import { GRID_SIZE } from "./constants.js";

export function arrEq(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
}

export function manhattanDist(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

export function isOnBoard(target, gridSize = GRID_SIZE) {
  if (!Array.isArray(target) || target.length !== 2) return false;
  const [r, c] = target;
  return Number.isInteger(r) && Number.isInteger(c) &&
    r >= 0 && r < gridSize && c >= 0 && c < gridSize;
}

// SPRINT: 2 células em linha reta (vertical ou horizontal). Outras: 1 adjacente Manhattan.
export function isReachableTarget(pos, target, skill, gridSize = GRID_SIZE) {
  if (!isOnBoard(target, gridSize)) return false;
  if (arrEq(pos, target)) return false;
  const [pr, pc] = pos;
  const [tr, tc] = target;
  if (skill === "SPRINT") {
    return (pr === tr && Math.abs(pc - tc) === 2) ||
           (pc === tc && Math.abs(pr - tr) === 2);
  }
  return manhattanDist(pos, target) === 1;
}

// RULE-001: BLOCK/TRAP não podem ser colocados na própria base de spawn.
export function canPlaceSkillOnBase(player, skill) {
  if (skill !== "BLOCK" && skill !== "TRAP") return true;
  return !arrEq(player.pos, player.spawn);
}

// Guards defensivos para payloads de socket. Cliente real sempre envia objetos planos;
// estes barram payloads bizarros (string, número, array) antes que cheguem aos handlers
// que esperam `payload?.campo` e poderiam crashar com tipos inesperados.
export function isPlainPayload(p) {
  return p === undefined || p === null ||
    (typeof p === "object" && !Array.isArray(p));
}

export function isShortString(s, maxLen = 64) {
  return typeof s === "string" && s.length > 0 && s.length <= maxLen;
}
