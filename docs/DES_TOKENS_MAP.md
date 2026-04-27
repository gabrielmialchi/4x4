# DES_TOKENS_MAP — Mapa de cores não-tokenizadas

**Saída de:** DES-002.1 (2026-04-27)
**Insumo de:** DES-002.2 (criar tokens), DES-002.3 (substituir em CSS), DES-002.4 (substituir em JS)

---

## 1. Tokens já existentes em `style.css :root`

`--bg`, `--surf`, `--surf2`, `--bdr`, `--bdr2`, `--p1`, `--p2`, `--trap`, `--combat`, `--gold`, `--text`, `--dim`, `--gp1`, `--gp2`.

## 2. Hex hardcoded em CSS (6 ocorrências)

| Linha (style.css) | Valor | Uso | Token proposto |
|---|---|---|---|
| 129 | `#02020a` | background célula em fog | `--fog-bg` |
| 129 | `#08070f` | border célula em fog | `--fog-bdr` |
| 133 | `#110d03` | background alvo SPRINT | `--sprint-bg` |
| 208 | `#22c55e` | border/color botão active | `--btn-active` |
| 231 | `#010008` | background overlay combate | `--combat-bg` |
| 414 | `#020108` | background log | `--log-bg` |

## 3. Hex hardcoded em HTML (1 ocorrência)

| Local | Valor |
|---|---|
| `index.html:77` (botão "NOVA MISSÃO") | `#22c55e` + `rgba(34,197,94,.07)` — mesma cor de `.button.active` |

## 4. rgba/rgb literais em CSS (~30 ocorrências, agrupadas)

### 4.1 Variações de cores existentes (preferir `color-mix(in srgb, var(--X) Y%, transparent)`)
- `rgba(59,143,239,...)` — variantes de `--p1`. Linhas 31, 168, 177, 178, ...
- `rgba(239,59,59,...)` — variantes de `--p2`. Linhas 32, 172, 181, 182, ...
- `rgba(200,168,75,...)` — variantes de `--gold`. Linhas 131, 139, 205, 213, 217, 218, 341
- `rgba(245,166,35,...)` — variantes de `--combat`. Linhas 135, 143, 265, 346
- `rgba(147,51,234,...)` — variante de `--trap`. Linha 177

### 4.2 Cores próprias (candidatas a token novo)
- `rgba(0,0,0,.8)` (113), `rgba(0,0,0,.4)` (113) — sombras → `--shadow-heavy`, `--shadow-light`
- `rgba(255,255,255,.012)` (42), `rgba(255,255,255,.018)` (255) — scanlines → `--scanline`, `--scanline-combat`
- `rgba(255,255,255,.18)` (159) — inner ring de peça → `--piece-ring`
- `rgba(255,255,255,.35)` (164) — diamond marker de peça → `--piece-diamond`
- `rgba(130,200,255,.5)` (168) — highlight P1 (azul claro) → `--p1-highlight`
- `rgba(255,130,130,.5)` (172) — highlight P2 (vermelho claro) → `--p2-highlight`
- `rgba(34,197,94,.07)` (209) — bg botão active → derivado de `--btn-active` via `color-mix`

## 5. JS inline

**Nenhuma** ocorrência em `gameState.js`, `network.js`, `combat.js`, `ui.js`, `validators.js`. Todas as cores aplicadas via JS já usam `var(--token)`. **DES-002.4 será praticamente uma sub-sessão de validação (no-op).**

## 6. Síntese / proposta para DES-002.2

**Tokens novos a adicionar em `:root`:**

```
--btn-active:        #22c55e;
--fog-bg:            #02020a;
--fog-bdr:           #08070f;
--sprint-bg:         #110d03;
--combat-bg:         #010008;
--log-bg:            #020108;
--shadow-heavy:      rgba(0,0,0,.8);
--shadow-light:      rgba(0,0,0,.4);
--scanline:          rgba(255,255,255,.012);
--scanline-combat:   rgba(255,255,255,.018);
--piece-ring:        rgba(255,255,255,.18);
--piece-diamond:     rgba(255,255,255,.35);
--p1-highlight:      rgba(130,200,255,.5);
--p2-highlight:      rgba(255,130,130,.5);
```

**Estratégia para variações de cor existente:** em vez de criar 5+ tokens `--gold-glow`, `--gold-shadow`, `--gold-bg`, etc., usar `color-mix(in srgb, var(--gold) X%, transparent)` na própria propriedade. Mais legível e evita explosão de tokens.

Exemplo:
```css
/* antes */
box-shadow: inset 0 0 14px rgba(200,168,75,.12);
/* depois */
box-shadow: inset 0 0 14px color-mix(in srgb, var(--gold) 12%, transparent);
```

Esta decisão será revalidada ao executar DES-002.3 (pode ser que `color-mix` não funcione bem em algum browser-alvo — verificar suporte; é `Baseline 2023`, OK para itch.io).
