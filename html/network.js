// network.js — Camada de rede do cliente.
//
// Server Node + Socket.io autoritativo (Railway). Cliente apenas emite ações e
// renderiza o state_for_me que vem de volta. Adaptador converte o schema cullado
// (me + opponents) para o schema antigo (.players[]) que ui.js/combat.js consomem.

import { showStartScreen, showSearchingScreen, notifyMatchFound } from "./startScreen.js";

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
        matchmaking: state.matchmaking,
        mode: state.mode,
        pendingCombat: state.pendingCombat || null,
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
        matchmaking: fullState.matchmaking,
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

    // match_found vem após queue_join pareou — atualiza window.roomId/myId pra
    // que a transição de UI funcione igual ao create_private_room/join_private_room
    socket.on("match_found", ({ roomId, mySlot, state }) => {
        window.roomId = roomId;
        window.myId = mySlot;
        window.S = adaptStateForMe(state);
        notifyMatchFound(); // fecha a tela "Procurando..." se ela estiver ativa
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

    // Roteamento:
    //   1) URL tem ?sala=XXXX → join direto (atalho de link compartilhado)
    //   2) Sem ?sala → loop showStartScreen → ação escolhida; Random pode cancelar e voltar
    if (window.roomId) {
        const ack = await emit("join_private_room", { roomId: window.roomId });
        if (ack?.error) {
            alert(`Erro ao entrar na sala: ${ack.error.code}`);
            return;
        }
        window.myId = ack.mySlot;
    } else {
        // Loop: jogador pode cancelar Random Match e voltar pro start-screen
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const choice = await showStartScreen();

            if (choice.action === "random") {
                const ack = await emit("queue_join", { mode: choice.mode });
                if (ack?.error) {
                    alert(`Erro ao entrar na fila: ${ack.error.code}`);
                    continue;
                }
                const { result } = await showSearchingScreen();
                if (result === "cancelled") {
                    await emit("queue_leave", {});
                    continue; // volta pro start-screen
                }
                // matched: window.roomId/myId já foram setados pelo handler match_found
                break;
            }

            if (choice.action === "createPrivate") {
                const ack = await emit("create_private_room", { mode: choice.mode });
                if (ack?.error) {
                    alert(`Erro ao criar sala: ${ack.error.code}`);
                    continue;
                }
                window.roomId = ack.roomId;
                window.myId = ack.mySlot;
                window.history.replaceState(null, null, `?sala=${window.roomId}`);
                break;
            }

            if (choice.action === "joinPrivate") {
                const ack = await emit("join_private_room", { roomId: choice.roomId });
                if (ack?.error) {
                    alert(`Erro ao entrar na sala: ${ack.error.code}`);
                    continue;
                }
                window.roomId = choice.roomId.toUpperCase();
                window.myId = ack.mySlot;
                window.history.replaceState(null, null, `?sala=${window.roomId}`);
                break;
            }
        }
    }

    // Random Match pareou: state já chegou via match_found → syncUI vai mostrar
    // game-container direto (ambos players connected). Pra Private, syncUI vai
    // mostrar a private-room-screen sozinha quando detectar slot vazio + matchmaking
    // privado — não precisa setar display aqui.
}
