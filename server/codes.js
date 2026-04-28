// Alfabeto sem caracteres confusos (0/O, 1/I/L) — facilita ditar o código por voz/chat.
// 31 chars × 4 posições = 923.521 combinações, suficiente para Private Rooms (Random Match não usa código).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
