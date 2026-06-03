// Génère public/apple-touch-icon.png (512x512) sans dépendance externe :
// fond sombre + "H" teal dessiné directement dans le buffer de pixels.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SIZE = 512;
const BG = [11, 14, 20, 255]; // #0b0e14
const FG = [94, 234, 212, 255]; // #5eead4

const px = Buffer.alloc(SIZE * SIZE * 4);
function set(x, y, c) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = c[3];
}

// Fond
for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) set(x, y, BG);

// "H" : deux barres verticales + une barre horizontale
const fill = (x0, y0, x1, y1) => {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, FG);
};
fill(150, 130, 200, 382); // barre gauche
fill(312, 130, 362, 382); // barre droite
fill(150, 232, 362, 280); // barre centrale

// Encodage PNG (filtre 0 par scanline)
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  px.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "apple-touch-icon.png");
writeFileSync(out, png);
console.log(`écrit: ${out} (${png.length} octets)`);
