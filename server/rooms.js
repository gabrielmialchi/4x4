import { randomInt, randomUUID } from "node:crypto";
import { generateRoomCode } from "./codes.js";
import {
  MAX_PLAYERS,
  SPAWNS_BY_SLOT,
  GOALS_BY_SLOT,
  INV_INITIAL_BY_MODE,
} from "./constants.js";
import { arrEq, manhattanDist, isReachableTarget, canPlaceSkillOnBase } from "./validators.js";

// Estado em RAM. Persistência (Redis) só em pós-Alpha — ver PROTO_SOCKET §11.
const rooms = new Map();          // roomId -> RoomState
const socketToRoom = new Map();   // socketId -> roomId (lookup reverso)
const queues = new Map();         // mode -> [socketId, ...] (FIFO por modo, PROTO §11)
const socketToQueue = new Map();  // socketId -> mode (lookup reverso)

const STALE_ROOM_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

// ─── Helpers internos ────────────────────────────────────────────────────────

function isValidMode(mode) {
  return mode === "1v1" || mode === "4v4";
}

function nextFreeSlot(room) {
  const used = new Set(room.players.map((p) => p.slot));
  for (let i = 0; i < MAX_PLAYERS[room.mode]; i++) {
    if (!used.has(i)) return i;
  }
  return -1;
}

function makePlayer({ slot, mode, socketId }) {
  const spawn = SPAWNS_BY_SLOT[mode][slot];
  return {
    slot,
    spawn: [...spawn],
    goal: [...GOALS_BY_SLOT[mode][slot]],
    pos: [...spawn],
    target: false,
    skill: "",
    combatSkill: "",
    inv: { ...INV_INITIAL_BY_MODE[mode] },
    ready: false,
    roll: 0,
    permMod: 0,
    history: [[...spawn]],
    trapped: false,
    jumpedBlock: false,
    connected: true,
    socketId,
  };
}

function getRoomBySocket(socketId) {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return null;
  return rooms.get(roomId) || null;
}

function getPlayer(room, socketId) {
  return room.players.find((p) => p.socketId === socketId) || null;
}

// Sala fica "planning" quando todos os slots estão ocupados e conectados.
function maybeStartPlanning(room) {
  if (room.phase !== "lobby") return;
  if (room.players.length !== MAX_PLAYERS[room.mode]) return;
  if (!room.players.every((p) => p.connected)) return;
  room.phase = "planning";
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export function createPrivateRoom({ mode, socketId }) {
  if (!isValidMode(mode)) return { error: "INVALID_MODE" };
  if (socketToRoom.has(socketId)) return { error: "ALREADY_IN_QUEUE_OR_ROOM" };

  let roomId;
  do {
    roomId = generateRoomCode();
  } while (rooms.has(roomId));

  const room = {
    roomId,
    mode,
    matchmaking: "private",
    phase: "lobby",
    winner: -1,
    isEndgame: false,
    players: [makePlayer({ slot: 0, mode, socketId })],
    blocks: [],
    traps: [],
    spentRes: [],
    combatLocs: [],
    pendingCombat: null,
    createdAt: Date.now(),
    disconnectedAt: null,
  };

  rooms.set(roomId, room);
  socketToRoom.set(socketId, roomId);
  maybeStartPlanning(room); // 1v1 com MAX=2 nunca dispara aqui, mas mantém simétrico
  return { room, mySlot: 0 };
}

export function joinPrivateRoom({ roomId, socketId }) {
  if (socketToRoom.has(socketId)) return { error: "ALREADY_IN_QUEUE_OR_ROOM" };

  // Códigos são gerados em uppercase (codes.js); aceitar minúsculas no input
  // evita ROOM_NOT_FOUND quando usuário cola "abcd" em vez de "ABCD"
  const normalizedId = String(roomId).toUpperCase();
  const room = rooms.get(normalizedId);
  if (!room) return { error: "ROOM_NOT_FOUND" };

  // Salas de Random Match (matchmaking: "random") não aceitam join por código —
  // são pareadas via fila. Sem este guard, MATCH-001.2 vai criar buraco.
  if (room.matchmaking !== "private") return { error: "ROOM_NOT_PRIVATE" };

  const slot = nextFreeSlot(room);
  if (slot === -1) return { error: "ROOM_FULL" };

  room.players.push(makePlayer({ slot, mode: room.mode, socketId }));
  room.disconnectedAt = null;
  socketToRoom.set(socketId, normalizedId);
  maybeStartPlanning(room);
  return { room, mySlot: slot };
}

export function leaveRoom({ socketId }) {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return null;

  const room = rooms.get(roomId);
  socketToRoom.delete(socketId);
  if (!room) return null;

  const player = getPlayer(room, socketId);
  room.players = room.players.filter((p) => p.socketId !== socketId);

  if (room.players.length === 0) {
    rooms.delete(roomId);
    return { roomId, room: null, slot: player?.slot ?? null };
  }
  return { roomId, room, slot: player?.slot ?? null };
}

// Reconexão formal só em pós-Alpha — disconnect aqui marca connected=false.
// Também limpa o socket de qualquer fila Random Match em que estivesse esperando.
export function markDisconnected({ socketId }) {
  removeFromQueue(socketId);

  const roomId = socketToRoom.get(socketId);
  if (!roomId) return null;

  socketToRoom.delete(socketId);
  const room = rooms.get(roomId);
  if (!room) return null;

  const player = getPlayer(room, socketId);
  if (player) player.connected = false;
  if (room.players.every((p) => !p.connected)) room.disconnectedAt = Date.now();
  return { roomId, room, slot: player?.slot ?? null };
}

// ─── Random Match queue ──────────────────────────────────────────────────────

function getQueue(mode) {
  let q = queues.get(mode);
  if (!q) {
    q = [];
    queues.set(mode, q);
  }
  return q;
}

function removeFromQueue(socketId) {
  const mode = socketToQueue.get(socketId);
  if (!mode) return false;
  socketToQueue.delete(socketId);
  const q = queues.get(mode);
  if (!q) return false;
  const idx = q.indexOf(socketId);
  if (idx !== -1) q.splice(idx, 1);
  return true;
}

// Cria sala random a partir dos N primeiros socketIds da fila do `mode`.
// Slot é atribuído pela ordem de chegada na fila — primeiro a entrar pega slot 0.
function createRandomRoom(mode, socketIds) {
  let roomId;
  do {
    roomId = randomUUID();
  } while (rooms.has(roomId));

  const room = {
    roomId,
    mode,
    matchmaking: "random",
    phase: "lobby",
    winner: -1,
    isEndgame: false,
    players: socketIds.map((sid, slot) => makePlayer({ slot, mode, socketId: sid })),
    blocks: [],
    traps: [],
    spentRes: [],
    combatLocs: [],
    pendingCombat: null,
    createdAt: Date.now(),
    disconnectedAt: null,
  };

  rooms.set(roomId, room);
  for (const sid of socketIds) socketToRoom.set(sid, roomId);
  maybeStartPlanning(room); // todos os slots preenchidos e conectados → planning
  return room;
}

export function queueJoin({ mode, socketId }) {
  if (!isValidMode(mode)) return { error: "INVALID_MODE" };
  if (socketToRoom.has(socketId) || socketToQueue.has(socketId)) {
    return { error: "ALREADY_IN_QUEUE_OR_ROOM" };
  }

  const q = getQueue(mode);
  q.push(socketId);
  socketToQueue.set(socketId, mode);

  // Pareou? Tira os N primeiros e cria sala. Demais ficam esperando próximo grupo.
  const need = MAX_PLAYERS[mode];
  if (q.length >= need) {
    const matched = q.splice(0, need);
    for (const sid of matched) socketToQueue.delete(sid);
    const room = createRandomRoom(mode, matched);
    return { matched, room };
  }
  return { queued: true };
}

// Idempotente: cliente que cancela duas vezes não recebe erro.
export function queueLeave({ socketId }) {
  removeFromQueue(socketId);
  return { ok: true };
}

// ─── Planning handlers ───────────────────────────────────────────────────────

function notInPlanningGuard(room) {
  return room.phase !== "planning" ? "NOT_IN_PLANNING" : null;
}

export function setTarget({ socketId, target }) {
  const room = getRoomBySocket(socketId);
  if (!room) return { error: "ROOM_NOT_FOUND" };
  const phaseErr = notInPlanningGuard(room);
  if (phaseErr) return { error: phaseErr };

  const me = getPlayer(room, socketId);
  if (!me) return { error: "ROOM_NOT_FOUND" };
  if (me.ready) return { error: "ALREADY_READY" };

  if (!isReachableTarget(me.pos, target, me.skill)) {
    return { error: me.skill === "SPRINT" ? "INVALID_SPRINT_TARGET" : "INVALID_TARGET" };
  }

  me.target = [target[0], target[1]];
  return { room };
}

export function unsetTarget({ socketId }) {
  const room = getRoomBySocket(socketId);
  if (!room) return { error: "ROOM_NOT_FOUND" };
  const phaseErr = notInPlanningGuard(room);
  if (phaseErr) return { error: phaseErr };

  const me = getPlayer(room, socketId);
  if (!me) return { error: "ROOM_NOT_FOUND" };
  if (me.ready) return { error: "ALREADY_READY" };

  me.target = false;
  return { room };
}

export function setSkill({ socketId, skill }) {
  const room = getRoomBySocket(socketId);
  if (!room) return { error: "ROOM_NOT_FOUND" };
  const phaseErr = notInPlanningGuard(room);
  if (phaseErr) return { error: phaseErr };

  const me = getPlayer(room, socketId);
  if (!me) return { error: "ROOM_NOT_FOUND" };
  if (me.ready) return { error: "ALREADY_READY" };

  if (!["BLOCK", "TRAP", "SPRINT"].includes(skill)) return { error: "INVALID_SKILL" };
  if ((me.inv[skill] || 0) <= 0) return { error: "NO_INVENTORY" };
  if (!canPlaceSkillOnBase(me, skill)) return { error: "CANT_PLACE_ON_OWN_SPAWN" };

  // Trocar skill pode invalidar o target já escolhido (ex: tinha SPRINT com alvo a 2,
  // mudou pra BLOCK que limita a adjacente). Limpa o target preventivamente.
  if (me.target !== false && !isReachableTarget(me.pos, me.target, skill)) {
    me.target = false;
  }
  me.skill = skill;
  return { room };
}

export function unsetSkill({ socketId }) {
  const room = getRoomBySocket(socketId);
  if (!room) return { error: "ROOM_NOT_FOUND" };
  const phaseErr = notInPlanningGuard(room);
  if (phaseErr) return { error: phaseErr };

  const me = getPlayer(room, socketId);
  if (!me) return { error: "ROOM_NOT_FOUND" };
  if (me.ready) return { error: "ALREADY_READY" };

  // Se target era SPRINT (dist 2) e agora vai virar "" (dist 1), invalida
  if (me.target !== false && !isReachableTarget(me.pos, me.target, "")) {
    me.target = false;
  }
  me.skill = "";
  return { room };
}

export function setReady({ socketId }) {
  const room = getRoomBySocket(socketId);
  if (!room) return { error: "ROOM_NOT_FOUND" };
  const phaseErr = notInPlanningGuard(room);
  if (phaseErr) return { error: phaseErr };

  const me = getPlayer(room, socketId);
  if (!me) return { error: "ROOM_NOT_FOUND" };
  if (me.ready) return { error: "ALREADY_READY" };
  if (me.target === false) return { error: "INVALID_TARGET" };

  // Re-valida target contra skill atual (cliente pode ter mudado skill após set_target)
  if (!isReachableTarget(me.pos, me.target, me.skill)) {
    return { error: me.skill === "SPRINT" ? "INVALID_SPRINT_TARGET" : "INVALID_TARGET" };
  }

  me.ready = true;

  // Dispara turno apenas quando todos os slots ocupados estão prontos. Disconnected = jogo trava
  // (PROTO_SOCKET §10: AFK timeout / reconnect formal ficam para sub-sessões futuras).
  const allReady = room.players.length === MAX_PLAYERS[room.mode] &&
                   room.players.every((p) => p.ready && p.connected);

  if (allReady) {
    const result = processTurn(room);
    return { room, ...result };
  }
  return { room };
}

// ─── Turn processing (porta de combat.js do cliente, generalizado p/ N players) ─

function movePlayer(room, p) {
  if (!p.target || arrEq(p.target, p.pos)) return;

  let usedSkillMod = 0;

  // Plant BLOCK/TRAP na pos atual antes de mover (porta exata de hostMove)
  if (p.skill === "BLOCK") {
    room.blocks.push({ r: p.pos[0], c: p.pos[1], owner: p.slot });
    p.inv.BLOCK--;
    usedSkillMod = 1;
  } else if (p.skill === "TRAP") {
    room.traps.push({ r: p.pos[0], c: p.pos[1], owner: p.slot });
    p.inv.TRAP--;
    usedSkillMod = 1;
  }

  if (p.skill === "SPRINT") {
    const mr = (p.pos[0] + p.target[0]) / 2;
    const mc = (p.pos[1] + p.target[1]) / 2;
    p.inv.SPRINT--;

    const targetIdx = room.blocks.findIndex((b) => b.r === p.target[0] && b.c === p.target[1]);
    const middleIdx = room.blocks.findIndex((b) => b.r === mr && b.c === mc);

    if (targetIdx !== -1) {
      // BLOCK no alvo: quebra, jogador para na célula intermediária
      room.spentRes.push({ ...room.blocks[targetIdx], status: "broken" });
      room.blocks.splice(targetIdx, 1);
      p.pos = [mr, mc];
      usedSkillMod = -1;
    } else if (middleIdx !== -1) {
      // BLOCK no meio: pula consumindo (-2), chega ao alvo
      room.spentRes.push({ ...room.blocks[middleIdx], status: "jumped" });
      room.blocks.splice(middleIdx, 1);
      p.jumpedBlock = true;
      p.pos = [...p.target];
      usedSkillMod = -2;
    } else {
      p.pos = [...p.target];
      usedSkillMod = -1;
    }
  } else {
    // Movimento normal de 1 célula
    const blockIdx = room.blocks.findIndex((b) => b.r === p.target[0] && b.c === p.target[1]);
    if (blockIdx !== -1) {
      room.spentRes.push({ ...room.blocks[blockIdx], status: "broken" });
      room.blocks.splice(blockIdx, 1);
      // jogador NÃO se move (BLOCK barra)
    } else {
      p.pos = [...p.target];
    }
  }

  // Trap de outro player na nova posição: dispara
  const trapIdx = room.traps.findIndex(
    (t) => t.r === p.pos[0] && t.c === p.pos[1] && t.owner !== p.slot
  );
  if (trapIdx !== -1) {
    const triggered = room.traps[trapIdx];
    room.spentRes.push({ ...triggered, status: "triggered" });
    room.traps.splice(trapIdx, 1);
    p.trapped = true;
    recordTrap(triggered);
  }

  p.permMod += usedSkillMod;
  p.history.push([...p.pos]);
  p.skill = "";
}

function detectSwaps(players) {
  const inSwap = new Set();
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      if (a.target && b.target && arrEq(a.target, b.pos) && arrEq(b.target, a.pos)) {
        inSwap.add(a.slot);
        inSwap.add(b.slot);
      }
    }
  }
  return inSwap;
}

function detectCollisions(players, inSwap) {
  const groups = new Map();
  for (const p of players) {
    if (!p.target) continue;
    if (inSwap.has(p.slot)) continue;
    if (arrEq(p.target, p.pos)) continue;
    const key = `${p.target[0]},${p.target[1]}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p.slot);
  }
  const collisions = [];
  for (const [key, slots] of groups) {
    if (slots.length >= 2) {
      const [r, c] = key.split(",").map(Number);
      collisions.push({ cell: [r, c], slots });
    }
  }
  return collisions;
}

function checkWin(room) {
  const winners = [];
  for (const p of room.players) {
    if (arrEq(p.pos, p.goal)) winners.push(p.slot);
  }
  if (winners.length === 1) {
    room.phase = "game_over";
    room.winner = winners[0];
    return { gameOver: true, winnerSlot: winners[0] };
  }
  if (winners.length >= 2) {
    // Endgame combat genérico: chegada simultânea no goal → Royal Rumble entre quem
    // chegou. Decisão MODE-001.2 (2026-04-29): vale pra 1v1 e 4v4 — a infra é a mesma,
    // dado decide entre os que chegaram (consistente com o resto do design "combate
    // resolve disputas"). Empate no top do endgame faz re-roll só entre empatados (já
    // tratado em resolveCombat).
    room.isEndgame = true;
    room.phase = "combat";
    room.pendingCombat = {
      cell: null,
      participants: winners,
      rolls: Object.fromEntries(winners.map((s) => [s, 0])),
      resolveAt: null,
      isEndgame: true,
    };
    for (const p of room.players) p.roll = 0;
    return { combatStarted: true, isEndgame: true };
  }
  return null;
}

function resetForNextTurn(room) {
  for (const p of room.players) {
    p.target = false;
    p.skill = "";
    p.ready = false;
  }
}

function processTurn(room) {
  const players = room.players;
  startTrapRecording();

  for (const p of players) {
    p.trapped = false;
    p.combatSkill = p.skill;
  }

  const inSwap = detectSwaps(players);

  // Em swap, BLOCK/TRAP viram "wasted" — recurso gasto sem efeito (porta de hostProcessTurn)
  for (const p of players) {
    if (!inSwap.has(p.slot)) continue;
    if (p.skill === "BLOCK" || p.skill === "TRAP") {
      room.spentRes.push({ r: p.pos[0], c: p.pos[1], type: p.skill, owner: p.slot, status: "wasted" });
      p.inv[p.skill]--;
      p.permMod += 1;
      p.skill = "";
    }
  }

  const collisions = detectCollisions(players, inSwap);

  if (collisions.length > 0) {
    // Decisão SEC-001.4: 1 grupo de combate por turno. Players em colisões secundárias
    // ficam parados; serão re-resolvidos em turnos seguintes (4v4 vai precisar de queue
    // formal em SEC-001.5/6 se acontecer com frequência).
    const first = collisions[0];
    const fightingSlots = new Set(first.slots);
    const blockedSlots = new Set();
    for (let k = 1; k < collisions.length; k++) {
      for (const s of collisions[k].slots) blockedSlots.add(s);
    }

    // Pré-calcula jumpedBlock pro combate (modificador depende disso)
    for (const slot of first.slots) {
      const p = players[slot];
      if (p.skill === "SPRINT") {
        const mr = (p.pos[0] + p.target[0]) / 2;
        const mc = (p.pos[1] + p.target[1]) / 2;
        p.jumpedBlock = room.blocks.some((b) => b.r === mr && b.c === mc);
      }
    }

    for (const p of players) {
      if (fightingSlots.has(p.slot)) continue;
      if (blockedSlots.has(p.slot)) continue;
      movePlayer(room, p);
    }

    room.phase = "combat";
    room.pendingCombat = {
      cell: first.cell,
      participants: first.slots,
      rolls: Object.fromEntries(first.slots.map((s) => [s, 0])),
      resolveAt: null,
    };
    for (const p of players) p.roll = 0;
    return { combatStarted: true, trapTriggers: flushTrapRecording() };
  }

  // Sem colisão: todos movem e checa win (swap também executa hostMove no Alpha)
  for (const p of players) {
    movePlayer(room, p);
  }

  const winResult = checkWin(room);
  if (winResult) return { ...winResult, trapTriggers: flushTrapRecording() };

  resetForNextTurn(room);
  return { trapTriggers: flushTrapRecording() };
}

// ─── Restart ─────────────────────────────────────────────────────────────────

function resetPlayer(room, p) {
  p.pos = [...p.spawn];
  p.target = false;
  p.skill = "";
  p.combatSkill = "";
  p.inv = { ...INV_INITIAL_BY_MODE[room.mode] };
  p.ready = false;
  p.roll = 0;
  p.permMod = 0;
  p.history = [[...p.spawn]];
  p.trapped = false;
  p.jumpedBlock = false;
}

// PROTO_SOCKET §6.2: qualquer player conectado em game_over pode resetar a partida.
// Mantém slots/spawns/socketIds; zera estado de jogo (pos volta ao spawn, inv recarrega).
export function restartGame({ socketId }) {
  const room = getRoomBySocket(socketId);
  if (!room) return { error: "ROOM_NOT_FOUND" };
  if (room.phase !== "game_over") return { error: "NOT_IN_GAME_OVER" };

  const me = getPlayer(room, socketId);
  if (!me || !me.connected) return { error: "ROOM_NOT_FOUND" };

  room.phase = "planning";
  room.winner = -1;
  room.isEndgame = false;
  room.blocks = [];
  room.traps = [];
  room.spentRes = [];
  room.combatLocs = [];
  room.pendingCombat = null;

  for (const p of room.players) resetPlayer(room, p);
  return { room };
}

// ─── Trap trigger recording (consumido por server.js para emitir trap_triggered) ─

// Node é single-thread síncrono — buffer global no módulo é seguro entre processTurn/resolveCombat.
let _trapBuffer = null;

function startTrapRecording() {
  _trapBuffer = [];
}

function recordTrap(trap) {
  if (_trapBuffer) _trapBuffer.push({ cell: [trap.r, trap.c], ownerSlot: trap.owner });
}

function flushTrapRecording() {
  const list = _trapBuffer || [];
  _trapBuffer = null;
  return list;
}

// ─── Combat (Royal Rumble) ───────────────────────────────────────────────────

// Modificador do turno baseado em combatSkill — porta exata de combat.js do cliente.
function getTurnMod(p) {
  if (p.combatSkill === "SPRINT") return p.jumpedBlock ? -2 : -1;
  if (p.combatSkill === "BLOCK" || p.combatSkill === "TRAP") return 1;
  return 0;
}

function getTotalMod(p) {
  return p.permMod + getTurnMod(p);
}

export function rollDie({ socketId }) {
  const room = getRoomBySocket(socketId);
  if (!room) return { error: "ROOM_NOT_FOUND" };
  if (room.phase !== "combat" || !room.pendingCombat) return { error: "NOT_IN_COMBAT" };

  const me = getPlayer(room, socketId);
  if (!me) return { error: "ROOM_NOT_FOUND" };

  const pc = room.pendingCombat;
  if (!pc.participants.includes(me.slot)) return { error: "NOT_IN_COMBAT" };
  if (pc.rolls[me.slot] !== 0) return { error: "ALREADY_ROLLED" };

  // crypto.randomInt: aleatoriedade no server (PROTO_SOCKET §1, princípio 4) — fecha a vulnerabilidade
  // do cliente Alpha onde Math.random podia ser forçado via DevTools.
  const dice = randomInt(1, 7);
  pc.rolls[me.slot] = dice;
  me.roll = dice;

  const allRolled = pc.participants.every((s) => pc.rolls[s] !== 0);
  return { room, dice, allRolled };
}

function applyLoser(room, slot) {
  const p = room.players[slot];
  p.history.push([...p.pos]); // perdedor não move; history registra o turno
  if (p.combatSkill) {
    p.inv[p.combatSkill]--;
    p.permMod += getTurnMod(p);
    room.spentRes.push({
      r: p.pos[0],
      c: p.pos[1],
      type: p.combatSkill,
      owner: slot,
      status: "wasted",
    });
  }
}

function clearCombatTransients(room) {
  room.pendingCombat = null;
  for (const p of room.players) {
    p.roll = 0;
    p.combatSkill = "";
    p.jumpedBlock = false;
  }
}

export function resolveCombat({ roomId }) {
  const room = rooms.get(roomId);
  if (!room || !room.pendingCombat) return null;
  startTrapRecording();

  const pc = room.pendingCombat;
  const participants = pc.participants;

  // Calcula totals (snapshot pro evento combat_resolved)
  const scores = {};
  for (const slot of participants) {
    const p = room.players[slot];
    const dice = p.roll;
    const mod = getTotalMod(p);
    scores[slot] = { dice, mod, total: dice + mod };
  }

  // combatLocs registra a célula do combate (Aftermath usa). Endgame tem cell=null
  if (pc.cell && !room.combatLocs.some((l) => arrEq(l, pc.cell))) {
    room.combatLocs.push([...pc.cell]);
  }

  const topScore = Math.max(...participants.map((s) => scores[s].total));
  const topScorers = participants.filter((s) => scores[s].total === topScore);

  // Empate no top: re-roll só entre topScorers (PROTO_SOCKET §5.3)
  if (topScorers.length >= 2) {
    const losers = participants.filter((s) => !topScorers.includes(s));
    for (const slot of losers) applyLoser(room, slot);

    // Reseta apenas dos topScorers; pendingCombat continua com participants reduzidos
    for (const slot of topScorers) {
      room.players[slot].roll = 0;
    }
    pc.participants = topScorers;
    pc.rolls = Object.fromEntries(topScorers.map((s) => [s, 0]));
    return { room, scores, isReroll: true, trapTriggers: flushTrapRecording() };
  }

  // Vencedor único
  const winnerSlot = topScorers[0];
  const losers = participants.filter((s) => s !== winnerSlot);
  for (const slot of losers) applyLoser(room, slot);

  // Endgame: vitória final, sem mover
  if (pc.isEndgame) {
    room.winner = winnerSlot;
    room.phase = "game_over";
    clearCombatTransients(room);
    return { room, scores, winnerSlot, gameOver: true, trapTriggers: flushTrapRecording() };
  }

  // Combate normal: vencedor avança (movePlayer aplica plant/sprint/trap igual hostMove)
  movePlayer(room, room.players[winnerSlot]);

  room.phase = "planning";
  clearCombatTransients(room);

  // Vencedor pode ter pisado no goal — checkWin pode disparar endgame combat (1v1) ou game_over
  const winResult = checkWin(room);
  if (winResult?.gameOver) {
    return { room, scores, winnerSlot: winResult.winnerSlot, gameOver: true, trapTriggers: flushTrapRecording() };
  }
  if (winResult?.combatStarted) {
    // Empate de chegada no 1v1 disparou pendingCombat endgame
    return { room, scores, winnerSlot, endgameStarted: true, trapTriggers: flushTrapRecording() };
  }

  resetForNextTurn(room);
  return { room, scores, winnerSlot, turnEnded: true, trapTriggers: flushTrapRecording() };
}

// ─── State serialization ─────────────────────────────────────────────────────

function fullPlayerView(p) {
  return {
    slot: p.slot,
    spawn: p.spawn,
    goal: p.goal,
    pos: p.pos,
    target: p.target,
    skill: p.skill,
    combatSkill: p.combatSkill,
    ready: p.ready,
    roll: p.roll,
    permMod: p.permMod,
    inv: { ...p.inv },
    history: p.history.map((h) => [...h]),
    trapped: p.trapped,
    jumpedBlock: p.jumpedBlock,
    connected: p.connected,
  };
}

// Versão SEM culling — usada apenas em game_over.full_state (PROTO_SOCKET §5.4).
// Cliente deve receber esta forma somente quando o jogo já terminou (Aftermath).
export function summarizeFull(room) {
  return {
    roomId: room.roomId,
    mode: room.mode,
    matchmaking: room.matchmaking,
    phase: room.phase,
    winner: room.winner,
    isEndgame: room.isEndgame,
    players: room.players.map(fullPlayerView),
    blocks: room.blocks.map((b) => ({ ...b })),
    traps: room.traps.map((t) => ({ ...t })),
    spentRes: room.spentRes.map((s) => ({ ...s })),
    combatLocs: room.combatLocs.map((c) => [...c]),
    pendingCombat: room.pendingCombat ? { ...room.pendingCombat } : null,
  };
}

function cullPendingCombatFor(pc, viewerSlot) {
  if (!pc) return null;
  const isParticipant = pc.participants.includes(viewerSlot);
  return {
    cell: pc.cell ? [...pc.cell] : null,
    participants: [...pc.participants],
    isEndgame: !!pc.isEndgame,
    myRoll: isParticipant ? pc.rolls[viewerSlot] : 0,
    opponentRolls: pc.participants
      .filter((s) => s !== viewerSlot)
      .map((s) => ({ slot: s, rolled: pc.rolls[s] !== 0 })),
  };
}

// Versão COM culling — implementa PROTO_SOCKET §5 (`state_for_me`).
// Filtros: oponentes sem target/skill/combatSkill/roll/history/jumpedBlock; traps só do viewer;
// blocks de outros owners apenas se distância Manhattan ≤ 1 do viewer.pos; pendingCombat com
// myRoll só pra mim e opponentRolls só com flag rolled.
export function summarizeFor(room, viewerSlot) {
  const me = room.players.find((p) => p.slot === viewerSlot);
  if (!me) return summarizeFull(room); // fallback defensivo

  return {
    roomId: room.roomId,
    mode: room.mode,
    matchmaking: room.matchmaking,
    phase: room.phase,
    winner: room.winner,
    isEndgame: room.isEndgame,
    mySlot: viewerSlot,
    me: fullPlayerView(me),
    opponents: room.players
      .filter((p) => p.slot !== viewerSlot)
      .map((p) => ({
        slot: p.slot,
        spawn: p.spawn,
        goal: p.goal,
        pos: p.pos,
        inv: { ...p.inv },
        permMod: p.permMod,
        ready: p.ready,
        connected: p.connected,
        trapped: p.trapped,
        // NUNCA: target, skill, combatSkill, roll, history, jumpedBlock
      })),
    blocks: room.blocks
      .filter((b) => b.owner === viewerSlot || manhattanDist([b.r, b.c], me.pos) <= 1)
      .map((b) => ({ ...b })),
    traps: room.traps.filter((t) => t.owner === viewerSlot).map((t) => ({ ...t })),
    spentRes: room.spentRes.map((s) => ({ ...s })),
    combatLocs: room.combatLocs.map((c) => [...c]),
    pendingCombat: cullPendingCombatFor(room.pendingCombat, viewerSlot),
  };
}

// ─── Cleanup timer ───────────────────────────────────────────────────────────

let cleanupTimer = null;

export function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, room] of rooms) {
      if (room.disconnectedAt && now - room.disconnectedAt > STALE_ROOM_MS) {
        rooms.delete(id);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref();
}

export function stopCleanup() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
