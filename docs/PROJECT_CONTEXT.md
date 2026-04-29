# PROJECT_CONTEXT — 4x4

Documento vivo. Atualizar ao final de cada sessão que muda arquitetura, telas, regras de negócio ou stack.

---

## 1. Visão geral

**4x4** é um jogo de estratégia tática em tabuleiro 4×4 com planejamento simultâneo (cego) e revelação por colisão de alvos. Partidas curtas (2–5 min). Mobile-first. Versão herdada em runtime: **Alpha 2.2_Visual**.

**Modos de partida (após SEC-001 e MODE-001):**
- **1v1** — atual; 2 jogadores, cantos opostos, primeiro a pisar no spawn do oponente vence
- **4v4** (Free-For-All) — novo; 4 jogadores nos 4 cantos, cada um indo para a diagonal oposta; primeiro a chegar vence sozinho; combate em colisão usa Royal Rumble (todos rolam, maior avança)

**Modos de matchmaking (após MATCH-001):**
- **Random Match** — pareamento automático com quem está procurando partida
- **Private Room** — código curto (4 caracteres tipo ABCD) para amigos entrarem

**Hospedagem-alvo:**
- Servidor Node em [Railway](https://railway.app)
- Cliente como página estática em [itch.io](https://itch.io)

> Codinome herdado "Shadow Protocol" foi descontinuado em 2026-04-26 (BRAND-001 ✅).

Posicionamento (de [docs/4x4-onepager.html](4x4-onepager.html)):
- Estratégia abstrata para fãs de xadrez/jogos táticos
- Blind Planning + revelação simultânea = duelo psicológico
- Recursos consumidos viram modificador permanente (engine building leve)
- "Aftermath instagramável" como gancho social

Documento canônico de regras: [docs/4x4-techdoc.html](4x4-techdoc.html) (não reescrever — é o ground truth do design).

---

## 2. Stack

### Estado atual (após SEC-001.11)
| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vanilla JavaScript ES6+ modular (`gameState.js`, `network.js`, `combat.js`, `ui.js`, `validators.js`) |
| Backend | **Node + Socket.io** autoritativo, hospedado em `https://4x4-production.up.railway.app` |
| Hospedagem cliente | Página estática no [itch.io](https://itch.io) (`https://o6games.itch.io/4x4-game`) |
| Build | Nenhum (vanilla JS direto; Railway empacota o server via `package.json`) |
| Multiplayer | Autoritativo no server: cliente apenas renderiza `state_for_me`; aleatoriedade no server; data culling por jogador |
| Modos | 1v1 (atual). 4v4 (FFA) preparado server-side desde SEC-001 — falta cliente (MODE-001) |

Contrato canônico cliente↔servidor: [PROTO_SOCKET.md](PROTO_SOCKET.md).

### Estado-alvo (próximas Macros)
| Macro | Adiciona |
|-------|----------|
| SEC-001.12 | Hardening do server (rate limit, validação, graceful shutdown) |
| MATCH-001 | Random Match + Private Room formais (tela de matchmaking) |
| MODE-001 | Cliente do 4v4 (4 jogadores, Royal Rumble com 3+ dados, 4 trajetos no Aftermath) |
| DES-001 | i18n |
| FEAT-001 | Replay/Spectator |

> **Histórico:** Alpha 2.2_Visual rodava em vanilla JS + Firebase RTDB SDK v10, com lógica pseudo-authoritative no cliente do P1. Migração concluída em SEC-001 (2026-04-27 a 2026-04-28). Firebase removido em SEC-001.11.

---

## 3. Arquitetura

### 3.1 Estrutura atual

```
4x4/
├── html/                     # Cliente — modular, servido como estático no itch.io
│   ├── index.html            # Markup pivot (88 linhas)
│   ├── style.css             # CSS pivot (~430 linhas)
│   ├── gameState.js          # Constantes, helpers, window.S placeholder
│   ├── network.js            # Socket.io client + adaptador de schema
│   ├── ui.js                 # syncUI, renderBoard, screens, handlers window.X
│   ├── combat.js             # getTotalMod (display do overlay)
│   └── validators.js         # arrEq, dist, calcFogMask, validSkillTargets
├── server/                   # Backend autoritativo — Node + Socket.io no Railway
│   ├── server.js             # Boot, CORS, wire de handlers Socket.io
│   ├── rooms.js              # Lifecycle, planning, combat, endgame
│   ├── codes.js              # Geração de código ABCD
│   ├── constants.js          # GRID_SIZE, SPAWNS_BY_SLOT, INV_INITIAL_BY_MODE, COMBAT_REVEAL_MS
│   ├── validators.js         # Funções puras (arrEq, manhattan, isReachable, RULE-001)
│   ├── package.json          # dep: socket.io, express
│   └── test-client.html      # Cliente de teste interno
├── testes/index.html         # Backup congelado da Alpha 2.2_Visual — NÃO editar
├── docs/
│   ├── 4x4-techdoc.html      # Regras canônicas (não reescrever)
│   ├── 4x4-onepager.html     # Marketing/posicionamento
│   ├── PROTO_SOCKET.md       # Contrato cliente↔servidor (canônico)
│   └── (PROJECT_CONTEXT, ACTIVITY_LOG, SESSAO_POR_SESSAO_PLANNING, PARIDADE_REPORT, DES_TOKENS_MAP, ONBOARDINGs)
├── WebBuilds/                # Snapshots zipados (Alpha 2.1, 2.2, 2.2_Visual)
├── logos/                    # 4x4-logo.jpg/png
└── .claude/agents/           # pesquisador, explorador, programador, designer
```

**Sobre `testes/index.html`:** é um backup congelado da Alpha 2.2_Visual (vanilla + Firebase). Não é sandbox de experimentação. Toda mudança vai direto para `html/`. Rollback via Git, não via cópia de arquivo.

### 3.2 Estado global (cliente)

Tudo em `window.*`:
- `window.S` — snapshot derivado do `state_for_me` mais recente; o `network.js` adapta para o schema legado `.players[]` que a UI consome
- `window.myId` — slot inteiro (`0` para P1, `1` para P2; futuro `2`/`3` em 4v4)
- `window.roomId` — sala atual (vem da URL ou da resposta de `create_private_room`)

---

## 4. Telas / Screens

| ID | Função | Linhas (aprox) |
|----|--------|----------------|
| `#lobby-screen` | Aguarda P2; exibe link de convite copiável | 454–461 |
| `#game-container` | Tabuleiro 4×4 + controles BLOCK / TRAP / SPRINT + CONFIRMAR | 464–479 |
| `#combat-overlay` | Resolução de combate: dois dados d6, modificadores, resultado | 482–507 |
| `#review-screen` | Aftermath: grelha final, recursos gastos, trajetos em SVG | 510–521 |
| `#log` | Painel de debug fixo no rodapé | 524 |

Fluxo: `lobby → game (planning) → combat (dice) → game (resolved) → review → restart` (ou volta a `lobby`).

---

## 5. Regras de negócio (resumo — fonte canônica em [4x4-techdoc.html](4x4-techdoc.html))

- **Tabuleiro** 4×4 fixo (não escalável).
- **Spawns:**
  - 1v1: P1 em `[0,0]` → vai para `[3,3]`; P2 em `[3,3]` → vai para `[0,0]`
  - 4v4: 4 jogadores em `[0,0]`, `[3,3]`, `[3,0]`, `[0,3]`; cada um vai para a **diagonal oposta**
- **Vitória:** primeiro a pisar no destino vence sozinho (4v4: outros 3 perdem juntos).
- **Planejamento simultâneo**: cada um escolhe alvo (1 célula adjacente Manhattan, ou 2 retas via SPRINT) + opcionalmente uma habilidade antes do CONFIRMAR.
- **Combate**: disparado quando 2+ jogadores miram a mesma célula vazia. **Royal Rumble** — todos rolam 1d6, maior `dado + modificador` avança, outros permanecem.
- **Endgame Tie-Breaker (1v1)**: se ambos chegam ao destino no mesmo turno, Combate Final decide.
- **Empate em Royal Rumble (4v4)**: decisão pendente — proposta atual é re-roll só entre os empatados.
- **Habilidades:**
  - `BLOCK` (1v1: ×2 · 4v4: ×1): barricada na célula atual, bloqueia passagem, +1 permMod (consumido)
  - `TRAP` (1v1: ×2 · 4v4: ×1): armadilha invisível ao oponente, imobiliza 1 turno, +1 permMod
  - `SPRINT` (1v1: ×1 · 4v4: ×1): move 2 retas, pula blocos, -1 permMod (-2 se saltar BLOCK)
  - **Restrição:** BLOCK e TRAP não podem ser colocados na **própria base de spawn** (RULE-001, decidido 2026-04-26).
- **Fog of War**: células com distância Manhattan > 1 do próprio agente são ocultadas. TRAPs de outros jogadores nunca são visíveis até serem disparadas.
- **Modificador permanente (`permMod`)**: cada recurso consumido vira +1 (ou -1/-2 no SPRINT). Cumulativo entre combates.
- **Tela de combate (UX-001, decidido 2026-04-26):** mostra apenas `Dado + Modificador = Total` por jogador, **sem revelar qual habilidade foi usada**. O efeito da habilidade aparece depois no tabuleiro (BLOCK posto, TRAP revelada via trigger, SPRINT executado).

---

## 6. Eventos / Fluxo de dados

Toda comunicação cliente↔servidor passa por Socket.io. Spec canônica em [PROTO_SOCKET.md](PROTO_SOCKET.md). Resumo:

| Evento | Direção | Efeito |
|--------|---------|--------|
| `create_private_room` / `join_private_room` | Cliente → Server | Cria sala (mode=1v1/4v4) ou entra via código ABCD |
| `set_target` / `unset_target` | Cliente → Server | Define alvo do turno (validação de alcance, RULE-001) |
| `set_skill` / `unset_skill` | Cliente → Server | Marca skill (BLOCK/TRAP/SPRINT) |
| `set_ready` | Cliente → Server | Confirma turno; quando todos prontos, server processa o turno |
| `roll_die` | Cliente → Server | Server gera 1d6 com `crypto.randomInt`; ack devolve o número |
| `restart_game` | Cliente → Server | Reseta sala em `phase=game_over` |
| `state_update` | Server → Cliente | Snapshot cullado por destinatário (state_for_me §5) |
| `combat_started` / `combat_resolved` | Server → Cliente | Eventos do overlay de combate |
| `trap_triggered` | Server → Cliente | Trap disparada (com state_for_me) |
| `game_over` | Server → Cliente | Vitória — payload `full_state` sem culling para o Aftermath |
| `opponent_disconnected` | Server → Cliente | Sinalização lateral de queda de adversário |

A lógica autoritativa (resolução de combate, validação de movimento, vitória, aleatoriedade) vive em [server/rooms.js](../server/rooms.js). Cliente apenas envia ações e renderiza o estado de volta.

---

## 7. Convenções herdadas (mapeadas em P-AUDIT-INICIAL)

Isto descreve o estado herdado, não o estado-alvo. O backlog em SESSAO_POR_SESSAO_PLANNING.md endereça os pontos abaixo.

- **Cores hardcoded** em vários pontos (ex: `--bg: #04030a`, `--p1: #3b8fef`, `rgba(147,51,234,.25)` inline). Tokens existem no `:root` mas não cobrem 100%.
- **Strings UI hardcoded em PT-BR**, sem `t()` de i18n. Pelo menos 15 strings espalhadas (ex: "AGENTE I/II", "BARRICADA", "ARMADILHA", "AVANÇO", "Aguardando segundo agente").
- **Funções acopladas**: `renderBoard()` (~69 linhas) entrelaça cálculo de fog + lógica de skill + manipulação DOM. `hostResolveCombat()` mistura score, inventário e escrita Firebase.
- **Valores mágicos**: `CELL = isMobile ? 62 : 75` (linha 554), `2800` ms de delay no combate (linha 623), `[0,0]/[3,3]` repetidos em múltiplos pontos.
- **Sem modularização**: 15+ funções globais num único `<script>` em `html/index.html`.
- **Reuso de classe `.cell`** para múltiplas semânticas (vazia, fog, selected, sprint-target, combat) controladas por classList toggle.

---

## 8. Tabela de sessões

Detalhe completo em [SESSAO_POR_SESSAO_PLANNING.md](SESSAO_POR_SESSAO_PLANNING.md). Resumo:

| Macro / Sessão | Status | Notas |
|----------------|--------|-------|
| P-AUDIT-INICIAL | ✅ | Auditoria do estado herdado — 2026-04-26 |
| TESTES-001, BRAND-001, BUG-001 | ✅ | Quick wins — 2026-04-26 |
| UX-001, RULE-001 | ✅ | Polish + regra de produto — 2026-04-26 |
| REF-002 | ✅ | Modularização do monolito (5/5 subs) — 2026-04-26 a 2026-04-27 |
| REF-001 | ✅ | renderBoard reduzido a 17 linhas (3/3 subs) — 2026-04-27 |
| DES-002 | ✅ | Design tokens (4/4 subs) — 2026-04-27 |
| SEC-001 | 🔄 | Backend autoritativo Node+Socket.io — 10/12 subs ✅ (resta SEC-001.12 hardening; SEC-001.9 paridade pulada) |
| MATCH-001 | ⏳ | Random Match + Private Room formais |
| MODE-001 | ⏳ | Modo 4v4 (cliente) |
| DES-001 | ⏳ | i18n |
| FEAT-001 | ⏳ | Replay/Spectator |
