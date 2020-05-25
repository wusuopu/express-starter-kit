import mongoose from 'mongoose'
import logger from '../lib/logger'
import User from './user.model'
import Role from './role.model'
import { IUser, IRole } from './types.d'


const MONGO_URI = process.env.NODE_ENV === 'test' ? process.env.MONGO_URI_TEST : process.env.MONGO_URI


const connectDB = () => {
  return mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
}

const disconnectDB = () => {
  return mongoose.disconnect()
}
const startEventListen = () => {
  // 监听mongoose事件
  mongoose.connection.on('connected', () => {
    logger.info(`Mongoose connection open to ${MONGO_URI}`)
  })

  mongoose.connection.on('error',(err) => {
    logger.error(`Mongoose connection with ${MONGO_URI} error: ${err}`)
    process.exit(0)
  })

  mongoose.connection.on('disconnected', () => {
    logger.error(`Mongoose connection disconnected with ${MONGO_URI}`)
  })

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      logger.info(`Mongoose connection disconnected with ${MONGO_URI} through app termination`)
      process.exit(0)
    })
  })
}

export {
  IUser,
  IRole,
}

export default {
  connectDB,
  disconnectDB,
  startEventListen,
  User,
  Role,
}
