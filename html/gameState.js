// gameState.js — Constantes globais e estado inicial do 4x4.
// Carregado pelo módulo principal em html/index.html via import ES6.

export const DICE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Spawn de cada slot. Hoje 1v1 (slots 0 e 1); expandido para 4 slots em MODE-001.
export const SPAWN_PER_SLOT = { 0: [0, 0], 1: [3, 3] };

// Tabuleiro 4x4 fixo.
export const GRID_SIZE = 4;

// Comparação de posições [r, c].
export const arrEq = (a, b) =>
    a && b && Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];

// Distância Manhattan entre duas posições [r, c].
export const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

// Estado inicial placeholder. Sobrescrito pelo primeiro state_update vindo do server
// (network.js) — adapter converte schema cullado para este layout antigo (.players[]).
window.S = {
    players: [
        { id: 0, pos: [0, 0], target: false, skill: "", combatSkill: "",
          inv: { BLOCK: 2, TRAP: 2, SPRINT: 1 }, ready: false, roll: 0, permMod: 0,
          history: [[0, 0]], trapped: false, jumpedBlock: false, connected: false },
        { id: 1, pos: [3, 3], target: false, skill: "", combatSkill: "",
          inv: { BLOCK: 2, TRAP: 2, SPRINT: 1 }, ready: false, roll: 0, permMod: 0,
          history: [[3, 3]], trapped: false, jumpedBlock: false, connected: false }
    ],
    blocks: [], traps: [], spentRes: [], combatLocs: [],
    phase: "planning", winner: -1, isEndgame: false
};
