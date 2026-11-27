// Browser-only upload handoff. Never serialize the shopper's image into a URL,
// session, analytics payload, or browser history entry.
let pendingImage;
export function stageSearchImage(file) {pendingImage = file;}
export function consumeSearchImage() {
  const file = pendingImage;
  pendingImage = undefined;
  return file;
}
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_LIMIT = 8 * 1024 * 1024;
export function validUpload(file) {return file?.size > 0 && file.size <= IMAGE_LIMIT && IMAGE_TYPES.includes(file.type);}

// Compact shared visual signature: grayscale edges plus a spatial RGB grid.
// Coarse sampling intentionally ignores tiny format differences.
export function describePixels(rgba) {
  const count = rgba.length / 4;
  const side = Math.sqrt(count);
  const color = new Float32Array(16 * 3);
  const edges = new Float32Array(16);
  const totals = new Uint16Array(16);
  if (!side || side % 4) throw new Error('Expected a square image divisible by four');
  const luminance = (i) => (0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]) / 255;
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const i = 4 * (y * side + x);
      const cell = Math.floor(y * 4 / side) * 4 + Math.floor(x * 4 / side);
      totals[cell]++;
      for (let j = 0; j < 3; j++) color[cell * 3 + j] += rgba[i + j] / 255;
      const l = luminance(i);
      edges[cell] += ((x + 1 < side ? Math.abs(l - luminance(i + 4)) : 0) + (y + 1 < side ? Math.abs(l - luminance(i + side * 4)) : 0)) / 2;
    }
  }
  return {color: color.map((value, i) => value / totals[Math.floor(i / 3)]), edges: edges.map((value, i) => value / totals[i])};
}
export function visualDistance(a, b) {
  const mean = (x, y) => x.reduce((sum, value, i) => sum + Math.abs(value - y[i]), 0) / x.length;
  return mean(a.color, b.color) * 0.72 + mean(a.edges, b.edges) * 0.28;
}
export async function describeImage(blob) {
  const bitmap = await createImageBitmap(blob, {resizeWidth: 64, resizeHeight: 64});
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    if (!context) throw new Error('Canvas is unavailable');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, 32, 32);
    context.drawImage(bitmap, 0, 0, 32, 32);
    return describePixels(context.getImageData(0, 0, 32, 32).data);
  } finally {bitmap.close();}
}
