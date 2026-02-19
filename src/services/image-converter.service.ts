import sharp from 'sharp';

export async function pngToWebp(pngBuffer: Buffer, quality = 80): Promise<Buffer> {
  return sharp(pngBuffer).webp({ quality }).toBuffer();
}
