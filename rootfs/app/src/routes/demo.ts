// a async router demo
import { Request, Response } from 'express';
import safeRouter from '../lib/safe-router';

const router = safeRouter()
export default router

router.get('/', async (req: Request, res: Response) => {
  return res.json({ result: 'ok' })
})
