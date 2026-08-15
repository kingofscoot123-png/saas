import sharp from "sharp";
import path from "node:path";

const source =
  "C:\\Users\\Shaked\\.cursor\\projects\\c-Users-Shaked-saas\\assets\\c__Users_Shaked_AppData_Roaming_Cursor_User_workspaceStorage_2ea4513e1fa037f60ac7636b58172724_images_________-58370aa9-7211-4cef-b06b-171be66fe7f3.png";
const target = path.join("C:\\Users\\Shaked\\saas", "assets", "hero-robot-user-transparent.png");

const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;
const count = width * height;
const white = [254, 254, 254];

const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const chromaOf = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);
const distWhite = (r, g, b) => Math.hypot(r - white[0], g - white[1], b - white[2]);

const isBackdrop = (r, g, b, a) => {
  if (a < 8) return true;
  if (b > r + 18 && b > g + 8) return false;
  const lum = lumOf(r, g, b);
  const chroma = chromaOf(r, g, b);
  return distWhite(r, g, b) < 22 || (lum > 248 && chroma < 12);
};

const dirs4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const dirs8 = [
  ...dirs4,
  [1, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
];

const candidate = new Uint8Array(count);
for (let i = 0; i < count; i += 1) {
  const o = i * 4;
  candidate[i] = isBackdrop(data[o], data[o + 1], data[o + 2], data[o + 3]) ? 1 : 0;
}

const clear = new Uint8Array(count);
const visited = new Uint8Array(count);
const queue = [];
const tryEnqueue = (x, y) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const index = y * width + x;
  if (visited[index] || !candidate[index]) return;
  visited[index] = 1;
  queue.push(index);
};

for (let x = 0; x < width; x += 1) {
  tryEnqueue(x, 0);
  tryEnqueue(x, height - 1);
}
for (let y = 0; y < height; y += 1) {
  tryEnqueue(0, y);
  tryEnqueue(width - 1, y);
}

for (let cursor = 0; cursor < queue.length; cursor += 1) {
  const index = queue[cursor];
  clear[index] = 1;
  const x = index % width;
  const y = Math.floor(index / width);
  for (const [dx, dy] of dirs4) tryEnqueue(x + dx, y + dy);
}

const alpha = new Uint8Array(count);
for (let i = 0; i < count; i += 1) {
  alpha[i] = clear[i] ? 0 : 255;
}

for (let pass = 0; pass < 3; pass += 1) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (alpha[index] === 0) continue;

      let touchesClear = false;
      for (const [dx, dy] of dirs8) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || alpha[ny * width + nx] === 0) {
          touchesClear = true;
          break;
        }
      }
      if (!touchesClear) continue;

      const o = index * 4;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      const lum = lumOf(r, g, b);
      const chroma = chromaOf(r, g, b);
      const dWhite = distWhite(r, g, b);

      if (dWhite < 30 || (lum > 240 && chroma < 18)) {
        alpha[index] = 0;
        continue;
      }

      if (pass === 0 && (dWhite < 72 || (lum > 182 && chroma < 42))) {
        const t = Math.min(1, Math.max(0, (dWhite - 18) / 54));
        alpha[index] = Math.round(t * t * 255);
      }
    }
  }
}

for (let i = 0; i < count; i += 1) {
  const o = i * 4;
  const a = alpha[i];
  if (a === 0) {
    data[o] = 0;
    data[o + 1] = 0;
    data[o + 2] = 0;
    data[o + 3] = 0;
    continue;
  }

  const x = i % width;
  const y = Math.floor(i / width);
  let touchesClear = false;
  for (const [dx, dy] of dirs4) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height || alpha[ny * width + nx] === 0) {
      touchesClear = true;
      break;
    }
  }

  if (touchesClear && lumOf(data[o], data[o + 1], data[o + 2]) > 150) {
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let n = 0;
    for (const [dx, dy] of dirs8) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      if (alpha[ni] < 200) continue;
      const no = ni * 4;
      sr += data[no];
      sg += data[no + 1];
      sb += data[no + 2];
      n += 1;
    }
    if (n > 0) {
      const blend = 0.65;
      data[o] = Math.round(data[o] * (1 - blend) + (sr / n) * blend);
      data[o + 1] = Math.round(data[o + 1] * (1 - blend) + (sg / n) * blend);
      data[o + 2] = Math.round(data[o + 2] * (1 - blend) + (sb / n) * blend);
    }
  }

  data[o + 3] = a;
}

await sharp(data, {
  raw: { width, height, channels: 4 },
})
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
  .png({ compressionLevel: 9 })
  .toFile(target);

const check = await sharp(target).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let edgeFringe = 0;
let opaque = 0;
for (let y = 0; y < check.info.height; y += 1) {
  for (let x = 0; x < check.info.width; x += 1) {
    const o = (y * check.info.width + x) * 4;
    const a = check.data[o + 3];
    if (a < 40) continue;
    opaque += 1;
    let touch = false;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= check.info.width || ny >= check.info.height) {
          touch = true;
          break;
        }
        if (check.data[(ny * check.info.width + nx) * 4 + 3] < 20) touch = true;
      }
      if (touch) break;
    }
    if (!touch) continue;
    const r = check.data[o];
    const g = check.data[o + 1];
    const b = check.data[o + 2];
    const lum = lumOf(r, g, b);
    const chroma = chromaOf(r, g, b);
    if (lum > 150 && chroma < 55) edgeFringe += 1;
  }
}

console.log({
  target,
  size: `${check.info.width}x${check.info.height}`,
  opaque,
  edgeFringe,
});
