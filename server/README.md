# 4x4 — Server (Node + Socket.io)

Server local pra testar a próxima fase do multiplayer. **Ainda não substitui o Firebase** — é só o esqueleto que liga e responde "pong", confirmando que cliente e servidor conseguem se falar. A substituição completa do Firebase acontece em SEC-001.10/11.

## Pré-requisito

Node.js **20 ou superior**.

Pra ver o que você tem instalado, no terminal:

```
node --version
```

Se aparecer `v20.x.x` (ou maior), OK. Se não tiver Node ou estiver desatualizado, baixar a versão LTS em [nodejs.org/download](https://nodejs.org/download/).

## Instalar (só na primeira vez)

No terminal, entrar na pasta `server/` e rodar:

```
cd server
npm install
```

Isso baixa as dependências (`express` e `socket.io`) e cria uma pasta `node_modules/`. Ela é ignorada pelo Git automaticamente — não precisa se preocupar.

## Rodar

```
npm start
```

Esperado no terminal:

```
[server] listening on :3000
```

Se essa linha apareceu, o server está vivo na porta 3000.

## Testar

Duas verificações independentes confirmam que o server funciona:

### 1. HTTP responde

Com o server rodando, abrir [http://localhost:3000](http://localhost:3000) no navegador.

Esperado: o texto `4x4 server ok`.

### 2. Socket.io faz eco

Com o server ainda rodando, abrir [http://localhost:3000/test-client.html](http://localhost:3000/test-client.html) no navegador.

> **Por que não duplo-clique no arquivo?** Aberto via `file://`, o navegador bloqueia a conexão com o server por segurança (CORS). Servir pelo próprio server resolve.

Apertar o botão **Ping**. No log da página deve aparecer:

- `connected (id)` — conexão estabelecida
- `pong recebido: { pong: true, echoed: ..., t: ... }` — o server respondeu

Se as duas verificações funcionarem, **SEC-001.2 está OK** e SEC-001.3 pode começar.

## Parar o server

No terminal onde ele está rodando, `Ctrl+C`.

## Variáveis de ambiente

| Nome   | Default | Quando importa                                         |
|--------|---------|--------------------------------------------------------|
| `PORT` | `3000`  | Railway injeta um valor próprio em produção (SEC-001.10). Em local, deixar default. |

## Próxima sessão

**SEC-001.3** — implementar o lifecycle de Private Room (criação com código ABCD, join, disconnect).
