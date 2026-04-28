// Constantes compartilhadas pelo server. Espelham as do cliente (html/gameState.js)
// até existir um pacote shared — por agora a duplicação é deliberada (server e cliente
// rodam em ambientes diferentes, módulo shared exigiria tooling extra).

export const GRID_SIZE = 4;

export const MAX_PLAYERS = { "1v1": 2, "4v4": 4 };

export const SPAWNS_BY_SLOT = {
  "1v1": [[0, 0], [3, 3]],
  "4v4": [[0, 0], [3, 3], [3, 0], [0, 3]],
};

// Goal de cada slot é a diagonal oposta do spawn (PROTO_SOCKET §2).
export const GOALS_BY_SLOT = {
  "1v1": [[3, 3], [0, 0]],
  "4v4": [[3, 3], [0, 0], [0, 3], [3, 0]],
};

// Inventário inicial por modo (PROTO_SOCKET §4).
export const INV_INITIAL_BY_MODE = {
  "1v1": { BLOCK: 2, TRAP: 2, SPRINT: 1 },
  "4v4": { BLOCK: 1, TRAP: 1, SPRINT: 1 },
};

// Delay entre todos rolarem e a resolução do combate aparecer — espelha o cliente
// (html/gameState.js → COMBAT_REVEAL_MS). É o tempo da animação dos dados.
export const COMBAT_REVEAL_MS = 2800;
