// Token bucket por socket. Cliente honesto envia <5 eventos/s no pico de planning;
// limite de 30/s deixa folga absurda e ainda barra abuso (loop em DevTools).
// Quando excede, o handler simplesmente descarta o evento — não desconecta o socket
// (cliente honesto nunca chega aqui; cliente malicioso só desperdiça envio).

const CAPACITY = 30;          // tokens máximos no bucket
const REFILL_PER_SEC = 30;    // tokens adicionados por segundo

const buckets = new Map(); // socketId -> { tokens, last }

export function consume(socketId) {
  const now = Date.now();
  let b = buckets.get(socketId);
  if (!b) {
    b = { tokens: CAPACITY, last: now };
    buckets.set(socketId, b);
  } else {
    const elapsed = (now - b.last) / 1000;
    b.tokens = Math.min(CAPACITY, b.tokens + elapsed * REFILL_PER_SEC);
    b.last = now;
  }
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

export function release(socketId) {
  buckets.delete(socketId);
}
