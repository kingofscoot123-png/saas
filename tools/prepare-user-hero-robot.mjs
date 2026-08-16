import sharp from "sharp";
import path from "node:path";

const source =
  "C:\\Users\\Shaked\\.cursor\\projects\\c-Users-Shaked-saas\\assets\\c__Users_Shaked_AppData_Roaming_Cursor_User_workspaceStorage_2ea4513e1fa037f60ac7636b58172724_images_robot-final.png-4e1f016c-3be5-4a66-853b-2cbf2a24695e.png";
const target = path.join("C:\\Users\\Shaked\\saas", "assets", "robot-final.png");

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

const isOuterBackdrop = (r, g, b, a) => {
  if (a < 8) return true;
  const lum = lumOf(r, g, b);
  const chroma = chromaOf(r, g, b);
  return distWhite(r, g, b) < 28 || (lum > 244 && chroma < 16);
};

const isHoleWhite = (r, g, b, a) => {
  if (a < 8) return true;
  const lum = lumOf(r, g, b);
  const chroma = chromaOf(r, g, b);
  return distWhite(r, g, b) < 24 && lum > 240 && chroma < 14;
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

const flood = (isMatch) => {
  const reached = new Uint8Array(count);
  const visited = new Uint8Array(count);
  const queue = [];
  const tryEnqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index]) return;
    const o = index * 4;
    if (!isMatch(data[o], data[o + 1], data[o + 2], data[o + 3])) return;
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
    reached[index] = 1;
    const x = index % width;
    const y = Math.floor(index / width);
    for (const [dx, dy] of dirs4) tryEnqueue(x + dx, y + dy);
  }

  return reached;
};

const outerClear = flood(isOuterBackdrop);
const alpha = new Uint8Array(count);
for (let i = 0; i < count; i += 1) {
  alpha[i] = outerClear[i] ? 0 : 255;
}

const holeVisited = new Uint8Array(count);
let holesCleared = 0;
for (let start = 0; start < count; start += 1) {
  if (alpha[start] === 0 || holeVisited[start]) continue;
  const o = start * 4;
  if (!isHoleWhite(data[o], data[o + 1], data[o + 2], data[o + 3])) continue;

  const stack = [start];
  const component = [];
  holeVisited[start] = 1;

  while (stack.length) {
    const index = stack.pop();
    component.push(index);
    const x = index % width;
    const y = Math.floor(index / width);
    for (const [dx, dy] of dirs4) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      if (holeVisited[ni] || alpha[ni] === 0) continue;
      const no = ni * 4;
      if (!isHoleWhite(data[no], data[no + 1], data[no + 2], data[no + 3])) continue;
      holeVisited[ni] = 1;
      stack.push(ni);
    }
  }

  if (component.length < 20) continue;

  let darkBorder = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  const inComponent = new Set(component);
  for (const index of component) {
    const o = index * 4;
    sumR += data[o];
    sumG += data[o + 1];
    sumB += data[o + 2];
    const x = index % width;
    const y = Math.floor(index / width);
    for (const [dx, dy] of dirs8) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      if (inComponent.has(ni) || alpha[ni] === 0) continue;
      const no = ni * 4;
      if (lumOf(data[no], data[no + 1], data[no + 2]) < 90) darkBorder += 1;
    }
  }

  const meanR = sumR / component.length;
  const meanG = sumG / component.length;
  const meanB = sumB / component.length;
  const meanChroma = Math.max(meanR, meanG, meanB) - Math.min(meanR, meanG, meanB);
  const paperWhite =
    meanR >= 251 &&
    meanG >= 251 &&
    meanB >= 251 &&
    meanChroma <= 2;
  const isEnclosedGap = paperWhite && darkBorder >= 20 && component.length >= 40;
  if (!isEnclosedGap) continue;

  for (const index of component) {
    alpha[index] = 0;
    holesCleared += 1;
  }
}

let fringeCleared = 0;
for (let pass = 0; pass < 10; pass += 1) {
  let changed = 0;
  const next = new Uint8Array(alpha);
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
      const lum = lumOf(data[o], data[o + 1], data[o + 2]);
      if (lum > 48) {
        next[index] = 0;
        changed += 1;
      }
    }
  }
  alpha.set(next);
  fringeCleared += changed;
  if (!changed) break;
}

for (let i = 0; i < count; i += 1) {
  const o = i * 4;
  if (alpha[i] === 0) {
    data[o] = 0;
    data[o + 1] = 0;
    data[o + 2] = 0;
    data[o + 3] = 0;
    continue;
  }
  data[o + 3] = 255;
}

await sharp(data, {
  raw: { width, height, channels: 4 },
})
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
  .png({ compressionLevel: 9 })
  .toFile(target);

const check = await sharp(target).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let opaque = 0;
let interiorWhite = 0;
let edgeHalo = 0;
for (let y = 1; y < check.info.height - 1; y += 1) {
  for (let x = 1; x < check.info.width - 1; x += 1) {
    const o = (y * check.info.width + x) * 4;
    const a = check.data[o + 3];
    if (a < 40) continue;
    opaque += 1;
    const r = check.data[o];
    const g = check.data[o + 1];
    const b = check.data[o + 2];
    const lum = lumOf(r, g, b);
    const chroma = chromaOf(r, g, b);
    if (lum > 245 && chroma < 12) {
      let surrounded = 0;
      for (const [dx, dy] of dirs4) {
        if (check.data[((y + dy) * check.info.width + (x + dx)) * 4 + 3] > 40) surrounded += 1;
      }
      if (surrounded === 4) interiorWhite += 1;
    }

    let touchesClear = false;
    for (const [dx, dy] of dirs8) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= check.info.width || ny >= check.info.height) {
        touchesClear = true;
        break;
      }
      if (check.data[(ny * check.info.width + nx) * 4 + 3] < 20) {
        touchesClear = true;
        break;
      }
    }
    if (touchesClear && lum > 70) edgeHalo += 1;
  }
}

console.log({
  target,
  size: `${check.info.width}x${check.info.height}`,
  opaque,
  holesCleared,
  fringeCleared,
  interiorWhite,
  edgeHalo,
});
