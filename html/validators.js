// validators.js — Funções puras de validação e cálculo (sem DOM, sem state global).
// Servem tanto para o cliente (UI) quanto, futuramente, para o servidor (SEC-001).

import { dist } from './gameState.js';

/**
 * Conjunto de células ocultas pela fog of war para uma dada posição de jogador.
 * Uma célula está em fog quando a distância Manhattan dela ao jogador é > 1.
 *
 * Não considera ajustes de skill (ex: SPRINT que revela alvo de 2 células de distância).
 * Esses ajustes ficam em camada superior (renderBoard combina o resultado com sprint targets).
 *
 * @param {[number, number]} myPos - posição [r, c] do jogador
 * @param {number} gridSize - lado do tabuleiro (4 no jogo atual)
 * @returns {Set<string>} conjunto de chaves "r,c" das células ocultas
 */
export function calcFogMask(myPos, gridSize) {
    const mask = new Set();
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (dist([r, c], myPos) > 1) mask.add(`${r},${c}`);
        }
    }
    return mask;
}

/**
 * Conjunto de células alvo válidas para movimento, dado o skill atual do jogador.
 *  - SPRINT: 4 candidatas a 2 células de distância em linha reta (vertical ou horizontal)
 *  - qualquer outro skill (BLOCK, TRAP, sem skill): 4 adjacentes Manhattan
 *
 * Aplica clamp de bordas do tabuleiro. Não verifica colisão com BLOCKs ou TRAPs —
 * essa validação fica em camada de movimento autoritativo (combat.js / server).
 *
 * @param {string} skill - "" | "BLOCK" | "TRAP" | "SPRINT"
 * @param {[number, number]} myPos
 * @param {number} gridSize
 * @returns {Set<string>} chaves "r,c" das células alvo
 */
export function validSkillTargets(skill, myPos, gridSize) {
    const [pr, pc] = myPos;
    const step = skill === 'SPRINT' ? 2 : 1;
    const candidates = [
        [pr - step, pc], [pr + step, pc],
        [pr, pc - step], [pr, pc + step]
    ];
    const targets = new Set();
    for (const [r, c] of candidates) {
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
            targets.add(`${r},${c}`);
        }
    }
    return targets;
}
