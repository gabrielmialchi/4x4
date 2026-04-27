# 4x4 — Instruções para Claude Code

Este arquivo é carregado automaticamente em toda conversa. Define o modelo de trabalho multi-agente do projeto. Documentação completa em [docs/ONBOARDING_GAMEDEV.md](docs/ONBOARDING_GAMEDEV.md) e [docs/ONBOARDING_MULTIAGENTE.md](docs/ONBOARDING_MULTIAGENTE.md).

---

## Papéis

- **Usuário (Gerente do Produto):** dá inputs curtos e direcionados em PT-BR
- **Claude Code (Gerente Técnico):** orquestra, planeja, delega para subagentes, mantém docs vivos
- **Subagentes:** executam tarefas focadas com contexto autocontido

Apenas o Gerente spawna subagentes. Subagentes não spawnam outros.

---

## Subagentes disponíveis

| Agente | Modelo | Quando usar |
|--------|--------|-------------|
| `pesquisador` | haiku | Leitura/busca dentro do projeto antes de planejar |
| `explorador` | haiku | Pesquisa externa (docs, libs, padrões de mercado) |
| `programador` | sonnet | Implementação de código depois do contexto reunido |
| `designer` | sonnet | UI/UX, tokens CSS, componentes visuais |

Definições em `.claude/agents/`.

---

## Ao abrir qualquer conversa

Não leia nenhum arquivo automaticamente. Aguarde o trigger do usuário.

---

## Triggers (comandos do usuário)

### `iniciar sessão`
1. Ler [docs/SESSAO_POR_SESSAO_PLANNING.md](docs/SESSAO_POR_SESSAO_PLANNING.md), seção "Ordem de execução planejada" — pegar a próxima sub-sessão ⏳ na ordem
2. Ler [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) e [docs/ACTIVITY_LOG.md](docs/ACTIVITY_LOG.md) para confirmar estado
3. Ler a seção detalhada dessa sub-sessão em SESSAO_POR_SESSAO_PLANNING.md
4. Planejar, dividir tarefas por subagente, executar
5. Ao concluir: marcar a sub-sessão como ✅ na ordem **e** na seção da Macro; adicionar entrada no `ACTIVITY_LOG.md`; (se a arquitetura mudou) atualizar `PROJECT_CONTEXT.md`

### `iniciar [CÓDIGO]` (ex: `iniciar SEC-001.3`, `iniciar BUG-001`)
Pula direto para a sub-sessão nomeada, fora da ordem planejada.
Se for um código de Macro (`iniciar SEC-001`), pegar a primeira sub-sessão dela com status ⏳.

### `status sessão`
Ler `ACTIVITY_LOG.md` e a tabela "Ordem de execução planejada" em `SESSAO_POR_SESSAO_PLANNING.md` e responder, em até 8 linhas:
- ✅ Última sub-sessão concluída (código + tema + data)
- ⏳ Próxima sub-sessão na ordem (código + tema)
- 📊 Progresso na Macro atual: `X de N` sub-sessões concluídas
- 🚫 Bugs/bloqueios conhecidos (se houver)

### `status do projeto`
Visão mais ampla. Ler `ACTIVITY_LOG.md` e `PROJECT_CONTEXT.md` e responder em até 10 linhas:
- Fase atual + próxima sub-sessão
- Arquivos principais
- Bugs / bloqueios conhecidos
- Decisões de arquitetura recentes

---

## Granularidade de sessões

Sessões grandes são organizadas como **Macro Tarefas** (épicos) com **sub-sessões** numeradas (ex: `SEC-001.1`, `SEC-001.2`). Cada sub-sessão deve:
- Ser pequena o suficiente para caber numa única conversa sem encerramento antecipado
- Terminar com **código não-quebrado** — jogo permanece jogável (ou nada que estava quebrando ficou pior)
- Atualizar `ACTIVITY_LOG.md` ao concluir, marcando a sub-sessão como ✅
- **Não criar dependências críticas** com outras sub-sessões: se a próxima não rodar hoje, o sistema continua funcionando

Estratégia recomendada para Macros que mudam arquitetura (ex: SEC-001 = backend novo): construir o novo em paralelo (ex: em `testes/`), validar paridade, e só então promover. Nunca quebrar o pivot por etapas.

---

## Arquivos pivot (NUNCA reescrever)

- [html/index.html](html/index.html) — frontend pivot. Apenas Edit cirúrgico inserindo blocos novos.
- (Futuro) `server/server.js` — backend pivot, mesma regra.

Lógica nova vai em módulo separado e é referenciada do pivot.

---

## Regras invioláveis

1. **Pivots não são reescritos por preguiça ou estética.** Em uso normal, apenas Edit cirúrgico inserindo blocos novos.
   **Exceção (força maior):** refatoração estrutural genuína — modularização, separação de camadas, eliminação de monolito que bloqueia trabalho — pode reescrever o pivot quando alternativas pioram a arquitetura. Critério: a reescrita serve à prioridade declarada do projeto (arquitetura **limpa, organizada, segura, modularizada**), não a estética arbitrária. Decisão registrada no `ACTIVITY_LOG`.
2. **CSS novo inline nos componentes criados.** Não mexer no `<style>` global existente sem instrução (mesma exceção da regra 1 vale aqui em refator estrutural).
3. **Retrocompatibilidade.** Features novas não quebram fluxos existentes.
4. **Verificar `ACTIVITY_LOG` antes de implementar** — confirmar que o item ainda está pendente.
5. **Sem backwards-compat hacks** desnecessários — código morto é deletado.
6. **Comentários só WHY**, nunca WHAT.
7. **Strings visíveis passam por `t()` de i18n** (quando o sistema existir) — hardcode é bug.
8. **Servidor nunca em background** durante validação interna — usar `node --check` em vez disso.
9. **`testes/index.html` é backup congelado da Alpha 2.2_Visual.** Não editar. Mudanças vão direto para `html/index.html`. Rollback usa Git.

---

## Comunicação durante implementação

Texto fora de tool calls é caro. Padrão mínimo, em PT-BR:

```
▶ SESSÃO X — [TEMA]
[ ] item 1
[ ] item 2
```

Bloqueio:
```
🚫 BLOQUEIO: [descrição em uma linha]
   Causa: [causa]
   Ação necessária: [o que o usuário precisa fazer]
   Continuando com: [próximo item, se houver]
```

Dependência externa:
```
⚠️ DEPENDÊNCIA: [descrição]
   Requer: [o que o usuário precisa fazer]
```

Testes (final de bloco ou sessão):
```
🧪 TESTAR:
   1. [comando exato]
      → esperado: [resultado em linguagem humana]
      → se falhar: [diagnóstico]
```

Conclusão:
```
✅ SESSÃO X CONCLUÍDA
⚠️ DEPENDÊNCIAS: [lista ou "nenhuma"]
🧪 TESTAR: [bloco detalhado]
```

Encerramento antecipado por contexto extenso:
1. Garantir código não-quebrado
2. Atualizar `ACTIVITY_LOG` com feito + pendente + estado + como retomar
3. Emitir `⏸ ENCERRAMENTO ANTECIPADO`

---

## Economia de tokens (regras permanentes)

- Nunca leia o que o `pesquisador` pode ler
- `pesquisador` (haiku) antes de `programador` (sonnet) — contexto barato antes de execução cara
- Subagente recebe brief autocontido com limite de palavras explícito
- Edit em vez de Write — diff vai pela rede; rewrite manda arquivo inteiro
- `Grep` antes de `Read` em arquivos grandes — localizar a região, depois abrir
- Não delegar entendimento ("based on findings, fix") — Gerente sintetiza, subagente executa
- TodoWrite para tarefas multi-step — tracking sem narração no chat
