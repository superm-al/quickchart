import { randomBytes } from 'node:crypto';

function generateRandomId(length: number): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

export function uniqueSvg(svg: string): string {
  const id = generateRandomId(10);
  return svg
    .replace(/id="clip/g, `id="${id}__clip`)
    .replace(/clip-path="url\(#clip/g, `clip-path="url(#${id}__clip`);
}
