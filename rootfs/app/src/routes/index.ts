import { Application } from 'express';
import * as health from './health'
import demo from './demo'

const config = (server: Application) => {
  server.get('/_health', health.check)
  server.use('/v1/demo', demo)
}

export default {
  config
}
