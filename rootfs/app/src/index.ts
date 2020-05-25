import express, { Errback, Request, Response } from 'express';
import expressWinston from 'express-winston'
// import bodyParser from 'body-parser'
import winston from 'winston'
import formidableMiddleware from 'express-formidable'
import session from 'express-session'
import { ResponseError } from './global.d'
import routes from './routes'
import adminPanel from './routes/admin-panel'
import models from './models'
import { sessionConfig } from './lib/session-store'

const app = express();
app.use(expressWinston.logger({
  transports: [
    process.env.NODE_ENV !== 'test' ?
      new winston.transports.Console() :
      new winston.transports.File({filename: 'test.log', dirname: '/tmp'})
  ],
  ignoredRoutes: ['/health_check'],
  meta: true,
  expressFormat: true
}))
// 配置管理后台
if ( process.env.NODE_ENV !== 'test'  ) {
  app.use('/admin', adminPanel('/admin'))
}

app.use(formidableMiddleware({
  encoding: 'utf-8',
  multiples: true, // req.files to be arrays of files
  maxFileSize: Number(process.env.EXPRESS_BODY_LIMIT_SIZE) || 100 * 1024 * 1024,
}));
app.use(session(sessionConfig('')))
// app.use(bodyParser.urlencoded({ limit: process.env.BODY_LIMIT_SIZE || '50mb', extended: true }))
// app.use(bodyParser.json({ limit: process.env.BODY_LIMIT_SIZE || '50mb' }))
routes.config(app)

app.use((err: ResponseError, req: Request, res: Response, next: Errback) => {
  console.error(req.method, req.path, err)
  if (res.headersSent) {
    return next(err)
  }
  return res.status(err.httpCode || 500).json({error: err.message})
})

const { PORT = 80 } = process.env;

app.get('/', (_: Request, res: Response) => {
  res.send({
    message: 'hello world',
  });
});

const main = async () => {
  await models.connectDB()
  app.listen(PORT, () => {
    console.log('server started at http://0.0.0.0:'+PORT);
  });
}
if (require.main === module) {
  main()
}
export default app;
