import { Application } from 'express';
import * as health from './health'

const config = (server: Application) => {
  server.get('/_health', health.check)
}

export default {
  config
}
