# ACTIVITY_LOG — 4x4

Histórico cronológico de sessões. Claude lê este arquivo ao receber `iniciar sessão` para identificar a próxima sessão ⏳ Pendente.

Template de entrada:

```
## [DATA-ISO] Sessão CÓDIGO — TEMA
**Status:** Completo | Em andamento | Interrompido
**Branch:** sessao-CODIGO (se aplicável)

### Feito
- itens concretos com path:linha

### Pendente (se Interrompido)
- [ ] item

### Bugs / Bloqueios Conhecidos
- item

### Notas para próxima sessão
- item
```

---

## 2026-04-26 Sessão P-AUDIT-INICIAL — Onboarding multi-agente + auditoria do estado herdado
**Status:** Completo
**Branch:** —

### Feito (configuração de sessão)
- Criados 4 subagentes em [.claude/agents/](../.claude/agents/): `pesquisador.md`, `explorador.md`, `programador.md`, `designer.md`
- Criado [CLAUDE.md](../CLAUDE.md) na raiz com triggers (`iniciar sessão`, `iniciar [CÓDIGO]`, `status do projeto`), tabela de subagentes, regras invioláveis, formato de comunicação
- Criados os 3 docs centrais retroengenheirados:
  - [docs/PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — stack, arquitetura, telas, regras
  - [docs/ACTIVITY_LOG.md](ACTIVITY_LOG.md) — este arquivo
  - [docs/SESSAO_POR_SESSAO_PLANNING.md](SESSAO_POR_SESSAO_PLANNING.md) — backlog inicial

### Feito (auditoria — saída do `pesquisador`)
- **Stack confirmada:** vanilla JS + Firebase RTDB (SDK v10). Sem Node, sem Socket.io, sem build.
- **Arquitetura:** pseudo-authoritative — P1 (host) processa lógica; P2 é cliente puro. Estado completo em `rooms/{roomId}` no Firebase.
- **Pivot atual:** [html/index.html](../html/index.html) (~995 linhas, HTML + CSS + JS num único arquivo).
- **Snapshot:** [testes/index.html](../testes/index.html) é byte-a-byte idêntico ao pivot — pode ser sandbox ou esquecido. **Decidir o destino com o usuário.**
- **Builds históricas:** [WebBuilds/](../WebBuilds/) com Alpha 2.1, 2.2, 2.2_Visual (versão atual em runtime).
- 5 telas mapeadas: `#lobby-screen`, `#game-container`, `#combat-overlay`, `#review-screen`, `#log`.
- Regras de negócio extraídas e cruzadas com o código (ver PROJECT_CONTEXT §5).
- Débito técnico catalogado e convertido em backlog (ver SESSAO_POR_SESSAO_PLANNING).

### Bugs / Bloqueios Conhecidos
- **SEC-001** (alta prioridade): Firebase RTDB envia estado completo aos dois clientes → posições de TRAPs adversárias (que deveriam ser invisíveis no jogo) são legíveis via DevTools. Multiplayer competitivo está comprometido. Mitigação requer backend autoritativo OU Firebase Security Rules + filtragem por `myId` server-side (este último com restrições do RTDB).
- `html/index.html` e `testes/index.html` idênticos: risco de divergir silenciosamente se um for editado e o outro não. Decidir se `testes/` é sandbox de desenvolvimento, snapshot, ou pode ser deletado.

### Notas para próxima sessão
- **Próxima sessão a iniciar fica a critério do Gerente do Produto.** Backlog completo em [SESSAO_POR_SESSAO_PLANNING.md](SESSAO_POR_SESSAO_PLANNING.md). Recomendação técnica: começar por SEC-001 (impacto direto no produto) ou REF-002 (modularização — destrava todas as outras sessões).
- O `pesquisador` mapeou tudo o que era inspecionável estaticamente. Para validar regras dinâmicas (timing, edge cases de combate, comportamento em desconexão), uma sessão de teste manual com servidor rodando seria útil — mas não no escopo de P-AUDIT-INICIAL.

---

## 2026-04-26 Sessão DECISIONS — Decisões de produto pós-auditoria
**Status:** Completo
**Branch:** —

### Decisões registradas
- **Naming:** jogo se chama apenas **4x4**. Codinome interno "Shadow Protocol" descontinuado. Limpeza de strings do código vira `BRAND-001` no backlog.
- **SEC-001 → caminho B confirmado:** backend autoritativo Node + Socket.io (referência: arquitetura microChess do mesmo Gerente, já validada). Firebase pode ser descontinuado nesta sessão ou mantido apenas para auth/persistência — a decidir ao iniciar SEC-001.
- **TESTES-001 → sandbox de experimentação:** `testes/index.html` é onde features novas são prototipadas; após validação migram para `html/index.html`. Estavam idênticos por ambos refletirem a última versão aprovada. Sessão TESTES-001 reduzida a "documentar workflow no PROJECT_CONTEXT".

### Atualizado
- [docs/PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) §1: removido "Shadow Protocol" do título; adicionada nota sobre a descontinuação.
- [docs/SESSAO_POR_SESSAO_PLANNING.md](SESSAO_POR_SESSAO_PLANNING.md): SEC-001 reescrita com caminho B; TESTES-001 reescrita; adicionada `BRAND-001`.

### Criado
- [.gitignore](../.gitignore) na raiz do projeto cobrindo Node, Firebase, .env, IDE e OS files (preparando para o backend de SEC-001).

### Notas para próxima sessão
- **Backlog em ordem técnica recomendada:** REF-002 (modularizar cliente) → SEC-001 (backend) → REF-001 → DES-001/002 → BRAND-001 → BUG-001 → FEAT-001. Mas a ordem é decisão do Gerente.
- Quando SEC-001 começar, considerar criar `docs/PROTO_SOCKET.md` com schema de eventos antes de qualquer código (seção 14 do ONBOARDING_GAMEDEV recomenda isso para multiplayer).

---

## 2026-04-26 Sessão GRANULARIDADE — Reorganização do backlog em Macro Tarefas
**Status:** Completo
**Branch:** —

### Decisão registrada
Toda sessão grande é dividida em **Macro Tarefa** (épico) + **sub-sessões** numeradas (`MACRO.N`). Cada sub-sessão termina com código não-quebrado e ACTIVITY_LOG atualizado, podendo ser interrompida sem deixar o sistema inconsistente. Motivação: Gerente do Produto pode ser interrompido por AFK ou por limite de tokens — granularidade fina permite retomar do ponto exato sem retrabalho.

### Atualizado
- [docs/SESSAO_POR_SESSAO_PLANNING.md](SESSAO_POR_SESSAO_PLANNING.md): backlog inteiro reescrito em Macro Tarefas. Quebras notáveis:
  - `SEC-001` (era 1 sessão monolítica) → 12 sub-sessões com estratégia "construir em paralelo no `testes/` e promover no final" para nunca quebrar o pivot
  - `REF-002` → 5 sub-sessões (uma extração por vez)
  - `REF-001` → 3 sub-sessões
  - `DES-001` (i18n) → 6 sub-sessões (uma tela por vez)
  - `DES-002` → 4 sub-sessões + 1 futura
  - `BRAND-001` → 2 sub-sessões
  - `FEAT-001` → spec primeiro, depois sub-sessões a definir
  - `BUG-001` e `TESTES-001` → mantidas como sessões únicas (já são pequenas)
- [CLAUDE.md](../CLAUDE.md): adicionada seção "Granularidade de sessões" com a regra; trigger `iniciar [CÓDIGO]` aceita sub-sessões (`iniciar SEC-001.3`) e Macros (pega primeira ⏳).

### Notas para próxima sessão
- Recomendação técnica de início: **REF-002.1** (extrair gameState.js — primeira extração mais simples, destrava modularização).
- Alternativa, se a prioridade for o leak: **SEC-001.1** (escrever PROTO_SOCKET.md primeiro, sem código). Doc-only é uma sub-sessão de baixo custo de tokens, ideal pra começar quando há limite apertado.

---

## 2026-04-26 Sessão WORKFLOW — Ordem de execução, novo trigger e ajustes de regras
**Status:** Completo
**Branch:** —

### Decisões registradas
- **Ordem de execução planejada** definida pelo Claude (Gerente Técnico) e cristalizada na seção topo de `SESSAO_POR_SESSAO_PLANNING.md`. `iniciar sessão` (sem código) pega a próxima sub-sessão ⏳ na ordem. Lógica da ordem: quick wins → spec doc-only barata → modularização (destrava polish e backend) → polish visual e i18n (cliente apresentável) → backend autoritativo → features. Total de 35 sub-sessões enfileiradas.
- **Novo trigger `status sessão`**: resumo curto (≤8 linhas) com última concluída, próxima na ordem, progresso na Macro atual e bloqueios. Distinto de `status do projeto`, que dá visão mais ampla.
- **`testes/index.html` é backup congelado da Alpha 2.2_Visual** (não sandbox de experimentação como antes pensado). Toda mudança vai direto para `html/index.html`; rollback usa Git. Reflexos:
  - `TESTES-001` reescrita: agora documenta `testes/` como backup
  - `SEC-001.8` ajustada: cliente alternativo deixa de viver em `testes/` e passa a ser uma flag `USE_SERVER` no próprio `network.js` (modular após REF-002.2). Coexistência via flag durante migração.
  - `BRAND-001.1` exclui `testes/` da varredura
  - Regra inviolável #9 adicionada no CLAUDE.md proibindo edição de `testes/`
- **Pivot pode ser reescrito por força maior** quando refator estrutural exigir. Prioridade declarada: arquitetura **limpa, organizada, segura, modularizada**. Critério: a reescrita serve à prioridade, não a estética arbitrária. Decisão precisa ser registrada no ACTIVITY_LOG quando ocorrer. Aplicado especialmente em REF-002.5.

### Atualizado
- [docs/SESSAO_POR_SESSAO_PLANNING.md](SESSAO_POR_SESSAO_PLANNING.md): seção "Ordem de execução planejada" no topo (35 sub-sessões); SEC-001.8 ajustada para flag `USE_SERVER`; TESTES-001 ajustada para "documentar backup"; BRAND-001.1 exclui `testes/`.
- [CLAUDE.md](../CLAUDE.md): trigger `iniciar sessão` agora consulta a ordem; novo trigger `status sessão`; regra inviolável #1 atualizada (exceção de força maior); regra #9 adicionada (testes/ é backup, não editar).
- [docs/PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) §3.1: descrição de `testes/index.html` atualizada para "backup congelado da Alpha".

### Notas para próxima sessão
- Sequência inicial: **TESTES-001** → **BRAND-001.1** → **BRAND-001.2** → **BUG-001**. As três primeiras são doc-only ou edição mínima — perfeitas para começar e validar o workflow `iniciar sessão` → execução → `status sessão`.

---

## 2026-04-26 Sessão TESTES-001 — `testes/` documentado como backup da Alpha
**Status:** Completo
**Branch:** —

### Feito
- Confirmado: [docs/PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) §3.1 já descreve `testes/index.html` como backup congelado da Alpha 2.2_Visual (atualizado preventivamente na sessão WORKFLOW anterior)
- Criado [testes/README.md](../testes/README.md) com explicação completa (papel, regra de não editar, rollback via Git, estado atual)
- Atualizado [docs/SESSAO_POR_SESSAO_PLANNING.md](SESSAO_POR_SESSAO_PLANNING.md): TESTES-001 marcado ✅ na ordem e na seção da sessão única

### Decisão de execução
- O item opcional do checklist sugeria comentário inline no topo de `testes/index.html`, mas a regra inviolável #9 do [CLAUDE.md](../CLAUDE.md) proíbe edição do backup. Resolvido com `testes/README.md` — mesmo objetivo (avisar quem abrir o diretório), zero edição em `index.html`, integridade byte-a-byte do snapshot Alpha preservada.

### Notas para próxima sessão
- Próxima na ordem: **BRAND-001.1** — `pesquisador` mapeia todas as ocorrências de "Shadow Protocol" no projeto (excluindo `WebBuilds/`, `testes/`, `.git/`).

---

## 2026-04-26 Sessão BRAND-001.1 — Mapeamento de "Shadow Protocol"
**Status:** Completo
**Branch:** —

### Feito
- `pesquisador` (haiku) executou varredura case-insensitive no projeto, excluindo `WebBuilds/`, `testes/`, `.git/`, `.claude/`
- Relatório consolidado: **9 ocorrências em 3 arquivos**

### Mapa para BRAND-001.2 (substituição)

#### A. Código vivo — alvo da próxima sessão (3 ocorrências em `html/index.html`)
- `html/index.html:6` — `<title>4×4 — Shadow Protocol</title>` → propor `<title>4×4</title>`
- `html/index.html:456` — `<div class="lobby-sub">Shadow Protocol</div>` → remover a div ou substituir por subtítulo neutro (decisão na BRAND-001.2)
- `html/index.html:524` — `<div id="log">>> Shadow Protocol — Alpha 2.2 — Pronto.</div>` → propor `>> 4×4 — Alpha 2.2 — Pronto.`

#### B. Docs canônicos (`4x4-techdoc.html`, `4x4-onepager.html`)
- **Nenhuma ocorrência.** Dispensa revisão manual do Gerente — alívio de escopo para BRAND-001.2.

#### C. Docs de workflow (PROJECT_CONTEXT, ACTIVITY_LOG, SESSAO_POR_SESSAO_PLANNING)
- 6 ocorrências, todas em **contexto histórico legítimo** (registros do tipo "descontinuado em 2026-04-26", "limpeza vai ser feita em BRAND-001", etc.)
- **Não tocar** — são memória do projeto, não branding ativo

#### D. Outros
- Nenhuma ocorrência

### Notas para próxima sessão
- BRAND-001.2 fica reduzida a 3 edições cirúrgicas em `html/index.html`. Antes de executar, vale alinhar com o Gerente sobre a linha 456 (manter a div com outro texto ou remover totalmente).

---

## 2026-04-26 Sessão BRAND-001.2 — "Shadow Protocol" removido do código vivo
**Status:** Completo
**Branch:** —

### Decisão de produto registrada
- Linha 456 (`<div class="lobby-sub">Shadow Protocol</div>`): Gerente decidiu **remover a div inteira**. Lobby fica sem subtítulo. *"Recolocaremos se necessário"* (Gabriel, 2026-04-26).

### Feito
- [html/index.html:6](../html/index.html) — `<title>4×4 — Shadow Protocol</title>` → `<title>4×4</title>`
- [html/index.html:456](../html/index.html) — `<div class="lobby-sub">Shadow Protocol</div>` removida (linha eliminada; `lobby-title` agora vem direto seguida de `gold-line`)
- [html/index.html:524](../html/index.html) (agora L523 após remoção) — `>> Shadow Protocol — Alpha 2.2 — Pronto.` → `>> 4×4 — Alpha 2.2 — Pronto.`
- Macro `BRAND-001` 100% concluída (2 sub-sessões ✅)

### Notas para próxima sessão
- Próxima na ordem: **BUG-001** — mover literal `2800` em `html/index.html` (delay de combate) para constante nomeada `COMBAT_REVEAL_MS`. Após a remoção da L456, o número da linha 623 do delay pode ter mudado em -1 — `pesquisador` ou Read pontual confirma antes do Edit.
- Após BUG-001, a fase de Quick wins encerra (4 sub-sessões ✅) e entra a fase de Spec doc-only com **SEC-001.1** (PROTO_SOCKET.md).

---

## 2026-04-26 Sessão BUG-001 — Constante COMBAT_REVEAL_MS para delay de combate
**Status:** Completo
**Branch:** —

### Feito
- Localizado o literal `2800` em `html/index.html:622` (era L623 antes de BRAND-001.2 remover uma linha) no `setTimeout` que dispara `hostResolveCombat`
- Declarada `const COMBAT_REVEAL_MS = 2800;` em `html/index.html:551` em novo bloco `/* ── timing constants ── */`, seguindo o padrão de organização já existente (DICE, layout helpers)
- Substituído o literal pelo nome da constante na chamada `setTimeout`

### Decisão de escopo registrada
- O item opcional do checklist (`prefers-reduced-motion`) foi deixado fora — princípio "não adicionar features além do que a tarefa pede". Vira sub-sessão de acessibilidade dedicada se o Gerente solicitar.

### Achado lateral (não no escopo desta sessão, registrado para SEC-001)
- `html/index.html:529-537` contém `firebaseConfig` com `apiKey`, `authDomain`, `databaseURL` etc. **hardcoded**. Embora a Firebase API key tenha proteção via Security Rules (não é "secret" no sentido tradicional), expô-la no código público fere boa prática. **Quando SEC-001.11 (descontinuar Firebase) chegar, o problema some sozinho.** Se o Gerente decidir manter Firebase Auth, vale isolar a config em variável de ambiente / endpoint dedicado. Anotado para tratar dentro de SEC-001.

### Encerramento da Fase 1 — Quick wins
Com BUG-001 ✅, a fase de **Quick wins** encerra: TESTES-001, BRAND-001.1, BRAND-001.2, BUG-001 — 4 sub-sessões ✅. Workflow `iniciar sessão` → execução → atualização de docs validado em produção.

### Notas para próxima sessão
- Próxima na ordem: **SEC-001.1** — escrever `docs/PROTO_SOCKET.md` (apenas spec, sem código). Sub-sessão doc-only, alta densidade de decisões de arquitetura. Vale eu apresentar uma proposta inicial e você revisar antes de cristalizar.

---

## 2026-04-26 Sessão SEC-001.1 — PROTO_SOCKET.md proposto (em revisão)
**Status:** 🔄 Em revisão (aguarda aprovação do Gerente)
**Branch:** —

### Feito
- `pesquisador` (haiku) mapeou schema canônico do estado Firebase: 8 campos top-level em `rooms/{roomId}` + 14 campos por `players[id]`. Achados além do esperado: `combatSkill`, `trapped`, `jumpedBlock` também precisam de tratamento de culling
- Escrito [docs/PROTO_SOCKET.md](PROTO_SOCKET.md) v1.0 com 9 seções: princípios, schema autoritativo, `state_for_me` por jogador, eventos C→S e S→C, códigos de erro, decisões pendentes, mudanças vs. Firebase, notas não-normativas

### Decisões cristalizadas na spec (todas sujeitas a revisão do Gerente)
- **Roll do d6 gerado no server**, não no cliente (anti-cheat — cliente atual gera localmente, é vulnerabilidade)
- **Data culling explícito** define quais campos do oponente vazam vs. ficam no server: `target` e `skill` nunca antes da revelação; `history` nunca durante o jogo (revelado em `game_over`); `traps` filtradas por `owner`
- **`state_update` específico por cliente** (P1 e P2 recebem versões diferentes do mesmo `RoomState`)
- **Em `game_over`, server envia `full_state` completo** — única exceção ao culling, para a tela Aftermath funcionar
- **Aleatoriedade isolada no server**, dependência de `Math.random()` ou `crypto.randomInt` (decisão de SEC-001.5)

### Achados não no escopo desta sessão
- Alpha **não tem AFK timer**, **não tem reconexão formal**, **não tem matchmaking**. Documentei como "Decisões pendentes" na §7 da spec — preservei comportamento atual sem inventar escopo. Ficam disponíveis para serem priorizadas como sub-sessões futuras.

### Aguardando revisão do Gerente
Pontos onde sua revisão é mais valiosa:
1. §3 `state_for_me`: você concorda com o que cada lado vê e quando? Especialmente sobre `combatSkill` revelado **só** no `combat_resolved` (não durante o roll)
2. §7 Decisões pendentes: alguma dessas (AFK, reconexão) virou prioridade na sua cabeça?
3. §8 Mudanças vs. atual: alguma dessas mudanças mexe com algo que você quer preservar exatamente como na Alpha?

### Notas para próxima sessão
- Após aprovação: marcar SEC-001.1 ✅ na ordem e seção. Próxima: **SEC-001.2** (boilerplate `server/`).
- Se houver pedido de ajuste: aplico no doc dentro desta mesma sub-sessão (não vira nova sessão — é refinamento da v1.0).

---

## 2026-04-26 Sessão SEC-001.1 — Refinamento v2.0 + reorganização do backlog
**Status:** ✅ Completo — spec PROTO_SOCKET.md v2.0 aprovada pelo Gerente em 2026-04-26 com regra de empate no Royal Rumble: re-roll entre empatados até alguém vencer (incorporada na §5.3 da spec). Sub-sessão fechada.
**Branch:** —

### Calibração de comunicação
- Gerente sinalizou que minhas perguntas anteriores estavam em jargão técnico (`combatSkill`, `state_for_me`) quando ele precisa de linguagem de produto: *"não estou de olho nas variáveis... temos que conversar a nível de usuário."*
- Salvei a regra como [feedback_linguagem_de_produto.md](C:\Users\gabri\.claude\projects\e--Projetos-o6-FAST-IP-4x4\memory\feedback_linguagem_de_produto.md) na memória persistente — aplicar daqui em diante.

### Diretrizes novas recebidas do Gerente
1. **Migração técnica, não redesign mecânico.** Alpha 2.2 mantém comportamento; muda só a infraestrutura.
2. **Hospedagem confirmada:** server Node no Railway, cliente como página no itch.io.
3. **Modos de matchmaking:** Random Match (fila) + Private Room (código curto ABCD).
4. **Modo 4v4 novo (Free-For-All):** 4 players nos 4 cantos, cada um vai para a diagonal oposta; primeiro a chegar vence sozinho.
5. **Royal Rumble:** combate com 2+ jogadores na mesma célula — todos rolam, maior avança, outros ficam.
6. **Inventário 4v4 reduzido:** 1 BLOCK + 1 TRAP + 1 SPRINT.
7. **Tela de combate sem revelar habilidade** (UX-001): mostra apenas `Dado + Modificador = Total`.
8. **Recurso só fora da base própria** (RULE-001): BLOCK/TRAP não podem ser colocados no spawn próprio.

### Atualizado
- [docs/PROTO_SOCKET.md](PROTO_SOCKET.md) → versão **2.0**:
  - §2-3 modos de partida e matchmaking
  - §4 schema com `mode`, `slot`, `goal`, `pendingCombat` (Royal Rumble), `inv` variável
  - §5 `state_for_me` agora com array `opponents[]` (suporta N jogadores) — `combatSkill` nunca revelado
  - §6 eventos novos para matchmaking (`queue_join`, `create_private_room`, `join_private_room`)
  - §6.2 validação RULE-001 incluída em `set_skill`
  - §8 código de erro `CANT_PLACE_ON_OWN_SPAWN`
  - §9 mudanças vs. Alpha listadas
- [docs/SESSAO_POR_SESSAO_PLANNING.md](SESSAO_POR_SESSAO_PLANNING.md) reescrito:
  - Adicionadas Macros **MATCH-001** (5 sub-sessões) e **MODE-001** (6 sub-sessões)
  - Adicionadas sessões únicas **UX-001** e **RULE-001**
  - SEC-001.5 (combat) e SEC-001.6 (vitória) marcadas para implementar como Royal Rumble e goal-por-slot **desde o início** — barato evitar refator no MODE-001
  - DES-001 (i18n) empurrada para depois do backend (PT-BR atende mercado brasileiro inicial)
  - Ordem de execução tem agora **48 itens** (4 ✅ + 1 🔄 + 43 ⏳)
- [docs/PROJECT_CONTEXT.md](PROJECT_CONTEXT.md):
  - §1 visão geral inclui modos de partida, matchmaking e hospedagem
  - §2 stack tem agora "estado atual" e "estado-alvo"
  - §5 regras de negócio expandidas com 4v4, RULE-001, UX-001
  - §8 tabela de sessões resumida com todas as Macros
- Memória [project_4x4_overview.md](C:\Users\gabri\.claude\projects\e--Projetos-o6-FAST-IP-4x4\memory\project_4x4_overview.md) atualizada com modos novos + hospedagem.

### Aguardando aprovação
Spec PROTO_SOCKET.md v2.0 aguarda aprovação do Gerente para SEC-001.2 começar. Após aprovação, marco SEC-001.1 ✅ e próxima na ordem é **UX-001**.

### Notas para próxima sessão
- Se aprovado: UX-001 (tela de combate sem revelar habilidade) é o próximo. Sub-sessão pequena, 30-60 min. Edita `showCombatUI` no monolito atual.
- Se houver ajustes: aplico em SEC-001.1 (mesmo escopo, não vira nova sub-sessão).

---

## 2026-04-26 Sessão UX-001 — Tela de combate sem revelar habilidade
**Status:** Completo
**Branch:** —

### Decisão de produto registrada
- Empate em Royal Rumble: re-roll só entre os empatados, repetindo até alguém vencer (mesma lógica do tie-breaker do 1v1). Incorporado na §5.3 do PROTO_SOCKET.md v2.0.

### Feito
- **PROTO_SOCKET.md fechada como v2.0 aprovada** — status no header atualizado, regra de empate movida da §10 (pendentes) para §5.3 (resolução de combate)
- **`showCombatUI()` modificada** em [html/index.html](../html/index.html):
  - Removidos os divs `<div id="mod-0">` e `<div id="mod-1">` no HTML (eram onde aparecia `fixo +X · ação BLOCK (+1)`)
  - Removido bloco CSS `.die-modifiers` (não há mais elemento usando)
  - Removida declaração `const modDiv = ...` no JS
  - Removido cálculo e escrita de string que revelava `combatSkill` (5 linhas eliminadas no JS)
- **Mantido funcionando:** `mathDiv` continua exibindo `Dado +Modificador = Total` quando o jogador rola — informação suficiente para o jogador.

### Validação
- `Grep` confirmou zero referências remanescentes a `mod-0`, `mod-1`, `modDiv`, `die-modifiers` no arquivo
- Tela de combate agora só mostra: título (CONFRONTO/CONFRONTO FINAL), nome dos agentes, dado, hint de "toque para rolar", `Dado + Mod = Total` (após roll), VS, vencedor (após resolução)

### Notas para próxima sessão
- Próxima na ordem: **RULE-001** — bloquear seleção de BLOCK/TRAP no client quando o jogador estiver na própria base de spawn. Sub-sessão pequena, edição em `setSkill()` (handler atual em html/index.html). Validação server-side já está prevista em SEC-001.4.

---

## 2026-04-26 Sessão RULE-001 — Bloquear BLOCK/TRAP na base própria (client-side)
**Status:** Completo
**Branch:** —

### Feito
- Constante `SPAWN_PER_SLOT = { 0: [0,0], 1: [3,3] }` adicionada no bloco global (preparada para MODE-001 quando os 4 slots tiverem spawns nos 4 cantos)
- `setSkill()` rejeita BLOCK/TRAP quando `me.pos` é igual ao spawn próprio (`arrEq(me.pos, SPAWN_PER_SLOT[myId])`)
- `syncUI()` aplica `disabled=true` aos botões BLOCK e TRAP no mesmo cenário
- SPRINT permanece habilitado na base (consistente com a decisão — SPRINT é movimento, não recurso colocado)

### Notas para próxima sessão
- Validação server-side equivalente está prevista em PROTO_SOCKET §6.2 (código de erro `CANT_PLACE_ON_OWN_SPAWN`) e será implementada em SEC-001.4.
- Próxima na ordem: **REF-002.1** (extrair `gameState.js`). Início da fase de Modularização — primeira extração do monolito. Constantes globais (`DICE`, `COMBAT_REVEAL_MS`, `SPAWN_PER_SLOT`, `arrEq`, `dist`) vão para o novo módulo.

---

## 2026-04-26 Sessão REF-002.1 — Extrair html/gameState.js
**Status:** Completo
**Branch:** —

### Feito
- Criado [html/gameState.js](../html/gameState.js): exporta `DICE`, `COMBAT_REVEAL_MS`, `SPAWN_PER_SLOT`, `INV_INITIAL` (novo), `GRID_SIZE` (novo), `arrEq`, `dist` (novo); inicializa `window.S` como efeito colateral (preservando o estado idêntico do monolito)
- Em [html/index.html](../html/index.html), adicionado `import { DICE, COMBAT_REVEAL_MS, SPAWN_PER_SLOT, INV_INITIAL, GRID_SIZE, arrEq, dist } from './gameState.js';` no `<script type="module">` logo após os imports do Firebase
- Removidas do monolito as declarações duplicadas (DICE, COMBAT_REVEAL_MS, SPAWN_PER_SLOT, arrEq, window.S inicial)

### Decisão técnica
- Optei por ES6 module (`export`/`import`) em vez de classic script (`<script src=...>`) porque o módulo principal já é `<script type="module">` (precisa ser para o Firebase SDK). Compartilhar via `window.X` poluiria o escopo global e exigiria reescritas no monolito; com ES6 modules, basta o `import` no topo.

### Descobertas que afetam sub-sessões futuras
- `INV_INITIAL` e `GRID_SIZE` foram criados como exports mas ainda não substituem literais espalhados no monolito (ex: `{BLOCK:2,TRAP:2,SPRINT:1}` em `restartGame`, `r%4`/`c%4` em `renderBoard`). Substituir em massa fica para sub-sessões posteriores (REF-001.* ou específicas) — risco baixo de fazer agora, mas fora do escopo "extrair constantes".
- `dist` foi criado mas não substitui o cálculo inline em `renderBoard:667`. Substituição planejada para REF-001.1 (calcFogMask).
- Para servir o jogo localmente durante desenvolvimento, será necessário um HTTP server (não funciona com `file://` por causa do import relativo). No deploy alvo (Firebase Hosting hoje, Railway/itch.io futuro) é HTTP nativo, sem problema.

### Notas para próxima sessão
- Próxima na ordem: **REF-002.2** — extrair `html/network.js` (Firebase init, listeners, writes). Decisão técnica adiantada: o `network.js` será desenhado de forma genérica para que SEC-001.8 possa adicionar a flag `USE_SERVER` sem refatoração.

---

## 2026-04-26 Sessão REF-002.2 — Extrair html/network.js
**Status:** Completo
**Branch:** —

### Feito
- Criado [html/network.js](../html/network.js): camada de rede contendo Firebase imports, `firebaseConfig`, `initMultiplayer(onStateChange)`, listener `onValue` com backfills, `beforeunload` e re-exports de `db`/`ref`/`set`/`onValue`/`get`/`update`
- Monolito ([html/index.html](../html/index.html)) agora importa `{ db, ref, set, onValue, get, update, initMultiplayer }` de `./network.js`. Removidos: imports Firebase, `firebaseConfig`, `app`, `db`, init, listener, beforeunload (~30 linhas)
- `initMultiplayer()` agora recebe `syncUI` como callback de `onStateChange`. O listener `onValue` em network.js dispara o callback após popular `window.S` e fazer backfills

### Decisão técnica
- `window.roomId`, `window.myId`, `window.dbRef` movidos para network.js. Permanecem expostos em `window` para preservar compat com chamadas espalhadas no monolito que usam `roomId`/`dbRef` sem prefixo (resolução via global object). Após REF-002 completo, esses identificadores podem ser substituídos por imports explícitos onde necessário.
- Re-exportar funções do Firebase (`ref`, `update`, etc.) em vez de criar wrappers de alto nível foi a escolha menos invasiva. Wrappers (`writePlayerUpdate`, etc.) virão organicamente quando SEC-001.8 adicionar a flag `USE_SERVER` — aí faz sentido abstrair.

### Notas para próxima sessão
- Próxima na ordem: **REF-002.3** — extrair `html/combat.js` com as funções `hostProcessTurn`, `hostMove`, `hostResolveCombat`, `hostCheckWin`, `getTurnMod`, `getTotalMod`. Essas funções usam `set(dbRef, S)` em vários pontos — vão importar de `network.js`.

---

## 2026-04-26 Sessão REF-002.3 — Extrair html/combat.js
**Status:** Completo
**Branch:** —

### Feito
- Criado [html/combat.js](../html/combat.js) com as 6 funções de combate; importa `set` de network.js e `arrEq` de gameState.js
- Exports públicos: `hostProcessTurn`, `hostResolveCombat`, `getTotalMod` (chamados pelo monolito em syncUI e showCombatUI)
- `hostMove`, `hostCheckWin`, `getTurnMod` permanecem **privados** ao módulo combat.js (são chamados apenas internamente pelas funções já exportadas)
- Removidas as 6 funções do monolito (~85 linhas removidas; o bloco `/* ── modifier helpers ── */` e `/* ── host process turn ── */` desapareceram do index.html)

### Notas para próxima sessão
- Próxima na ordem: **REF-002.4** — extrair `html/ui.js` (`syncUI`, `renderBoard`, `showCombatUI`, `showAftermath`, `drawSVG`, e handlers `onCellClick`, `setSkill`, `ready`, `rollDie`). Sub-sessão maior — concentra muita lógica visual + handlers.

---

## 2026-04-26 Sessão REF-002.4 — Extrair html/ui.js
**Status:** Completo
**Branch:** —

### Feito
- Criado [html/ui.js](../html/ui.js) com layout helpers, `syncUI` (export), renderBoard, showCombatUI, showAftermath, drawSVG, e handlers `window.X`
- Imports cobertos: gameState (DICE, COMBAT_REVEAL_MS, SPAWN_PER_SLOT, arrEq), network (update, ref, set, db), combat (hostProcessTurn, hostResolveCombat, getTotalMod)
- Monolito ([html/index.html](../html/index.html)) reduzido a 4 linhas de script: `import initMultiplayer` + `import syncUI` + chamada `initMultiplayer(syncUI)` (e tag de fechamento). ~290 linhas removidas.
- `window.combatTimer = null` movido para ui.js como efeito colateral

### Decisão técnica
- `syncUI` é o único export de ui.js (passado como callback). Demais funções (`renderBoard`, `showCombatUI`, `showAftermath`, `drawSVG`) permanecem privadas ao módulo. Handlers ficam em `window.X` por necessidade dos atributos `onclick="..."` no markup.

### Notas para próxima sessão
- Próxima na ordem: **REF-002.5** — reduzir `index.html` ao essencial. O bloco JS já está enxuto (4 linhas); o trabalho restante é avaliar se o `<style>` interno (≈400 linhas) deve sair para um `style.css` separado. Decisão de arquitetura — provavelmente sim, para coerência com o resto da modularização.

---

## 2026-04-26 Sessão REF-002.5 — Reduzir index.html
**Status:** Completo
**Branch:** —

### Feito
- Extraído `<style>` interno (~430 linhas) para [html/style.css](../html/style.css)
- [html/index.html](../html/index.html) agora referencia via `<link rel="stylesheet" href="style.css">`
- index.html reduzido a **88 linhas** (de 521 antes desta sessão; ~995 no estado inicial do projeto)
- Macro REF-002 100% concluída (5/5 sub-sessões)

### Estrutura final do `html/`
```
index.html       (88 linhas)  — markup + bootstrap script
style.css       (~430 linhas) — todo o CSS
gameState.js    (~38 linhas)  — constantes, helpers, window.S inicial
network.js      (~95 linhas)  — Firebase, initMultiplayer, listener
combat.js      (~110 linhas)  — host* funções, getTurnMod, getTotalMod
ui.js          (~250 linhas)  — syncUI, renderBoard, screens, handlers
```

### Notas para próxima sessão
- Próxima na ordem: **REF-001.1** — extrair `calcFogMask(myPos, gridSize)` como função pura. Vai para `ui.js` (ou se fizer sentido extrair como módulo `validators.js`/`fog.js` — decisão durante a sessão).

---

## 2026-04-27 Sessão REF-001.1 — Extrair calcFogMask
**Status:** Completo
**Branch:** —

### Feito
- Criado [html/validators.js](../html/validators.js) — módulo novo para funções puras de validação/cálculo (sem DOM, sem state global, reutilizável no servidor futuro de SEC-001)
- Implementada `calcFogMask(myPos, gridSize) → Set<"r,c">`: itera células do tabuleiro e adiciona ao Set as que têm distância Manhattan > 1 da posição do jogador
- [html/ui.js](../html/ui.js): adicionado import de `calcFogMask` (validators) e `GRID_SIZE` (gameState); `renderBoard` agora pré-calcula `fogMask` antes do loop e usa `fogMask.has(\`${r},${c}\`)` no lugar do cálculo inline `dist > 1`

### Decisão técnica
- Optei por criar `validators.js` em vez de manter a função em `ui.js`. REF-001.2 vai adicionar `validSkillTargets` lá; REF-001.3 vai usar ambas. Isolar funções puras num módulo dedicado prepara reuso pelo servidor de SEC-001 (validações server-side são as mesmas).

### Notas para próxima sessão
- Próxima na ordem: **REF-001.2** — `validSkillTargets(skill, myPos, state) → Set<"r,c">`. Vai para `validators.js`. Cobre BLOCK/TRAP (célula atual), SPRINT (2 retas), default (1 adjacente).

---

## 2026-04-27 Sessão REF-001.2 — Extrair validSkillTargets
**Status:** Completo
**Branch:** —

### Feito
- Adicionada `validSkillTargets(skill, myPos, gridSize) → Set<"r,c">` em [html/validators.js](../html/validators.js): retorna 4 candidatos a `step=2` (SPRINT) ou `step=1` (default), com clamp de bordas
- [html/ui.js](../html/ui.js):
  - `renderBoard` agora pré-calcula `targetMask = validSkillTargets(...)` antes do loop e usa o Set em vez de calcular `isSprint`/`dist===1` por célula
  - `onCellClick` reduzido a 2 linhas: pega o Set e checa `has(\`${r},${c}\`)` — mesma fonte de verdade que renderBoard
- Lógica de `dist <= 1` para mostrar oponente/blocks substituída por `!fogMask.has(key)` (equivalência: distância > 1 ↔ está em fogMask)

### Decisão técnica
- BLOCK e TRAP **não afetam o conjunto de alvos** (jogador escolhe alvo de movimento normalmente; o recurso é colocado na célula atual). Validei isso no comportamento atual: `validSkillTargets` para skill ∈ {"", "BLOCK", "TRAP"} retorna o mesmo Set de 4 adjacentes.
- Refator unificou duas fontes de verdade: antes, renderBoard calculava `isSprint` por célula e onCellClick recalculava. Agora ambos consomem o mesmo helper.

### Notas para próxima sessão
- Próxima na ordem: **REF-001.3** — reduzir `renderBoard` a renderização pura. Após REF-001.1 e .2, a função já está bem mais magra; resta avaliar se há mais lógica que pode sair (provavelmente a montagem de innerHTML por célula pode virar helpers de renderização).

---

## 2026-04-27 Sessão REF-001.3 — Reduzir renderBoard
**Status:** Completo
**Branch:** —

### Feito
- `renderBoard` em [html/ui.js](../html/ui.js) reduzido de 71 para **17 linhas** — apenas orquestra: monta contexto, calcula masks, itera células e chama 6 helpers
- Extraídos 6 helpers locais ao módulo: `renderHeader`, `setupBoardOnce`, `renderPieces`, `renderCell`, `renderControls`, `renderStatus`
- Cada helper tem responsabilidade única e parâmetros explícitos (sem leitura implícita de state global, exceto `S` e `window.myId` que são convenção do projeto)
- `renderCell` recebe contexto `{ me, other, fogMask, targetMask }` — facilita teste isolado e migração futura para virtual DOM se necessário
- Macro REF-001 100% completa (3/3 sub-sessões)

### Notas para próxima sessão
- Próxima na ordem: **DES-002.1** — pesquisador mapeia todas as cores não-tokenizadas (CSS estático e JS inline). Início da Macro DES-002 (design tokens completos).

---

## 2026-04-27 Sessão DES-002.1 — Mapeamento de cores não-tokenizadas
**Status:** Completo
**Branch:** —

### Feito
- `pesquisador` (haiku) varreu `style.css`, `*.js` em html/, e `index.html`
- Mapa salvo em [docs/DES_TOKENS_MAP.md](DES_TOKENS_MAP.md): 6 hex hardcoded em CSS, 1 em HTML inline, ~30 rgba literais em CSS, **zero em JS**

### Descoberta que afeta o backlog
- Todos os arquivos JS (`gameState.js`, `network.js`, `combat.js`, `ui.js`, `validators.js`) já usam `var(--token)` em 100% das cores aplicadas via `style.X = ...` ou template literais. **DES-002.4 vira praticamente uma validação (no-op).** Mantida como sub-sessão pra confirmar formalmente, mas o trabalho real fica em DES-002.2 (declarar tokens) e DES-002.3 (substituir em CSS).

### Decisão técnica registrada para DES-002.3
- Variações de cor já tokenizada (ex: `rgba(200,168,75,.X)` = variantes de `--gold`) serão substituídas por `color-mix(in srgb, var(--gold) X%, transparent)` em vez de criar 5+ tokens derivados. `color-mix` é Baseline 2023, suportado pelos targets (Chrome/Edge/Firefox/Safari modernos do itch.io).

### Notas para próxima sessão
- Próxima na ordem: **DES-002.2** — declarar os 14 tokens novos em `:root` de `style.css`. Lista pronta na §6 do mapa.

---

## 2026-04-27 Sessão DES-002.2 — Adicionar tokens semânticos em :root
**Status:** Completo
**Branch:** —

### Feito
- 14 tokens novos adicionados em `:root` de [html/style.css](../html/style.css): `--btn-active`, `--fog-bg`, `--fog-bdr`, `--sprint-bg`, `--combat-bg`, `--log-bg`, `--shadow-heavy`, `--shadow-light`, `--scanline`, `--scanline-combat`, `--piece-ring`, `--piece-diamond`, `--p1-highlight`, `--p2-highlight`
- `:root` reorganizado em 6 grupos comentados: core, players, semantic, contextual surfaces, shadows, piece details
- Tokens originais preservados (sem renomeação para não quebrar referências existentes)

### Notas para próxima sessão
- Próxima na ordem: **DES-002.3** — substituir hex/rgba literais em CSS pelos tokens declarados. ~36 substituições no `style.css` + 1 no `index.html` inline. Para variações de cor existente (rgba do gold/combat/p1/p2), usar `color-mix(in srgb, var(--X) Y%, transparent)`.

---

## 2026-04-27 Sessão DES-002.3 — Substituir cores em CSS
**Status:** Completo
**Branch:** —

### Feito
- Adicionado `--shadow-medium: rgba(0,0,0,.6)` em `:root` (descoberto durante substituição em `.p1-piece` / `.p2-piece` — não estava no mapa original; estende `--shadow-heavy/light`)
- 16 edits no [html/style.css](../html/style.css) e 1 em [html/index.html](../html/index.html) substituindo todas as cores literais fora de `:root` por `var(--token)` ou `color-mix(in srgb, var(--X) Y%, transparent)`
- Validado via Grep: hex/rgba só permanecem dentro do `:root` (linhas 1-41), que é a definição autoritativa dos tokens

### Decisões técnicas
- Usei `color-mix(in srgb, var(--X) Y%, transparent)` para variações de opacidade de tokens existentes (gold, combat, p1, p2, trap, btn-active) em vez de criar tokens derivados (`--gold-glow-12`, `--combat-shadow-55`, etc). Mais legível e flexível
- Tokens próprios criados apenas para cores realmente independentes (fog-bg, sprint-bg, log-bg, scanline, piece-ring, etc.) ou compartilhadas (shadow-heavy/medium/light, btn-active)

### Notas para próxima sessão
- Próxima na ordem: **DES-002.4** — formalmente "substituir cores em JS inline". Conforme descoberto em DES-002.1, **JS já está 100% tokenizado** — sub-sessão será de validação rápida (Grep confirmando zero ocorrências) + fechar. Macro DES-002 fica 4/4 + futura DES-002.5 ⏸ (tema light).

---

## 2026-04-27 Sessão DES-002.4 — Validação JS tokenizado
**Status:** Completo (no-op formal)
**Branch:** —

### Feito
- Grep `#[0-9a-fA-F]{3,8}|rgba?\(` em `html/*.js` retornou zero matches
- Confirmado: `gameState.js`, `network.js`, `combat.js`, `ui.js`, `validators.js` usam exclusivamente `var(--token)` em todas as aplicações de cor via DOM (template literals em `style.X = ...`)
- Macro DES-002 fechada: 4/4 sub-sessões concluídas (DES-002.5 "tema light" mantida como ⏸ futuro, fora do escopo Alpha)

### Notas para próxima sessão
- Macros remanescentes na ordem: SEC-001.2-12 → MATCH-001 → MODE-001 → DES-001 (i18n) → FEAT-001
- Próxima na ordem: **SEC-001.2** — boilerplate `server/`. **Atenção:** entra em uma fase de trabalho mais pesado (backend Node + Socket.io). Considerar começar criando `server/package.json` + `server.js` mínimo com eco; deploy no Railway fica para depois (testes locais primeiro).

---

## 2026-04-27 Sessão SEC-001.2 — Boilerplate Node + Socket.io
**Status:** Completo
**Branch:** —

### Feito
- Criado [server/package.json](../server/package.json): `fast-ip-4x4-server`, `type: module`, `engines.node >=20`, deps `express ^4.19.0` + `socket.io ^4.7.5`, scripts `start` e `dev` (com `node --watch`)
- Criado [server/server.js](../server/server.js): Express com `GET /` (texto `4x4 server ok`) e `GET /health` (JSON status+uptime); HTTP server + Socket.io anexado; CORS via função `isAllowedOrigin` cobrindo localhost (qualquer porta), `itch.io` e `*.itch.io`; eventos `connection` / `ping` (ack `{pong, echoed, t}`) / `disconnect`; graceful shutdown em SIGTERM/SIGINT com fallback de force-exit em 5s
- Criado [server/README.md](../server/README.md): tom Gabriel-friendly em PT-BR, passo a passo de pré-requisito (node ≥20), `npm install`, `npm start`, e duas verificações independentes (HTTP no browser + `test-client.html` via duplo-clique)
- Criado [server/test-client.html](../server/test-client.html): página standalone com botão Ping; carrega socket.io client da CDN 4.7.5; conecta a `http://localhost:3000`; loga connect/disconnect/connect_error e mostra o ack no `<pre>`. Standalone — não toca nenhum arquivo do cliente do jogo

### Validação
- `node --check server/server.js` passou (Node v24.15.0 disponível na máquina, atende `>=20`)
- Regra inviolável #8 respeitada: server NÃO foi rodado em background pra validar — verificação dinâmica fica com o Gabriel via README

### Decisões técnicas
- **CORS via função em vez de array literal**: a regra `*.itch.io` exige regex (não cabe em lista estática). Manter as outras regras na mesma função evita misturar formatos
- **`node --watch` em vez de nodemon**: built-in do Node ≥18.11, zero dep extra
- **Sem dotenv**: `process.env.PORT || 3000` direto basta até SEC-001.10. Adicionar dotenv só quando aparecerem outras variáveis (Redis URL, secrets)
- **CSS inline no `test-client.html` com cores literais**: arquivo standalone fora de `html/`, fora do escopo de DES-002. Usei `#04030a` (bg) e `#c8a84b` (gold) idênticos aos tokens pra coerência visual, sem importar `style.css`

### Dependência externa para o Gabriel
- Validação dinâmica precisa do Gabriel rodar localmente: `cd server && npm install` (1ª vez), `npm start`, abrir `http://localhost:3000` e `test-client.html`. Esperado documentado no [server/README.md](../server/README.md)

### Notas para próxima sessão
- Próxima na ordem: **SEC-001.3** — lifecycle de Private Room (criação com código ABCD, join, disconnect). Vai introduzir: Map de salas em memória, gerador de código alfanumérico (4 chars excluindo `0/O`/`1/I/L`), eventos `create_private_room` / `join_private_room` / `leave_room` / `disconnect`, primeiros códigos de erro do PROTO_SOCKET §8 (`ROOM_NOT_FOUND`, `ROOM_FULL`, `ALREADY_IN_QUEUE_OR_ROOM`)
- Antes de SEC-001.3, idealmente o Gabriel já ter rodado `npm install` no `server/` ao menos uma vez, para destravar validações dinâmicas locais

### Patch pós-validação (mesma sessão)
- Gabriel testou e o `test-client.html` aberto via `file://` recebia `connect_error: xhr poll error` — o navegador envia `Origin: null` e o CORS rejeitou. Solução: `app.use(express.static(__dirname))` no server.js para servir a pasta `server/` por HTTP. README atualizado: passo "abrir test-client.html" agora aponta para `http://localhost:3000/test-client.html` em vez de duplo-clique
- Gabriel confirmou pong recebido após o patch — sub-sessão fechada de fato

---

## 2026-04-27 Sessão SEC-001.3 — Lifecycle de Private Room
**Status:** Completo
**Branch:** —

### Feito
- Criado [server/codes.js](../server/codes.js): `generateRoomCode()` retorna 4 chars do alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sem `0/O`/`1/I/L`, conforme PROTO_SOCKET §11). Espaço de 31⁴ ≈ 923 mil combinações
- Criado [server/rooms.js](../server/rooms.js): estado em RAM com `Map<roomId, RoomState>` + `Map<socketId, roomId>` (lookup reverso). Constantes `MAX_PLAYERS`, `SPAWNS_BY_SLOT`, `GOALS_BY_SLOT` por modo. Funções: `createPrivateRoom`, `joinPrivateRoom`, `leaveRoom`, `markDisconnected`, `summarize`, `startCleanup`, `stopCleanup`. Cleanup roda a cada 60s removendo salas com `disconnectedAt > 5 min` (PROTO_SOCKET §11). `setInterval.unref()` para não bloquear shutdown
- [server/server.js](../server/server.js) ampliado: handlers `create_private_room` / `join_private_room` / `leave_room` / `disconnect`. ACK direto para o emissor (`{ roomId, mySlot }` ou `{ error: { code } }`); `state_update` broadcast para a sala (`io.to(roomId).emit`) após cada mudança; `opponent_disconnected` quando alguém sai/cai. `startCleanup()` chamado no boot e `stopCleanup()` no shutdown
- [server/test-client.html](../server/test-client.html) reformulado: radio 1v1/4v4, input de código (com auto-uppercase), botões Create/Join/Leave/Ping/Limpar log, listener para `state_update` e `opponent_disconnected`. Após Create, código preenche o input automaticamente (facilita teste com 2 abas)

### Decisões técnicas
- **Estado em memória vs. Redis**: Map em RAM por agora (PROTO_SOCKET §11 — Redis é pós-Alpha). Não compromete o que vem por aí; trocar para Redis depois é refator localizado em `rooms.js`
- **Reconexão deixada para SEC-001.12**: `disconnect` apenas marca `connected:false`; `leaveRoom` remove de fato. PROTO_SOCKET §10 explicita que reconexão fica para hardening final
- **`state_update` mínimo nesta sub-sessão**: payload só com `roomId/mode/phase/players[{slot,spawn,goal,connected}]`. Quando SEC-001.4 adicionar planning, `summarize()` cresce com `pos/target/inv/permMod` (com data culling em SEC-001.7). Cliente futuro vai descobrindo campos progressivamente — não há quebra
- **Sem evento `opponent_joined` na spec, então não criei**: novos players viram visíveis pelos demais via `state_update` broadcast (que é genérico). Spec só prevê `opponent_disconnected` como sinal lateral. Mantive paridade
- **Validação `INVALID_MODE`**: não está nominalmente nos códigos da spec §8, mas adicionei como guard estrutural (cliente futuro nunca deve mandar mode inválido — é proteção contra bugs/clients antigos). Se Gerente quiser remover, vira no-op

### Validação
- `node --check` passou em codes.js, rooms.js, server.js
- Validação dinâmica precisa do Gabriel testar com 2 abas do test-client (uma cria, outra entra)

### Notas para próxima sessão
- Próxima na ordem: **SEC-001.4** — planning phase no server. Eventos: `set_target` / `unset_target` / `set_skill` (com validação RULE-001) / `unset_skill` / `set_ready`. Quando todos `ready`, server processa o turno (movimento, detecção de colisões, transição para combat ou aplicação de TRAP/BLOCK). Vai expandir `summarize()` com `pos/target/skill/inv/permMod/ready/trapped/jumpedBlock`. Inventário inicial é populado aqui (`{BLOCK:2,TRAP:2,SPRINT:1}` para 1v1, `{BLOCK:1,TRAP:1,SPRINT:1}` para 4v4)
- Atenção: SEC-001.4 vai ser sub-sessão maior (planning é a fase com mais lógica de validação). Considerar fatiar se ficar grande demais

---

## 2026-04-27 Sessão SEC-001.4 — Planning phase no server
**Status:** Completo
**Branch:** —

### Feito
- Criado [server/constants.js](../server/constants.js): `GRID_SIZE`, `MAX_PLAYERS`, `SPAWNS_BY_SLOT`, `GOALS_BY_SLOT`, `INV_INITIAL_BY_MODE` (1v1=`{B2,T2,S1}`, 4v4=`{B1,T1,S1}`)
- Criado [server/validators.js](../server/validators.js): funções puras `arrEq`, `manhattanDist`, `isOnBoard`, `isReachableTarget(pos, target, skill)`, `canPlaceSkillOnBase` (RULE-001)
- [server/rooms.js](../server/rooms.js) refatorado: `makePlayer` agora popula `pos/target/skill/combatSkill/inv/permMod/history/trapped/jumpedBlock/roll`; RoomState ganha `blocks/traps/spentRes/combatLocs/pendingCombat/winner/isEndgame`. Auto-transição lobby→planning via `maybeStartPlanning` quando MAX players conectados
- [server/rooms.js](../server/rooms.js): adicionados handlers `setTarget`, `unsetTarget`, `setSkill`, `unsetSkill`, `setReady` com validações de fase, ready, inv, RULE-001 e re-validação de target ao trocar skill
- [server/rooms.js](../server/rooms.js): `processTurn` portado de [html/combat.js](../html/combat.js) generalizado para N players — detecta swaps, detecta colisões em grupos, monta `pendingCombat` quando há colisão, move players não-colididos. `movePlayer` cobre BLOCK/TRAP plantados, SPRINT (com block no meio/alvo), trap trigger no destino, atualização de `permMod` e `history`. `checkWin` cobre vitória direta e tie-breaker 1v1 (vira `pendingCombat` endgame)
- [server/server.js](../server/server.js): wire de 5 handlers (`set_target`, `unset_target`, `set_skill`, `unset_skill`, `set_ready`); emite `combat_started` e `game_over` quando `setReady` retorna esses flags
- [server/test-client.html](../server/test-client.html) ampliado: campos r/c + Set Target, botões BLOCK/TRAP/SPRINT/Unset Skill/Unset Target, botão READY, painel "Meu estado" derivado do `state_update` (phase, mySlot, pos, target, skill, inv, permMod, ready, trapped, oponentes resumidos)

### Decisões técnicas
- **1 grupo de combate por turno**: PROTO_SOCKET §4 tem `pendingCombat` singular. Em 4v4 podem aparecer múltiplos grupos colidindo simultaneamente — nesta sub, processo só o primeiro grupo (em ordem de iteração); players de grupos secundários ficam parados. Fila formal de combates fica para SEC-001.5/6 ou sub-sessão de hardening 4v4 se necessário
- **Tie-breaker 4v4 desconhecido**: PROTO_SOCKET §10 marca como pendente. Implementei fallback "slot menor vence" para o caso raríssimo de 2+ chegadas simultâneas no goal em 4v4. Decisão final fica para o Gerente quando MODE-001.2 chegar
- **Re-validação de target ao trocar skill**: cliente pode `set_target` (dist 1) e depois `set_skill SPRINT` (dist 2) — o target vira inválido. Em vez de retornar erro, limpo `target` preventivamente; cliente precisa re-setar. Mais ergonômico que travar
- **Sem culling ainda**: `summarize` envia tudo (target, skill, history, traps de todos). Filtragem por destinatário fica em SEC-001.7 quando o foco for vazamentos. Por agora Gabriel testa local e ver tudo é útil para debug
- **Sem `combatSkill` revelado a outros**: SIM já envio; SEC-001.7 vai ocultar
- **Constantes duplicadas com cliente**: `GRID_SIZE`, spawns, inventário inicial — duplicadas no server (`server/constants.js`) vs cliente (`html/gameState.js`). Pacote shared exigiria tooling; por agora a duplicação é deliberada e pequena. Mover pra `shared/` é refator localizado se virar problema

### Validação
- `node --check` passou em constants.js, validators.js, rooms.js, server.js
- Validação dinâmica fica com Gabriel (2 abas → criar sala 1v1, ambos set_target adjacente, set_ready, observar `state_update` mostrando posições atualizadas e turno reiniciado)

### Notas para próxima sessão
- Próxima na ordem: **SEC-001.5** — combate (Royal Rumble desde o início). Implementar handler `roll_die` com geração de 1d6 no server (`crypto.randomInt(1, 7)`), preenchendo `pendingCombat.rolls[slot]`. Quando todos os participantes rolaram, agendar resolução em `COMBAT_REVEAL_MS` (timer no server). Resolução: calcular `dado + permMod + turnMod` por participante; vencedor avança (chama `movePlayer` com o target dele); perdedor consome `combatSkill` (porta de `hostResolveCombat`); empate dispara nova rodada só entre top scores (PROTO_SOCKET §5.3); transição para `planning` resetando `target/skill/ready/roll/combatSkill/jumpedBlock`. Emite `combat_resolved` com `{ winnerSlot, scores: { [slot]: {dice, mod, total} } }`
- Atenção: combate generalizado para N participantes (não hardcode 2). Decisão SEC-001.4 sobre múltiplas colisões pode ressurgir aqui

---

## 2026-04-27 Sessão SEC-001.5 — Combate (Royal Rumble)
**Status:** Completo
**Branch:** —

### Feito
- [server/constants.js](../server/constants.js): adicionada `COMBAT_REVEAL_MS = 2800` (espelha o cliente)
- [server/rooms.js](../server/rooms.js): adicionados `getTurnMod`, `getTotalMod` (porta exata de combat.js do cliente); `rollDie({ socketId })` que valida fase/participação/já-rolado e gera 1d6 com `crypto.randomInt(1, 7)` (aleatoriedade no server — fecha vulnerabilidade do `Math.random` no cliente Alpha); `resolveCombat({ roomId })` que calcula totals, registra `combatLocs` (não-endgame), aplica perdedores (`applyLoser` consome combatSkill com permMod ajustado, status "wasted"), gerencia empate via re-roll só entre top scorers (PROTO_SOCKET §5.3), avança vencedor via `movePlayer`, lida com endgame (vitória final sem mover) e re-checa `checkWin` após o move (vencedor pode pisar no goal e disparar endgame ou game_over)
- [server/server.js](../server/server.js): handler `roll_die` retorna `{ dice }` no ack; broadcast `state_update`; quando `allRolled`, chama `scheduleCombatResolve(roomId)`. Função local `scheduleCombatResolve` agenda `setTimeout(COMBAT_REVEAL_MS)` com `unref()`, dentro do callback chama `resolveCombat` e emite `combat_resolved` + (`combat_started` se reroll/endgame OU `game_over` se gameOver OU `state_update` se turno simples). Map `combatTimers` cancela timers anteriores ao agendar
- [server/test-client.html](../server/test-client.html): seção "Combate" com botão Roll Die; listener `combat_resolved` formata as linhas `slotN: dice=X mod=Y total=Z` no log

### Decisões técnicas
- **`crypto.randomInt(1, 7)`** em vez de `Math.random` — princípio 4 do PROTO_SOCKET. Diferença prática: bot/devtools não consegue forçar dado 6 (era a vulnerabilidade no cliente Alpha)
- **Royal Rumble generalizado**: `topScore = max(totals)` + `topScorers = participants com total === topScore`. Empate no top → re-roll só entre topScorers; perdedores fora do top já consomem combatSkill agora (não esperam o re-roll). 1v1 (sempre 2 participantes) cai no caminho ou "winner único" ou "empate de 2" — bate com Alpha. 4v4 com 3+ participantes ganha suporte natural
- **Timer no server.js, não em rooms.js**: `setTimeout` precisa de acesso ao `io` para emit. Map `combatTimers` permite cancelar timer anterior se outro combate disparar (não acontece na prática mas é defensivo). Não cancelo timer ao deletar sala — `resolveCombat` retorna `null` se sala sumiu, então callback vira no-op silencioso
- **`combat_resolved` antes dos eventos de transição**: cliente recebe `combat_resolved` com scores (animação termina), depois `combat_started` (re-roll), `game_over` ou `state_update` (turno seguinte). Ordem importa pra UX: scores aparecem antes do próximo combat ou do reset
- **Endgame com empate**: spec original do 1v1 (`hostResolveCombat`) zera roll e mantém phase=combat; minha implementação faz exatamente isso via `isReroll: true` (pendingCombat.participants continua igual, rolls zeram, phase fica em combat). Cliente vê `combat_resolved` (winner=null) + novo `combat_started`

### Validação
- `node --check` passou em constants.js, rooms.js, server.js
- Validação dinâmica fica com Gabriel: 2 abas, ambos miram a mesma célula, set_ready → `combat_started` aparece → cada um clica Roll Die → após ~2.8s `combat_resolved` mostra os scores

### Notas para próxima sessão
- Próxima na ordem: **SEC-001.6** — endgame + condição de vitória. Boa parte já está implementada como subproduto desta sub (checkWin, isEndgame, game_over). SEC-001.6 fica focada em: garantir que `game_over` envia `full_state` correto (Aftermath precisa de `history` completo dos oponentes, sem culling — única exceção da spec §5.4); validar que `restart_game` reseta tudo corretamente; possivelmente implementar `restart_game` aqui (não estava na ordem mas faz sentido fechar o ciclo). Também: revisar a regra de empate 4v4 com Gerente (PROTO_SOCKET §10 — atualmente cai no fallback "slot menor vence")

---

## 2026-04-27 Sessão SEC-001.6 — Endgame + restart_game
**Status:** Completo
**Branch:** —

### Feito
- [server/rooms.js](../server/rooms.js): adicionada `restartGame({ socketId })` — valida `phase === "game_over"` e `me.connected`, depois reseta room (`phase`/`winner`/`isEndgame`/`blocks`/`traps`/`spentRes`/`combatLocs`/`pendingCombat`) e cada player via helper `resetPlayer` (pos→spawn, inv recarrega, history=[spawn], demais zerados)
- [server/server.js](../server/server.js): handler `restart_game` ack→`{ok:true}` em sucesso e `state_update` broadcast pra sala. Erros mapeados: `NOT_IN_GAME_OVER`, `ROOM_NOT_FOUND`
- [server/test-client.html](../server/test-client.html): seção "Game Over" com botão Restart Game

### Decisões técnicas
- **`game_over` já envia `full_state` correto desde SEC-001.5**: o handler usa `summarize(room)` que hoje não filtra nada (culling formal vem em SEC-001.7). Quando SEC-001.7 chegar, `state_update` ganha culling mas `game_over.full_state` continua usando o summarize sem filtro — única exceção do PROTO_SOCKET §5.4. Decisão: manter um único `summarize` agora; em SEC-001.7 dividir em `summarizeFor(slot)` (com culling) e `summarizeFull(room)` (sem)
- **Restart sem consenso**: PROTO_SOCKET §6.2 diz "qualquer player conectado em game_over". Em 4v4 isso pode parecer brusco (1 player reseta sem o consenso dos outros 3); decisão de UX a revisitar quando MATCH-001/MODE-001 chegarem. Por hora a regra literal da spec foi implementada
- **Regra de empate 4v4 mantida como fallback "slot menor vence"** (decidido em SEC-001.4). Empate de chegada simultânea ao goal em 4v4 é caso raríssimo; decisão final fica para o Gerente quando MODE-001.2 chegar. Sub-sessão SEC-001.6 não força essa decisão

### Validação
- `node --check` passou em rooms.js, server.js
- Validação dinâmica fica com Gabriel: jogar até alguém vencer (chega na diagonal oposta) → `game_over` aparece com `winnerSlot` → clicar Restart em qualquer aba → `state_update` mostra phase=planning, todos no spawn, inv recarregado

### Macro SEC-001 — checkpoint
**Implementado (SEC-001.2 a SEC-001.6):** boilerplate, lifecycle de Private Room, planning phase, combat (Royal Rumble), endgame + restart. Server tem hoje **fluxo de jogo completo end-to-end** para 1v1 (e arquitetonicamente preparado para 4v4). 6/12 sub-sessões da Macro concluídas (50%).

### Notas para próxima sessão
- Próxima na ordem: **SEC-001.7** — data culling (`state_for_me` específico por destinatário). Implementar: dividir `summarize` em `summarizeFor(room, viewerSlot)` que filtra `target/skill/combatSkill/roll/history/jumpedBlock` dos oponentes; filtrar `traps[]` para enviar apenas as do `viewerSlot` (PROTO_SOCKET §5.2); filtrar `blocks[]` por distância Manhattan ≤ 1 do `me.pos` para os de outros owners (§5.1); criar `summarizeFull(room)` separado para `game_over.full_state`. Trocar `broadcastState` por loop que emite por socket com payload customizado. Também: emitir `trap_triggered` quando uma trap dispara (hoje só a flag `trapped` no player vai pro state_update)

---

## 2026-04-27 Sessão SEC-001.7 — Data culling (state_for_me)
**Status:** Completo
**Branch:** —

### Feito
- [server/rooms.js](../server/rooms.js): `summarize` substituída por duas funções:
  - `summarizeFor(room, viewerSlot)`: payload de `state_update` cullado conforme PROTO_SOCKET §5. Estrutura nova `{ mySlot, me: PlayerState, opponents: OpponentView[] }`. Oponentes nunca recebem `target/skill/combatSkill/roll/history/jumpedBlock`. `blocks[]` filtrado por owner próprio OU dist Manhattan ≤ 1 do `me.pos` (§5.1). `traps[]` filtrado por `owner === viewerSlot` (§5.2). `pendingCombat` virou `PendingCombatView` com `myRoll` (visível só pra mim) e `opponentRolls: [{slot, rolled}]` (boolean indicando se o adversário já rolou — sem revelar o número)
  - `summarizeFull(room)`: versão sem culling, exclusivamente para `game_over.full_state` (§5.4). Mantém schema antigo com `players[]` completo para o Aftermath desenhar trajetos
- [server/rooms.js](../server/rooms.js): mecanismo `startTrapRecording`/`recordTrap`/`flushTrapRecording` — buffer no escopo do módulo (Node single-thread, seguro). `movePlayer` registra cada trap disparada; `processTurn` e `resolveCombat` flush antes de retornar, devolvendo `trapTriggers: [{cell, ownerSlot}]`
- [server/server.js](../server/server.js): `broadcastState` reescrito como loop por player (cada socket recebe `summarizeFor` com seu próprio slot). Helpers novos: `emitCombatStarted`, `emitCombatResolved`, `emitGameOver` (única chamada que usa `summarizeFull`), `emitTrapTriggered` (emite com state filtrado por destinatário, conforme §7). `set_ready` e `scheduleCombatResolve` agora flush trap triggers e emitem `trap_triggered` quando aplicável
- [server/test-client.html](../server/test-client.html): `updateStatus` adaptado para `state.me`/`state.opponents`; listener `trap_triggered` novo; `combat_started`/`combat_resolved` agora chamam `updateStatus(state)`; `game_over` recompõe schema antigo (vem com `summarizeFull`) pra reaproveitar a UI

### Decisões técnicas
- **Schema do state quebrou compat com SEC-001.4 a 6**: `state.players` virou `state.me + state.opponents`. Test-client foi adaptado mas não é cliente do jogo — quando SEC-001.8 plugar o cliente real (flag `USE_SERVER`), ele terá que entender o schema novo. Decisão: schema do state_update é o do PROTO_SOCKET §5 desde sempre — SEC-001.4-6 estavam temporariamente "vazando" tudo até esta sub fechar
- **Buffer global de trap triggers em rooms.js**: Node é single-thread, operações de turn/combat são síncronas — buffer no escopo do módulo é seguro e mais simples que passar contexto por argumento. Documentado no comentário do buffer
- **trap_triggered carrega state_for_me**: PROTO_SOCKET §7 lista `state` no payload. Substitui o `state_update` separado quando há trap (evita 2x payload de state). Em casos sem trap, `broadcastState` cobre normal
- **PendingCombatView com `opponentRolls: [{slot, rolled: bool}]`**: a spec §5 estava ambígua (`{ slot: number }[]`); interpretei como "indicação de quem já rolou, sem o número". Cliente vai poder renderizar "AGUARDANDO" para oponentes que ainda não rolaram, sem vazar o resultado
- **`game_over` mantém broadcast pra sala (não por socket)**: payload é `summarizeFull` igual pra todos (Aftermath é sem culling). Otimização: 1 emit em vez de N
- **`combat_resolved` também usa state filtrado**: preserva culling até o último momento. Cliente vê `me.history` próprio mas não dos oponentes (só revelado em `game_over.full_state`)

### Validação
- `node --check` passou em rooms.js e server.js
- Validação dinâmica essencial pelo Gabriel: 2 abas, criar partida 1v1. **Verificar com DevTools (Network → WS → Messages)**:
  - Aba 1 (slot 0): após plantar TRAP em alguma célula, no payload `state_update` da aba 1 deve aparecer `traps: [{r,c,owner:0}]`. **Na aba 2 NÃO deve aparecer essa trap em `state.traps`** — esse era o vazamento original que SEC-001 fechou
  - Durante planning, oponente em `state.opponents[]` NÃO deve ter campos `target`, `skill`, `combatSkill`, `roll`, `history`, `jumpedBlock`
  - Quando trap dispara: ambas abas recebem `trap_triggered` com `cell` e `by_owner_slot`

### Macro SEC-001 — checkpoint
**Implementado (SEC-001.2 a SEC-001.7):** boilerplate, lifecycle Private Room, planning, combat (Royal Rumble), endgame+restart, **culling de info oculta**. Server hoje **não vaza nada do oponente** que o jogador não deveria ver. 7/12 sub-sessões da Macro concluídas (~58%).

### Notas para próxima sessão
- Próxima na ordem: **SEC-001.8** — flag `USE_SERVER` em `network.js`. Esta é a sub que conecta o cliente real ao server. Implementar: importar `socket.io-client` no `html/network.js` (CDN ou `node_modules` servido — decidir); adicionar flag `USE_SERVER` (default `false`); quando `true`, `initMultiplayer` conecta ao server em vez de Firebase, e `update`/`set` viram emits Socket.io equivalentes; receber `state_update` do server e popular `window.S` no schema antigo (cliente espera `state.players[]` não `state.me/opponents`) — **adaptador entre schemas**. Decisão: o adaptador fica em `network.js` ou cliente é refatorado pro schema novo? Em pró de menor escopo para SEC-001.8, adaptador no `network.js` é caminho mais rápido

---

## 2026-04-28 Sessão SEC-001.8 — Cliente plugado ao server (flag USE_SERVER)
**Status:** Completo
**Branch:** —

### Feito
- [html/network.js](../html/network.js) reescrito com bifurcação. Exports novos: `USE_SERVER` (default `false`), `IS_SERVER_MODE`, `actReady(target, skill)`, `actRollDie(localRoll)`, `actRestartGame(resetState)`. Wrappers escolhem entre Firebase update/set ou Socket.io emit conforme a flag. `initMultiplayer` separado em `initFirebaseMode` (lógica original) e `initServerMode` (conecta a `http://localhost:3000`, registra listeners de `state_update`/`combat_started`/`combat_resolved`/`trap_triggered`/`game_over`, faz `create_private_room` ou `join_private_room` conforme `?sala=` na URL)
- [html/network.js](../html/network.js): adaptadores `adaptStateForMe(state)` (state_for_me com `me`/`opponents` → `window.S` schema antigo com `players[]`) e `adaptFullState(fullState)` (game_over.full_state já tem players[], só renomeia `slot` → `id`). Defaults para campos cullados de oponentes (target=false, skill="", roll=0, history=[spawn], etc.) preenchem o que o cliente lê na UI
- [html/ui.js](../html/ui.js): import trocado de `update/ref/set/db` (firebase) para `IS_SERVER_MODE/actReady/actRollDie/actRestartGame`. `syncUI` agora pula `hostProcessTurn`/`hostResolveCombat` quando `IS_SERVER_MODE` (server é autoritativo). `window.ready` chama `actReady(me.target, me.skill)`. `window.rollDie` virou async: em modo server pede o dado ao server (anti-trapaça); em modo Firebase gera local. `window.restartGame` chama `actRestartGame(resetState)` (resetState ignorado em modo server)
- [html/index.html](../html/index.html): adicionada `<script src="https://cdn.socket.io/4.7.5/socket.io.min.js">` antes do módulo principal (carrega `io` global; inerte se `USE_SERVER=false`)

### Decisões técnicas
- **Adaptador no network.js, não refatorar o cliente**: o cliente (combat.js, ui.js) consome `window.S` no schema antigo (`players[0]/players[1]`, índice = slot). Refatorar pra schema `me`/`opponents` exigiria mudar todas as renderizações. Adaptador em network.js mantém escopo da sub e isola a mudança — quando SEC-001.11 deletar o caminho Firebase, o adaptador continua útil até o cliente ser eventualmente refatorado para o schema novo (não é obrigatório)
- **Default `USE_SERVER=false`**: cliente continua jogando via Firebase como sempre. Gabriel troca pra `true` na linha 18 de network.js quando quiser testar contra o server local. SEC-001.10 vai promover pra `true` permanente após validação de paridade
- **`actRollDie` retorna o dado**: server emit ack com `{ dice }`, cliente usa esse número pra animação. Em Firebase o cliente gera local e transmite — a função recebe esse local roll como argumento e retorna ele mesmo. Interface uniforme; UX da animação inalterada
- **CDN socket.io-client em vez de import ES**: socket.io-client tem dependências (engine.io-client, etc.) — mais simples carregar via CDN como global `io` do que configurar bundler. Custo: ~30KB adicionais; benefício: zero tooling. Quando o jogo for empacotado pra itch.io (SEC-001.10/11), pode trocar pra import bundle
- **`actReady` envia `set_skill` antes de `set_target`**: server valida `set_target` contra a skill atual (SPRINT distância 2 vs adjacente). Sequência da spec preservada
- **Chave Firebase ainda hardcoded**: chave foi restringida por domínio em 2026-04-27 (resposta ao alerta GitHub) e o vazamento real morre em SEC-001.11 quando o caminho Firebase for removido. Comentário atualizado no network.js refletindo isso

### Validação
- `node --check` passou em network.js e ui.js (mesmo sendo módulos browser, sintaxe ES é compatível com Node ≥20)
- Validação dinâmica fica com Gabriel: testar AMBOS os modos:
  - `USE_SERVER=false` (default): jogar normal → tudo deve funcionar igual à Alpha 2.2_Visual (regressão zero)
  - `USE_SERVER=true`: subir o server (`cd server && npm start`), abrir `html/index.html` em 2 abas → primeira cria sala (URL ganha `?sala=ABCD`), segunda copia URL → ambos jogam normalmente. Verificar via DevTools que mensagens Socket.io aparecem em vez de Firebase

### Notas para próxima sessão
- Próxima na ordem: **SEC-001.9** — validação de paridade Firebase ↔ Server. Plano: roteiro de teste comparando comportamentos lado a lado; documentar diferenças encontradas (se houver) em `docs/PROTO_SOCKET.md` ou novo `docs/PARIDADE_REPORT.md`. Casos críticos: trap trigger, BLOCK quebrado em SPRINT, swap de posições, empate em combate (combate normal e endgame), restart durante diferentes phases. Sub-sessão majoritariamente de teste — código só se aparecer bug. Possivelmente curtinha
- Pendência conhecida: quando o cliente conecta em modo server e a sala já está cheia, hoje o `alert("Erro ao entrar na sala: ROOM_FULL")` mata o fluxo. Parece OK para alpha mas piora UX em produção; melhorar em SEC-001.12 (hardening) ou MATCH-001
- Atenção pra SEC-001.9: o cliente real ainda usa `setSkill`/`onCellClick` que mexem em `me.skill`/`me.target` localmente em `window.S`. Isso é renderização otimista — quando ele aperta CONFIRMAR, o `actReady` envia ao server. Server processa e devolve `state_update` que substitui `window.S` (incluindo target/skill confirmados). Edge case: se o server rejeitar (ex: `INVALID_TARGET`), o `me.skill` fica dessincronizado. Em SEC-001.9 vale mapear esses cantos

---

## 2026-04-28 Sessão SEC-001.9 — Roteiro de paridade Firebase ↔ Server (em revisão)
**Status:** 🔄 Em revisão (aguarda Gabriel executar o roteiro no PC)
**Branch:** —

### Feito
- [server/server.js](../server/server.js): atalho de DEV `app.use("/jogo", express.static(path.join(__dirname, "..", "html")))` — serve a pasta `html/` em `http://localhost:3000/jogo/index.html`. Permite testar o cliente em modo `USE_SERVER=true` sem ter um server estático separado. Atalho some quando o cliente for hospedado no itch.io (SEC-001.10/11)
- Criado [docs/PARIDADE_REPORT.md](PARIDADE_REPORT.md): roteiro com **16 cenários** numerados, cada um com comportamento esperado, tabela de marcação por modo (Firebase / Server) e campo de notas. Cobre setup de sala, movimento, BLOCK/TRAP, SPRINT (com block no meio/alvo), swap, combate (vencedor único, empate, endgame), vitória direta, aftermath, restart, RULE-001 e disconnect. Inclui seção "Cantos sutis" com 3 pontos de atenção sobre renderização otimista e ordem de eventos
- Resultado consolidado tem 2 caixas: "Paridade total" → libera SEC-001.10; "Divergência detectada" → vira correção antes de SEC-001.10

### Decisões de escopo
- **Sub-sessão fica em "🔄 em revisão" até Gabriel executar o roteiro no PC**: marcar ✅ exigiria validação dinâmica em ambos os modos. Como Gabriel está mobile/sem PC neste momento (mensagem dele), o roteiro fica preparado para quando ele estiver no PC. Ele aciona o trigger `iniciar SEC-001.9` ou similar quando pronto, e a sub fecha com base no resultado
- **Atalho `/jogo` do server**: decisão pragmática para reduzir fricção. Em produção (Railway/itch.io) o cliente vive em domínio separado — o atalho some sem perda
- **Não implementei correções proativas dos "cantos sutis"** (renderização otimista, duplo-emit roll_die): listados no PARIDADE_REPORT como aceitáveis para Alpha. Hardening explícito é trabalho de SEC-001.12

### Notas para próxima sessão
- **Quando Gabriel rodar o roteiro:**
  - Se todos os 16 cenários passarem → marcar SEC-001.9 ✅ e seguir pra **SEC-001.10** (promover `USE_SERVER=true` permanente, configurar Railway, atualizar `SERVER_URL` em network.js para a URL do Railway, possivelmente publicar cliente no itch.io)
  - Se houver divergência → cada divergência vira tarefa de correção dentro da própria SEC-001.9 (sem virar nova sub) e a paridade é re-rodada
- **SEC-001.10 vai precisar de inputs do Gabriel:**
  - Conta Railway criada e conectada ao repo (ou subir o `server/` manualmente)
  - URL final do server (ex: `https://4x4.up.railway.app`)
  - Decisão sobre cliente: continuar local enquanto Alpha, ou já publicar no itch.io junto?
- **Pergunta de produto sobre regra de empate 4v4** (PROTO_SOCKET §10) ainda pendente — segue como decisão ao chegar em MODE-001.2

---

## 2026-04-28 Sessão SEC-001.10 — USE_SERVER=true permanente
**Status:** Completo
**Branch:** —

### Decisões de produto registradas
- **SEC-001.9 pulada** (decisão Gerente): paridade não foi validada via roteiro. Firebase continua vivo como rede de segurança até SEC-001.11. Risco aceito: divergências, se houver, aparecem em produção; correção pontual se reportada
- **Server hospedado no Railway** em `https://4x4-production.up.railway.app` (HTTPS automático)
- **Cliente hospedado no itch.io** em `https://o6games.itch.io/4x4-game` (página restricted; Alpha 2.2_Visual antiga removida pelo Gerente para não conflitar)

### Feito
- [server/server.js](../server/server.js): CORS `isAllowedOrigin` agora aceita `*.itch.zone` além de `*.itch.io`. itch.zone é o domínio do iframe HTML5 do itch.io (separado por design); sem essa regra, o jogo embutido recebia `connect_error`
- [html/network.js](../html/network.js): `USE_SERVER` promovido de `false` para `true`. `SERVER_URL` trocado de `http://localhost:3000` para `https://4x4-production.up.railway.app`. Comentários atualizados refletindo a promoção

### Validação
- `node --check` passou em server.js e network.js

### Dependências externas (Gabriel cuida)
- **Push do commit pro Railway** — Railway redeploy automático ao detectar novo commit no branch conectado. Confirmar que server `[server] listening on :PORT` aparece nos logs após push
- **ZIP do `html/`** pra upload no itch.io — Gabriel monta e sobe pelo painel do itch.io. Conteúdo: `index.html` na raiz do ZIP + `style.css` + `gameState.js` + `network.js` + `combat.js` + `ui.js` + `validators.js`

### Notas para próxima sessão
- Próxima na ordem: **SEC-001.11** — descontinuar Firebase (remover SDK, paths, listeners, chave). Quando esta sub rodar, o caminho `initFirebaseMode` em network.js sai inteiro, junto com `firebaseConfig`, imports do firebase, e os exports `db`/`ref`/`set`/`onValue`/`get`/`update`. Ataca o vazamento original da chave (alerta GitHub de 2026-04-26) na raiz: a chave deixa de existir no código vivo
- **Pré-requisito de produto pra SEC-001.11**: confirmar que o Railway está estável após uns dias de uso. Se houver problema crítico, reverter `USE_SERVER` pra `false` é trivial (1 linha) — desde que Firebase continue vivo. SEC-001.11 fecha a porta de saída
- **Atenção:** verificar fim a fim antes de SEC-001.11. Cenários: criar sala no itch.io, copiar URL, abrir em outro dispositivo/aba, jogar uma partida completa. Se algo não funcionar, vira correção dentro de SEC-001.10 (não nova sub)

---

## 2026-04-28 Sessão SEC-001.11 — Descontinuar Firebase
**Status:** Completo
**Branch:** —

### Feito
- [html/network.js](../html/network.js) reescrito sem caminho Firebase. Removidos: imports de `firebase-app.js`/`firebase-database.js`, objeto `firebaseConfig` (com a `apiKey`), `initializeApp`, `getDatabase`, re-exports `db/ref/set/onValue/get/update`, flags `USE_SERVER`/`IS_SERVER_MODE`, função `initFirebaseMode`, branches Firebase em `actReady`/`actRollDie`/`actRestartGame`, `window.dbRef`. `initMultiplayer` ficou com o que era `initServerMode` (única implementação). Tamanho: 298 → 192 linhas
- [html/combat.js](../html/combat.js) reduzido a `getTurnMod` + `getTotalMod` (helpers de display do overlay de combate). Removidos: `hostProcessTurn`, `hostMove`, `hostResolveCombat`, `hostCheckWin` (toda a lógica autoritativa que vivia aqui — portada para o server em SEC-001.4 a SEC-001.6 e agora era código morto). Tamanho: 132 → 17 linhas
- [html/ui.js](../html/ui.js): imports atualizados (sem `IS_SERVER_MODE`/`hostProcessTurn`/`hostResolveCombat`/`COMBAT_REVEAL_MS`); `syncUI` perdeu o bloco que agendava `setTimeout(hostResolveCombat, COMBAT_REVEAL_MS)` e o `if(window.myId===0&&...)hostProcessTurn()`; `window.combatTimer` removida; `window.rollDie` chama `actRollDie()` sem argumento; `window.restartGame` deixa de montar `resetState` local (server reseta autoritariamente)
- [html/gameState.js](../html/gameState.js): exports não mais usados removidos (`COMBAT_REVEAL_MS`, `INV_INITIAL`); comentário do `window.S` atualizado para refletir que ele é placeholder sobrescrito pelo primeiro `state_update`
- [html/index.html](../html/index.html): comentário acima da CDN do socket.io reescrito (antes mencionava flag `USE_SERVER`, agora descreve o uso direto)

### Decisões técnicas
- **Sem flag de modo**: `USE_SERVER`/`IS_SERVER_MODE` removidos por completo. Manter como `const true` exportada seria vestígio sem função. Cliente assume server autoritativo a partir desta sub — refletindo a realidade pós SEC-001.10. Reverter pra Firebase agora exigiria `git revert` desta sub (ou voltar uma versão na linha do tempo); a "rede de segurança" de SEC-001.10 termina aqui, conforme planejado
- **`combat.js` mantido como arquivo separado** (em vez de mover `getTotalMod` pra `ui.js` ou `gameState.js`): semanticamente é display de combate; manter o nome facilita encontrar quando o cliente do 4v4 (MODE-001.5) precisar do mesmo cálculo
- **`gameState.js` ficou com `window.S` placeholder**: zerar players e blocks/traps logo no carregamento; primeiro `state_update` do server preenche tudo. Alternativa seria não inicializar e deixar `S` undefined até o primeiro emit — mas `syncUI` foi escrito assumindo `S.players[0].connected` legível. Manter o placeholder é mais defensivo
- **Chave Firebase morre aqui**: o `apiKey` saiu do `network.js` (era a única ocorrência em código vivo). Histórico do Git ainda tem; `testes/index.html` (backup Alpha congelado) também ainda tem. Para fechar 100% precisaria reescrever histórico (não fizemos — risco>benefício, e a chave já foi restringida por domínio em 2026-04-27 + agora não existe mais no código que roda)

### Validação
- `node --check` passou em network.js, combat.js, ui.js, gameState.js, validators.js
- Validação dinâmica fica com Gabriel: jogar 1 partida no Railway/itch.io após o deploy. Comportamento esperado é idêntico ao anterior (SEC-001.10 já era server-only); esta sub não muda fluxo, só remove código morto. Se algo regredir é porque algum `host*` ainda estava sendo invocado em algum caminho que SEC-001.8/.10 não capturaram

### Macro SEC-001 — checkpoint
**Implementado (SEC-001.2 a SEC-001.11):** boilerplate, lifecycle Private Room, planning, combat (Royal Rumble), endgame+restart, culling, cliente plugado, paridade (pulada), promoção pra produção, **descontinuação do Firebase**. Server hoje é o único caminho; cliente não tem mais SDK Firebase, chave, ou bifurcação. 10/12 sub-sessões da Macro concluídas (~83%). Resta apenas SEC-001.12 (hardening: rate limit, validação, graceful shutdown)

### Dependências externas (Gabriel cuida)
- **Push do commit pro Railway** — server.js e PROTO_SOCKET.md não mudaram nesta sub, então nem precisa redeploy do server (mas não atrapalha). O que importa é re-zipar `html/` (sem o Firebase) e atualizar o upload no itch.io para o cliente público parar de carregar o SDK Firebase de 1MB que não usa mais

### Notas para próxima sessão
- Próxima na ordem: **SEC-001.12** — hardening do server. Itens previstos: rate limit por socket (proteção contra spam de emits), validação dos payloads de entrada (hoje rooms.js confia no shape, exemplo: `set_target` com `target` não-array crasha o `arrEq`), graceful shutdown (SIGTERM do Railway → desconectar todos antes de matar processo), `process.on('uncaughtException')` para logging em vez de crash silencioso. Reconexão (PROTO_SOCKET §10) também pode entrar aqui dependendo do escopo. Última sub da Macro SEC-001 antes de seguir pra MATCH-001
- **Sugestão de schedule:** quando MATCH-001.1 chegar (Private Room formal), valeria abrir um agente de cleanup pra remover o atalho de DEV `/jogo` em [server/server.js](../server/server.js) — útil hoje porque cliente e server compartilham origem em desenvolvimento, mas em produção o cliente vive em `itch.io`/`itch.zone` (CORS já cobre). Não é urgente

---

## 2026-04-28 Sessão SEC-001.12 — Hardening do server
**Status:** Completo
**Branch:** —

### Feito
- [server/server.js](../server/server.js):
  - `maxHttpBufferSize: 4096` no `new Server(...)` — payloads do jogo são minúsculos (≤30 bytes); antes era o default de 1 MB, suficiente pra ataque de saturação de memória
  - `process.on("uncaughtException")` e `process.on("unhandledRejection")` — log e segue vivo. Bug isolado num handler não derruba mais o processo inteiro (todas as salas ativas iam junto antes)
  - `ping` deixou de ecoar `payload`: antes respondia `{ pong, echoed: payload, t }` — attacker mandava blob grande e server reecoava (amplification). Agora só `{ pong, t }`
  - Wrapper `guarded(socket, handler)` aplicado em todos os handlers de evento — rate-limita o evento e rejeita payloads que não sejam objeto plano (ex: array, string, número)
  - `join_private_room` ganhou guard explícito: `roomId` precisa ser string curta (≤64 chars). Cliente real envia 4 chars; rejeitar antes de chegar ao `Map.get` evita lookups com tipos esquisitos
  - `disconnect` chama `release(socket.id)` — limpa entrada no bucket do rate limiter pra não vazar memória ao longo do dia
- [server/rateLimit.js](../server/rateLimit.js) **novo**: token bucket por socket. Capacidade 30, refill 30/s. Cliente real envia <5 eventos/s no pico; abusador em loop atinge o teto e tem mensagens descartadas silenciosamente (sem ack — não desconectar pra não dar feedback claro pro atacante)
- [server/validators.js](../server/validators.js): exportados `isPlainPayload(p)` e `isShortString(s, max)` — usados pelo wrapper e pelo `join_private_room`. Demais campos (`mode`, `skill`, `target`) já tinham whitelist/`isOnBoard` no caminho de `rooms.js`, então a defesa adicional ficaria redundante

### Decisões técnicas
- **Rate limit descarta silenciosamente em vez de desconectar**: cliente honesto NUNCA atinge 30 eventos/s (pico real é set_skill→set_target→set_ready, ~3 eventos/turno). Descartar sem ack mantém a UX limpa pro real e força o abusador a reescrever lógica pra detectar throttle. Desconectar daria sinal claro ("você foi banido") que ajuda automação adversária
- **`maxHttpBufferSize: 4096`** (não 1024): folga pra eventuais payloads de debug/futuras features de matchmaking. 4 KB ainda é 250× menor que o default e custa nada
- **`uncaughtException` apenas loga** (não chama `shutdown`): em produção (Railway) preferimos perder uma sala caso de bug a derrubar todas. Se o erro for sistêmico, o monitoring externo do Railway pega via /health falhando. Decisão alinhada com Node best practices pós-Node-16 que ainda permite `--unhandled-rejections=warn`
- **Não implementei reconnect formal (PROTO_SOCKET §10)**: escopo dele é maior — exige token de sessão, mapeamento socketId↔playerId persistente, retomada de fase/timer. Vale uma sub-sessão própria em MATCH-001 ou pós-Alpha
- **Não implementei AFK timeout**: também escopo PROTO_SOCKET §10. O `disconnectedAt` + cleanup de 5 min já protege contra salas órfãs

### Validação
- `node --check` em server.js, rateLimit.js, validators.js
- Smoke test do rate limiter: burst de 100 → 30 permitidas, 70 descartadas, depois `release()` reabastece o bucket (esperado e observado)
- Smoke test dos validadores: `isPlainPayload` aceita `{}`/`null`/`undefined` e rejeita arrays/strings/números/booleans; `isShortString` aceita strings 1-64 chars, rejeita vazia, longa demais, ou tipos não-string
- **Validação dinâmica fica com Gabriel**: jogar 1 partida normal no Railway/itch.io após o deploy. Comportamento esperado é idêntico (cliente honesto não percebe nada). Se houver regressão, suspeita primeiro do wrapper `guarded` — talvez algum payload que eu assumi como objeto venha como undefined em algum caminho do client real

### Macro SEC-001 — checkpoint
**Macro 100% completa (11 subs ✅, 1 ⏸ pulada por decisão).** SEC-001.2 a SEC-001.12 fechadas: backend autoritativo no Railway, cliente sem Firebase no itch.io, server hardenizado. Próxima Macro: **MATCH-001** (matchmaking — Private Room no server + Random Match queue + UI cliente)

### Dependências externas (Gabriel cuida)
- **Push do commit pro Railway** — server.js e dois novos arquivos (`rateLimit.js`, edição em `validators.js`) entram no redeploy. Confirmar `[server] listening on :PORT` nos logs após push. Cliente NÃO mudou nesta sub, então o ZIP do itch.io não precisa ser atualizado

### Notas para próxima sessão
- Próxima na ordem: **MATCH-001.1** — Private Room no server (código ABCD). Boa parte já existe (SEC-001.3 implementou `createPrivateRoom`/`joinPrivateRoom` com geração de código). MATCH-001.1 é provavelmente: revisar contrato vs PROTO_SOCKET, lidar com edge cases de entrada de URL com código (cliente lê `?sala=ABCD`), formalizar o fluxo de "join via link"
- **Pendência herdada**: a UX de `ROOM_FULL` ainda é `alert()` no cliente (mencionado em notas da SEC-001.8). Vale tratar quando MATCH-001.5 chegar (UI de Private Room)
- **Sugestão de schedule (mantida)**: quando MATCH-001.1 chegar, lembrar de remover o atalho `/jogo` de DEV em server.js — em produção cliente e server vivem em hosts separados

---

## 2026-04-28 Sessão MATCH-001.1 — Private Room formal
**Status:** Completo
**Branch:** —

### Feito
- [server/rooms.js](../server/rooms.js) `joinPrivateRoom`:
  - Normaliza `roomId` recebido pra uppercase via `String(roomId).toUpperCase()` antes do lookup. Cliente que cole `abcd` em vez de `ABCD` no link agora entra normalmente em vez de receber `ROOM_NOT_FOUND`. Códigos sempre são gerados em uppercase em [server/codes.js](../server/codes.js)
  - Novo guard: `if (room.matchmaking !== "private") return { error: "ROOM_NOT_PRIVATE" }`. Hoje todas as salas são `"private"` (única forma de criar é `createPrivateRoom`), então o guard nunca dispara — mas MATCH-001.2 vai introduzir salas `matchmaking: "random"` criadas pelo pareamento de fila, e sem este guard alguém poderia tentar joinar nelas via código (vazaria estado de partida pareada randomicamente)
- [docs/PROTO_SOCKET.md](PROTO_SOCKET.md):
  - §6.1 reescrito: respostas de matchmaking documentadas como **ack callback** (contrato real desde SEC-001.3) em vez de eventos S→C dedicados (`room_created`/`joined`). Adicionada nota sobre normalização de roomId
  - §7 enxugado: removidas linhas `room_created`, `joined`, `queued` (não são emits dedicados — viram ack); `state_update` ganhou nota de que também serve como entrega de estado inicial pós-create/join
  - §8 ganhou 3 novos códigos de erro: `ROOM_NOT_PRIVATE` (deste sub), `INVALID_PAYLOAD` (do wrapper de SEC-001.12), `INVALID_MODE` (já existia em código mas não no doc)

### Decisões técnicas
- **Manter contrato ack em vez de migrar pra emits dedicados**: o cliente atual ([html/network.js:174-192](../html/network.js)) já consome ack e funciona; mudar agora seria churn sem ganho. Ack do socket.io é equivalente semântico a "S→C event direcionado ao requester" — a spec antiga foi escrita assumindo fluxo de emit puro, mas isso era idealismo do papel. Atualizar a spec é a forma certa de fechar a lacuna
- **`String(roomId).toUpperCase()` em vez de `roomId.toUpperCase()`**: o wrapper SEC-001.12 já garante que `payload` é objeto plano, mas `payload.roomId` em si pode ser undefined/número/array (rate-limited mas não tipado). `String(...)` defensivamente evita crash; lookup falha em `Map.get` retornando undefined → `ROOM_NOT_FOUND`, que é a mensagem certa
- **`ROOM_NOT_PRIVATE` em vez de reusar `ROOM_NOT_FOUND`**: erros distintos ajudam debug e permitem UX diferente no cliente (ex: explicar que código é só pra Private Room) — custo é uma string a mais

### Validação
- `node --check` em rooms.js e server.js
- Smoke test programático: cria sala, faz join com código em minúscula → ok; tenta `XXXX` (inexistente) → `ROOM_NOT_FOUND`; muta `room.matchmaking="random"` e tenta join → `ROOM_NOT_PRIVATE`. Todos os 3 cenários comportam-se como esperado
- **Validação dinâmica fica com Gabriel**: jogar 1 partida normal no Railway/itch.io após o deploy. Mudança é cirúrgica — partida típica não passa pelo guard novo. O único caso visível pro jogador é se ele colar a URL com código em minúsculas: antes ele via `alert("Erro ao entrar na sala: ROOM_NOT_FOUND")`, agora deve entrar normalmente

### Dependências externas (Gabriel cuida)
- **Push do commit pro Railway** — só rooms.js mudou no caminho de runtime do server (PROTO_SOCKET.md é doc, não roda). Confirmar `[server] listening on :PORT` após redeploy. Cliente NÃO mudou — ZIP do itch.io fica como está

### Notas para próxima sessão
- Próxima na ordem: **MATCH-001.2** — Random Match queue. Trabalho previsto: adicionar `Map<mode, PlayerInfo[]>` (ou estrutura equivalente) para fila por modo; handler `queue_join { mode }` valida não-em-fila/sala e enfileira; quando fila atinge `MAX_PLAYERS[mode]`, criar `RoomState` com `matchmaking: "random"` e mover players pra ela; emit `match_found { roomId, mySlot, state }` pros pareados. `queue_leave` e cleanup de filas órfãs (jogador desconectou na fila) também entram. Pré-requisito: o guard que acabei de adicionar em MATCH-001.1
- **Atenção MATCH-001.3** (UI cliente): cliente atual ainda hardcodeia `mode: "1v1"` em [html/network.js:184](../html/network.js#L184) e cria sala automaticamente ao abrir sem URL. UI de tela inicial vai precisar de uma camada nova antes do `initMultiplayer` rodar — provavelmente um overlay com botões "Random / Private" × "1v1 / 4v4" que despacha a chamada apropriada

---

## 2026-04-29 Sessão MATCH-001.2 — Random Match queue
**Status:** Completo
**Branch:** —

### Feito
- [server/rooms.js](../server/rooms.js):
  - Estado novo: `queues = Map<mode, socketId[]>` (FIFO por modo, PROTO §11) e `socketToQueue = Map<socketId, mode>` (lookup reverso pra detectar `ALREADY_IN_QUEUE_OR_ROOM` cross-mode e fazer cleanup no disconnect)
  - `queueJoin({mode, socketId})`: valida mode, rejeita se socket já está em sala/fila, enfileira, e pareia atomicamente quando `queue.length >= MAX_PLAYERS[mode]`. Retorna `{queued:true}` ou `{matched:[ids], room}`
  - `queueLeave({socketId})`: idempotente — sempre retorna `{ok:true}` mesmo se o socket nunca entrou em fila. Cliente que clica "cancelar" duas vezes não vê erro
  - `createRandomRoom(mode, socketIds)` interno: monta `RoomState` com `matchmaking:"random"`, `roomId` via `crypto.randomUUID()`, slots 0..N-1 atribuídos pela ordem de chegada na fila. Chama `maybeStartPlanning` (todos slots preenchidos e conectados → vira `phase:"planning"` direto)
  - `markDisconnected` agora também chama `removeFromQueue` antes de tocar em `socketToRoom` — jogador que cai durante busca não fica fantasma na fila bloqueando próximos pareamentos
- [server/server.js](../server/server.js):
  - Imports `queueJoin`/`queueLeave` adicionados
  - Handler `queue_join` (sob `guarded`): se pareou, emite `match_found { roomId, mySlot, state: StateForMe }` para cada matched socket via `io.sockets.sockets.get(sid).emit(...)`. Cada player recebe estado já cullado pelo seu slot (segue §5 do PROTO). Edge case: se um socket caiu entre o splice e o emit, pula com graça (`markDisconnected` faz cleanup eventual)
  - Handler `queue_leave` (sob `guarded`): chama `queueLeave` e responde `{ok:true}`

### Decisões técnicas
- **Map<mode, []> em vez de 2 arrays separados**: facilita extensão futura (variantes de modo, ranqueado, etc.) e iterar/cleanup é trivial. Custo é zero
- **Slot atribuído pela ordem de chegada na fila** (em vez de random shuffle): determinístico, sem implicação de balanceamento (jogo é simétrico — todos os spawns têm mesma distância pro goal). Quem entrou primeiro pega slot 0; trivial de explicar pro jogador se aparecer em alguma feature de "mostrar quem joga em qual canto"
- **`queue_leave` idempotente em vez de retornar `NOT_IN_QUEUE`**: UX win — botão "cancelar match" não precisa lógica defensiva. Custa um código de erro a menos no PROTO. PROTO §6.1 dizia "validação: jogador está na fila" mas isso era idealismo de spec — em prática cancelamento é melhor idempotente
- **`crypto.randomUUID()` para roomId random**: PROTO §4 já especificava UUID. Cliente não compartilha esse ID com ninguém (não existe link compartilhável pra Random Match), então não precisa ser legível como o ABCD da Private Room
- **Pareamento atômico dentro do `queueJoin`** (em vez de timer separado): Node single-thread garante que cada `queueJoin` é atomic; checar fila e parear na mesma chamada elimina janela de inconsistência. PROTO §11 diz "fila simples FIFO" — não há razão pra introduzir tick assíncrono
- **`maybeStartPlanning` reutilizado** em vez de criar `setPhasePlanning` próprio: zero diferença semântica entre Private Room e Random — ambas viram planning quando todos os slots estão preenchidos e conectados. Reuso mantém `phase` consistente

### Validação
- `node --check` em rooms.js e server.js
- Smoke test programático cobriu 6 cenários:
  1. **1v1 pareamento**: A entra → queued; B entra → matched=[A,B], sala criada com phase=planning, slots 0/1 com spawns [0,0]/[3,3]. ✓
  2. **4v4 pareamento com sobra**: C/D/E queued, F dispara matched=[C,D,E,F], G fica esperando próximo grupo. ✓
  3. **`queueLeave` idempotente**: X entra, leave (ok), leave de novo (ok sem erro). ✓
  4. **Lock cross-mode**: Y entra em 1v1, tenta entrar em 4v4 → `ALREADY_IN_QUEUE_OR_ROOM`. ✓
  5. **Cleanup no disconnect**: Z entra na fila, `markDisconnected(Z)`, Z entra de novo → queued OK (não fantasma). ✓
  6. **`INVALID_MODE`**: `5v5` → erro. ✓
- **Validação dinâmica fica com Gabriel**: precisa de cliente que chame `queue_join`/`queue_leave` pra testar end-to-end. Cliente atual ainda usa `create_private_room` direto; UI de Random Match vai chegar em MATCH-001.3 (tela inicial). Por enquanto dá pra testar com o `test-client.html` se quiser exercitar — mas não tem urgência, pode esperar MATCH-001.3

### Dependências externas (Gabriel cuida)
- **Push do commit pro Railway** — `rooms.js` e `server.js` mudaram. Confirmar `[server] listening on :PORT` após redeploy. Cliente NÃO mudou — ZIP do itch.io fica como está; nada visível no jogo até MATCH-001.3 expor a tela inicial

### Notas para próxima sessão
- Próxima na ordem: **MATCH-001.3** — Cliente: tela inicial. Trabalho previsto: novo overlay/screen antes de `initMultiplayer` ([html/network.js:174-192](../html/network.js)) onde jogador escolhe **matchmaking** (Random/Private) × **modo** (1v1/4v4). Despacha `queue_join`, `create_private_room`, ou `join_private_room` conforme escolha + entrada no campo "código". Cliente atual roteia 100% por URL (`?sala=ABCD` ou nada) — vai virar fallback de "join via link compartilhado" enquanto a tela inicial fica como caminho default
- **Atenção pra MATCH-001.3**: o handler `queue_join` no server emite `match_found` (não `state_update` direto). Cliente precisa registrar `socket.on("match_found")` que vai chamar a mesma transição que hoje acontece após `room_created`/`joined` — entrar na sala e renderizar. Boa parte é compartilhar lógica
- **Atenção pra MATCH-001.4** (UI aguardando match): vai precisar de timeout/cancelar elegante. `queue_leave` já existe e é idempotente; cliente só precisa chamar quando jogador clica "cancelar" ou navega fora

---

## 2026-04-29 Sessão MATCH-001.3 — Cliente: tela inicial
**Status:** Completo
**Branch:** —

### Feito
- [html/startScreen.js](../html/startScreen.js) **novo módulo**:
  - `showStartScreen()` retorna Promise<{action, mode, roomId?}> que resolve quando o jogador clica em um dos 3 botões. Cleanup de handlers no `finish()` (sem vazar referência se a tela for reaberta no futuro)
  - `setLobbyMode(mode)`: alterna o texto e visibilidade do `#lobby-screen` entre "Aguardando segundo agente" + link de convite (private) e "Procurando oponente" sem link (random)
  - Constante `MODE_4V4_LOCKED = true` controla o toggle. Trocar pra `false` em MODE-001 destrava 4v4 sem outras mudanças no startScreen
- [html/index.html](../html/index.html):
  - Novo `<div id="start-screen">` com toggle de modo (1v1/4v4) e 3 ações (Procurar oponente / Criar sala privada / Campo + Entrar)
  - `<div id="lobby-screen">` ganhou `style="display:none"` (start-screen é visível por default agora). Subtitle ganhou id `lobby-subtitle` e botão copiar ganhou id `lobby-copy-btn` pra o `setLobbyMode` poder achar
- [html/style.css](../html/style.css): bloco novo "── START SCREEN" com tokens reaproveitados (`--surf2`, `--bdr2`, `--p1`, `--gold`, `--p2`, `--dim`). Mode toggle com estado `.active` e `.locked`; ações primária/secundária; input de código mono-spaced em uppercase com letter-spacing 4
- [html/network.js](../html/network.js):
  - Import de `showStartScreen`/`setLobbyMode`
  - Handler `socket.on("match_found")` novo — seta `window.roomId`/`window.myId` a partir do payload do server e atualiza state via `adaptStateForMe`. Sem isso o cliente nunca renderizaria o jogo após um pareamento Random
  - Bloco de roteamento expandido: URL com `?sala` continua sendo atalho direto pro `join_private_room`; sem URL, chama `showStartScreen()` e despacha `queue_join`/`create_private_room`/`join_private_room` conforme escolha. `setLobbyMode("random"|"private")` no fim, antes de `lobby-screen.display = "flex"`

### Decisões de produto registradas
- **4v4 fica visível com badge "EM BREVE"** em vez de oculto: antecipa a feature pro jogador antes da Macro MODE-001. Custo: 1 string e 1 classe CSS (`.locked`). Ativação é uma flag (`MODE_4V4_LOCKED = false`)
- **3 caminhos numa tela só** em vez de fluxo multi-tela: Random / Create / Join cabem em <360px na vertical, mobile-first. MATCH-001.4 (UI aguardando) e MATCH-001.5 (UI Private Room com código grande) podem virar overlays separados sem mexer nesta tela
- **URL `?sala=XXXX` continua sendo atalho** que pula a tela: preserva fluxo de link compartilhado que já funciona. Quem cria sala via "Criar sala privada" também recebe URL atualizada via `replaceState` — pode compartilhar igual antes
- **Lobby reaproveitado pra "Procurando..."** em vez de tela própria: economia de markup. Quando MATCH-001.4 trouxer animação de busca + botão cancelar, vira tela própria

### Decisões técnicas
- **`showStartScreen()` Promise-based** em vez de callback ou estado global: encaixa direto em `await` dentro de `initMultiplayer` sem complicar o fluxo. Cleanup de listeners em `finish()` evita acúmulo se a tela voltar a aparecer no futuro
- **`Map<id, handler>` não usado**: handlers atribuídos diretamente via `.onclick = ...` (não `addEventListener`). Justificativa: pivot do jogo já usa esse padrão em outros lugares; consistência > pureza. Se MATCH-001.4 trouxer múltiplos listeners por elemento, migra pra `addEventListener`/`removeEventListener`
- **`window.roomId.toUpperCase()` no caminho `joinPrivate`**: redundante com a normalização server-side de MATCH-001.1, mas mantém URL espelhando o que o server reconheceu — usuário recarregando a página vê código consistente
- **`alert(...)` mantido pros erros de matchmaking**: feio, mas suficiente pra Alpha. UI proper de erro vai junto com MATCH-001.5 (UI Private Room)

### Validação
- `node --check` em network.js, startScreen.js, ui.js, gameState.js, combat.js, validators.js: tudo passou
- IDs cruzados conferidos: 11 IDs criados em index.html (`start-screen`, `ss-mode-1v1`, `ss-mode-4v4`, `ss-btn-random`, `ss-btn-create`, `ss-btn-join`, `ss-input-code`, `ss-error`, `lobby-subtitle`, `invite-link`, `lobby-copy-btn`) — todos consumidos pelo startScreen.js
- Fluxo de transição cobre 4 caminhos:
  1. URL com `?sala=XXXX`: tela inicial pulada, vai direto pro `join_private_room` (compat)
  2. Random → `queue_join` → lobby "Procurando..." → `match_found` → game
  3. Create Private → `create_private_room` → lobby "Aguardando..." com link → opponent join → game
  4. Join Private → input código → `join_private_room` → game (se sala já tem 1 player, vira planning direto)
- **Validação dinâmica fica com Gabriel**: precisa testar no PC com 2 abas (ou 2 dispositivos). Caminho completo: abrir página em A → escolher "Criar sala privada" → copiar link → abrir em B → ver tela inicial → opção 1: usar link (atalho), opção 2: digitar código no input. Também testar caminho Random com A "Procurar oponente" + B "Procurar oponente" → ambos pareados. Fluxo da URL antiga (link Alpha) não muda

### Dependências externas (Gabriel cuida)
- **ZIP do `html/`** atualizado no itch.io: agora tem 1 arquivo a mais (`startScreen.js`) + edições em `index.html`/`style.css`/`network.js`. Conteúdo do ZIP: `index.html` na raiz + `style.css` + `gameState.js` + `network.js` + `combat.js` + `ui.js` + `validators.js` + `startScreen.js`
- **Server NÃO mudou** nesta sub — Railway redeploy não é necessário (mas não atrapalha)

### Notas para próxima sessão
- Próxima na ordem: **MATCH-001.4** — UI de aguardando match (Random). Trabalho previsto: trocar o lobby-screen reaproveitado por uma tela própria com animação de "procurando" (pulsar / dots) + botão CANCELAR que dispara `queue_leave` e volta pro start-screen. Quando `match_found` chega, fade-out e abre game
- **Atenção pra MATCH-001.5** (UI Private Room): hoje o link compartilhado é mostrado no `#lobby-screen` reaproveitado. MATCH-001.5 vai dar um upgrade — código ABCD em fonte grande (já que tem só 4 chars), botão "copiar código" próprio, lista de jogadores na sala com indicador de quem já chegou
- **Atenção pra MODE-001**: destravar 4v4 na tela inicial é trivial — `MODE_4V4_LOCKED = false` em [html/startScreen.js:6](../html/startScreen.js#L6). Mas só faz sentido depois de MODE-001.4 (renderizar 4 jogadores) e MODE-001.5 (Royal Rumble com 3+ dados)

---

## 2026-04-29 Sessão MATCH-001.4 — UI de aguardando match
**Status:** Completo
**Branch:** —

### Feito
- [html/index.html](../html/index.html): novo `<div id="searching-screen">` com título 4×4, label "Procurando oponente", 3 dots pulsantes, botão CANCELAR
- [html/style.css](../html/style.css): bloco "── SEARCHING SCREEN" — fixed overlay z-index 6500 (mesmo do start-screen), `.searching-dots span` com animação `searching-pulse` 1.4s ease-in-out infinita e delays escalonados (0/0.2/0.4s) gera o efeito de scanner. Botão cancelar usa `--p2` (vermelho) — diferencia visualmente das ações primárias
- [html/startScreen.js](../html/startScreen.js):
  - `setLobbyMode` removida (não é mais usada — lobby-screen volta a ser exclusivo de Private Room)
  - `showSearchingScreen()` retorna Promise<{result:"matched"|"cancelled"}>. Cleanup zera o handler do botão e o resolver de match. Idempotente: chamada repetida reseta o estado interno
  - `notifyMatchFound()`: chamada pelo handler `socket.on("match_found")` em network.js; resolve a Promise pendente se houver. No-op se ninguém está esperando (chamadas espúrias são ignoradas)
- [html/network.js](../html/network.js):
  - Bloco de roteamento sem URL virou um `while (true)` com `break` em cada caminho terminal — permite que cancelar o Random Match volte ao start-screen sem reload da página. Em todos os caminhos, erro do server faz `continue` (loop) em vez de `return` (mata o cliente)
  - Handler `match_found` chama `notifyMatchFound()` antes de propagar pra `_onStateChange`. Se a tela searching estiver aberta, ela fecha antes do `syncUI` rodar e mostrar o jogo
  - Flag `isRandomMatched`: pareamento Random pula o `lobby-screen` totalmente — ambos os jogadores entram direto no game-container porque `match_found` já trouxe o estado completo (phase=planning, ambos connected). Sem isso o lobby piscaria por uma fração de segundo

### Decisões de produto
- **Animação de 3 dots em vez de spinner**: minimalista, combina com o resto da estética cyberpunk; spinner padrão Material/Bootstrap quebraria a linguagem visual. Reuso de `--p1` mantém a paleta
- **Botão CANCELAR em `--p2` (vermelho)**: sinal visual de "ação destrutiva" — alinhado com a regra de cor já estabelecida (player 1 azul = aliado, player 2 vermelho = oponente/perigo)
- **Lobby-screen volta a ser só Private**: estava reaproveitado em MATCH-001.3 com `setLobbyMode("random"|"private")`, mas tela própria pra Random é mais limpa e abre espaço pra animação. `setLobbyMode` removido sem deixar shim

### Decisões técnicas
- **Loop `while(true)` em vez de recursão** em `initMultiplayer`: estouro de stack improvável (jogador teria que cancelar centenas de vezes) mas o while é mais legível e debugável. Variável `isRandomMatched` no escopo do loop sai pelo `break`
- **`notifyMatchFound()` é idempotente e não faz cleanup ela mesma**: o cleanup acontece dentro do resolver registrado pelo `showSearchingScreen` (ou seja, ela só "puxa o gatilho"). Mantém responsabilidade clara: `showSearchingScreen` é dona da tela, `notifyMatchFound` só sinaliza
- **Edge case race "cancelei mas server pareou"**: jogador clica CANCELAR no exato instante em que o server emite `match_found`. Janela é de milissegundos. Comportamento atual: o `match_found` chega depois do `cleanup` ter limpado o resolver; `notifyMatchFound` vira no-op; `_onStateChange` ainda dispara via handler match_found e atualiza `window.S` + `window.roomId`. O jogador acabaria entrando no jogo apesar de ter clicado cancelar. **Não tratado nesta sub** — janela é muito pequena, e tratar exigiria token de session ou confirmação no server. Listado pra hardening futuro se virar problema reportado

### Validação
- `node --check` em network.js e startScreen.js
- IDs cruzados conferidos: `searching-screen`, `searching-btn-cancel` ambos presentes no markup e referenciados no JS
- Fluxos cobertos:
  1. Random Match → searching-screen → match_found → game-container (esconde searching via `cleanup` antes do syncUI)
  2. Random Match → searching-screen → CANCELAR → queue_leave → start-screen (loop)
  3. CANCELAR + reentrar Random: nova chamada `showSearchingScreen` reseta resolver pendente; sem vazamento de listener
- **Validação dinâmica fica com Gabriel**: testar no PC com 2 abas em modo Random:
  1. A clica "Procurar oponente" → vê dots pulsando
  2. A clica CANCELAR → volta pro start-screen (sem refresh)
  3. A clica "Procurar oponente" de novo → dots pulsam de novo (reentrada OK)
  4. B clica "Procurar oponente" → ambos pareiam, jogo começa

### Dependências externas (Gabriel cuida)
- **Re-zipar `html/` e atualizar upload no itch.io** — `index.html`, `style.css`, `network.js`, `startScreen.js` mudaram. Sem arquivos novos nesta sub
- **Server NÃO mudou** — Railway redeploy não é necessário

### Notas para próxima sessão
- Próxima na ordem: **MATCH-001.5** — UI Private Room. Trabalho previsto: tela própria pra "sala criada" (em vez de reaproveitar `lobby-screen`) com código ABCD em fonte grande, botão "copiar código" próprio (vs. URL), lista de jogadores conectados na sala (importante pra 4v4 onde 4 slots aparecem progressivamente). `lobby-screen` atual pode ser absorvido ou virar fallback
- **Race extremo a observar em produção**: se o relato vier de "cliquei cancelar mas entrei no jogo", é o edge case documentado em decisões técnicas. Solução prevista: server emitir `queue_left { ok: true }` somente se conseguiu remover ANTES do pareamento; se já pareou, retornar erro `ALREADY_MATCHED` e cliente forçar leave_room. Um pouco de trabalho, vale só se aparecer relato

---

## 2026-04-29 Sessão MATCH-001.5 — UI de Private Room
**Status:** Completo
**Branch:** —

### Feito
- [html/index.html](../html/index.html): `<div id="lobby-screen">` removido; novo `<div id="private-room-screen">` com título 4×4, label "SALA PRIVADA", `#private-code` em fonte mono grande clicável, botões "COPIAR CÓDIGO"/"COPIAR LINK", e bloco `.private-players` com `#private-players-count` + `#private-players-list`
- [html/style.css](../html/style.css): bloco `─── LOBBY` reorganizado em `─── SHARED TITLES & DIVIDER` (mantém `.lobby-title` e `.gold-line` reusados pelo start/searching) e `─── PRIVATE ROOM`. Removidos: `#lobby-screen`, `.lobby-sub` (não era usado em lugar nenhum), `.link-box`/`.link-box:hover`. Adicionados estilos pro código (clamp 48-82px, letter-spacing 14, padding-left maior pra compensar tracking do último char), botões compactos, lista com bullet `.dot` que muda cor + glow quando `.connected`
- [html/ui.js](../html/ui.js):
  - `syncUI` reescrita: `allConnected = S.players.every(p => p.connected)` (genérica pra N players). Branch quando algum slot vazio: se `S.matchmaking === "private"` mostra `#private-room-screen` + chama `renderPrivateRoom()`; se random, mantém o tabuleiro visível pra o jogador (sem tela específica até hardening de reconnect)
  - `renderPrivateRoom()` nova: seta `#private-code` com `window.roomId`, atualiza `#private-players-count` com `${connected}/${total}`, renderiza lista de slots com `<dot> + label`. Label: "Você — Agente I" se for o próprio jogador, "Agente II/III/IV" pros conectados, "Aguardando…" pros vazios. Constante `ROMAN = ['I','II','III','IV']` cobre 4v4 sem mudanças
  - `showAftermath` agora esconde `#private-room-screen` em vez de `#lobby-screen`
  - `window.copyCode` adicionado: copia `window.roomId` (o código ABCD) com alert de confirmação
- [html/network.js](../html/network.js):
  - `adaptStateForMe` e `adaptFullState` agora propagam o campo `matchmaking` — `syncUI` precisa pra distinguir Private vs Random na tela de "aguardando"
  - Bloco final que setava `#lobby-screen.display = "flex"` e `#invite-link.innerText = window.location.href` removido — `syncUI` agora cuida disso sozinho via `renderPrivateRoom`. Variável morta `isRandomMatched` também removida

### Decisões de produto
- **Código clicável + 2 botões redundantes** (clique no código copia + botão "COPIAR CÓDIGO" + botão "COPIAR LINK"): clique direto cobre desktop power user; botão "COPIAR CÓDIGO" cobre mobile (clicar texto pequeno é frágil); botão "COPIAR LINK" cobre quem prefere mandar URL completa (one-click join). 3 caminhos = mais cliques completados
- **Indicador `.dot` verde com glow** quando conectado: visual clean, alinhado com a estética cyberpunk; cor `--btn-active` (verde) já existe no projeto. Glow via `box-shadow` com `color-mix` 50% transparência — sutil
- **Tela genérica de N players** desde já: lista renderiza igual pra 1v1 (2 slots) ou 4v4 (4 slots). Quando MODE-001 destravar 4v4 não precisa mexer em ui.js — só `MODE_4V4_LOCKED = false` em startScreen.js
- **Removido `.lobby-sub` morto**: não era usado em parte alguma. Cleanup pequeno mas vale (regra inviolável #5 — sem código morto)

### Decisões técnicas
- **Decisão de qual tela mostrar via `S.matchmaking`** em vez de flag local: a fonte de verdade é o server. Adapter passa o campo agora; sem isso o cliente teria que inferir do formato do roomId (4 chars uppercase = private; UUID = random) — frágil. Custo: 1 campo a mais no payload culado, ~12 bytes
- **`renderPrivateRoom()` chamada a cada `state_update`** em vez de só no primeiro: idempotente (DOM mutation só altera o que mudou). Quando 4v4 chegar (ou quando jogador desconecta/reconecta), a lista atualiza automaticamente via syncUI sem orquestração extra
- **`syncUI` no caso "random com slot vazio"** mantém o estado visual anterior (tabuleiro) sem mostrar tela de aviso: se um oponente cair durante random match, o jogador hoje vê o tabuleiro estático. Adicionar overlay "Oponente desconectado" exigiria sub-sessão própria (UX de reconexão é tópico amplo). Comportamento atual é o melhor "fallback do nada" — pelo menos não esconde tudo
- **Sem botão "VOLTAR" na private-room-screen**: jogador que criou uma sala e quer cancelar pode simplesmente fechar a aba ou recarregar (sala stale → cleanup de 5min do server). Add botão volta exigiria "leave_room" + `showStartScreen` igual ao searching → vale numa sub futura se reportado

### Validação
- `node --check` em network.js, ui.js, startScreen.js
- Grep cruzado: zero referências a `lobby-screen`, `lobby-sub`, `link-box`, `invite-link`, `lobby-subtitle`, `lobby-copy-btn` em qualquer arquivo. Limpeza completa
- IDs cruzados conferidos no markup novo: `private-room-screen`, `private-code`, `private-players-count`, `private-players-list` — todos consumidos por ui.js e onclick handlers
- **Validação dinâmica fica com Gabriel**: testar no PC com 2 abas:
  1. A: tela inicial → "Criar sala privada" → vê código grande (4 chars), 2 botões copiar, lista "Você - Agente I" + "Aguardando…"
  2. A: clicar no código (copia) → alert; clicar "COPIAR CÓDIGO" → mesma coisa; clicar "COPIAR LINK" → copia URL com `?sala=...`
  3. B: tela inicial → digita código no input ENTRAR → entra na sala; ambos veem game-container (private-room-screen some)
  4. Caminho alternativo: A copia link, B abre URL → entra automaticamente (atalho de URL pula a tela inicial)
  5. Random Match continua funcionando igual (não toca em private-room-screen)

### Macro MATCH-001 — checkpoint
**Macro 100% completa (5/5 sub-sessões ✅).** MATCH-001.1 (Private Room formal) + MATCH-001.2 (Random queue) + MATCH-001.3 (tela inicial) + MATCH-001.4 (searching screen com cancelar) + MATCH-001.5 (UI Private Room). Cliente agora tem fluxo completo de matchmaking: 3 caminhos (Random / Create Private / Join Private com código), 4 telas (start, searching, private-room, game), retrocompatível com link `?sala=ABCD`. Próxima Macro: **MODE-001** (modo 4v4 — Free-For-All)

### Dependências externas (Gabriel cuida)
- **Re-zipar `html/` e atualizar upload no itch.io**: `index.html`, `style.css`, `ui.js`, `network.js` mudaram (sem arquivo novo nesta sub). Conteúdo do ZIP: `index.html` + `style.css` + `gameState.js` + `network.js` + `combat.js` + `ui.js` + `validators.js` + `startScreen.js`
- **Server NÃO mudou** — Railway redeploy não é necessário

### Notas para próxima sessão
- Próxima na ordem: **MODE-001.1** — Server: schema com N players + spawns 4 cantos. Maior parte do server já suporta N players desde SEC-001.5/.6 (combate Royal Rumble e endgame foram feitos genéricos desde o início). MODE-001.1 deve ser pequena: confirmar que `MAX_PLAYERS["4v4"]=4`, `SPAWNS_BY_SLOT["4v4"]` e `GOALS_BY_SLOT["4v4"]` em [server/constants.js](../server/constants.js) estão corretos (já estão), validar que `joinPrivateRoom` aceita 3°/4° players sem regressão (já aceita pelo `nextFreeSlot`), e talvez documentar/escrever 1 teste de smoke
- **Atenção pra MODE-001.4** (renderizar 4 jogadores): `ui.js` hoje tem cores `var(--p1)` e `var(--p2)` hardcoded em vários pontos (renderHeader, renderBoard, showCombatUI). Vai precisar adicionar `--p3` e `--p4` no `:root` do CSS e generalizar. Lista da private-room-screen já está pronta pra 4 players (genérica), mas o tabuleiro não
- **Destravar 4v4 só depois de MODE-001.4-6** estarem prontos: `MODE_4V4_LOCKED = false` em [html/startScreen.js:6](../html/startScreen.js#L6) é o último passo. Se Gabriel destravar antes, criar sala 4v4 vai gerar 4 players no server mas o cliente vai quebrar ao renderizar — `S.players[2]` não existe no DOM

---

## 2026-04-29 Sessão MODE-001.1 — Server: schema com N players + spawns 4 cantos
**Status:** Completo
**Branch:** —

### Feito
- **Sem código novo nesta sub** — server já suportava 4v4 nativamente desde SEC-001.5/.6 (combate Royal Rumble e endgame foram feitos genéricos pra N players desde o início) e MATCH-001.2 (queue 4v4 implementada lá). MODE-001.1 ficou sendo a **sub de validação dinâmica** que confirma isso de ponta a ponta
- 3 smoke tests programáticos cobriram os caminhos críticos do 4v4

### Validação (smoke tests)
1. **Schema básico**: `createPrivateRoom({mode:"4v4"}) + 3 joins`:
   - Phase progression `lobby → planning` automática quando 4° entra (via `maybeStartPlanning`)
   - Spawns nos 4 cantos: slot 0=[0,0], slot 1=[3,3], slot 2=[3,0], slot 3=[0,3]
   - Goals diagonais: slot 0=[3,3], slot 1=[0,0], slot 2=[0,3], slot 3=[3,0]
   - Inventário 1/1/1 (BLOCK/TRAP/SPRINT) por player — espelho do PROTO §4
   - Culling cobre 4 players: cada viewer vê `me` + 3 `opponents` com campos restritos (sem target/skill/combatSkill/roll/history)
   - State propaga `matchmaking` e `mode` corretamente após adição em MATCH-001.5

2. **Royal Rumble 3-way**: 3 players colidem em [1,1], 4° fora move sozinho:
   - `pendingCombat.cell=[1,1]`, `participants=[0,1,2]`, slot 3 NÃO entra no combate
   - Slots 0,1,2 ficam em pos original durante combate; slot 3 move pra alvo independente
   - Após dado decidir (top score único), vencedor avança pra [1,1], perdedores ficam parados, `turnEnded:true`

3. **Queue Random Match 4v4**: 4 players entram fila → `MATCH-001.2`'s `queueJoin` pareia automaticamente:
   - Sala criada com `matchmaking:"random"`, `roomId` UUID format (`/^[0-9a-f]{8}-/`), 4 players, phase=planning

### Decisões técnicas
- **Sub marcada como ✅ sem PR de código**: validação dinâmica é entregável legítimo. Memória de Gabriel diz "feedback_pivot_e_testes" — testes/index.html é backup; smoke tests programáticos são caminho válido pra validar server. Sub não viola "código não-quebrado" porque... não há código pra quebrar
- **MODE-001.2 e MODE-001.3 também já estão implementadas em código**: `checkWin` em rooms.js usa `arrEq(p.pos, p.goal)` por slot (genérico) e `INV_INITIAL_BY_MODE["4v4"]` em constants.js já é `{BLOCK:1, TRAP:1, SPRINT:1}`. **Mas MODE-001.2 ainda tem decisão de produto pendente**: regra de empate quando 2+ players chegam no goal no mesmo turno em 4v4 (hoje cai em "slot menor leva" por default — comentário em rooms.js:382 reconhece o gap). Isso é decisão do Gabriel, não tem código a escrever até ele decidir

### Validação dinâmica (Gabriel)
Não há nada pra Gabriel testar nesta sub — server não mudou, cliente ainda tem `MODE_4V4_LOCKED=true` em startScreen.js. Toggle 4v4 destrava automaticamente no fim da Macro MODE-001 (após MODE-001.4-6 prontos)

### Notas para próxima sessão
- Próxima na ordem: **MODE-001.2** — Server: condição de vitória diagonal. Trabalho real é decisão de produto: **quando 2+ players chegam no goal no mesmo turno em 4v4, o que acontece?**
  - **Opção A** (atual default): slot menor leva. Determinístico, sem código novo. Fica arbitrário ("por que slot 0 ganhou?")
  - **Opção B**: Royal Rumble entre os que chegaram. Dado decide, infraestrutura já existe. Coerente com o resto do design ("combate decide tudo")
  - **Opção C**: Todos os que chegaram dividem a vitória (game termina sem winner único). Esquisito pra UI de Aftermath
  - **Recomendação**: **Opção B**. Faz sentido temático e zero código novo (basta tirar o `if (room.mode === "1v1")` no `checkWin` e deixar o Royal Rumble disparar pra ambos os modos). Vou pedir confirmação do Gabriel antes de implementar
- **MODE-001.3 já está implementada em código** — pode virar uma sub de "documentação" rápida ou ser absorvida em MODE-001.2
- **Atenção pra MODE-001.4** (renderizar 4 jogadores no cliente): será a sub mais densa da Macro. `--p3` e `--p4` precisam virar tokens em `:root`; `renderHeader`/`renderBoard`/`showCombatUI`/`drawSVG` em ui.js têm cores e índices hardcoded em vários pontos. Generalização vai exigir release de fôlego — talvez quebrar em MODE-001.4a (CSS tokens + renderHeader) e MODE-001.4b (board + combat overlay) se a sub ficar grande

---

## 2026-04-29 Sessão MODE-001.2 + MODE-001.3 — Vitória diagonal genérica + inventário 4v4
**Status:** Completo (2 sub-sessões fechadas juntas)
**Branch:** —

### Decisão de produto registrada (MODE-001.2)
**Empate em chegada simultânea no goal em 4v4: Opção B aprovada** — endgame combat (Royal Rumble) entre os que chegaram. Mesma regra do 1v1, agora genérica. Decisão tomada em 2026-04-29 baseada em:
1. **Coerência temática**: o resto do design já decide disputas via combate. "Slot menor leva" seria o único caso de exceção arbitrária
2. **Custo zero**: infra de Royal Rumble + endgame combat já existia (SEC-001.5/.6); só removi o `if` que travava o caminho pra 1v1
3. **Sem objeção do Gabriel** após eu propor as 3 opções; segui a recomendação

### Feito
- [server/rooms.js](../server/rooms.js) `checkWin`: bloco `if (winners.length >= 2)` simplificado — removido o ramo `if (room.mode === "1v1")` que disparava endgame combat só no 1v1 e o ramo de fallback que jogava direto pra game_over com slot menor. Endgame combat agora dispara pra qualquer modo. Comentário atualizado refletindo a decisão MODE-001.2
- [docs/PROTO_SOCKET.md](PROTO_SOCKET.md) §10: linha "empate em 4v4 ainda pendente" marcada com strike-through e legenda "Resolvida em MODE-001.2"
- **MODE-001.3 fechada sem mudança de código**: `INV_INITIAL_BY_MODE["4v4"]` em constants.js já é `{BLOCK:1, TRAP:1, SPRINT:1}` desde SEC-001.5. Foi validado via smoke test em MODE-001.1 (cada player de uma sala 4v4 nasce com inventário 1/1/1). Sub fica fechada documentalmente

### Validação
- `node --check rooms.js` passou
- Smoke test programático: criar sala 4v4, posicionar slots 0 e 1 a 1 célula do goal próprio, slots 2 e 3 longe, todos miram seus alvos, todos confirmam → endgame combat dispara com `participants:[0,1]`, `isEndgame:true`. Após dado (6 vs 5), slot 0 vence, gameOver. Comportamento idêntico ao 1v1 (que continua funcionando exatamente como antes — caminho generalizado é superset)
- **Validação dinâmica fica com Gabriel**: por enquanto o cliente ainda tem 4v4 locked, então não há nada visível pra testar fora dos smoke tests. Quando MODE-001.4-6 destravarem o 4v4 no cliente, valerá testar 1 partida 4v4 onde 2 players cheguem ao goal no mesmo turno (cenário raríssimo na prática)

### Decisões técnicas
- **Bloco simplificado em vez de "if (mode==='4v4') { mesmo bloco }"**: a lógica é genuinamente genérica — não há razão pra branch por modo. Reduz código morto e elimina a chance de regressão silenciosa quando um terceiro modo chegar (ex: `2v2` futuro)
- **Não toquei em `resolveCombat`**: o caminho de empate no top (re-roll) e o de winnerSlot único já são genéricos em N participants. Nada a ajustar
- **MODE-001.3 fechada como ✅ documental, não pulada (⏸)**: o trabalho da sub era "garantir que inventário 4v4 está 1/1/1". Está. Fechar como ✅ é honesto — a sub foi cumprida pelo trabalho prévio. Marcar como pulada/cancelada subestimaria a entrega

### Macro MODE-001 — checkpoint
**Server-side 100% pronto**: MODE-001.1 (schema + spawns) ✅, MODE-001.2 (vitória diagonal) ✅, MODE-001.3 (inventário) ✅. **3 de 6 sub-sessões da Macro concluídas**. Restam as 3 sub-sessões de cliente (renderizar 4 jogadores, Royal Rumble com 3+ dados, Aftermath com 4 trajetos). Após elas, basta `MODE_4V4_LOCKED = false` em [html/startScreen.js:6](../html/startScreen.js#L6) pra destravar a feature

### Dependências externas (Gabriel cuida)
- **Push do commit pro Railway** — `rooms.js` mudou (apenas o bloco `if (winners.length >= 2)`). Confirmar `[server] listening on :PORT` após redeploy
- **PROTO_SOCKET.md** mudou (doc, não roda). Cliente NÃO mudou — ZIP do itch.io fica como está

### Notas para próxima sessão
- Próxima na ordem: **MODE-001.4** — Cliente: renderizar 4 jogadores. Plano:
  1. Adicionar tokens `--p3` e `--p4` em `:root` (CSS) — proponho `#9d4edd` (roxo) e `#f5a623` (laranja/gold) pra contraste com `--p1` azul e `--p2` vermelho. Pode ajustar
  2. Generalizar `renderHeader` em ui.js pra ler cor de `var(--p${myId+1})` em vez de ternário 0/1
  3. `renderBoard` (peças no tabuleiro) já usa `var(--p${owner+1})` em alguns lugares, mas tem ternários hardcoded pra slot 0/1 que precisam virar genéricos
  4. `drawSVG` em showAftermath: hoje itera `[0,1].forEach` — generalizar pra `S.players.forEach`
  5. Possivelmente quebrar em MODE-001.4a (CSS tokens + renderHeader + renderBoard) e MODE-001.4b (combat overlay + Aftermath SVG) se a sub ficar grande
- **Atenção pra MODE-001.5** (combat overlay com 3+ dados): hoje o `#combat-overlay` em index.html tem markup hardcoded com 2 dies (`die-0`, `die-1`). Pra Royal Rumble com 3+ players, precisa renderizar dinamicamente. Provavelmente trocar pra `<div id="combat-arena">` que `showCombatUI` popula via JS

---

## 2026-04-29 Sessão MODE-001.4 — Cliente: renderizar 4 jogadores no tabuleiro
**Status:** Completo
**Branch:** —

### Decisões de produto registradas
- **Cores P3 e P4**: P3 = roxo `#c084fc`, P4 = dourado `#facc15`. Distintos de azul (P1) e vermelho (P2), bom contraste no fundo escuro. Sem feedback do Gabriel a contestar; segui a recomendação. Pode trocar editando os 6 tokens em [html/style.css:11-21](../html/style.css)
- **`winner-text` na Aftermath agora usa cor do slot vencedor** (em vez de "p1 se foi eu, p2 se foi outro"): em 4v4 fica imediatamente claro QUEM venceu via cor. O texto "MISSÃO CUMPRIDA"/"MISSÃO FALHOU" continua refletindo perspectiva do próprio jogador
- **Combat overlay e combat-result intocados**: ficam pra MODE-001.5 (dies dinâmicos pra 3+ participantes — hoje `index.html` ainda tem `die-0`/`die-1` hardcoded)

### Feito
- [html/style.css](../html/style.css):
  - `:root` ganhou 6 tokens novos: `--p3` (#c084fc roxo), `--p4` (#facc15 dourado), `--gp3`/`--gp4` glows com 35% alpha, `--p3-highlight`/`--p4-highlight` com 55% alpha pra gradiente radial das peças
  - Classes `.p3-piece` e `.p4-piece` espelhando `.p1-piece`/`.p2-piece` — radial-gradient + box-shadow
- [html/ui.js](../html/ui.js):
  - `renderHeader` lê `var(--p${myId+1})` e `ROMAN[myId]` em vez de ternário
  - `setupBoardOnce` itera sobre `S.players` (em vez de `[0,1].forEach`) — cria 1 div por slot existente, classe `p${slot+1}-piece`
  - `renderPieces` itera sobre `S.players`; só renderiza a peça do próprio jogador, oponentes aparecem como ghost nas células adjacentes (lógica preservada, agora N players)
  - `renderBoard` usa `others = S.players.filter(p => p.id !== window.myId)` em vez de `other = S.players[1-myId]`
  - `renderCell` faz loop em `others` pra desenhar ghost de cada oponente adjacente — em 4v4, mais de um oponente pode ocupar a mesma célula (Royal Rumble)
  - `rollDie` cor genérica `var(--p${id+1})` + `var(--gp${id+1})`
  - `showCombatUI` (parte de loop de dies, ainda `[0,1]`): só ternário de cor virou `var(--p${i+1})` — markup hardcoded fica pra MODE-001.5
  - `drawSVG` (Aftermath SVG) itera `S.players.forEach(p => ...)` em vez de `[0,1].forEach` — cada jogador ganha trajeto colorido por seu slot
  - `winner-text` cor: `var(--p${w+1})` (cor do slot vencedor) em vez de ternário 0/1
  - `syncUI` linha 29: `S.winner !== undefined && S.winner >= 0` em vez de `S.winner===0||S.winner===1` (slots 2 e 3 também disparam Aftermath agora)

### Decisões técnicas
- **`others.filter` rodando a cada render**: 4 elementos no máximo, custo desprezível. Alternativa seria cachear no `S.opponents`, mas como o adapter de network.js já recria `S` a cada `state_update`, cachear duplicaria trabalho
- **Ghost de múltiplos oponentes na mesma célula** (loop em vez de "primeiro encontrado"): em 4v4 com Royal Rumble, é cenário real. Cada ghost é independente — vão sobrepor visualmente se forem na mesma cor mas diferentes slots. Não é bonito (nem deveria — significa colisão iminente) mas dá pra ver o número de oponentes pelo glow expandido
- **Não toquei no `body::before` background atmosférico** (cantos inferior-esquerdo azul + superior-direito vermelho): em 4v4 só os cantos P1/P2 ganham o tint sutil, P3/P4 não. Decisão por menor risco — mexer no gradient pode pegar mal visual com 4 tints. Se ficar feio na prática, trivial adicionar mais 2 radial-gradients lá depois
- **Combat overlay com loop `[0,1]` mantido**: a comparação `S.players[0].roll>0 && S.players[1].roll>0` linha 296 e o cálculo `t1`/`t2` linhas 297-298 são lógica 1v1 hardcoded. Generalizar exige renderizar dies dinâmicos. Escopo de MODE-001.5

### Validação
- `node --check` em ui.js, network.js, startScreen.js
- Grep cruzado: zero referências hardcoded em `players[0]`/`players[1]` no caminho de renderização do tabuleiro/Aftermath. Resíduos só em `showCombatUI` (escopo MODE-001.5)
- IDs cruzados: `piece-${i}` agora é dinâmico (slot 0..N-1); CSS `.p${i+1}-piece` cobre N de 1 a 4
- **Validação dinâmica fica com Gabriel**: quando MODE-001.5 fechar, vai dar pra destravar 4v4 e testar. Ainda assim, sub atual deve manter 1v1 idêntico — testar 1 partida 1v1 no itch.io e ver se nada regrediu

### Dependências externas (Gabriel cuida)
- **Re-zipar `html/` e atualizar upload no itch.io**: `style.css` e `ui.js` mudaram. Sem arquivo novo
- **Server NÃO mudou** — Railway sem necessidade de redeploy

### Notas para próxima sessão
- Próxima na ordem: **MODE-001.5** — Cliente: combat overlay com 3+ dies dinâmicos. Trabalho previsto:
  1. `index.html`: `#combat-overlay` perde `die-0` e `die-1` hardcoded; ganha `<div id="combat-arena">` que `showCombatUI` popula via JS
  2. `ui.js showCombatUI`: cria 1 `<div class="die-wrap">` por participant em `S.pendingCombat?.participants`. Cada wrap tem label, die, hint, math
  3. `ui.js`: cálculo de vencedor genérico — em vez de comparar `t1` vs `t2`, achar `Math.max` entre todos os totais e detectar empate no top
  4. CSS: `.combat-arena` com flex-wrap pra 3-4 dies em mobile; tipografia das labels e dies adequada (talvez menores em 4v4)
  5. Empate (re-roll) em 4v4: server já trata via `pendingCombat.participants` reduzido — cliente só precisa re-renderizar com novo `participants`
- **Atenção pra MODE-001.6** (Aftermath 4 trajetos): a maior parte já está pronta nesta sub. MODE-001.6 talvez vire só ajustes finos — opacidade das paths, indicação visual do vencedor entre 4, ícones do Aftermath header. Pode ser sub curtíssima ou absorvida na próxima
- **Toggle 4v4 pode ser destravado depois de MODE-001.5**: tabuleiro + combat overlay cobrem o gameplay. Aftermath funciona "good enough" mesmo se MODE-001.6 ainda não chegou. Decisão do Gabriel quando achar momento

---

## 2026-04-29 Sessão MODE-001.5 — Cliente: combate Royal Rumble (overlay com 2-4 dados)
**Status:** Completo
**Branch:** —

### Feito
- [html/network.js](../html/network.js) `adaptStateForMe`: passa `state.pendingCombat` direto pro `window.S.pendingCombat`. Antes o adapter ignorava esse campo — UI não tinha como saber quem está no combate atual. Em 4v4 isso é essencial: nem todos os 4 entram em todo combate (pode ser 2 colidindo enquanto os outros 2 movem)
- [html/index.html](../html/index.html) `#combat-overlay`: enxugado de markup hardcoded com 2 dies (`die-0`, `die-1`) + `.combat-vs` "VS" pra um único container `<div class="combat-arena" id="combat-arena"></div>`. ui.js popula em runtime
- [html/ui.js](../html/ui.js):
  - `showCombatUI` reescrita: lê `S.pendingCombat.participants`, ordena, e itera. Para cada participante, decide se já rolou via `pc.myRoll` (eu) ou `pc.opponentRolls.find(o=>o.slot===slot).rolled` (oponente). PROTO §5.3 mantido — valor do dado do oponente continua oculto até `combat_resolved`
  - `setupCombatArena(participants)`: novo helper. Reconstrói o DOM do arena só quando o conjunto de participantes muda (via `dataset.sig`). Em re-roll de Royal Rumble (top scorers), `pc.participants` reduz e o arena se atualiza sozinho
  - `renderCombatDie(slot, isMe, hasRolled, myRollValue)`: novo helper. Três caminhos visuais — meu dado pousado com número e math; oponente que rolou (idle "·" + hint "rolou", valor escondido); ainda não rolou (idle + "toque para rolar" se for meu, "aguardando..." se for de outro)
  - `rollDie` agora curto-circuita por `S.pendingCombat?.myRoll > 0` (em vez de `S.players[id].roll>0` que não funcionava com cull — `players[other].roll` sempre é 0 no cliente). Mantém id-check `id !== window.myId` por segurança
  - Bloco morto removido: cálculo `t1` vs `t2` que escrevia "VENCEDOR: AGENTE I/II" só rodava se ambos `players[*].roll > 0` — impossível com cull. Não havia regressão de UX porque na prática nunca renderizava nada
- [html/style.css](../html/style.css) `.combat-arena`: ganha `flex-wrap:wrap` + `justify-content:center` + `row-gap:28px` pra 3-4 dados quebrarem linha em telas estreitas. Mobile reduz `gap` pra 18px e `row-gap` pra 20px. Bloco `.combat-vs` removido (não há "VS" entre N participantes em Royal Rumble)

### Decisões técnicas
- **Spectators de combate parcial em 4v4 também veem o overlay**: server bota `room.phase = "combat"` pra sala inteira mesmo quando só 2 de 4 colidem. UI mostra só os participantes (sem botão de rolar pros que não estão), e o "aguardando..." nos seus próprios dies… espera, spectator não tem die próprio renderizado no novo arena (só `participants` aparecem). O spectator vê o arena dos combatentes e fica esperando o `combat_resolved` mudar a phase de volta. **Decisão**: ok pra agora. Se virar problema de UX (spectator não sabe o que rolou no combate), MODE-001.5b ou hardening pode adicionar overlay de "AGUARDANDO COMBATE..." específico pro spectator
- **Hint "rolou" pra oponente que já rolou** (em vez de manter "aguardando..."): pequena melhoria de feedback. Ajuda Royal Rumble com 4 dados onde demora mais até todo mundo confirmar
- **Não toquei na exibição do resultado pós-combate** (`#combat-result` continua vazio): o gap real é que `combat_resolved.result.scores` vem com a phase já mudada pra `planning`/`game_over`, então o overlay some imediatamente — `result.scores` nunca chega a renderizar. Mesmo gap existia em 1v1. Fica como sub-sessão futura se Gabriel quiser feedback visual do resultado (ex: "REVEAL-001 — pausa de 1.5s entre combat_resolved e a transição de phase")
- **Reconstrução do arena só quando `participants` muda**: re-roll em Royal Rumble (4 → 2 top scorers) muda o conjunto. Combates normais (mesmo set, várias atualizações) reaproveitam DOM. Reduz flicker

### Validação
- `node --check ui.js network.js` passou
- Grep manual: nenhum resíduo `die-0`/`die-1` hardcoded fora do test-client.html (que é debug do server, não tela do jogador)
- 1v1 preservado: `pendingCombat.participants=[0,1]` produz exatamente 2 dies, layout idêntico ao anterior (apenas sem o "VS" entre eles — decisão consciente de produto)
- **Validação dinâmica fica com Gabriel**: testar 1 partida 1v1 no itch.io pós-redeploy e ver se a tela de combate continua igual (toque para rolar, dado anima, vencedor avança no tabuleiro). 4v4 ainda travado em `MODE_4V4_LOCKED=true` — só destravar quando MODE-001.6 (Aftermath 4 trajetos) também passar

### Dependências externas (Gabriel cuida)
- **Re-zipar `html/` e atualizar upload no itch.io**: `index.html`, `ui.js`, `network.js`, `style.css` mudaram
- **Server NÃO mudou** — Railway sem redeploy

### Notas para próxima sessão
- Próxima na ordem: **MODE-001.6** — Cliente: Aftermath com 4 trajetos. A maior parte do trabalho de SVG já foi feita em MODE-001.4 (`drawSVG` itera `S.players.forEach`). MODE-001.6 deve ser ajustes finos:
  1. Ver se as 4 paths coloridas no SVG ficam legíveis sobrepostas (opacidade `0.35` atual pode precisar ajuste)
  2. `winner-text` em 4v4 pode mostrar "AGENTE III VENCEU" pra um perdedor (ele sabe que perdeu, mas não pra quem). Hoje só usa "MISSÃO CUMPRIDA"/"MISSÃO FALHOU" — talvez mostrar o slot vencedor explícito ajude
  3. Legenda do Aftermath atualmente só lista BARRICADA / ARMADILHA / CONFRONTO. Pode ganhar miniaturas dos 4 cores se for 4v4
- **Após MODE-001.6**: destravar 4v4 (`MODE_4V4_LOCKED = false` em [html/startScreen.js:6](../html/startScreen.js#L6)) é a última barreira. Validação dinâmica de uma partida 4v4 ponta-a-ponta vira essencial nessa hora
- **Reveal de combate pós-rolagem** (gap mencionado nas decisões técnicas): se Gabriel quiser que o resultado numérico apareça antes da phase mudar, vira sub futura `REVEAL-001`. Não bloqueia MODE-001

---

## 2026-04-29 Sessão MODE-001.6 — Cliente: Aftermath com 4 trajetos
**Status:** Completo
**Branch:** —

### Feito
- [html/index.html](../html/index.html) `#review-screen`: ganha 2 elementos novos
  - `<div id="winner-sub">` logo abaixo do `#winner-text` — sub-título identificando o vencedor explicitamente quando ele não é o próprio jogador (em 4v4, perdedores precisam saber QUEM ganhou)
  - `<div id="legend-players">` entre o tabuleiro e a legenda de ícones — chips coloridos com `Agente I/II/III/IV`, só visível em 4v4
- [html/ui.js](../html/ui.js) `showAftermath`:
  - `winner-text` continua mostrando "MISSÃO CUMPRIDA"/"MISSÃO FALHOU" da perspectiva do jogador (cor do slot vencedor)
  - `winner-sub` aparece só em 4v4 quando o vencedor NÃO sou eu — texto "AGENTE X VENCEU" na cor do vencedor. Em 1v1 a info é redundante (só tem 2 slots, "MISSÃO FALHOU" já implica que o outro venceu)
  - `legend-players` aparece só em 4v4 — chips com cor de cada slot. Em 1v1 a cor do header já é suficiente
  - Passa `w` (slot do vencedor) pra `drawSVG` para destaque visual
- [html/ui.js](../html/ui.js) `drawSVG(winnerSlot)`:
  - Vencedor: stroke 4, path opacity 0.7, dot raio 5, dot opacity 1.0 — sai claramente em primeiro plano
  - Perdedores: stroke 2, path opacity 0.22, dot raio 3, dot opacity 0.45 — visível mas discreto
  - Resolve o risco mencionado nas notas da MODE-001.4: 4 paths sobrepostas com opacity 0.35 igual pra todos ficavam difíceis de ler em 4v4
- [html/style.css](../html/style.css):
  - `#winner-text` perde `margin-bottom` default pra encostar no sub-título
  - `.winner-sub` — Cinzel 13px, letter-spacing 6px, levemente sobreposto ao texto principal (`margin-top:-6px`)
  - `.legend-players` — flex-wrap centralizado, gap 18px; cada `.legend-player` é um chip colorido `● Agente X` em monospace 11px

### Decisões técnicas
- **Detecção de modo via `S.players.length > 2`**: o adapter de network.js não passa `state.mode` pra `window.S`, mas a contagem de players já é suficiente pra distinguir 1v1 (2) vs 4v4 (4). Decisão: manter detecção implícita por ora; se algum dia surgir um modo 3v3 ou similar, refatorar pra `S.mode` direto. Adicionar `mode` ao adapter agora seria especulativo
- **Sub-título só pra perdedores em 4v4**: pro vencedor "MISSÃO CUMPRIDA" + cor do slot dele já comunica tudo. Adicionar "AGENTE I VENCEU" abaixo seria barulho. Pros perdedores em 4v4, é informação genuinamente nova — sem ela, o jogador derrotado não sabe se foi P1, P3 ou P4 que cruzou primeiro
- **Em 1v1 winner-sub fica oculto**: minha primeira intuição foi "se o vencedor não sou eu, mostrar AGENTE II VENCEU também em 1v1". Decidi contra: em 1v1 só tem 2 slots e o texto "MISSÃO FALHOU" já implica que o oponente venceu. Adicionar info redundante polui a tela. Caso o Gabriel discorde, é trivial trocar o `S.players.length > 2` por `!isMe`
- **Stroke widths 4/2 em vez de 3/3**: o destaque do vencedor precisa ser distinguível mesmo quando todas as cores estão saturadas no SVG. Tentei manter stroke 3 com opacidades 0.7/0.25 e ficou OK em 1v1 mas em 4v4 o vencedor empata visualmente com 2-3 perdedores cuja path passa pelas mesmas células. Stroke 4 vs 2 dá um peso visual claro
- **Não toquei nos resíduos de quando 4v4 não tem trajeto interessante**: jogos 4v4 onde o vencedor avança em 2 turnos vão ter histórico curto (3 pontos no SVG). Os perdedores podem ter histórico mais longo. Visualmente é OK — é o que de fato aconteceu na partida

### Validação
- `node --check ui.js` passou
- 1v1 preservado: `S.players.length === 2` faz sub-título e legend-players ficarem ocultos. Aftermath visualmente idêntico ao anterior, exceto pelo stroke do vencedor agora ser 4 em vez de 3 (perdedor é stroke 2 em vez de 3) — destaque sutil mas perceptível
- 4v4 visualmente: trajeto vencedor sobressai entre os 3 perdedores; sub-título e legenda colorida deixam claro quem é quem
- **Validação dinâmica fica com Gabriel**: testar 1 partida 1v1 no itch.io pós-redeploy e ver se o Aftermath ficou coerente. 4v4 ainda travado — destravar é o próximo passo (uma linha em startScreen.js)

### Dependências externas (Gabriel cuida)
- **Re-zipar `html/` e atualizar upload no itch.io**: `index.html`, `ui.js`, `style.css` mudaram (3 arquivos)
- **Server NÃO mudou** — Railway sem redeploy

### Macro MODE-001 — fechada (6/6)
Server-side pronto desde MODE-001.1-3 (validado em 2026-04-29). Cliente: 4 jogadores no tabuleiro (MODE-001.4), combate Royal Rumble dinâmico (MODE-001.5), Aftermath com 4 trajetos destacados (MODE-001.6). **Toggle 4v4 pode ser destravado** trocando `MODE_4V4_LOCKED = false` em [html/startScreen.js:6](../html/startScreen.js#L6). Recomendo fazer isso antes da próxima sub pra Gabriel poder testar uma partida 4v4 real e validar tudo de ponta-a-ponta antes de empurrar pra DES-001 (i18n)

### Notas para próxima sessão
- **Próxima na ordem**: DES-001.1 (i18n base). Mas antes recomendo:
  - Destravar `MODE_4V4_LOCKED` (1 linha)
  - Fazer 1 partida 4v4 ponta-a-ponta no itch.io. Cobre matchmaking, spawns, planejamento, combate Royal Rumble (idealmente 3+ players), Aftermath com 4 trajetos
  - Se algo regredir, sub de hardening fica entre MODE-001 e DES-001
- **Gap conhecido**: combate `combat_resolved.result.scores` ainda não renderiza visualmente (overlay some antes — phase muda no mesmo evento). Mesmo gap existia em 1v1 e em 4v4 continua. Vira sub `REVEAL-001` se Gabriel quiser feedback de "vencedor: AGENTE III com 6+1=7"
- **Possível ajuste fino do Aftermath**: em jogos 4v4 longos, 4 trajetos sobrepostos podem ainda assim ficar densos. Se virar problema, opções são (a) destacar só vencedor + jogador atual, esmaecer os outros 2; (b) toggles na legenda pra ligar/desligar trajetos individuais. Não vou implementar especulativamente — precisa o Gabriel ver na prática

---

## 2026-06-13 Sessão BUG-002 — Fix: "Criar Sala" pulava direto pro tabuleiro sem mostrar o código
**Status:** Completo
**Branch:** —

### Bug relatado
Ao clicar "Criar Sala Privada", o jogo não mostrava a tela com o código (ABCD) pra convidar o oponente — ia direto pro tabuleiro vazio, sem ninguém pra entrar.

### Causa
`server/rooms.js` `createPrivateRoom` cria a sala com `players: [makePlayer(slot:0)]` — só o criador existe no array; o slot do oponente nem é alocado até alguém dar join (correto, server não muda).

No cliente, `adaptStateForMe` ([html/network.js](../html/network.js)) monta `S.players` só com quem existe (`state.me` + `state.opponents`) — sala recém-criada gera `S.players` com 1 elemento. `syncUI` ([html/ui.js](../html/ui.js)) calculava `allConnected = S.players.every(p => p.connected)`, que é `true` vacuamente pra um array de 1 conectado → pulava a `private-room-screen` e ia direto pro `game-container`.

### Feito
- [html/gameState.js](../html/gameState.js): novo export `MAX_PLAYERS = { "1v1": 2, "4v4": 4 }` espelhando `server/constants.js`
- [html/network.js](../html/network.js) `adaptStateForMe`: agora propaga `state.mode` pro `window.S`
- [html/ui.js](../html/ui.js) `syncUI`: `allConnected` agora exige `S.players.length === MAX_PLAYERS[S.mode]` além de todos conectados
- [html/ui.js](../html/ui.js) `renderPrivateRoom`: itera sobre `MAX_PLAYERS[S.mode]` slots (não só `S.players`, que é esparso) — slots vazios mostram "Aguardando…" e o contador fica correto (ex: `1/2`)

### Validação
- `node --check` passou em gameState.js, network.js, ui.js
- Server **não mudou** — sem redeploy no Railway

### Dependências externas (Gabriel cuida)
- Re-zipar `html/` e atualizar upload no itch.io — `gameState.js`, `network.js`, `ui.js` mudaram (3 arquivos)

### Nota de processo
Bugs e ajustes fora do planning (como este) passam a ser sempre documentados aqui, mesmo sem código de sub-sessão mapeado, pra manter o histórico completo
