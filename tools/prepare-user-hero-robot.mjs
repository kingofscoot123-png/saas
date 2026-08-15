import sharp from "sharp";
import path from "node:path";

const source =
  "C:\\Users\\Shaked\\.cursor\\projects\\c-Users-Shaked-saas\\assets\\c__Users_Shaked_AppData_Roaming_Cursor_User_workspaceStorage_2ea4513e1fa037f60ac7636b58172724_images_Gemini_Generated_Image_iuesxgiuesxgiues-4555b0bf-7d1e-4420-987a-f3e3cdc822ea.png";
const target = path.join("C:\\Users\\Shaked\\saas", "assets", "hero-robot-user-transparent.png");

const sitePrimary = [91, 44, 130];
const siteAccent = [78, 205, 196];
const siteCyan = [0, 240, 255];

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
};

const hslToRgb = (h, s, l) => {
  const hue = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(hue + 1 / 3) * 255),
    Math.round(hue2rgb(hue) * 255),
    Math.round(hue2rgb(hue - 1 / 3) * 255),
  ];
};

const isBrownHue = (h, s, l) => {
  if (s < 0.1 || l < 0.12 || l > 0.9) return false;
  return (h >= 0 && h <= 70) || h >= 330;
};

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
const mix = (from, to, amount) => Math.round(from * (1 - amount) + to * amount);

const isBackdrop = (r, g, b, a) => {
  if (a < 8) return true;
  if (b > r + 18 && b > g + 8) return false;
  const lum = lumOf(r, g, b);
  const chroma = chromaOf(r, g, b);
  return distWhite(r, g, b) < 22 || (lum > 248 && chroma < 12);
};

const applySiteColors = (r, g, b, a) => {
  if (a < 24) return [r, g, b];

  const lum = lumOf(r, g, b);
  const [h, s, l] = rgbToHsl(r, g, b);

  if (lum < 28 || (r < 40 && g < 40 && b < 40 && s < 0.2)) {
    return [r, g, b];
  }

  const warm = r > b + 6 && r >= g - 4 && (h <= 70 || h >= 330);
  if (isBrownHue(h, s, l) || (warm && lum > 28 && lum < 235 && s > 0.06)) {
    const targetHue = l < 0.38 ? 278 : 174;
    const targetSat = l < 0.38 ? 0.46 : 0.4;
    return hslToRgb(targetHue, targetSat, Math.min(0.78, l));
  }

  const isGlow = b > r + 20 && lum > 120;
  if (isGlow) {
    return [
      mix(r, siteCyan[0], 0.55),
      mix(g, siteCyan[1], 0.55),
      mix(b, siteCyan[2], 0.55),
    ];
  }

  const isBody = b >= r - 18 && lum > 95;
  if (isBody) {
    const amount = lum > 190 ? 0.22 : 0.32;
    return [
      mix(r, siteAccent[0], amount),
      mix(g, siteAccent[1], amount),
      mix(b, siteAccent[2], amount),
    ];
  }

  if (b > r && lum > 70) {
    return [
      mix(r, siteAccent[0], 0.18),
      mix(g, siteAccent[1], 0.18),
      mix(b, siteAccent[2], 0.18),
    ];
  }

  return [r, g, b];
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

  let r = data[o];
  let g = data[o + 1];
  let b = data[o + 2];

  if (touchesClear && lumOf(r, g, b) > 150) {
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
      r = Math.round(r * (1 - blend) + (sr / n) * blend);
      g = Math.round(g * (1 - blend) + (sg / n) * blend);
      b = Math.round(b * (1 - blend) + (sb / n) * blend);
    }
  }

  [r, g, b] = applySiteColors(r, g, b, a);
  const [hh, ss, ll] = rgbToHsl(r, g, b);
  if (isBrownHue(hh, ss, ll) || (r > b + 8 && r >= g && ss > 0.08 && ll > 0.14 && ll < 0.88)) {
    [r, g, b] = hslToRgb(ll < 0.4 ? 278 : 174, 0.42, ll);
  }
  data[o] = r;
  data[o + 1] = g;
  data[o + 2] = b;
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

let brownLeft = 0;
for (let i = 0; i < check.data.length; i += 4) {
  if (check.data[i + 3] < 40) continue;
  const [h, s, l] = rgbToHsl(check.data[i], check.data[i + 1], check.data[i + 2]);
  if (isBrownHue(h, s, l)) brownLeft += 1;
}

console.log({
  target,
  size: `${check.info.width}x${check.info.height}`,
  opaque,
  edgeFringe,
  brownLeft,
});
