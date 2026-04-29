# SESSAO_POR_SESSAO_PLANNING — 4x4

Backlog organizado em **Macro Tarefas** (épicos) com **sub-sessões** numeradas. Cada sub-sessão é uma unidade de trabalho independente — termina com código não-quebrado, atualiza `ACTIVITY_LOG`, e pode ser interrompida sem deixar o sistema inconsistente.

**Triggers:**
- `iniciar sessão` → Claude pega a **próxima sub-sessão ⏳ na ordem planejada** (seção a seguir)
- `iniciar [CÓDIGO]` → pula direto (`SEC-001.3`) ou Macro (`SEC-001` — pega primeira ⏳ dela)
- `status sessão` → resumo: última concluída + próximas

**Status:** ⏳ Pendente · 🔄 Em revisão · ✅ Completo · ⏸ Interrompido · 🚫 Bloqueado

---

# 📋 Ordem de execução planejada

`iniciar sessão` pega o próximo ⏳ daqui de cima. Manter atualizada ao concluir cada sub-sessão.

| # | Sub-sessão | Status | Fase |
|---|-----------|--------|------|
| 1 | TESTES-001 | ✅ | Quick wins |
| 2 | BRAND-001.1 | ✅ | Quick wins |
| 3 | BRAND-001.2 | ✅ | Quick wins |
| 4 | BUG-001 | ✅ | Quick wins |
| 5 | SEC-001.1 | ✅ | Spec do backend (PROTO_SOCKET.md v2.0 aprovada) |
| 6 | UX-001 | ✅ | Polish — tela de combate sem revelar habilidade |
| 7 | RULE-001 | ✅ | Regra — bloquear recurso na base própria (client) |
| 8 | REF-002.1 | ✅ | Modularização |
| 9 | REF-002.2 | ✅ | Modularização |
| 10 | REF-002.3 | ✅ | Modularização |
| 11 | REF-002.4 | ✅ | Modularização |
| 12 | REF-002.5 | ✅ | Modularização |
| 13 | REF-001.1 | ✅ | Refator renderBoard |
| 14 | REF-001.2 | ✅ | Refator renderBoard |
| 15 | REF-001.3 | ✅ | Refator renderBoard |
| 16 | DES-002.1 | ✅ | Design tokens |
| 17 | DES-002.2 | ✅ | Design tokens |
| 18 | DES-002.3 | ✅ | Design tokens |
| 19 | DES-002.4 | ✅ | Design tokens |
| 20 | SEC-001.2 | ✅ | Backend — boilerplate Node + Socket.io |
| 21 | SEC-001.3 | ✅ | Backend — lifecycle Private Room (criação/join) |
| 22 | SEC-001.4 | ✅ | Backend — planning phase (com validação RULE-001) |
| 23 | SEC-001.5 | ✅ | Backend — combat (Royal Rumble desde o início) |
| 24 | SEC-001.6 | ✅ | Backend — endgame + condição de vitória |
| 25 | SEC-001.7 | ✅ | Backend — data culling (`state_for_me`) |
| 26 | SEC-001.8 | ✅ | Cliente — flag `USE_SERVER` em network.js |
| 27 | SEC-001.9 | ⏸ | Validação de paridade Firebase ↔ Server (pulada por decisão do Gerente em 2026-04-28; Firebase ainda vivo até SEC-001.11 como rede de segurança) |
| 28 | SEC-001.10 | ✅ | Promoção: `USE_SERVER=true` permanente |
| 29 | SEC-001.11 | ✅ | Descontinuar Firebase |
| 30 | SEC-001.12 | ✅ | Hardening: rate limit, validação, graceful shutdown |
| 31 | MATCH-001.1 | ✅ | Matchmaking — Private Room no server (código ABCD) |
| 32 | MATCH-001.2 | ✅ | Matchmaking — Random Match queue no server |
| 33 | MATCH-001.3 | ✅ | Cliente — tela inicial (Random/Private + 1v1/4v4) |
| 34 | MATCH-001.4 | ✅ | Cliente — UI de aguardando match |
| 35 | MATCH-001.5 | ✅ | Cliente — UI de Private Room (mostrar/copiar código) |
| 36 | MODE-001.1 | ⏳ | Server — schema com N players + spawns 4 cantos |
| 37 | MODE-001.2 | ⏳ | Server — condição de vitória diagonal (goal por slot) |
| 38 | MODE-001.3 | ⏳ | Server — inventário 1x cada para 4v4 |
| 39 | MODE-001.4 | ⏳ | Cliente — renderizar 4 jogadores (cores distintas) |
| 40 | MODE-001.5 | ⏳ | Cliente — combate Royal Rumble (3+ dados na tela) |
| 41 | MODE-001.6 | ⏳ | Cliente — Aftermath com 4 trajetos |
| 42 | DES-001.1 | ⏳ | i18n — sistema base `t()` + locales |
| 43 | DES-001.2 | ⏳ | i18n — strings do lobby/menu inicial |
| 44 | DES-001.3 | ⏳ | i18n — strings do game-container |
| 45 | DES-001.4 | ⏳ | i18n — strings do combat-overlay |
| 46 | DES-001.5 | ⏳ | i18n — strings do review/aftermath |
| 47 | DES-001.6 | ⏳ | i18n — toggle de idioma + persistência |
| 48 | FEAT-001.1 | ⏳ | Replay/Spectator — spec |

**Lógica da ordem (atualizada):**
- Quick wins (1-4) ✅ concluídos
- Spec doc-only (5) destrava SEC-001 inteiro
- UX-001 e RULE-001 (6-7) são ajustes pequenos pedidos pelo Gerente; mexem no monolito atual, antes de modularizar
- Modularização (8-15) destrava polish e backend
- Tokens (16-19) preparam para temas futuros
- Backend (20-30) é o trabalho mais pesado; entra com cliente modular
- Matchmaking (31-35) precisa do server pronto
- Modo 4v4 (36-41) precisa do server + matchmaking
- i18n (42-47) é polish empurrado para o fim — uma demo PT-BR funciona pro mercado brasileiro inicial
- Replay (48) começa com spec; sub-sessões a definir

---

# 🔴 Macro SEC-001 — Backend autoritativo (Node + Socket.io no Railway)

**Por quê:** Firebase RTDB envia estado completo a ambos os clientes → TRAPs ocultas e movimentos planejados vazam via DevTools. Backend autoritativo resolve a classe inteira de leaks, prepara para modos de matchmaking e modo 4v4.

**Pré-requisito:** REF-002 completo (cliente modular com `network.js` isolado).

**Hospedagem:** server Node no [Railway](https://railway.app); cliente como página estática no [itch.io](https://itch.io).

**Estratégia anti-quebra:** cliente atual continua usando Firebase ao longo de toda a Macro. Server é construído em paralelo. Quando o server estiver completo, o `network.js` (modularizado) ganha flag `USE_SERVER` que alterna entre Firebase e Socket.io. Cada sub-sessão termina com commit; `git revert` desfaz uma sub sem afetar as outras.

| Sub-sessão | Status | Tema |
|-----------|--------|------|
| SEC-001.1 | ✅ | `docs/PROTO_SOCKET.md` v2.0 aprovada em 2026-04-26 — incluiu regra de empate no Royal Rumble (re-roll entre empatados) |
| SEC-001.2 | ✅ | Boilerplate `server/`: Node + Socket.io rodando, eco básico, `package.json` (concluído 2026-04-27) |
| SEC-001.3 | ✅ | Lifecycle de Private Room (criação com código ABCD, join, disconnect) (concluído 2026-04-27) |
| SEC-001.4 | ✅ | Planning phase no server (set_target/skill/ready + validação RULE-001 incluída) (concluído 2026-04-27) |
| SEC-001.5 | ✅ | Combat phase no server — **Royal Rumble desde o início** (genérico para 2+ players) (concluído 2026-04-27) |
| SEC-001.6 | ✅ | Endgame + condição de vitória (diagonal por slot — preparada para 4v4 desde o início) (concluído 2026-04-27) |
| SEC-001.7 | ✅ | Data culling: server envia `state_for_me` específico por destinatário (concluído 2026-04-27) |
| SEC-001.8 | ✅ | Adicionar flag `USE_SERVER` em `network.js`; em `true`, cliente conecta ao server (concluído 2026-04-28) |
| SEC-001.9 | ⏸ | Validação de paridade Firebase ↔ Server (smoke test alternando flag) (pulada 2026-04-28 — roteiro pronto em PARIDADE_REPORT.md, revisitar se bug aparecer) |
| SEC-001.10 | ✅ | Promoção: `USE_SERVER=true` permanente (concluído 2026-04-28 — server no Railway, cliente no itch.io) |
| SEC-001.11 | ✅ | Descontinuar Firebase — SDK, config, chave, initFirebaseMode, branches duais e `combat.js` host* removidos (concluído 2026-04-28) |
| SEC-001.12 | ✅ | Hardening: rate limit (token bucket 30/s), validação defensiva de payload, `maxHttpBufferSize=4096`, uncaughtException/unhandledRejection, ping sem eco (concluído 2026-04-28) |

**Nota de design (importante):** SEC-001.5 (combate) e SEC-001.6 (vitória) são implementados desde o início suportando **N players** e **goal por slot**. Isso significa que MODE-001 (4v4) é majoritariamente cliente — o server já está pronto. Decisão: pagar um pouco mais de custo no SEC-001 para evitar refator no MODE-001.

---

# 🟢 UX-001 — Tela de combate sem revelar habilidade

**Status:** ✅ (concluído 2026-04-26) · **Pré-requisito:** nenhum
**Por quê:** decisão de produto. Mantém pilar "blind planning" mais consistente — durante combate, jogador vê só `Dado + Modificador = Total`, sem saber qual habilidade o oponente usou.

- [x] Localizado `showCombatUI()` em `html/index.html`; identificado bloco que escrevia `BLOCK (+1)` no `<div id="mod-${i}">` (linhas 812-816 originais)
- [x] Removidos: divs `mod-0`/`mod-1` no HTML, classe CSS `.die-modifiers`, declaração `const modDiv` no JS, bloco de cálculo+escrita de label de habilidade
- [x] Mantido visível: `mathDiv` continua mostrando `Dado +Mod = Total` quando o jogador rola
- **Concluído:** zero label de skill na tela de combate; tela mostra apenas dado, modificador agregado e total.

---

# 🟢 RULE-001 — Bloquear BLOCK/TRAP na base própria

**Status:** ✅ (concluído 2026-04-26) · **Pré-requisito:** nenhum
**Por quê:** decisão de produto. Recursos só fazem sentido **fora** da base de spawn própria.

**Escopo:** validação **client-side**. Validação server-side prevista em SEC-001.4.

- [x] Constante `SPAWN_PER_SLOT = { 0: [0,0], 1: [3,3] }` declarada no bloco global do script (preparada para expansão em MODE-001)
- [x] Guard adicionado em `setSkill()`: rejeita BLOCK/TRAP se `me.pos === SPAWN_PER_SLOT[myId]`
- [x] Botões BLOCK e TRAP recebem `disabled=true` em `syncUI()` quando o jogador está na base própria; SPRINT continua habilitado
- **Concluído.**

---

# 🟡 Macro REF-002 — Modularizar o monolito html/index.html

**Por quê:** ~995 linhas em arquivo único bloqueia trabalho incremental. Modularização destrava polish, backend, modo 4v4 e i18n. Reescrita do pivot é permitida nesta Macro por força maior.

| Sub-sessão | Status | Tema |
|-----------|--------|------|
| REF-002.1 | ⏳ | Extrair `html/gameState.js` (window.S, helpers, constantes) |
| REF-002.2 | ⏳ | Extrair `html/network.js` (Firebase init + listeners + writes) |
| REF-002.3 | ⏳ | Extrair `html/combat.js` (host* funções, getTurnMod, getTotalMod) |
| REF-002.4 | ⏳ | Extrair `html/ui.js` (syncUI, renderBoard, screens, handlers) |
| REF-002.5 | ⏳ | Reduzir `index.html` ao essencial (markup + style + scripts) |

Detalhes em [versão anterior do backlog](#) preservados — checklists detalhados de cada sub-sessão.

### REF-002.1 — Extrair gameState.js ✅
- [x] Criado `html/gameState.js` com: `DICE`, `COMBAT_REVEAL_MS`, `SPAWN_PER_SLOT`, `INV_INITIAL`, `GRID_SIZE`, `arrEq`, `dist` + estado inicial `window.S` (efeito colateral)
- [x] Em `index.html`, adicionado `import { ... } from './gameState.js'` no `<script type="module">` (módulo ES6, não classic — preserva escopo do módulo Firebase)
- [x] Removidas as declarações duplicadas no monolito: blocos `DICE`, `COMBAT_REVEAL_MS`, `SPAWN_PER_SLOT`, `arrEq` e `window.S = {...}` inicial
- **Concluído.** Servir via HTTP é necessário (import relativo) — já é o caso em Firebase Hosting / Railway / itch.io.

### REF-002.2 — Extrair network.js ✅
- [x] Criado `html/network.js` com Firebase imports, `firebaseConfig`, `initMultiplayer(onStateChange)`, listener `onValue` (com backfills) e `beforeunload`
- [x] Re-exporta `db`/`ref`/`set`/`onValue`/`get`/`update` para que mutações espalhadas no monolito (`set(dbRef,S)`, `update(ref(db,...))`) continuem funcionando sem refator
- [x] Monolito agora chama `initMultiplayer(syncUI)` passando `syncUI` como callback de mudança de estado
- [x] `window.roomId`/`window.myId`/`window.dbRef` movidos para network.js, preservados em `window` para compat
- **Concluído.** Próxima fase com flag `USE_SERVER` (SEC-001.8) vai abstrair os re-exports em wrappers de alto nível.

### REF-002.3 — Extrair combat.js ✅
- [x] Criado `html/combat.js` com as 6 funções de combate
- [x] Exports públicos: `hostProcessTurn`, `hostResolveCombat`, `getTotalMod`. `hostMove`, `hostCheckWin`, `getTurnMod` permanecem privados ao módulo
- [x] Imports: `set` de `./network.js` e `arrEq` de `./gameState.js`
- [x] Removidas do monolito (~85 linhas)
- **Concluído.**

### REF-002.4 — Extrair ui.js ✅
- [x] Criado `html/ui.js` com layout helpers, `syncUI` (export), `renderBoard`, `showCombatUI`, `showAftermath`, `drawSVG`, e handlers `window.X` (onCellClick/setSkill/ready/rollDie/restartGame/copyLink)
- [x] Imports: gameState (DICE, COMBAT_REVEAL_MS, SPAWN_PER_SLOT, arrEq), network (update, ref, set, db), combat (hostProcessTurn, hostResolveCombat, getTotalMod)
- [x] Removidas do monolito (~290 linhas); script de bootstrap ficou em 4 linhas
- **Concluído.**

### REF-002.5 — Reduzir index.html ✅
- [x] CSS extraído para `html/style.css` (~430 linhas); `index.html` agora referencia via `<link rel="stylesheet" href="style.css">`
- [x] Ordem dos módulos JS resolvida automaticamente pela árvore de dependências (ES modules); index.html importa apenas `initMultiplayer` (network) e `syncUI` (ui), e ui puxa combat e gameState transitivamente
- [x] `index.html` final: **88 linhas** (de 521 antes desta sessão; de ~995 no início do projeto)
- **Concluído.** Macro REF-002 100% completa (5/5 sub-sessões).

---

# 🟡 Macro REF-001 — Refatorar renderBoard()

**Pré-requisito:** REF-002 idealmente concluído. Detalhes preservados.

| Sub-sessão | Status | Tema |
|-----------|--------|------|
| REF-001.1 | ✅ | Extrair `calcFogMask(myPos, gridSize) → Set<"x,y">` — concluído 2026-04-27, em `html/validators.js` |
| REF-001.2 | ✅ | `validSkillTargets(skill, myPos, gridSize) → Set<"r,c">` em `validators.js` (concluído 2026-04-27); `renderBoard` e `onCellClick` consomem o helper |
| REF-001.3 | ✅ | `renderBoard` reduzido a 17 linhas; helpers `renderHeader`/`setupBoardOnce`/`renderPieces`/`renderCell`/`renderControls`/`renderStatus` extraídos (concluído 2026-04-27). Macro REF-001 100% completa. |

---

# 🟢 Macro DES-002 — Design tokens completos

**Por quê:** tokens existem em `:root` mas convivem com cores rgba/hex inline em CSS estático e em JS. Bloqueia tema light futuro.

| Sub-sessão | Status | Tema |
|-----------|--------|------|
| DES-002.1 | ✅ | Mapa em [docs/DES_TOKENS_MAP.md](DES_TOKENS_MAP.md) — 6 hex em CSS, 1 hex em HTML, ~30 rgba literais. Zero ocorrências em JS (concluído 2026-04-27) |
| DES-002.2 | ✅ | 14 tokens novos adicionados em `:root` (concluído 2026-04-27): players-highlight, semantic, contextual surfaces, shadows, piece details. `:root` reorganizado em 6 grupos comentados |
| DES-002.3 | ✅ | Todas as cores fora de `:root` substituídas por `var(--token)` ou `color-mix(in srgb, var(--X) Y%, transparent)` (concluído 2026-04-27). Zero hex/rgba literais fora do `:root` em style.css e index.html |
| DES-002.4 | ✅ | Validação Grep confirma zero hex/rgba literais em `*.js` (concluído 2026-04-27 — no-op antecipado em DES-002.1). Macro DES-002 fechada (4/4 — DES-002.5 fica como ⏸ futuro) |

---

# 🟡 Macro MATCH-001 — Sistema de matchmaking

**Por quê:** o jogo atual só tem "compartilhar URL". Para a versão pública precisa de modos formais: Random Match (encontra alguém aleatório) + Private Room (código curto pra amigos).

**Pré-requisito:** SEC-001.6 (server pronto com gameplay completo).

| Sub-sessão | Status | Tema |
|-----------|--------|------|
| MATCH-001.1 | ✅ | Server: lifecycle de Private Room — base já existia (SEC-001.3); fechado em 2026-04-28 com guard `matchmaking==="private"` no join (preparação pra MATCH-001.2), normalização de `roomId` pra uppercase, novos códigos de erro `ROOM_NOT_PRIVATE`/`INVALID_PAYLOAD`/`INVALID_MODE`, e PROTO_SOCKET §6.1/§7/§8 atualizado pra refletir contrato real (ack-based) |
| MATCH-001.2 | ✅ | Server: fila de Random Match — `queue_join`/`queue_leave`, pareamento FIFO automático por modo, sala criada com `matchmaking:"random"` e `roomId` UUID, emit `match_found` cullado pra cada matched (concluído 2026-04-29) |
| MATCH-001.3 | ✅ | Cliente: tela inicial — overlay com toggle 1v1/4v4 (4v4 disabled "EM BREVE" até MODE-001) e 3 caminhos: Procurar oponente / Criar sala privada / Entrar com código. URL `?sala=XXXX` continua sendo atalho de link compartilhado. Concluído 2026-04-29 |
| MATCH-001.4 | ✅ | Cliente: UI de aguardando match (Random) — `#searching-screen` com animação de 3 dots pulsantes + botão CANCELAR. Cancel emite `queue_leave` e volta pro start-screen via loop em `initMultiplayer`. Concluído 2026-04-29 |
| MATCH-001.5 | ✅ | Cliente: UI de Private Room — `#private-room-screen` substitui o `#lobby-screen` reaproveitado: código ABCD em fonte mono grande, botões "COPIAR CÓDIGO"/"COPIAR LINK", lista de slots com indicador de conectado/aguardando (genérica até 4 players, pronta pra MODE-001). Concluído 2026-04-29 |

---

# 🟡 Macro MODE-001 — Modo 4v4 (Free-For-All)

**Por quê:** novo modo com 4 jogadores em FFA, cada um partindo de um canto e indo para a diagonal oposta. Primeiro a chegar vence sozinho.

**Pré-requisito:** SEC-001 completo (server suporta N players desde o início) + MATCH-001 ou pelo menos MATCH-001.1 (Private Room para testar).

**Spawns e diagonais:**
| Slot | Spawn | Goal |
|------|-------|------|
| 0 | `[0,0]` | `[3,3]` |
| 1 | `[3,3]` | `[0,0]` |
| 2 | `[3,0]` | `[0,3]` |
| 3 | `[0,3]` | `[3,0]` |

| Sub-sessão | Status | Tema |
|-----------|--------|------|
| MODE-001.1 | ⏳ | Server: schema com N players (já preparado em SEC-001) — apenas atribuição de spawns nos 4 cantos quando `mode=="4v4"` |
| MODE-001.2 | ⏳ | Server: condição de vitória usa `goal` por slot (já genérico desde SEC-001.6) |
| MODE-001.3 | ⏳ | Server: inventário inicial 1x BLOCK + 1x TRAP + 1x SPRINT em `mode=="4v4"` |
| MODE-001.4 | ⏳ | Cliente: renderizar 4 jogadores no tabuleiro com cores distintas (P1 azul, P2 vermelho, P3, P4 — definir cores em DES-002.2) |
| MODE-001.5 | ⏳ | Cliente: tela de combate Royal Rumble — exibir 3+ dados quando 3+ jogadores colidem |
| MODE-001.6 | ⏳ | Cliente: Aftermath com 4 trajetos coloridos |

**Decisão pendente:** empate em Royal Rumble (mais de um player com mesmo top score). Proposta: re-roll só entre os empatados, mantendo regra do tie-breaker do 1v1. Confirmar com Gerente quando MODE-001.5 chegar.

---

# 🟢 Macro DES-001 — Sistema de i18n

**Por quê:** preparar o jogo para idiomas futuros. Empurrado para depois do backend porque demo PT-BR já atende mercado brasileiro inicial.

**Pré-requisito:** REF-002 (mais fácil em `ui.js` modularizado).

| Sub-sessão | Status | Tema |
|-----------|--------|------|
| DES-001.1 | ⏳ | Criar `html/i18n.js` com `translations[lang]` + função `t(key)` + locale switch base |
| DES-001.2 | ⏳ | Migrar strings do lobby/menu inicial (com escolha de modo de matchmaking e modo de partida) |
| DES-001.3 | ⏳ | Migrar strings de `#game-container` (skills, AGENTE I-IV, CONFIRMAR) |
| DES-001.4 | ⏳ | Migrar strings de `#combat-overlay` (toque para rolar, aguardando…) |
| DES-001.5 | ⏳ | Migrar strings de review/aftermath |
| DES-001.6 | ⏳ | UI de toggle de idioma + persistência em `localStorage` + re-render no troca |

---

# 🟢 Macro FEAT-001 — Modo Replay / Spectator (futuro)

**Por quê:** o onepager destaca "Aftermath instagramável" como USP. `players[*].history` já é rastreado.

| Sub-sessão | Status | Tema |
|-----------|--------|------|
| FEAT-001.1 | ⏳ | Especificar com Gerente: replay offline (do próprio aftermath) ou espectador online (entra na sala como observador) |
| FEAT-001.2 | ⏳ | (Após spec) — sub-sessões serão criadas conforme escopo definido |

---

# ✅ Concluídas

### TESTES-001 — Documentar `testes/index.html` como backup da Alpha
**Status:** ✅ (concluído 2026-04-26) — README criado em [testes/README.md](../testes/README.md)

### BRAND-001.1 — Mapeamento de "Shadow Protocol"
**Status:** ✅ (concluído 2026-04-26) — 9 ocorrências em 3 arquivos

### BRAND-001.2 — "Shadow Protocol" removido do código vivo
**Status:** ✅ (concluído 2026-04-26) — title L6, lobby-sub L456 removida, log L524

### BUG-001 — Constante `COMBAT_REVEAL_MS`
**Status:** ✅ (concluído 2026-04-26) — declarada em L551, usada em L625
