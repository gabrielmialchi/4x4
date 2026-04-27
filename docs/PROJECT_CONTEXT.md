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

### Estado atual (Alpha 2.2_Visual)
| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vanilla JavaScript ES6+, sem framework |
| Realtime / Backend | **Firebase Realtime Database** (SDK v10) — não há servidor próprio |
| Build | Nenhum (servir HTML estático direto) |
| Multiplayer | Pseudo-authoritative: P1 = host (processa lógica), P2 = cliente puro |

Implicação: lógica autoritativa roda no cliente do P1. Firebase RTDB sincroniza estado completo — informação oculta vaza por DevTools (alvo de SEC-001).

### Estado-alvo (após SEC-001 + MATCH-001 + MODE-001)
| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vanilla JavaScript ES6+ modular (`gameState.js`, `network.js`, `combat.js`, `ui.js`, `i18n.js`) |
| Backend | **Node + Socket.io** autoritativo, hospedado no [Railway](https://railway.app) |
| Hospedagem cliente | Página estática no [itch.io](https://itch.io) |
| Build | Nenhum (vanilla JS direto; Railway empacota o server via `package.json`) |
| Multiplayer | Autoritativo no server: cliente é renderizador puro; aleatoriedade no server; data culling por jogador |
| Modos | 1v1 (2 players), 4v4 (4 players FFA); Random Match + Private Room |

Contrato canônico cliente↔servidor: [PROTO_SOCKET.md](PROTO_SOCKET.md).

---

## 3. Arquitetura

### 3.1 Estrutura atual

```
4x4/
├── html/index.html           # Pivot atual — monolito (~995 linhas, HTML+CSS+JS) — alvo de toda mudança
├── testes/index.html         # Backup congelado da Alpha 2.2_Visual — NÃO editar
├── docs/
│   ├── 4x4-techdoc.html      # Regras canônicas (não reescrever)
│   ├── 4x4-onepager.html     # Marketing/posicionamento
│   └── (PROJECT_CONTEXT, ACTIVITY_LOG, SESSAO_POR_SESSAO_PLANNING, ONBOARDINGs)
├── WebBuilds/                # Snapshots zipados (Alpha 2.1, 2.2, 2.2_Visual)
├── logos/                    # 4x4-logo.jpg/png
└── .claude/agents/           # pesquisador, explorador, programador, designer
```

**Sobre `testes/index.html`:** é um backup congelado da Alpha 2.2_Visual. Não é sandbox de experimentação. Toda mudança (feature, refator, bugfix) vai direto para `html/index.html`. Rollback é feito via Git, não via cópia de arquivo. Está byte-a-byte idêntico a `html/index.html` na fotografia atual; tende a divergir conforme `html/` evolui — isso é esperado.

### 3.2 Estado-alvo (após modularização — REF-002)

```
html/
├── index.html                # Pivot magro — só estrutura + <script src=...> dos módulos
├── gameState.js              # window.S, lifecycle, players, phase
├── network.js                # Firebase init + listeners + writes
├── ui.js                     # syncUI, renderBoard, render screens
├── combat.js                 # hostProcessTurn, hostResolveCombat, getTurnMod
└── validators.js             # arrEq, dist Manhattan, isValidMove
server/                       # (futuro, se SEC-001 motivar backend autoritativo)
```

### 3.3 Estado global (atual)

Tudo em `window.*`:
- `window.S` — snapshot completo do estado vindo do Firebase
- `window.myId` — `"p1"` ou `"p2"`
- `window.roomId` — sala atual (vem da URL)
- `window.dbRef` — referência Firebase
- `window.combatTimer` — handle do setTimeout do combate

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

Não há servidor próprio. Tudo passa por Firebase RTDB.

| Evento | Direção | Path | Efeito |
|--------|---------|------|--------|
| `update(target, skill, ready)` | Cliente → DB | `rooms/{roomId}/players/{myId}` | Marca pronto, sincroniza intenção |
| `update(roll)` | Cliente → DB | `rooms/{roomId}/players/{myId}` | Resultado do d6 |
| `update(connected)` | Cliente → DB | `rooms/{roomId}/players/{myId}` | true ao entrar, false em `beforeunload` |
| `onValue(rooms/{roomId})` | DB → Cliente | (listener) | Atualiza `window.S`, dispara `syncUI()` |

A lógica autoritativa (resolução de combate, validação de movimento, vitória) roda no cliente **do P1** (`hostProcessTurn`, `hostResolveCombat`, `hostCheckWin`). P2 só lê e renderiza.

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
| TESTES-001 | ✅ | `testes/` documentado como backup |
| BRAND-001 | ✅ | "Shadow Protocol" removido do código vivo |
| BUG-001 | ✅ | Constante `COMBAT_REVEAL_MS` |
| SEC-001 | 🔄 | Backend autoritativo Node+Socket.io — spec (PROTO_SOCKET.md v2.0) em revisão |
| UX-001 | ⏳ | Tela de combate sem revelar habilidade |
| RULE-001 | ⏳ | Bloquear BLOCK/TRAP em base própria (client) |
| REF-002 | ⏳ | Modularizar monolito |
| REF-001 | ⏳ | Refatorar renderBoard |
| DES-002 | ⏳ | Design tokens completos |
| MATCH-001 | ⏳ | Random Match + Private Room |
| MODE-001 | ⏳ | Modo 4v4 |
| DES-001 | ⏳ | i18n |
| FEAT-001 | ⏳ | Replay/Spectator |
