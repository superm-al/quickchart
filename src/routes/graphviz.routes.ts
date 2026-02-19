import { Router } from 'express';
import { validate, validateMerged } from '../middleware/validate.js';
import { graphvizQuerySchema } from '../schemas/graphviz.schema.js';
import { handleGraphviz } from '../controllers/graphviz.controller.js';

export const graphvizRouter = Router();

graphvizRouter.get('/', validate(graphvizQuerySchema, 'query'), handleGraphviz);
graphvizRouter.post('/', validateMerged(graphvizQuerySchema), handleGraphviz);
