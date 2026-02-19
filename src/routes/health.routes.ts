import { Router } from 'express';
import { handleHealthcheck } from '../controllers/health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', handleHealthcheck);
