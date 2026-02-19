import PDFDocument from 'pdfkit';

const IMAGE_MARGIN = 35;

export function getPdfBufferFromPng(image: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.image(image, IMAGE_MARGIN, 100, {
        fit: [doc.page.width - IMAGE_MARGIN * 2, doc.page.height - IMAGE_MARGIN * 2],
        align: 'center',
      });
      doc.end();
    } catch (err) {
      reject(new Error(`PDF generation error: ${(err as Error).message}`));
    }
  });
}
