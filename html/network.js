// network.js — Camada de rede (Firebase RTDB hoje; será trocado por Socket.io em SEC-001).
//
// Desenhado para que SEC-001.8 possa adicionar uma flag `USE_SERVER` que alterna
// entre Firebase e Socket.io sem refator. Hoje, exporta apenas o caminho Firebase.
//
// Convenção: chamadas de mutação espalhadas no monolito usam `update`/`set`/`ref`/`db`
// importados deste módulo. O monolito é progressivamente migrado para usar funções
// de mais alto nível (sub-sessões SEC-001.*).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// Credenciais públicas — proteção real vem das Security Rules do Firebase.
// Removidas em SEC-001.11 (descontinuar Firebase) ou isoladas em config externa
// caso Firebase Auth seja mantido.
const firebaseConfig = {
    apiKey: "AIzaSyA4QmmwIj2kMNDKOONi6ZbHPWcEApj9VG8",
    authDomain: "game-4x4.firebaseapp.com",
    databaseURL: "https://game-4x4-default-rtdb.firebaseio.com",
    projectId: "game-4x4",
    storageBucket: "game-4x4.firebasestorage.app",
    messagingSenderId: "32618206063",
    appId: "1:32618206063:web:eaec4df537d7d20c438e9a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Globais de runtime expostas em window para preservar compat com código não-modular
// que ainda referencia `roomId`, `myId`, `dbRef` sem prefixo (resolvido via window).
window.roomId = new URLSearchParams(window.location.search).get("sala");
window.myId = null;
window.dbRef = null;

export { db, ref, set, onValue, get, update };

/**
 * Inicializa multiplayer:
 *  - cria sala (se não houver na URL) ou junta como P0/P1
 *  - configura listener de estado e backfill de campos legados
 *  - registra beforeunload para marcar disconnect
 *
 * @param {Function} onStateChange - callback chamado a cada update de estado.
 *   Lê de window.S (já populado quando o callback é invocado).
 */
export async function initMultiplayer(onStateChange) {
    if (!window.roomId) {
        window.roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        window.history.replaceState(null, null, `?sala=${window.roomId}`);
    }
    window.dbRef = ref(db, `rooms/${window.roomId}`);

    const snapshot = await get(window.dbRef);
    if (!snapshot.exists()) {
        window.myId = 0;
        window.S.players[0].connected = true;
        await set(window.dbRef, window.S);
    } else {
        const data = snapshot.val();
        if (!data.players[0].connected) {
            window.myId = 0;
            await update(ref(db, `rooms/${window.roomId}/players/0`), { connected: true });
        } else if (!data.players[1].connected) {
            window.myId = 1;
            await update(ref(db, `rooms/${window.roomId}/players/1`), { connected: true });
        } else {
            alert("Sala cheia!");
            return;
        }
    }
    document.getElementById('invite-link').innerText = window.location.href;

    onValue(window.dbRef, (snap) => {
        if (!snap.exists()) return;
        window.S = snap.val();
        // Backfills para versões antigas do estado serializado:
        if (!window.S.blocks) window.S.blocks = [];
        if (!window.S.traps) window.S.traps = [];
        if (!window.S.spentRes) window.S.spentRes = [];
        if (!window.S.combatLocs) window.S.combatLocs = [];
        if (window.S.players[0].permMod === undefined) window.S.players[0].permMod = 0;
        if (window.S.players[1].permMod === undefined) window.S.players[1].permMod = 0;
        if (!window.S.players[0].history) window.S.players[0].history = [[0, 0]];
        if (!window.S.players[1].history) window.S.players[1].history = [[3, 3]];
        if (onStateChange) onStateChange();
    });

    window.addEventListener("beforeunload", () => {
        if (window.myId !== null) {
            update(ref(db, `rooms/${window.roomId}/players/${window.myId}`), {
                connected: false, ready: false
            });
        }
    });
}
