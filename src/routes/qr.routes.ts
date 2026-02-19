import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { qrQuerySchema } from '../schemas/qr.schema.js';
import { handleQr } from '../controllers/qr.controller.js';

export const qrRouter = Router();

qrRouter.get('/', validate(qrQuerySchema, 'query'), handleQr);
