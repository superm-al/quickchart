import { Router } from 'express';
import { validate, validateMerged } from '../middleware/validate.js';
import { chartSchema } from '../schemas/chart.schema.js';
import { handleChart } from '../controllers/chart.controller.js';

export const chartRouter = Router();

chartRouter.get('/', validate(chartSchema, 'query'), handleChart);
chartRouter.post('/', validateMerged(chartSchema), handleChart);
