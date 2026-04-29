// ui.js — Renderização e handlers de interação do cliente.
//
// Concentra: layout helpers, sincronização de telas (syncUI), tabuleiro (renderBoard),
// overlay de combate (showCombatUI), tela final (showAftermath/drawSVG), e handlers
// expostos via window.X para uso em onclick="..." no markup.
//
// syncUI é exportada para ser passada como callback de initMultiplayer (em network.js).

import { DICE, SPAWN_PER_SLOT, GRID_SIZE, arrEq } from './gameState.js';
import { actReady, actRollDie, actRestartGame } from './network.js';
import { getTotalMod } from './combat.js';
import { calcFogMask, validSkillTargets } from './validators.js';

/* ── layout helpers ─────────────────────────────────── */
const getLayout = () => {
    const isMobile = window.innerWidth <= 600;
    const CELL = isMobile ? 62 : 75;
    const GAP  = isMobile ? 6  : 8;
    const PAD  = isMobile ? 10 : 14;
    const PO   = (CELL - (isMobile ? 42 : 50)) / 2;
    const STEP = CELL + GAP;
    return { PAD, CELL, STEP, PO };
};
const pPos  = (r,c) => { const L=getLayout(); return { top:L.PAD+r*L.STEP+L.PO, left:L.PAD+c*L.STEP+L.PO }; };
const svgXY = (r,c) => { const L=getLayout(); return { x:L.PAD+c*L.STEP+L.CELL/2, y:L.PAD+r*L.STEP+L.CELL/2 }; };

/* ── sync ───────────────────────────────────────────── */
export function syncUI(){
    if(S.winner===0||S.winner===1){showAftermath(S.winner);return;}
    else{document.getElementById('review-screen').style.display='none';}

    const allConnected = S.players.every(p => p.connected);

    if(allConnected){
        document.getElementById('private-room-screen').style.display='none';
        if(S.phase!=="combat") document.getElementById('game-container').style.display='flex';
    } else if(S.matchmaking === "private"){
        // Sala privada com slot vazio: mostra tela de "aguardando" com código + lista
        document.getElementById('private-room-screen').style.display='flex';
        document.getElementById('game-container').style.display='none';
        document.getElementById('combat-overlay').style.display='none';
        renderPrivateRoom();
        return;
    } else {
        // Random Match com slot vazio: oponente caiu pós-pareamento. Mantém o tabuleiro
        // visível pra o jogador ver onde estava — sem tela específica até hardening de reconnect
        document.getElementById('private-room-screen').style.display='none';
        return;
    }

    if(S.phase==="combat"){
        showCombatUI();
    } else {
        document.getElementById('combat-overlay').style.display='none';
        renderBoard();
    }
}

/* ── private room (MATCH-001.5) ────────────────────── */
const ROMAN = ['I','II','III','IV'];
function renderPrivateRoom(){
    const codeEl = document.getElementById('private-code');
    if(window.roomId) codeEl.textContent = window.roomId;

    const total = S.players.length;
    const connected = S.players.filter(p => p.connected).length;
    document.getElementById('private-players-count').textContent = `${connected}/${total}`;

    const list = document.getElementById('private-players-list');
    list.innerHTML = '';
    for(const p of S.players){
        const isMe = p.id === window.myId;
        const div = document.createElement('div');
        div.className = 'private-player-slot' + (p.connected ? ' connected' : ' empty');
        const label = p.connected
            ? (isMe ? `Você — Agente ${ROMAN[p.id]}` : `Agente ${ROMAN[p.id]}`)
            : 'Aguardando…';
        div.innerHTML = `<span class="dot"></span><span>${label}</span>`;
        list.appendChild(div);
    }
}

/* ── render board ───────────────────────────────────── */
function renderBoard(){
    const me    = S.players[window.myId];
    const other = S.players[1-window.myId];

    renderHeader(window.myId);
    setupBoardOnce();
    renderPieces();

    const fogMask    = calcFogMask(me.pos, GRID_SIZE);
    const targetMask = !me.ready ? validSkillTargets(me.skill, me.pos, GRID_SIZE) : new Set();
    document.querySelectorAll('#grid-main .cell').forEach((cell, i) => {
        const r = Math.floor(i / GRID_SIZE), c = i % GRID_SIZE;
        renderCell(cell, r, c, { me, other, fogMask, targetMask });
    });

    renderControls(me);
    renderStatus(me);
}

function renderHeader(myId){
    const title = document.getElementById('player-title');
    title.innerText  = `AGENTE ${myId === 0 ? 'I' : 'II'}`;
    title.style.color = myId === 0 ? 'var(--p1)' : 'var(--p2)';
}

function setupBoardOnce(){
    const g = document.getElementById('grid-main');
    if(g.children.length > 0) return;

    for(let i = 0; i < GRID_SIZE * GRID_SIZE; i++){
        const cell = document.createElement('div');
        cell.className = 'cell';
        const r = Math.floor(i / GRID_SIZE), c = i % GRID_SIZE;
        cell.onclick = () => onCellClick(r, c);
        g.appendChild(cell);
    }
    const layer = document.getElementById('pieces-main');
    [0, 1].forEach(i => {
        const d = document.createElement('div');
        d.id = `piece-${i}`;
        d.className = `piece p${i+1}-piece`;
        layer.appendChild(d);
    });
}

function renderPieces(){
    [0, 1].forEach(i => {
        const piece = document.getElementById(`piece-${i}`);
        const pos = pPos(S.players[i].pos[0], S.players[i].pos[1]);
        piece.style.top  = pos.top  + 'px';
        piece.style.left = pos.left + 'px';
        piece.classList.toggle('trapped', S.players[i].trapped);
        piece.style.display = (i === window.myId) ? 'block' : 'none';
    });
}

function renderCell(cell, r, c, ctx){
    const { me, other, fogMask, targetMask } = ctx;
    const key      = `${r},${c}`;
    const isTarget = targetMask.has(key);
    const fog      = fogMask.has(key) && !(me.skill === 'SPRINT' && isTarget);

    cell.className = 'cell' + (fog ? ' fog' : '');
    cell.innerHTML = '';

    if(me.target && arrEq(me.target, [r, c])) cell.classList.add('selected');
    else if(isTarget) cell.classList.add(me.skill === 'SPRINT' ? 'sprint-target' : 'clickable');

    const adjacent = !fogMask.has(key);
    if(adjacent){
        if(arrEq(other.pos, [r, c])){
            cell.innerHTML += `<div style="width:26px;height:26px;border-radius:50%;background:var(--p${other.id+1});opacity:.25;box-shadow:0 0 12px var(--p${other.id+1})"></div>`;
        }
        S.blocks.forEach(b => {
            if(b.r === r && b.c === c) cell.innerHTML += `<span style="color:var(--p${b.owner+1});font-size:26px;filter:drop-shadow(0 0 4px currentColor)">◈</span>`;
        });
    }
    S.traps.forEach(t => {
        if(t.r === r && t.c === c && t.owner === window.myId) cell.innerHTML += `<span style="color:var(--p${window.myId+1});font-size:18px;opacity:.85;filter:drop-shadow(0 0 4px currentColor)">✦</span>`;
    });
}

function renderControls(me){
    const onOwnSpawn = arrEq(me.pos, SPAWN_PER_SLOT[window.myId]);
    const icons = { BLOCK: '◈ BARRICADA', TRAP: '✦ ARMADILHA', SPRINT: '⟫ AVANÇO' };
    ['BLOCK', 'TRAP', 'SPRINT'].forEach(s => {
        const btn = document.getElementById(`btn-${s.toLowerCase()}`);
        btn.className = me.skill === s ? 'active' : '';
        btn.innerText = `${icons[s]} (${me.inv[s]})`;
        const blockedOnSpawn = (s === 'BLOCK' || s === 'TRAP') && onOwnSpawn;
        btn.disabled = me.inv[s] <= 0 || me.ready || me.trapped || blockedOnSpawn;
    });
    document.getElementById('btn-ready').disabled = me.ready || !me.target;
}

function renderStatus(me){
    const pMod = me.permMod >= 0 ? `+${me.permMod}` : me.permMod;
    document.getElementById('status-text').innerText = me.ready
        ? 'aguardando adversário...'
        : `modificador fixo: ${pMod}`;
}

/* ── cell click ─────────────────────────────────────── */
window.onCellClick=(r,c)=>{
    const me=S.players[window.myId];
    if(me.ready)return;
    const targets=validSkillTargets(me.skill, me.pos, GRID_SIZE);
    if(!targets.has(`${r},${c}`)) return;
    me.target=[r,c];
    renderBoard();
};

window.setSkill=(s)=>{
    const me=S.players[window.myId];
    if(me.ready)return;
    if((s==='BLOCK'||s==='TRAP') && arrEq(me.pos, SPAWN_PER_SLOT[window.myId])) return;
    me.skill=me.skill===s?"":s;
    me.target=false;
    renderBoard();
};

window.ready=()=>{
    const me=S.players[window.myId];
    if(me.trapped) me.target=[...me.pos];
    me.ready=true;
    actReady(me.target, me.skill);
};

/* ── roll die — with animation ──────────────────────── */
window.rollDie=async (id)=>{
    if(id!==window.myId||S.players[id].roll>0)return;

    const roll = await actRollDie();
    if(roll === null) return;

    const die=document.getElementById(`die-${id}`);
    const hint=document.getElementById(`hint-${id}`);

    die.classList.remove('idle','landed');
    die.classList.add('rolling');
    if(hint) hint.style.opacity='0';

    let ticks=0;
    const interval=setInterval(()=>{
        die.textContent=DICE[Math.floor(Math.random()*6)+1];
        ticks++;
        if(ticks>=16){
            clearInterval(interval);
            die.classList.remove('rolling');
            die.classList.add('landed');
            die.textContent=DICE[roll];

            // colour the die by player
            const color=id===0?'var(--p1)':'var(--p2)';
            die.style.borderColor=color;
            die.style.color=color;
            die.style.boxShadow=`0 0 28px ${id===0?'var(--gp1)':'var(--gp2)'}`;
        }
    },55);
};

/* ── combat UI ──────────────────────────────────────── */
function showCombatUI(){
    document.getElementById('game-container').style.display='none';
    document.getElementById('combat-overlay').style.display='flex';
    document.getElementById('combat-title').innerText=S.isEndgame?'CONFRONTO FINAL':'CONFRONTO';
    document.getElementById('combat-result').innerText='';

    [0,1].forEach(i=>{
        const p=S.players[i];
        const die=document.getElementById(`die-${i}`);
        const hint=document.getElementById(`hint-${i}`);
        const mathDiv=document.getElementById(`math-${i}`);

        if(p.roll>0){
            die.textContent=DICE[p.roll];
            die.classList.remove('idle','rolling');
            die.classList.add('landed');
            const clr=i===0?'var(--p1)':'var(--p2)';
            die.style.borderColor=clr;
            die.style.color=clr;
            die.style.boxShadow=`0 0 28px ${i===0?'var(--gp1)':'var(--gp2)'}`;
            die.style.cursor='default';
            if(hint) hint.textContent='';
        } else {
            if(!die.classList.contains('rolling')){
                die.textContent='·';
                die.style.borderColor='';die.style.color='';die.style.boxShadow='';
                die.classList.remove('landed');
                die.classList.add('idle');
            }
            die.style.cursor=(i===window.myId)?'pointer':'default';
            if(hint){
                hint.textContent=(i===window.myId)?'toque para rolar':'aguardando...';
                hint.style.opacity='1';
            }
        }

        const totalMod=getTotalMod(p);
        if(p.roll>0){
            const modStr=totalMod>=0?`+${totalMod}`:totalMod;
            mathDiv.innerText=`${p.roll} ${modStr} = ${p.roll+totalMod}`;
        } else { mathDiv.innerText=''; }
    });

    if(S.players[0].roll>0&&S.players[1].roll>0){
        const t1=S.players[0].roll+getTotalMod(S.players[0]);
        const t2=S.players[1].roll+getTotalMod(S.players[1]);
        const res=document.getElementById('combat-result');
        if(t1===t2){
            res.innerText=S.isEndgame?'EMPATE — NOVA RODADA':'EMPATE — RECURSOS DEVOLVIDOS';
            res.style.color='var(--combat)';
        } else {
            res.innerText=`VENCEDOR: AGENTE ${t1>t2?'I':'II'}`;
            res.style.color=t1>t2?'var(--p1)':'var(--p2)';
        }
    }
}

/* ── aftermath ──────────────────────────────────────── */
function showAftermath(w){
    document.getElementById('private-room-screen').style.display='none';
    document.getElementById('game-container').style.display='none';
    document.getElementById('combat-overlay').style.display='none';
    document.getElementById('review-screen').style.display='flex';
    document.getElementById('winner-text').innerText=(w===window.myId)?'MISSÃO CUMPRIDA':'MISSÃO FALHOU';
    document.getElementById('winner-text').style.color=(w===window.myId)?'var(--p1)':'var(--p2)';

    const grid=document.getElementById('after-grid');
    grid.innerHTML='';
    for(let i=0;i<16;i++){
        const r=Math.floor(i/4),c=i%4;
        const cell=document.createElement('div'); cell.className='cell';
        if(S.combatLocs.some(l=>arrEq(l,[r,c]))) cell.classList.add('cell-combat');
        let html='';
        S.blocks.forEach(b=>{if(b.r===r&&b.c===c) html+=`<span style="color:var(--p${b.owner+1});font-size:22px">◈</span>`;});
        S.traps.forEach(t=>{if(t.r===r&&t.c===c) html+=`<span style="color:var(--p${t.owner+1});font-size:16px">✦</span>`;});
        S.spentRes.forEach(s=>{
            if(s.r===r&&s.c===c){
                const ic=s.type==='BLOCK'?'◈':s.type==='TRAP'?'✦':'⟫';
                const sz=s.type==='BLOCK'?'22px':s.type==='TRAP'?'16px':'18px';
                html+=`<span class="broken" style="color:var(--p${s.owner+1});font-size:${sz};margin:0 2px">${ic}</span>`;
            }
        });
        cell.innerHTML=`<div style="position:relative;z-index:20;display:flex;gap:4px;flex-wrap:wrap;justify-content:center;align-items:center">${html}</div>`;
        grid.appendChild(cell);
    }
    setTimeout(()=>drawSVG(),100);
}

function drawSVG(){
    const svg=document.getElementById('svg-paths');
    const grid=document.getElementById('after-grid');
    svg.setAttribute('viewBox',`0 0 ${grid.offsetWidth} ${grid.offsetHeight}`);
    svg.innerHTML='';
    [0,1].forEach(pi=>{
        let d='';
        S.players[pi].history.forEach((pos,idx)=>{
            const {x,y}=svgXY(pos[0],pos[1]);
            d+=(idx===0?'M':'L')+`${x} ${y} `;
            const dot=document.createElementNS("http://www.w3.org/2000/svg","circle");
            dot.setAttribute("cx",x);dot.setAttribute("cy",y);dot.setAttribute("r","4");
            dot.setAttribute("fill",`var(--p${pi+1})`);
            svg.appendChild(dot);
        });
        const path=document.createElementNS("http://www.w3.org/2000/svg","path");
        path.setAttribute("d",d.trim());
        path.setAttribute("stroke",`var(--p${pi+1})`);
        path.setAttribute("stroke-width","3");
        path.setAttribute("fill","none");
        path.setAttribute("stroke-linejoin","round");
        path.setAttribute("opacity","0.35");
        svg.appendChild(path);
    });
}

/* ── restart ────────────────────────────────────────── */
window.restartGame=()=>{
    actRestartGame();
};

window.copyLink=()=>{ navigator.clipboard.writeText(window.location.href); alert("Link copiado."); };
window.copyCode=()=>{ if(window.roomId){ navigator.clipboard.writeText(window.roomId); alert(`Código ${window.roomId} copiado.`); } };
