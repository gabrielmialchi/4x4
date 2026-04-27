# /testes — Backup congelado

Este diretório contém **backup congelado da Alpha 2.2_Visual** do jogo 4x4.

## Não editar

O arquivo [`index.html`](index.html) neste diretório **não deve ser modificado**. Toda mudança em curso (features, refatorações, bugfixes) vai direto para [`../html/index.html`](../html/index.html), que é o pivot ativo do projeto.

## Para que serve

- Snapshot histórico da última versão "aprovada" antes do início do trabalho multi-agente em 2026-04-26
- Referência visual rápida sem precisar abrir Git
- **Não é sandbox de experimentação.** Rollback de mudanças no pivot é feito via Git (`git revert`, `git checkout`, etc.), não via cópia de arquivo deste diretório

## Estado em 2026-04-26

`testes/index.html` está byte-a-byte idêntico a `html/index.html` na fotografia atual. Conforme `html/` evolui pelo backlog em [`../docs/SESSAO_POR_SESSAO_PLANNING.md`](../docs/SESSAO_POR_SESSAO_PLANNING.md), os dois divergirão — comportamento esperado.

Regra correspondente: inviolável #9 do [`../CLAUDE.md`](../CLAUDE.md).
