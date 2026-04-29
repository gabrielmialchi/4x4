// startScreen.js — Tela inicial de escolha de matchmaking + modo (MATCH-001.3).
// Mostra o overlay #start-screen e resolve uma Promise quando o jogador escolhe um caminho.
// Resolve com { action: "random"|"createPrivate"|"joinPrivate", mode: "1v1"|"4v4", roomId? }.

// 4v4 fica visível mas desabilitado até MODE-001 chegar — cliente atual só renderiza 2 jogadores.
const MODE_4V4_LOCKED = true;

export function showStartScreen() {
    return new Promise((resolve) => {
        const screen = document.getElementById("start-screen");
        const btnRandom = document.getElementById("ss-btn-random");
        const btnCreate = document.getElementById("ss-btn-create");
        const btnJoin = document.getElementById("ss-btn-join");
        const inputCode = document.getElementById("ss-input-code");
        const errBox = document.getElementById("ss-error");
        const mode1v1 = document.getElementById("ss-mode-1v1");
        const mode4v4 = document.getElementById("ss-mode-4v4");

        let selectedMode = "1v1";

        if (MODE_4V4_LOCKED) {
            mode4v4.classList.add("locked");
            mode4v4.title = "Em breve";
        }

        function setMode(m) {
            if (m === "4v4" && MODE_4V4_LOCKED) return;
            selectedMode = m;
            mode1v1.classList.toggle("active", m === "1v1");
            mode4v4.classList.toggle("active", m === "4v4");
        }
        mode1v1.onclick = () => setMode("1v1");
        mode4v4.onclick = () => setMode("4v4");
        setMode("1v1");

        function showError(msg) {
            errBox.textContent = msg;
            errBox.style.display = "block";
        }

        function finish(result) {
            screen.style.display = "none";
            // Limpa handlers pra não vazar referências se a tela voltar a abrir no futuro
            btnRandom.onclick = null;
            btnCreate.onclick = null;
            btnJoin.onclick = null;
            mode1v1.onclick = null;
            mode4v4.onclick = null;
            resolve(result);
        }

        btnRandom.onclick = () => finish({ action: "random", mode: selectedMode });
        btnCreate.onclick = () => finish({ action: "createPrivate", mode: selectedMode });
        btnJoin.onclick = () => {
            const code = (inputCode.value || "").trim();
            if (code.length === 0) {
                showError("Digite o código da sala.");
                return;
            }
            finish({ action: "joinPrivate", mode: selectedMode, roomId: code });
        };

        // Enter no input dispara joinPrivate
        inputCode.onkeydown = (ev) => {
            if (ev.key === "Enter") btnJoin.onclick();
        };

        screen.style.display = "flex";
        errBox.style.display = "none";
        inputCode.value = "";
    });
}

// Tela "Procurando oponente" (Random Match). Resolve com:
//   { result: "matched" }    — server emitiu match_found (notifyMatchFound foi chamado)
//   { result: "cancelled" }  — jogador clicou CANCELAR
let _matchFoundResolve = null;

export function showSearchingScreen() {
    return new Promise((resolve) => {
        const screen = document.getElementById("searching-screen");
        const btnCancel = document.getElementById("searching-btn-cancel");

        function cleanup() {
            screen.style.display = "none";
            btnCancel.onclick = null;
            _matchFoundResolve = null;
        }

        btnCancel.onclick = () => {
            cleanup();
            resolve({ result: "cancelled" });
        };

        _matchFoundResolve = () => {
            cleanup();
            resolve({ result: "matched" });
        };

        screen.style.display = "flex";
    });
}

// Chamado pelo handler match_found em network.js — fecha a tela de busca se ativa.
// Idempotente: se ninguém está esperando, é no-op.
export function notifyMatchFound() {
    if (_matchFoundResolve) _matchFoundResolve();
}
