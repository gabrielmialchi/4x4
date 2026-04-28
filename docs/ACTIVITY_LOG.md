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
