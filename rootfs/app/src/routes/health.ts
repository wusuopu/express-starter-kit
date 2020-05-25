import { Request, Response } from 'express';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';

let version: string|undefined
try {
  version = fs.readFileSync(path.join(process.cwd(), 'version.txt'), 'utf8')
} catch (error) {
}

export const check = (_: Request, res: Response) => {
  return res.json({ result: 'ok', host: os.hostname(), version})
}
