# PROTO_SOCKET — Protocolo Cliente ↔ Servidor (4x4)

**Versão:** 2.0
**Status:** ✅ Aprovada pelo Gerente em 2026-04-26 — congelada, base canônica para SEC-001.2 a SEC-001.12 e MODE-001 / MATCH-001
**Data:** 2026-04-26

Especificação canônica do contrato Socket.io entre o cliente vanilla JS (hospedado no itch.io) e o servidor Node autoritativo (hospedado no Railway). Substituirá o uso atual de Firebase RTDB. Toda implementação de SEC-001.2 a SEC-001.12 deve programar contra este documento.

**Versionamento:**
- v1.0 (2026-04-26 manhã) — proposta inicial assumindo apenas modo 1v1
- v2.0 (2026-04-26 tarde) — incorpora: modo 4v4, matchmaking (Random + Private), tela de combate sem revelar habilidades, validação de recurso em base, simplificações por não ser jogo competitivo

---

## 1. Princípios

1. **Autoritativo no server.** Lógica de jogo (validação de movimento, resolução de combate, geração de aleatoriedade, condição de vitória) só roda no servidor Node hospedado no Railway. Cliente é renderizador puro.
2. **Data culling.** O server nunca envia ao cliente informação que o jogador não deveria ver no jogo — TRAPs do oponente, movimentos planejados antes da revelação, **qual habilidade o oponente usou no combate** (mostra-se apenas o efeito numérico).
3. **Paridade comportamental no modo 1v1.** O comportamento percebido pelo jogador deve ser idêntico ao da Alpha 2.2_Visual atual, exceto pelas mudanças de UX listadas em §8.
4. **Aleatoriedade no server.** Rolls de d6 são gerados pelo servidor. Cliente apenas solicita.
5. **Não é jogo competitivo com ranking.** Hardening anti-cheat de nível profissional não é prioridade; o que vale é preservar a experiência de "blind planning" e impedir vazamentos visíveis de info oculta.

---

## 2. Modos de partida

| Modo | Jogadores | Spawns | Vitória |
|------|-----------|--------|---------|
| **1v1** | 2 | P1 em `[0,0]`, P2 em `[3,3]` | Primeiro a pisar no spawn oposto vence |
| **4v4** (Free-For-All) | 4 | P1 `[0,0]`, P2 `[3,3]`, P3 `[3,0]`, P4 `[0,3]` | Primeiro a pisar na **diagonal oposta** vence sozinho; os outros 3 perdem juntos |

**Diagonais alvo no 4v4:**
- `[0,0]` → `[3,3]`
- `[3,3]` → `[0,0]`
- `[3,0]` → `[0,3]`
- `[0,3]` → `[3,0]`

---

## 3. Modos de matchmaking

| Modo | Como funciona |
|------|---------------|
| **Random Match** | Jogador entra numa fila no server. O server pareia automaticamente quando há gente suficiente buscando o mesmo modo de partida (1v1 ou 4v4) |
| **Private Room** | Jogador cria uma sala e recebe um **código curto** (4 caracteres alfanuméricos, ex: `ABCD`). Compartilha o código com amigos; eles entram digitando o código |

Ambos os modos funcionam tanto para 1v1 quanto para 4v4.

---

## 4. Schema do estado autoritativo (server-side)

Server mantém em memória dois `Map`s:

- `Map<roomId, RoomState>` — salas ativas
- `Map<queueKey, PlayerInfo[]>` — filas de Random Match (1 fila por modo de partida)

**Cliente nunca recebe `RoomState` inteiro** — apenas `state_for_me` derivado dele (§5).

```
RoomState = {
  roomId: string,                      // "ABCD" (private) ou UUID (random)
  mode: "1v1" | "4v4",
  matchmaking: "random" | "private",
  phase: "lobby" | "planning" | "combat" | "endgame" | "game_over",
  winner: number,                      // -1 = sem vencedor; índice do player vencedor
  players: PlayerState[],              // 2 ou 4 elementos conforme mode
  blocks: BlockEntity[],
  traps: TrapEntity[],
  spentRes: SpentEntity[],             // histórico de recursos consumidos
  combatLocs: [number, number][],      // tiles onde combate ocorreu (Aftermath)
  pendingCombat: PendingCombat | null, // combate em andamento (Royal Rumble)
  createdAt: number,
}

PlayerState = {
  slot: number,                        // 0..3 (sua posição na sala)
  spawn: [number, number],             // posição inicial = identidade da base própria
  goal: [number, number],              // diagonal oposta a alcançar
  pos: [number, number],
  target: [number, number] | false,    // movimento planejado deste turno
  skill: "" | "BLOCK" | "TRAP" | "SPRINT",
  combatSkill: "" | "BLOCK" | "TRAP" | "SPRINT",
  inv: { BLOCK: number, TRAP: number, SPRINT: number },
  ready: boolean,
  roll: number,                        // 0 = não rolou; 1-6 = resultado
  permMod: number,                     // modificador permanente acumulado
  history: [number, number][],
  trapped: boolean,
  jumpedBlock: boolean,
  connected: boolean,
  socketId: string | null,
  sessionToken: string | null,         // para reconexão (futuro, ver §7)
}

BlockEntity = { r, c, owner: number }       // owner = slot (0..3)
TrapEntity  = { r, c, owner: number }
SpentEntity = { r, c, owner, type, status: "broken" | "jumped" | "triggered" | "used" }

PendingCombat = {
  cell: [number, number],
  participants: number[],              // slots envolvidos (≥ 2 para Royal Rumble)
  rolls: { [slot: number]: number },   // 0 = ainda não rolou
  resolveAt: number | null,            // timestamp para auto-resolução
}
```

**Inventário inicial:**
- **1v1:** `{ BLOCK: 2, TRAP: 2, SPRINT: 1 }` (mesmo da Alpha)
- **4v4:** `{ BLOCK: 1, TRAP: 1, SPRINT: 1 }` (reduzido)

---

## 5. `state_for_me` — o que cada cliente recebe

Server **deriva** este objeto a cada `state_update`. Construído por jogador (P1, P2, P3, P4 recebem versões diferentes do mesmo `RoomState`).

```
StateForMe = {
  mode: "1v1" | "4v4",
  phase: RoomState.phase,
  winner: RoomState.winner,
  mySlot: number,                      // 0..3
  me: PlayerState,                     // meu PlayerState completo (sem socketId)
  opponents: OpponentView[],           // outros 1 ou 3 jogadores, FILTRADOS
  blocks: BlockEntity[],               // FILTRADO (regras abaixo)
  traps: TrapEntity[],                 // FILTRADO (regras abaixo)
  spentRes: SpentEntity[],             // visível inteiro
  combatLocs: [number, number][],      // visível inteiro
  pendingCombat: PendingCombatView | null,  // se em combate, ver regras abaixo
}

OpponentView = {
  slot,
  spawn,                               // identidade da base do oponente (visível)
  goal,                                // diagonal alvo do oponente (visível)
  pos,                                 // posição atual (sempre visível)
  inv,                                 // inventário restante (visível — recursos consumidos são públicos)
  permMod,                             // modificador acumulado (visível — sabe-se que ele "evoluiu")
  ready,                               // visível (UI mostra "AGUARDANDO")
  connected,                           // visível
  trapped,                             // visível APÓS trigger (já é fato público)
  // CAMPOS NUNCA VISÍVEIS:
  // target, skill, combatSkill, roll, history, jumpedBlock
}

PendingCombatView = {
  cell,                                // tile do combate
  participants,                        // slots envolvidos (público)
  myRoll,                              // meu d6 (visível só pra mim)
  opponentRolls: { slot: number }[],   // só TRUE/FALSE de "já rolou"
                                       // resultado numérico só aparece em combat_resolved
}
```

### 5.1 Filtragem de `blocks[]`

Server envia ao cliente:
- todos os blocks `owner === mySlot` (sempre visíveis para o dono)
- blocks de outros owners **apenas se** distância Manhattan ≤ 1 do `me.pos` (regra atual da fog of war)

### 5.2 Filtragem de `traps[]`

Server envia **apenas** traps com `owner === mySlot`. Traps de outros owners NUNCA saem do server até serem disparadas. No momento do trigger, server inclui um evento explícito `trap_triggered` (§6).

### 5.3 Resultado do combate (`combat_resolved`)

Quando server resolve o combate, envia a cada participante:
- Resultado numérico de cada participante: `dado + modificador = total`
- **Não** envia qual habilidade cada um usou (`combatSkill` fica oculto)
- Vencedor (slot)
- Estado atualizado pós-combate

Os efeitos das habilidades (BLOCK colocado, TRAP plantada e revelada via trigger, SPRINT executado) **se manifestam no estado do tabuleiro** após a resolução, não na tela de combate.

**Empate (top score por 2+ participantes):** server dispara nova rodada **apenas entre os empatados** — emite `combat_started` novo com `participants` reduzido aos que empataram. Repete até alguém vencer. Mesma lógica do tie-breaker do 1v1.

### 5.4 Em `game_over`

Server envia `full_state` completo (sem culling) para a tela Aftermath funcionar — única exceção ao culling. Inclui histórico, traps de todos, etc.

---

## 6. Eventos Cliente → Servidor (C→S)

### 6.1 Matchmaking

Respostas de matchmaking usam **ack callback** (Socket.io) em vez de eventos S→C dedicados — equivalente semântico, evita duplicação. Estado da sala chega ao cliente pelo `state_update` que o server emite logo em seguida ao `broadcastState` da sala.

| Evento | Payload | Validações | Resposta (ack) |
|--------|---------|-----------|----------|
| `queue_join` | `{ mode: "1v1" \| "4v4" }` | jogador não está em outra fila/sala | `{ ok: true }` ou `{ error: { code } }` (ver §8) |
| `queue_leave` | `{}` | jogador está na fila | `{ ok: true }` |
| `create_private_room` | `{ mode: "1v1" \| "4v4" }` | mode válido; jogador não está em outra fila/sala | `{ roomId, mySlot: 0 }` ou `{ error: { code } }` |
| `join_private_room` | `{ roomId }` | sala existe; `matchmaking == "private"`; tem vaga; jogador não está em outra fila/sala | `{ mySlot }` ou `{ error: { code } }` |

**Notas de implementação:**
- `roomId` é normalizado para uppercase antes do lookup — usuário pode digitar/colar `abcd` ou `ABCD` indistintamente
- Após `create`/`join`/`match_found`, o cliente recebe o estado completo via `state_update` broadcast (PROTO §7)

### 6.2 Em sala (gameplay)

| Evento | Payload | Validações | Resposta |
|--------|---------|-----------|----------|
| `set_target` | `{ target: [r,c] }` | phase=="planning"; !me.ready; alvo dentro do tabuleiro 0-3; distância Manhattan correta (1 sem skill, 2 reta com SPRINT) | `state_update` (apenas para o emissor — `target` não vaza) |
| `unset_target` | `{}` | phase=="planning"; !me.ready | `state_update` |
| `set_skill` | `{ skill }` | phase=="planning"; !me.ready; me.inv[skill] > 0; **se skill ∈ {BLOCK, TRAP}: me.pos ≠ me.spawn** (regra RULE-001) | `state_update` ou `error: CANT_PLACE_ON_OWN_SPAWN` |
| `unset_skill` | `{}` | phase=="planning"; !me.ready | `state_update` |
| `set_ready` | `{}` | phase=="planning"; me.target ≠ false; !me.ready | `state_update`. Se TODOS os players da sala `ready`, server processa turno |
| `roll_die` | `{}` | phase=="combat"; me participa do `pendingCombat`; `pendingCombat.rolls[mySlot] === 0` | server gera 1d6, salva. Se todos os participantes rolaram, server agenda resolução em `COMBAT_REVEAL_MS` |
| `restart_game` | `{}` | phase=="game_over"; me.connected | `state_update` resetado |
| `leave_room` | `{}` | qualquer | tira do estado, broadcast aos outros |
| (implícito) `disconnect` | — | — | `me.connected=false`; broadcast `opponent_disconnected` |

---

## 7. Eventos Servidor → Cliente (S→C)

| Evento | Payload | Quando dispara |
|--------|---------|----------------|
| `match_found` | `{ roomId, mySlot, state: StateForMe }` | Quando fila tem players suficientes (MATCH-001.2) |
| `state_update` | `{ state: StateForMe }` | A cada mudança relevante; específico por destinatário. Também é o caminho pelo qual o joiner/criador recebe o estado inicial após `create_private_room`/`join_private_room` (cuja resposta direta vai pelo ack) |
| `combat_started` | `{ pendingCombat: PendingCombatView, state: StateForMe }` | Quando 2+ players colidem em alvos |
| `trap_triggered` | `{ cell, by_owner_slot, state: StateForMe }` | Quando alguém pisa numa TRAP de outro player |
| `combat_resolved` | `{ result: { winnerSlot, scores: { [slot]: {dice, mod, total} } }, state: StateForMe }` | Após `COMBAT_REVEAL_MS` com todos rolados |
| `game_over` | `{ winnerSlot, full_state: RoomState }` | Quando alguém pisa na própria diagonal alvo |
| `opponent_disconnected` | `{ slot }` | Quando algum oponente cai |
| `opponent_reconnected` | `{ slot }` | Quando volta (via `rejoin_room`, ainda fora do escopo Alpha) |
| `error` | `{ code, message }` | Em qualquer falha de validação |

---

## 8. Códigos de erro

| Código | Quando |
|--------|--------|
| `ROOM_NOT_FOUND` | `join_private_room` em sala inexistente |
| `ROOM_NOT_PRIVATE` | `join_private_room` numa sala de Random Match (entrada por código não permitida) |
| `ROOM_FULL` | sala já tem todos os slots ocupados |
| `INVALID_PAYLOAD` | payload do evento não é um objeto plano (rejeitado pelo wrapper de hardening — SEC-001.12) |
| `INVALID_MODE` | `create_private_room`/`queue_join` com `mode` ≠ `"1v1"` e ≠ `"4v4"` |
| `INVALID_TARGET` | alvo fora do tabuleiro ou distância Manhattan inválida |
| `INVALID_SPRINT_TARGET` | SPRINT com alvo não-reto ou fora do alcance de 2 |
| `NO_INVENTORY` | `set_skill` para skill com `inv[skill] === 0` |
| `CANT_PLACE_ON_OWN_SPAWN` | tentou usar BLOCK/TRAP estando na própria base de spawn |
| `NOT_IN_PLANNING` | tentou alterar target/skill em phase ≠ planning |
| `ALREADY_READY` | tentou alterar após `set_ready` |
| `ALREADY_ROLLED` | `roll_die` quando já rolou |
| `NOT_IN_COMBAT` | `roll_die` em phase ≠ combat |
| `ALREADY_IN_QUEUE_OR_ROOM` | tentou entrar em fila/sala já estando em outra |
| `INTERNAL_ERROR` | qualquer falha não classificada |

---

## 9. Mudanças vs. comportamento Alpha 2.2_Visual

| Mudança | Por quê |
|---------|---------|
| **Tela de combate mostra apenas `Dado + Mod = Total`**, sem rótulo de habilidade | Decisão de produto (UX-001): preserva blind planning durante o combate. O efeito da habilidade aparece no tabuleiro depois (BLOCK posto, TRAP visível pelo dono, SPRINT moveu) |
| **Não é permitido usar BLOCK ou TRAP na própria base de spawn** | Decisão de produto (RULE-001): faz mais sentido em 4v4 (onde a base é só ponto de saída) e padroniza para 1v1 também |
| **Modo 4v4** com 4 jogadores em FFA, Royal Rumble em colisões, primeiro a chegar vence sozinho | Feature nova — Macro MODE-001 |
| **Inventário no 4v4 reduzido** (1 BLOCK, 1 TRAP, 1 SPRINT) | Equilíbrio: tabuleiro 4×4 fica saturado se 4 players tiverem 5 recursos cada |
| **Random Match + Private Room** como modos de matchmaking | Decisão de produto — Macro MATCH-001 |
| **Roll do d6 gerado no server** (não no cliente) | Trapaça por DevTools forçava `roll=6` antes; servidor autoritativo elimina |
| **`combatSkill` do oponente NUNCA revelado**, mesmo em `combat_resolved` | Atende UX-001 |
| **`history[]` do oponente nunca visível durante o jogo**; revelado apenas no Aftermath | No Firebase atual era acessível via DevTools |
| **TRAPs de outros players nunca saem do servidor**, exceto no momento de trigger | Vulnerabilidade central de SEC-001 |
| **Hospedagem**: Server Node no Railway, cliente como página estática no itch.io | Decisão de produto |

---

## 10. Decisões pendentes (fora do escopo Alpha)

Itens identificados que não fazem parte da Alpha mas precisam ser decididos antes de release público.

| Item | Comportamento Alpha | Quando tratar |
|------|---------------------|---------------|
| **AFK timeout em planning** | Não existe — jogador pode travar a sala saindo | Sub-sessão futura se necessário (ex: `RULE-002`); na spec Alpha, ausência preservada |
| **Reconexão formal** | Cair = entrar como novo player | SEC-001.12 (hardening) |
| **Histórico de partidas / contas de jogador** | Não existe | Fora do escopo MVP |
| **Auth** | Anônimo, qualquer um com URL/código entra | Fora do escopo MVP |

---

## 11. Observações de implementação (não-normativas)

- **Estado em memória vs. persistência:** Map em RAM. Persistência (Redis) é decisão de pós-Alpha — Railway permite persistência futura sem refactor radical
- **Cleanup:** salas com todos `connected:false` por > 5 min são removidas
- **Pareamento aleatório:** fila simples FIFO por modo (1v1 e 4v4 têm filas separadas)
- **Geração de código de Private Room:** 4 caracteres alfanuméricos (excluindo confusos: `0/O`, `1/I/L`); colisão checada antes de atribuir
- **Cors:** server precisa permitir o domínio do itch.io (`*.itch.io` ou específico) no CORS do Socket.io
- **Single-thread Node:** processamento atomico por sala via single-thread; sem locks explícitos

---

**Próxima ação:** após aprovação do Gerente, esta spec congela e SEC-001.2 começa.
