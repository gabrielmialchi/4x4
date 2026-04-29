// network.js — Camada de rede do cliente.
//
// Server Node + Socket.io autoritativo (Railway). Cliente apenas emite ações e
// renderiza o state_for_me que vem de volta. Adaptador converte o schema cullado
// (me + opponents) para o schema antigo (.players[]) que ui.js/combat.js consomem.

// URL do server hospedado no Railway. socket.io-client converte para wss://
// automaticamente (HTTPS).
const SERVER_URL = "https://4x4-production.up.railway.app";

// Globais runtime — preservadas em window para compat com handlers inline (onclick).
window.roomId = new URLSearchParams(window.location.search).get("sala");
window.myId = null;

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

// ─── Wrappers de ação ────────────────────────────────────────────────────────

export async function actReady(target, skill) {
    // Sequência da spec: skill primeiro (set_target valida com a skill já salva)
    if (skill !== "") await emit("set_skill", { skill });
    await emit("set_target", { target });
    await emit("set_ready", {});
}

// Server gera o dado (anti-trapaça). Retorna o número rolado pra animação.
export async function actRollDie() {
    const ack = await emit("roll_die", {});
    if (ack?.error) { console.error("[roll_die]", ack.error.code); return null; }
    return ack.dice;
}

export async function actRestartGame() {
    await emit("restart_game", {});
}

// ─── initMultiplayer ─────────────────────────────────────────────────────────

export async function initMultiplayer(onStateChange) {
    _onStateChange = onStateChange;
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
        // state_update separado já cobre; este evento é só sinalização lateral
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
        // Modo de partida hardcoded em 1v1. UI de escolha 1v1/4v4 vem em MATCH-001.
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
