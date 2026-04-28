# PARIDADE_REPORT — Firebase ↔ Server

Roteiro de teste para validar que o caminho **USE_SERVER=true** (server Node + Socket.io) preserva o comportamento da Alpha 2.2_Visual (USE_SERVER=false, Firebase). Cada cenário tem o comportamento **esperado** e um espaço para marcar resultado em cada modo.

> **Por que existe:** SEC-001 troca a infraestrutura sem mudar mecânicas. Antes de promover `USE_SERVER=true` permanente (SEC-001.10), confirmar que tudo se comporta igual aos olhos do jogador.

---

## Setup

### Modo Firebase (controle — Alpha 2.2_Visual)
1. Garantir [html/network.js:18](../html/network.js#L18) com `export const USE_SERVER = false;`
2. Servir `html/` via Firebase Hosting ou outro server estático
3. Abrir 2 abas

### Modo Server (sob teste)
1. Editar [html/network.js:18](../html/network.js#L18) → `export const USE_SERVER = true;`
2. Em um terminal: `cd server && npm install` (1ª vez), depois `npm start`
3. Abrir 2 abas em [http://localhost:3000/jogo/index.html](http://localhost:3000/jogo/index.html)
   - 1ª aba cria sala; URL ganha `?sala=XXXX`
   - 2ª aba abre a mesma URL com o `?sala=` da 1ª

> Lembrar de voltar `USE_SERVER=false` ao terminar (default Alpha).

---

## Cenários

Marcar `[x]` quando o comportamento bate com o esperado em cada modo.

---

### 1. Setup de sala

**Esperado:** URL ganha `?sala=XXXX`, P1 vê o lobby até P2 entrar; quando P2 entra, ambos vão pra `#game-container`.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

> Diferença esperada: o código do servidor é 4 letras maiúsculas (sem 0/O/1/I/L); o Firebase usa 4 chars Base36 aleatórios. UX igual.

---

### 2. Movimento simples sem skill

**Esperado:** P1 toca uma célula adjacente, fica destacada (selected); confirma; após P2 também confirmar, ambos andam um passo.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

---

### 3. BLOCK plantado

**Esperado:** P1 escolhe BARRICADA + alvo adjacente, confirma. Após P2 também confirmar, P1 deixa um `◈` na pos antiga, P1 está na pos nova, inv BLOCK -1, permMod +1.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

---

### 4. TRAP plantada e disparada

**Esperado:** P1 planta TRAP em [1,1] (saindo dela). Em turno seguinte, P2 anda pra [1,1] → P2 fica `trapped` (peça vermelha-ish), TRAP some do tabuleiro pra ambos. No aftermath, a TRAP aparece riscada.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

> **Verificação chave (server):** abrir DevTools (F12) → Network → WS → Messages na aba do P2. Antes de a trap disparar, `state.traps` chega vazio (`[]`) na aba P2. Esse é o vazamento que SEC-001 fechou.

---

### 5. SPRINT (movimento de 2)

**Esperado:** P1 escolhe AVANÇO + alvo a 2 células em linha reta, confirma. Após o turno: P1 está na pos a 2 distância, inv SPRINT -1, permMod -1 (ou -2 se pulou um BLOCK no meio).

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

---

### 6. SPRINT que quebra BLOCK no alvo

**Esperado:** P1 com SPRINT mira [r, c] que tem BLOCK. Após o turno: BLOCK sumiu (riscado em `spentRes`), P1 ficou na célula intermediária (não chegou ao alvo), permMod -1.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

---

### 7. SPRINT que pula BLOCK no meio

**Esperado:** P1 com SPRINT mira além de um BLOCK adjacente. Após turno: BLOCK sumiu (jumped), P1 chegou ao alvo, `jumpedBlock=true`, permMod -2.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

---

### 8. Swap (troca de posições)

**Esperado:** P1 mira a célula do P2, P2 mira a célula do P1. Após turno: ambos trocam de pos. **Recursos colocados (BLOCK/TRAP) viram "wasted"** (riscado em spentRes), inv consumido, permMod +1 mesmo assim. Sem combate.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

---

### 9. Combate normal — vencedor único

**Esperado:** Ambos miram a mesma célula. Sai do `#game-container`, abre `#combat-overlay`. Cada um clica no dado pra rolar; após ~2.8s (`COMBAT_REVEAL_MS`), aparece `Dado + Mod = Total`, depois `VENCEDOR: AGENTE I` (ou II). Vencedor avança, perdedor fica no lugar; perdedor que tinha skill consome o recurso (wasted, +permMod).

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

> **Dica server:** abrir DevTools → Console. Rolar dado em modo server NÃO usa `Math.random` local — vem do server (`crypto.randomInt`). Anti-trapaça vs DevTools force.

---

### 10. Combate empate — recursos devolvidos / nova rodada

**Esperado:** Ambos rolam o mesmo total. Combat overlay mostra "EMPATE — RECURSOS DEVOLVIDOS"; ninguém move; ambos voltam ao `#game-container` para planejar de novo.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

---

### 11. Endgame — chegada simultânea (1v1)

**Esperado:** P1 chega em [3,3] no mesmo turno em que P2 chega em [0,0]. `isEndgame=true`, `phase=combat`, abre `#combat-overlay` com título "CONFRONTO FINAL". Após ambos rolarem: vencedor único → `winner=slot`, vai pra Aftermath. Empate em endgame → roll volta pra 0, nova rodada de combate (não volta pra planning).

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

---

### 12. Vitória direta (sem combate)

**Esperado:** P1 pisa em [3,3] sem disputa. `winner=0`, abre `#review-screen` com "MISSÃO CUMPRIDA" pra P1 e "MISSÃO FALHOU" pra P2.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

---

### 13. Aftermath (review)

**Esperado:** `#review-screen` mostra grid 4×4 com BLOCKs (◈), TRAPs (✦), recursos quebrados (riscado), e SVG com trajeto colorido de cada player (do spawn até a pos final).

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

> **Atenção server:** o trajeto do oponente só é desenhado corretamente se `game_over.full_state` chegou — durante o jogo, o `history` dos oponentes vem como `[spawn]` (placeholder, culling §5.4). Confirmar que o aftermath mostra o caminho COMPLETO do oponente em modo server.

---

### 14. Restart (NOVA MISSÃO)

**Esperado:** Após game_over, o botão "NOVA MISSÃO" reseta. Players voltam ao spawn, inv recarregado, blocks/traps/spentRes limpos, phase=planning.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

> **Diferença esperada (sem ser bug):** em Firebase, qualquer um aperta o botão e o `set(dbRef, resetState)` reseta. Em server, qualquer player conectado também reseta (PROTO_SOCKET §6.2). UX igual.

---

### 15. RULE-001 — BLOCK/TRAP na base própria

**Esperado:** P1 em `[0,0]` (sua base) — botões BARRICADA e ARMADILHA ficam disabled; AVANÇO continua habilitado. Quando P1 sai da base, os botões reabilitam.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

---

### 16. Disconnect / reconnect

**Esperado:** Fechar a aba do P2. P1 vê P2 como desconectado (volta pro lobby? em Alpha mantém o `#game-container` mas fica preso). Reabrir P2 com a mesma URL — entra de novo na sala.

| Modo | Resultado | Notas |
|------|-----------|-------|
| Firebase | [ ] |  |
| Server | [ ] |  |

> **Limitação conhecida:** reconexão formal só em SEC-001.12. Esperado em ambos os modos: jogo trava até P2 reabrir; em server pode dar `ROOM_FULL` se a sessão antiga ficou pendurada (PROTO_SOCKET §10).

---

## Cantos sutis a observar

Durante o teste em modo server, prestar atenção em pontos onde a renderização otimista pode dessincronizar:

1. **Apertar CONFIRMAR com target inválido (via DevTools)** — server rejeita com `INVALID_TARGET`/`INVALID_SPRINT_TARGET`. Cliente já marcou `me.ready=true` localmente. **Esperado:** próximo `state_update` do server traz `me.ready=false`, o cliente "volta" — mas há uma janela curta onde o botão CONFIRMAR aparece desabilitado mesmo sem ter funcionado. Aceitável; tratamento explícito vira hardening em SEC-001.12.
2. **Duplo-clique rápido em Roll Die** — server rejeita o segundo com `ALREADY_ROLLED`. Cliente já fez emit; não anima 2x porque `S.players[id].roll>0` ainda volta `false` na janela curta. Possível duplo-emit; server rejeita o segundo. Cosmético.
3. **Aftermath em modo server** — `history` dos oponentes só está completo via `game_over.full_state`. Se o cliente dispara `showAftermath` antes do `full_state` chegar (por algum bug), trajeto fica vazio. Hoje `showAftermath` só roda em `S.winner===0||1`, e `game_over` é o evento que seta isso → ordem garantida.

---

## Resultado consolidado

Após rodar todos os cenários, marcar:

- [ ] **Paridade total** — todos os 16 cenários passaram em ambos os modos. SEC-001.9 ✅, pode ir pra SEC-001.10 (promover USE_SERVER=true permanente)
- [ ] **Divergência detectada** — listar abaixo:

```
(cenário N) — comportamento server diverge: [descrição curta]
```

Divergências viram tarefa de correção antes de SEC-001.10.
