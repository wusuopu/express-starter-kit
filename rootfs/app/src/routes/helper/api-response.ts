import { Response } from 'express';

const makeResponse = (res: Response, error: string, data: any, success: boolean, code: number): Response => {
  res.status(code).json({
    error,
    data,
    success,
  })
  return res
}
export default {
  makeSuccessResponse(res: Response, data?: any): Response {
    return makeResponse(res, undefined, data, true, 200)
  },
  makeErrorResponse(res: Response, code: number, error?: string, data?: any): Response {
    return makeResponse(res, error, data, false, code)
  },
}
