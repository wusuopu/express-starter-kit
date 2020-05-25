import { Application } from 'express';
import * as health from './health'
import users from './api/v1/users'

const config = (server: Application) => {
  server.get('/_health', health.check)
  server.use('/api/v1/users', users)
}

export default {
  config
}
