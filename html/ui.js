// ui.js — Renderização e handlers de interação do cliente.
//
// Concentra: layout helpers, sincronização de telas (syncUI), tabuleiro (renderBoard),
// overlay de combate (showCombatUI), tela final (showAftermath/drawSVG), e handlers
// expostos via window.X para uso em onclick="..." no markup.
//
// syncUI é exportada para ser passada como callback de initMultiplayer (em network.js).

import { DICE, SPAWN_PER_SLOT, GRID_SIZE, MAX_PLAYERS, arrEq } from './gameState.js';
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
    if(S.winner!==undefined&&S.winner>=0){showAftermath(S.winner);return;}
    else{document.getElementById('review-screen').style.display='none';}

    // opponents ausentes (sala recém-criada) não entram em S.players — checar
    // contagem de slots esperada pro modo, não só os presentes
    const allConnected = S.players.length === MAX_PLAYERS[S.mode] && S.players.every(p => p.connected);

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

    const total = MAX_PLAYERS[S.mode];
    const connected = S.players.filter(p => p && p.connected).length;
    document.getElementById('private-players-count').textContent = `${connected}/${total}`;

    const list = document.getElementById('private-players-list');
    list.innerHTML = '';
    for(let id = 0; id < total; id++){
        const p = S.players[id];
        const isMe = id === window.myId;
        const div = document.createElement('div');
        div.className = 'private-player-slot' + (p?.connected ? ' connected' : ' empty');
        const label = p?.connected
            ? (isMe ? `Você — Agente ${ROMAN[id]}` : `Agente ${ROMAN[id]}`)
            : 'Aguardando…';
        div.innerHTML = `<span class="dot"></span><span>${label}</span>`;
        list.appendChild(div);
    }
}

/* ── render board ───────────────────────────────────── */
function renderBoard(){
    const me     = S.players[window.myId];
    const others = S.players.filter(p => p.id !== window.myId);

    renderHeader(window.myId);
    setupBoardOnce();
    renderPieces();

    const fogMask    = calcFogMask(me.pos, GRID_SIZE);
    const targetMask = !me.ready ? validSkillTargets(me.skill, me.pos, GRID_SIZE) : new Set();
    document.querySelectorAll('#grid-main .cell').forEach((cell, i) => {
        const r = Math.floor(i / GRID_SIZE), c = i % GRID_SIZE;
        renderCell(cell, r, c, { me, others, fogMask, targetMask });
    });

    renderControls(me);
    renderStatus(me);
}

function renderHeader(myId){
    const title = document.getElementById('player-title');
    title.innerText  = `AGENTE ${ROMAN[myId]}`;
    title.style.color = `var(--p${myId+1})`;
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
    S.players.forEach(p => {
        const d = document.createElement('div');
        d.id = `piece-${p.id}`;
        d.className = `piece p${p.id+1}-piece`;
        layer.appendChild(d);
    });
}

function renderPieces(){
    S.players.forEach(p => {
        const piece = document.getElementById(`piece-${p.id}`);
        if(!piece) return;
        const pos = pPos(p.pos[0], p.pos[1]);
        piece.style.top  = pos.top  + 'px';
        piece.style.left = pos.left + 'px';
        piece.classList.toggle('trapped', p.trapped);
        // Só renderiza a peça do próprio jogador no tabuleiro principal —
        // oponentes só aparecem como "ghost" nas células adjacentes (renderCell).
        piece.style.display = (p.id === window.myId) ? 'block' : 'none';
    });
}

function renderCell(cell, r, c, ctx){
    const { me, others, fogMask, targetMask } = ctx;
    const key      = `${r},${c}`;
    const isTarget = targetMask.has(key);
    const fog      = fogMask.has(key) && !(me.skill === 'SPRINT' && isTarget);

    cell.className = 'cell' + (fog ? ' fog' : '');
    cell.innerHTML = '';

    if(me.target && arrEq(me.target, [r, c])) cell.classList.add('selected');
    else if(isTarget) cell.classList.add(me.skill === 'SPRINT' ? 'sprint-target' : 'clickable');

    const adjacent = !fogMask.has(key);
    if(adjacent){
        // Em 4v4, mais de um oponente pode ocupar a mesma célula adjacente
        // (Royal Rumble simultâneo). Renderiza ghost de cada um.
        for(const other of others){
            if(arrEq(other.pos, [r, c])){
                cell.innerHTML += `<div style="width:26px;height:26px;border-radius:50%;background:var(--p${other.id+1});opacity:.25;box-shadow:0 0 12px var(--p${other.id+1})"></div>`;
            }
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
    if(id!==window.myId)return;
    if((S.pendingCombat?.myRoll ?? 0) > 0) return;

    const roll = await actRollDie();
    if(roll === null) return;

    const die=document.getElementById(`die-${id}`);
    const hint=document.getElementById(`hint-${id}`);
    if(!die) return;

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
            const color=`var(--p${id+1})`;
            die.style.borderColor=color;
            die.style.color=color;
            die.style.boxShadow=`0 0 28px var(--gp${id+1})`;
        }
    },55);
};

/* ── combat UI — Royal Rumble (2-4 dados) ───────────── */
function showCombatUI(){
    document.getElementById('game-container').style.display='none';
    document.getElementById('combat-overlay').style.display='flex';
    document.getElementById('combat-title').innerText=S.isEndgame?'CONFRONTO FINAL':'CONFRONTO';
    document.getElementById('combat-result').innerText='';

    const pc = S.pendingCombat;
    if(!pc || !Array.isArray(pc.participants) || pc.participants.length < 2) return;

    const participants = [...pc.participants].sort((a,b)=>a-b);
    setupCombatArena(participants);

    for(const slot of participants){
        const isMe = (slot === window.myId);
        const hasRolled = isMe
            ? (pc.myRoll > 0)
            : !!pc.opponentRolls?.find(o => o.slot === slot)?.rolled;
        renderCombatDie(slot, isMe, hasRolled, pc.myRoll);
    }
}

// Recria os dados no arena só quando o conjunto de participantes muda.
// Em re-roll de Royal Rumble (top scorers) o subset muda → arena reconstrói.
function setupCombatArena(participants){
    const arena = document.getElementById('combat-arena');
    const sig = participants.join(',');
    if(arena.dataset.sig === sig) return;

    arena.dataset.sig = sig;
    arena.innerHTML = '';
    arena.dataset.count = String(participants.length);

    for(const slot of participants){
        const wrap = document.createElement('div');
        wrap.className = 'die-wrap';

        const lbl = document.createElement('div');
        lbl.className = 'die-label';
        lbl.id = `lbl-${slot}`;
        lbl.style.color = `var(--p${slot+1})`;
        lbl.textContent = `Agente ${ROMAN[slot]}`;
        wrap.appendChild(lbl);

        const die = document.createElement('div');
        die.className = 'die idle';
        die.id = `die-${slot}`;
        die.textContent = '·';
        if(slot === window.myId) die.onclick = () => window.rollDie(slot);
        wrap.appendChild(die);

        const hint = document.createElement('div');
        hint.className = 'die-hint';
        hint.id = `hint-${slot}`;
        wrap.appendChild(hint);

        const math = document.createElement('div');
        math.className = 'die-math';
        math.id = `math-${slot}`;
        wrap.appendChild(math);

        arena.appendChild(wrap);
    }
}

function renderCombatDie(slot, isMe, hasRolled, myRollValue){
    const die = document.getElementById(`die-${slot}`);
    const hint = document.getElementById(`hint-${slot}`);
    const mathDiv = document.getElementById(`math-${slot}`);
    if(!die) return;

    if(isMe && hasRolled){
        // Mostra o meu dado pousado com o número.
        die.textContent = DICE[myRollValue];
        die.classList.remove('idle','rolling');
        die.classList.add('landed');
        const clr = `var(--p${slot+1})`;
        die.style.borderColor = clr;
        die.style.color = clr;
        die.style.boxShadow = `0 0 28px var(--gp${slot+1})`;
        die.style.cursor = 'default';
        die.onclick = null;
        hint.textContent = '';
        hint.style.opacity = '1';

        const me = S.players[slot];
        const totalMod = getTotalMod(me);
        const modStr = totalMod >= 0 ? `+${totalMod}` : totalMod;
        mathDiv.innerText = `${myRollValue} ${modStr} = ${myRollValue + totalMod}`;
    } else if(!isMe && hasRolled){
        // Oponente já rolou; valor permanece oculto até combat_resolved (PROTO §5.3).
        if(!die.classList.contains('rolling')){
            die.textContent = '·';
            die.style.borderColor = '';
            die.style.color = '';
            die.style.boxShadow = '';
            die.classList.remove('landed','rolling');
            die.classList.add('idle');
        }
        die.style.cursor = 'default';
        die.onclick = null;
        hint.textContent = 'rolou';
        hint.style.opacity = '1';
        mathDiv.innerText = '';
    } else {
        // Ainda não rolou.
        if(!die.classList.contains('rolling')){
            die.textContent = '·';
            die.style.borderColor = '';
            die.style.color = '';
            die.style.boxShadow = '';
            die.classList.remove('landed');
            die.classList.add('idle');
        }
        die.style.cursor = isMe ? 'pointer' : 'default';
        die.onclick = isMe ? () => window.rollDie(slot) : null;
        hint.textContent = isMe ? 'toque para rolar' : 'aguardando...';
        hint.style.opacity = '1';
        mathDiv.innerText = '';
    }
}

/* ── aftermath ──────────────────────────────────────── */
function showAftermath(w){
    document.getElementById('private-room-screen').style.display='none';
    document.getElementById('game-container').style.display='none';
    document.getElementById('combat-overlay').style.display='none';
    document.getElementById('review-screen').style.display='flex';

    const isMe = (w === window.myId);
    const winText = document.getElementById('winner-text');
    winText.innerText = isMe ? 'MISSÃO CUMPRIDA' : 'MISSÃO FALHOU';
    winText.style.color = `var(--p${w+1})`;

    // Sub-título identificando o vencedor explicitamente. Em 4v4 os perdedores
    // precisam saber QUEM venceu pra contar a história — em 1v1 é redundante.
    const sub = document.getElementById('winner-sub');
    if(S.players.length > 2 && !isMe){
        sub.style.display = 'block';
        sub.innerText = `AGENTE ${ROMAN[w]} VENCEU`;
        sub.style.color = `var(--p${w+1})`;
    } else {
        sub.style.display = 'none';
    }

    // Legenda de cores por slot, só em 4v4 (em 1v1 a cor já é óbvia pelo header).
    const legend = document.getElementById('legend-players');
    if(S.players.length > 2){
        legend.style.display = 'flex';
        legend.innerHTML = S.players.map(p =>
            `<span class="legend-player" style="color:var(--p${p.id+1})">● Agente ${ROMAN[p.id]}</span>`
        ).join('');
    } else {
        legend.style.display = 'none';
    }

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
    setTimeout(()=>drawSVG(w),100);
}

function drawSVG(winnerSlot){
    const svg=document.getElementById('svg-paths');
    const grid=document.getElementById('after-grid');
    svg.setAttribute('viewBox',`0 0 ${grid.offsetWidth} ${grid.offsetHeight}`);
    svg.innerHTML='';
    // Trajeto do vencedor sai destacado (mais forte/grosso); perdedores ficam
    // discretos pra não saturar quando há 4 paths sobrepostas em 4v4.
    S.players.forEach(p=>{
        const pi=p.id;
        const isWinner = (pi === winnerSlot);
        const strokeWidth = isWinner ? '4' : '2';
        const pathOpacity = isWinner ? '0.7' : '0.22';
        const dotR = isWinner ? '5' : '3';
        const dotOpacity = isWinner ? '1' : '0.45';
        let d='';
        p.history.forEach((pos,idx)=>{
            const {x,y}=svgXY(pos[0],pos[1]);
            d+=(idx===0?'M':'L')+`${x} ${y} `;
            const dot=document.createElementNS("http://www.w3.org/2000/svg","circle");
            dot.setAttribute("cx",x);dot.setAttribute("cy",y);dot.setAttribute("r",dotR);
            dot.setAttribute("fill",`var(--p${pi+1})`);
            dot.setAttribute("opacity",dotOpacity);
            svg.appendChild(dot);
        });
        const path=document.createElementNS("http://www.w3.org/2000/svg","path");
        path.setAttribute("d",d.trim());
        path.setAttribute("stroke",`var(--p${pi+1})`);
        path.setAttribute("stroke-width",strokeWidth);
        path.setAttribute("fill","none");
        path.setAttribute("stroke-linejoin","round");
        path.setAttribute("opacity",pathOpacity);
        svg.appendChild(path);
    });
}

/* ── restart ────────────────────────────────────────── */
window.restartGame=()=>{
    actRestartGame();
};

window.copyLink=()=>{ navigator.clipboard.writeText(window.location.href); alert("Link copiado."); };
window.copyCode=()=>{ if(window.roomId){ navigator.clipboard.writeText(window.roomId); alert(`Código ${window.roomId} copiado.`); } };
