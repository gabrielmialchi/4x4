import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "socket.io";
import {
  createPrivateRoom,
  joinPrivateRoom,
  leaveRoom,
  markDisconnected,
  setTarget,
  unsetTarget,
  setSkill,
  unsetSkill,
  setReady,
  rollDie,
  resolveCombat,
  restartGame,
  summarizeFor,
  summarizeFull,
  startCleanup,
  stopCleanup,
} from "./rooms.js";
import { COMBAT_REVEAL_MS } from "./constants.js";

const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.get("/", (_req, res) => res.status(200).type("text/plain").send("4x4 server ok"));
app.get("/health", (_req, res) =>
  res.status(200).json({ status: "ok", uptime: process.uptime() })
);

// Serve a própria pasta server/ pra que test-client.html abra via http://localhost:3000/test-client.html
// (abrir como file:// faz o navegador mandar Origin "null" e o CORS bloqueia)
app.use(express.static(__dirname));

// Atalho de DEV: serve a pasta html/ em /jogo para Gabriel testar o cliente em modo USE_SERVER
// sem precisar de outro server estático. Em produção (SEC-001.10/Railway) o cliente vive no
// itch.io e este atalho some — server e cliente ficam em hosts separados.
app.use("/jogo", express.static(path.join(__dirname, "..", "html")));

const server = http.createServer(app);

// CORS: dev local (qualquer porta) + itch.io publicado. itch.zone é o domínio do iframe
// HTML5 player do itch.io (separado de itch.io por design) — sem ele, o jogo embutido
// no itch.io recebe connect_error.
function isAllowedOrigin(origin) {
  if (!origin) return true; // requests sem header Origin (mesmo host, curl) passam
  return (
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    /^https:\/\/itch\.io$/.test(origin) ||
    /^https:\/\/[^/]+\.itch\.io$/.test(origin) ||
    /^https:\/\/[^/]+\.itch\.zone$/.test(origin)
  );
}

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    methods: ["GET", "POST"],
  },
});

function reply(ack, payload) {
  if (typeof ack === "function") ack(payload);
}

// Emite por socket com payload já cullado por viewerSlot — coração do PROTO_SOCKET §5.
function broadcastState(room) {
  if (!room) return;
  for (const p of room.players) {
    if (!p.connected || !p.socketId) continue;
    io.to(p.socketId).emit("state_update", { state: summarizeFor(room, p.slot) });
  }
}

function emitCombatStarted(room) {
  for (const p of room.players) {
    if (!p.connected || !p.socketId) continue;
    const state = summarizeFor(room, p.slot);
    io.to(p.socketId).emit("combat_started", {
      pendingCombat: state.pendingCombat,
      state,
    });
  }
}

function emitCombatResolved(room, winnerSlot, scores) {
  for (const p of room.players) {
    if (!p.connected || !p.socketId) continue;
    io.to(p.socketId).emit("combat_resolved", {
      result: { winnerSlot: winnerSlot ?? null, scores },
      state: summarizeFor(room, p.slot),
    });
  }
}

// PROTO_SOCKET §5.4: game_over.full_state é a única exceção ao culling — Aftermath precisa
// de tudo (history dos oponentes, traps de todos, etc.) pra desenhar trajetos.
function emitGameOver(room, winnerSlot) {
  io.to(room.roomId).emit("game_over", {
    winnerSlot,
    full_state: summarizeFull(room),
  });
}

function emitTrapTriggered(room, triggers) {
  if (!triggers || triggers.length === 0) return;
  for (const tt of triggers) {
    for (const p of room.players) {
      if (!p.connected || !p.socketId) continue;
      io.to(p.socketId).emit("trap_triggered", {
        cell: tt.cell,
        by_owner_slot: tt.ownerSlot,
        state: summarizeFor(room, p.slot),
      });
    }
  }
}

const combatTimers = new Map();

function scheduleCombatResolve(roomId) {
  const prev = combatTimers.get(roomId);
  if (prev) clearTimeout(prev);

  const handle = setTimeout(() => {
    combatTimers.delete(roomId);
    const result = resolveCombat({ roomId });
    if (!result) return; // sala foi deletada durante o delay

    const { room, scores, winnerSlot, trapTriggers } = result;

    emitCombatResolved(room, winnerSlot, scores);
    emitTrapTriggered(room, trapTriggers);

    if (result.isReroll || result.endgameStarted) {
      emitCombatStarted(room);
    } else if (result.gameOver) {
      emitGameOver(room, winnerSlot);
    }
    // turnEnded sem outro evento: o state já saiu via combat_resolved (e trap_triggered se houve)
  }, COMBAT_REVEAL_MS);
  handle.unref();
  combatTimers.set(roomId, handle);
}

io.on("connection", (socket) => {
  console.log(`[socket] connected ${socket.id}`);

  socket.on("ping", (payload, ack) => {
    reply(ack, { pong: true, echoed: payload, t: Date.now() });
  });

  socket.on("create_private_room", (payload, ack) => {
    const result = createPrivateRoom({
      mode: payload?.mode,
      socketId: socket.id,
    });
    if (result.error) return reply(ack, { error: { code: result.error } });

    socket.join(result.room.roomId);
    reply(ack, { roomId: result.room.roomId, mySlot: result.mySlot });
    broadcastState(result.room);
  });

  socket.on("join_private_room", (payload, ack) => {
    const result = joinPrivateRoom({
      roomId: payload?.roomId,
      socketId: socket.id,
    });
    if (result.error) return reply(ack, { error: { code: result.error } });

    socket.join(result.room.roomId);
    reply(ack, { mySlot: result.mySlot });
    broadcastState(result.room);
  });

  socket.on("leave_room", (_payload, ack) => {
    const result = leaveRoom({ socketId: socket.id });
    if (!result) return reply(ack, { ok: true });

    socket.leave(result.roomId);
    reply(ack, { ok: true });
    if (result.room) {
      io.to(result.roomId).emit("opponent_disconnected", { slot: result.slot });
      broadcastState(result.room);
    }
  });

  // ─── Planning handlers ──────────────────────────────────────────────────

  socket.on("set_target", (payload, ack) => {
    const result = setTarget({ socketId: socket.id, target: payload?.target });
    if (result.error) return reply(ack, { error: { code: result.error } });
    reply(ack, { ok: true });
    broadcastState(result.room);
  });

  socket.on("unset_target", (_payload, ack) => {
    const result = unsetTarget({ socketId: socket.id });
    if (result.error) return reply(ack, { error: { code: result.error } });
    reply(ack, { ok: true });
    broadcastState(result.room);
  });

  socket.on("set_skill", (payload, ack) => {
    const result = setSkill({ socketId: socket.id, skill: payload?.skill });
    if (result.error) return reply(ack, { error: { code: result.error } });
    reply(ack, { ok: true });
    broadcastState(result.room);
  });

  socket.on("unset_skill", (_payload, ack) => {
    const result = unsetSkill({ socketId: socket.id });
    if (result.error) return reply(ack, { error: { code: result.error } });
    reply(ack, { ok: true });
    broadcastState(result.room);
  });

  socket.on("set_ready", (_payload, ack) => {
    const result = setReady({ socketId: socket.id });
    if (result.error) return reply(ack, { error: { code: result.error } });
    reply(ack, { ok: true });

    const room = result.room;
    const traps = result.trapTriggers || [];

    if (traps.length === 0) {
      broadcastState(room);
    } else {
      emitTrapTriggered(room, traps);
    }

    if (result.combatStarted) emitCombatStarted(room);
    if (result.gameOver) emitGameOver(room, result.winnerSlot);
  });

  socket.on("roll_die", (_payload, ack) => {
    const result = rollDie({ socketId: socket.id });
    if (result.error) return reply(ack, { error: { code: result.error } });
    reply(ack, { dice: result.dice });
    broadcastState(result.room);
    if (result.allRolled) {
      scheduleCombatResolve(result.room.roomId);
    }
  });

  socket.on("restart_game", (_payload, ack) => {
    const result = restartGame({ socketId: socket.id });
    if (result.error) return reply(ack, { error: { code: result.error } });
    reply(ack, { ok: true });
    broadcastState(result.room);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected ${socket.id} (${reason})`);
    const result = markDisconnected({ socketId: socket.id });
    if (result?.room) {
      io.to(result.roomId).emit("opponent_disconnected", { slot: result.slot });
      broadcastState(result.room);
    }
  });
});

startCleanup();

server.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});

// SIGTERM é o sinal que o Railway envia ao redeployar — sem isso, conexões ativas caem feio.
function shutdown(signal) {
  console.log(`[server] received ${signal}, shutting down`);
  stopCleanup();
  io.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
