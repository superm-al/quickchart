import type { Request, Response } from 'express';

const VERSION = '2.0.0';

export function handleHealthcheck(_req: Request, res: Response): void {
  res.json({ success: true, version: VERSION });
}
