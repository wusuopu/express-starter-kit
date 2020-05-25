import { IUser } from './models/types.d'

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }

  namespace factory {
    interface Static {
      chance: (generator: string, ...args: any[]) => any;
    }
  }
}
export interface ResponseError extends Error {
  httpCode?: number
}
