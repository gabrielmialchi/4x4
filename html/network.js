// network.js — Camada de rede do cliente.
//
// Bifurca entre Firebase RTDB (legacy, default) e server Socket.io (SEC-001.8 em diante)
// via flag USE_SERVER. Resto do cliente (ui.js / combat.js) consome window.S no schema
// antigo — o adaptador converte state_for_me do server pra esse schema.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// ─── Flags de modo ──────────────────────────────────────────────────────────

// false = Firebase RTDB (Alpha 2.2_Visual). true = server Node + Socket.io.
// Promovido pra true permanente em SEC-001.10. SEC-001.11 remove o caminho Firebase.
export const USE_SERVER = true;
export const IS_SERVER_MODE = USE_SERVER;

// URL do server hospedado no Railway. socket.io-client converte para wss:// automaticamente
// porque é HTTPS. Localhost ficou pra trás na promoção SEC-001.10 (2026-04-28).
const SERVER_URL = "https://4x4-production.up.railway.app";

// ─── Firebase config (vivo enquanto USE_SERVER=false) ───────────────────────

// Credenciais públicas — chave restrita por domínio em 2026-04-27 (resposta ao alerta
// do GitHub). Removidas em SEC-001.11 (descontinuar Firebase).
const firebaseConfig = {
    apiKey: "AIzaSyA4QmmwIj2kMNDKOONi6ZbHPWcEApj9VG8",
    authDomain: "game-4x4.firebaseapp.com",
    databaseURL: "https://game-4x4-default-rtdb.firebaseio.com",
    projectId: "game-4x4",
    storageBucket: "game-4x4.firebasestorage.app",
    messagingSenderId: "32618206063",
    appId: "1:32618206063:web:eaec4df537d7d20c438e9a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Globais runtime — preservadas em window pra compat com código não-modular.
window.roomId = new URLSearchParams(window.location.search).get("sala");
window.myId = null;
window.dbRef = null;

export { db, ref, set, onValue, get, update };

// ─── Socket.io state (vivo enquanto USE_SERVER=true) ─────────────────────────

let socket = null;
let _onStateChange = null;

function ensureIO() {
    if (typeof io !== "function") {
        throw new Error("socket.io-client não carregou — verifique a tag <script> da CDN no index.html");
    }
}

// Promise wrapper sobre socket.emit com ack.
function emit(event, payload) {
    return new Promise((resolve) => {
        socket.emit(event, payload || {}, (ack) => resolve(ack));
    });
}

// ─── Adaptadores de schema (server → window.S antigo) ───────────────────────

function defaultsForOpponent(p) {
    // Oponentes vêm sem target/skill/combatSkill/roll/history/jumpedBlock (culling §5).
    // Cliente lê esses campos em renderização — preencher com valores neutros.
    return {
        target: p.target ?? false,
        skill: p.skill ?? "",
        combatSkill: p.combatSkill ?? "",
        roll: p.roll ?? 0,
        history: p.history ?? [[...p.spawn]],
        jumpedBlock: p.jumpedBlock ?? false,
    };
}

// state_for_me (com .me e .opponents) → window.S no schema antigo (.players[])
function adaptStateForMe(state) {
    const all = [state.me, ...state.opponents].sort((a, b) => a.slot - b.slot);
    const players = [];
    for (const p of all) {
        const d = defaultsForOpponent(p);
        players[p.slot] = {
            id: p.slot,
            pos: p.pos,
            target: d.target,
            skill: d.skill,
            combatSkill: d.combatSkill,
            inv: p.inv,
            ready: p.ready,
            roll: d.roll,
            permMod: p.permMod,
            history: d.history,
            trapped: p.trapped,
            jumpedBlock: d.jumpedBlock,
            connected: p.connected,
        };
    }
    return {
        players,
        blocks: state.blocks,
        traps: state.traps,
        spentRes: state.spentRes,
        combatLocs: state.combatLocs,
        phase: state.phase,
        winner: state.winner,
        isEndgame: state.isEndgame,
    };
}

// summarizeFull (game_over.full_state) — schema com .players[] já no formato esperado.
function adaptFullState(fullState) {
    return {
        players: fullState.players.map((p) => ({
            id: p.slot,
            pos: p.pos,
            target: p.target,
            skill: p.skill,
            combatSkill: p.combatSkill,
            inv: p.inv,
            ready: p.ready,
            roll: p.roll,
            permMod: p.permMod,
            history: p.history,
            trapped: p.trapped,
            jumpedBlock: p.jumpedBlock,
            connected: p.connected,
        })),
        blocks: fullState.blocks,
        traps: fullState.traps,
        spentRes: fullState.spentRes,
        combatLocs: fullState.combatLocs,
        phase: fullState.phase,
        winner: fullState.winner,
        isEndgame: fullState.isEndgame,
    };
}

// ─── Wrappers de ação (cliente chama estes em vez de update/set diretos) ────

export async function actReady(target, skill) {
    if (USE_SERVER) {
        // Sequência da spec: skill primeiro (para set_target validar com skill já salvo)
        if (skill !== "") await emit("set_skill", { skill });
        await emit("set_target", { target });
        await emit("set_ready", {});
        return;
    }
    return update(ref(db, `rooms/${window.roomId}/players/${window.myId}`), {
        target, skill, ready: true,
    });
}

// Em modo server: server gera o dado (anti-trapaça). Retorna o número rolado pra animação.
// Em modo Firebase: cliente gera e transmite — o roll vem como argumento, retorna ele.
export async function actRollDie(localRoll) {
    if (USE_SERVER) {
        const ack = await emit("roll_die", {});
        if (ack?.error) { console.error("[roll_die]", ack.error.code); return null; }
        return ack.dice;
    }
    update(ref(db, `rooms/${window.roomId}/players/${window.myId}`), { roll: localRoll });
    return localRoll;
}

export async function actRestartGame(resetState) {
    if (USE_SERVER) {
        await emit("restart_game", {});
        return;
    }
    return set(window.dbRef, resetState);
}

// ─── initMultiplayer ─────────────────────────────────────────────────────────

export async function initMultiplayer(onStateChange) {
    _onStateChange = onStateChange;
    if (USE_SERVER) return initServerMode();
    return initFirebaseMode();
}

async function initServerMode() {
    ensureIO();
    socket = io(SERVER_URL);

    socket.on("connect_error", (err) => console.error("[socket] connect_error:", err.message));
    socket.on("disconnect", (reason) => console.warn("[socket] disconnected:", reason));

    socket.on("state_update", ({ state }) => {
        window.S = adaptStateForMe(state);
        if (_onStateChange) _onStateChange();
    });

    socket.on("combat_started", ({ state }) => {
        window.S = adaptStateForMe(state);
        if (_onStateChange) _onStateChange();
    });

    socket.on("combat_resolved", ({ state }) => {
        window.S = adaptStateForMe(state);
        if (_onStateChange) _onStateChange();
    });

    socket.on("trap_triggered", ({ state }) => {
        window.S = adaptStateForMe(state);
        if (_onStateChange) _onStateChange();
    });

    socket.on("game_over", ({ full_state }) => {
        // §5.4: full_state vem sem culling — usa adaptador específico
        window.S = adaptFullState(full_state);
        if (_onStateChange) _onStateChange();
    });

    socket.on("opponent_disconnected", () => {
        // state_update separado já vai cobrir; este evento é só sinalização lateral
    });

    // Esperar conexão antes de criar/joinar sala
    await new Promise((resolve) => {
        if (socket.connected) return resolve();
        socket.once("connect", resolve);
    });

    // Roteamento: URL com ?sala=XXXX entra; sem, cria nova
    if (window.roomId) {
        const ack = await emit("join_private_room", { roomId: window.roomId });
        if (ack?.error) {
            alert(`Erro ao entrar na sala: ${ack.error.code}`);
            return;
        }
        window.myId = ack.mySlot;
    } else {
        // Modo de partida hardcoded em 1v1 nesta sub. UI de escolha 1v1/4v4 vem em MATCH-001.
        const ack = await emit("create_private_room", { mode: "1v1" });
        if (ack?.error) {
            alert(`Erro ao criar sala: ${ack.error.code}`);
            return;
        }
        window.roomId = ack.roomId;
        window.myId = ack.mySlot;
        window.history.replaceState(null, null, `?sala=${window.roomId}`);
    }
    document.getElementById("invite-link").innerText = window.location.href;
}

async function initFirebaseMode() {
    if (!window.roomId) {
        window.roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        window.history.replaceState(null, null, `?sala=${window.roomId}`);
    }
    window.dbRef = ref(db, `rooms/${window.roomId}`);

    const snapshot = await get(window.dbRef);
    if (!snapshot.exists()) {
        window.myId = 0;
        window.S.players[0].connected = true;
        await set(window.dbRef, window.S);
    } else {
        const data = snapshot.val();
        if (!data.players[0].connected) {
            window.myId = 0;
            await update(ref(db, `rooms/${window.roomId}/players/0`), { connected: true });
        } else if (!data.players[1].connected) {
            window.myId = 1;
            await update(ref(db, `rooms/${window.roomId}/players/1`), { connected: true });
        } else {
            alert("Sala cheia!");
            return;
        }
    }
    document.getElementById("invite-link").innerText = window.location.href;

    onValue(window.dbRef, (snap) => {
        if (!snap.exists()) return;
        window.S = snap.val();
        // Backfills para versões antigas do estado serializado:
        if (!window.S.blocks) window.S.blocks = [];
        if (!window.S.traps) window.S.traps = [];
        if (!window.S.spentRes) window.S.spentRes = [];
        if (!window.S.combatLocs) window.S.combatLocs = [];
        if (window.S.players[0].permMod === undefined) window.S.players[0].permMod = 0;
        if (window.S.players[1].permMod === undefined) window.S.players[1].permMod = 0;
        if (!window.S.players[0].history) window.S.players[0].history = [[0, 0]];
        if (!window.S.players[1].history) window.S.players[1].history = [[3, 3]];
        if (_onStateChange) _onStateChange();
    });

    window.addEventListener("beforeunload", () => {
        if (window.myId !== null) {
            update(ref(db, `rooms/${window.roomId}/players/${window.myId}`), {
                connected: false, ready: false
            });
        }
    });
}
