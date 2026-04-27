// combat.js — Lógica autoritativa de turno e combate (1v1).
//
// Em 1v1 atual, P1 (slot 0) é o host: somente esse cliente roda hostProcessTurn /
// hostResolveCombat / hostCheckWin. P2 (slot 1) apenas observa estado.
//
// Migração para SEC-001: estas funções são portadas para o servidor Node em
// SEC-001.4 a SEC-001.6, com Royal Rumble genérico (N participantes).

import { set } from './network.js';
import { arrEq } from './gameState.js';

function getTurnMod(p) {
    if (p.combatSkill === 'SPRINT') return p.jumpedBlock ? -2 : -1;
    if (p.combatSkill === 'BLOCK' || p.combatSkill === 'TRAP') return 1;
    return 0;
}

export function getTotalMod(p) {
    return p.permMod + getTurnMod(p);
}

export function hostProcessTurn() {
    const [p1, p2] = S.players;
    const swap = arrEq(p1.target, p2.pos) && arrEq(p2.target, p1.pos);
    const same = arrEq(p1.target, p2.target);
    S.players.forEach(p => { p.trapped = false; p.combatSkill = p.skill; });

    if (swap) {
        S.players.forEach((p, i) => {
            if (p.skill && p.skill !== 'SPRINT') {
                S.spentRes.push({ r: p.pos[0], c: p.pos[1], type: p.skill, owner: i, status: 'wasted' });
                p.inv[p.skill]--; p.permMod += 1; p.skill = "";
            }
        });
        hostMove(0); hostMove(1); hostCheckWin();
    } else if (same && !arrEq(p1.target, p1.pos)) {
        S.players.forEach(p => {
            if (p.skill === 'SPRINT') {
                const mr = (p.pos[0] + p.target[0]) / 2, mc = (p.pos[1] + p.target[1]) / 2;
                p.jumpedBlock = S.blocks.some(b => b.r === mr && b.c === mc);
            }
        });
        S.phase = "combat";
        S.players.forEach(p => { p.roll = 0; });
        set(dbRef, S);
    } else {
        hostMove(0); hostMove(1); hostCheckWin();
    }
}

function hostMove(i) {
    const p = S.players[i];
    let usedSkillMod = 0;
    if (p.skill === 'BLOCK') { S.blocks.push({ r: p.pos[0], c: p.pos[1], owner: i }); p.inv.BLOCK--; usedSkillMod = 1; }
    if (p.skill === 'TRAP')  { S.traps.push({ r: p.pos[0], c: p.pos[1], owner: i }); p.inv.TRAP--; usedSkillMod = 1; }
    if (p.skill === 'SPRINT') {
        const mr = (p.pos[0] + p.target[0]) / 2, mc = (p.pos[1] + p.target[1]) / 2;
        const di = S.blocks.findIndex(b => b.r === p.target[0] && b.c === p.target[1]);
        const mi = S.blocks.findIndex(b => b.r === mr && b.c === mc);
        p.inv.SPRINT--;
        if (di !== -1) {
            S.spentRes.push({ ...S.blocks[di], status: 'broken' });
            S.blocks.splice(di, 1); p.pos = [mr, mc]; usedSkillMod = -1;
        } else if (mi !== -1) {
            S.spentRes.push({ ...S.blocks[mi], status: 'jumped' });
            S.blocks.splice(mi, 1); p.jumpedBlock = true; p.pos = [...p.target]; usedSkillMod = -2;
        } else {
            p.pos = [...p.target]; usedSkillMod = -1;
        }
    } else {
        const bi = S.blocks.findIndex(b => b.r === p.target[0] && b.c === p.target[1]);
        if (bi !== -1) {
            S.spentRes.push({ ...S.blocks[bi], status: 'broken' });
            S.blocks.splice(bi, 1);
        } else {
            p.pos = [...p.target];
        }
    }
    const ti = S.traps.findIndex(t => t.r === p.pos[0] && t.c === p.pos[1] && t.owner !== i);
    if (ti !== -1) {
        S.spentRes.push({ ...S.traps[ti], status: 'triggered' });
        S.traps.splice(ti, 1); p.trapped = true;
    }
    p.permMod += usedSkillMod;
    p.history.push([...p.pos]);
    p.skill = "";
}

export function hostResolveCombat() {
    try {
        const [p1, p2] = S.players;
        const t1 = p1.roll + getTotalMod(p1);
        const t2 = p2.roll + getTotalMod(p2);
        if (p1.target && Array.isArray(p1.target)) S.combatLocs.push([...p1.target]);
        if (S.isEndgame) {
            if (t1 === t2) { S.players.forEach(p => p.roll = 0); set(dbRef, S); return; }
            S.winner = t1 > t2 ? 0 : 1; set(dbRef, S); return;
        }
        if (t1 === t2) {
            S.players.forEach(p => p.ready = false);
        } else {
            const wi = t1 > t2 ? 0 : 1, li = 1 - wi;
            hostMove(wi);
            S.players[li].history.push([...S.players[li].pos]);
            if (S.players[li].combatSkill) {
                S.players[li].inv[S.players[li].combatSkill]--;
                S.players[li].permMod += getTurnMod(S.players[li]);
                S.spentRes.push({
                    r: S.players[li].pos[0], c: S.players[li].pos[1],
                    type: S.players[li].combatSkill, owner: li, status: 'wasted'
                });
            }
        }
        S.phase = "planning";
        S.players.forEach(p => { p.roll = 0; p.combatSkill = ""; p.jumpedBlock = false; });
        hostCheckWin();
    } catch (e) {
        console.error("Erro na resolução:", e);
    }
}

function hostCheckWin() {
    const v1 = arrEq(S.players[0].pos, [3, 3]), v2 = arrEq(S.players[1].pos, [0, 0]);
    if (v1 && v2) {
        S.isEndgame = true; S.phase = "combat";
        S.players.forEach(p => { p.roll = 0; p.combatSkill = p.skill; });
    } else if (v1) S.winner = 0;
    else if (v2) S.winner = 1;
    else S.players.forEach(p => { p.ready = false; p.target = false; });
    set(dbRef, S);
}
