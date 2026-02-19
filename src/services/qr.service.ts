import QRCode from 'qrcode';
import { QrGenerationError } from '../types/errors.js';
import type { QrRenderRequest } from '../types/qr.js';
import { logger } from '../lib/logger.js';

export async function renderQr(request: QrRenderRequest): Promise<Buffer> {
  logger.debug({ request }, 'Rendering QR code');

  const baseOpts = {
    margin: request.margin,
    width: request.size,
    errorCorrectionLevel: (request.ecLevel || 'M') as QRCode.QRCodeErrorCorrectionLevel,
    color: {
      dark: request.dark,
      light: request.light,
    },
  };

  let qrData: string | QRCode.QRCodeSegment[] = request.text;
  if (request.mode === 'sjis') {
    const toSJIS = (await import('qrcode/helper/to-sjis')).default;
    qrData = [{ data: request.text, mode: 'kanji' }];
    Object.assign(baseOpts, { toSJISFunc: toSJIS });
  }

  try {
    if (request.format === 'svg') {
      const svgOpts: QRCode.QRCodeToStringOptions = {
        ...baseOpts,
        type: 'svg',
      };
      const svgStr = await QRCode.toString(qrData, svgOpts);
      return Buffer.from(svgStr, 'utf8');
    }

    const pngOpts: QRCode.QRCodeToDataURLOptions = {
      ...baseOpts,
      type: 'image/png',
    };
    const dataUrl = await QRCode.toDataURL(qrData, pngOpts);
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid QR data URL');
    }
    return Buffer.from(base64Data, 'base64');
  } catch (err) {
    logger.error({ err }, 'QR render error');
    throw new QrGenerationError(`Could not generate QR: ${err}`);
  }
}
