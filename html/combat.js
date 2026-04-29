// combat.js — Modificadores de combate (display).
//
// Lógica autoritativa de turno e combate vive no server (server/rooms.js,
// portado em SEC-001.4 a SEC-001.6). Este módulo retém apenas os helpers
// que o cliente usa para renderizar `Dado + Modificador = Total` durante
// o overlay de combate — derivados de campos que já vêm em window.S.

function getTurnMod(p) {
    if (p.combatSkill === 'SPRINT') return p.jumpedBlock ? -2 : -1;
    if (p.combatSkill === 'BLOCK' || p.combatSkill === 'TRAP') return 1;
    return 0;
}

export function getTotalMod(p) {
    return p.permMod + getTurnMod(p);
}
