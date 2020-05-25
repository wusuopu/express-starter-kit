import MongoStore from 'connect-mongo'
import mongoose from 'mongoose'
import session from 'express-session'
import RedisStore from 'connect-redis'
import redisMock from 'redis-mock'
import { createRedisStore, createLevelDBStore, LevelDBStore } from './cache'
import logger from './logger'
import Config from '../constants/config'

class LevelStore extends session.Store {
  db: LevelDBStore;
  prefix: string;
  lengthKey: string;
  ttl: number;

  constructor(options: {prefix?: string, ttl?: number} = {}) {
    super(options)
    this.db = createLevelDBStore()
    this.prefix = options.prefix || '__sessions:'
    this.lengthKey = `${this.prefix}/__length__`
    this.ttl = options.ttl || 86400000 // One day in seconds.
    this.init()
    this.get = (sid: string, cb = this.defaultValueNoop) => {
      this.db.client.get(this._getKey(sid), (err, data) => {
        if (!data) return cb(null)

        let result
        try {
          result = JSON.parse(data)
        } catch (err) {
          return cb(err)
        }
        return cb(null, result)
      })
    }
    this.set = (sid: string, sess: any, cb = this.errorNoop) => {
      let value
      try {
        value = JSON.stringify(sess)
      } catch (er) {
        return cb(er)
      }

      this.db.client.put(this._getKey(sid), value, {ttl: this._getTTL(sess)}, cb)
    }
    this.touch = (sid: string, sess: any, cb = this.errorNoop) => {
      this.set(sid, sess, cb)
    }
    this.length = (cb = this.defaultValueNoop) => {
      this.db.client.get(this.lengthKey, function (err, len) {
        return cb(err, parseInt(len, 10) || 0)
      })
    }
    this.clear = (cb = this.errorNoop) => {
      let total = 0
      let count = 0
      let streamDone = false

      const done =  () => {
        ++count
        if (count === total && streamDone) {
          cb && cb()
        }
      }
      this.db.client.createKeyStream()
        .on('data', function (key: string) {
          if (key.startsWith(this.prefix)) {
            this.db.client.del(key, done)
          }
        })
        .on('end', function () {
          this.db.client.put(this.lengthKey, 0, function () {
            streamDone = true
            done()
          })
        })
    }
    this.destroy = (sid, cb = this.errorNoop) => {
      this.db.client.del(this._getKey(sid), cb)
    }
  }

  errorNoop(err?: any) {}
  defaultValueNoop(err?: any, value?: any) {}

  async init() {
    let value = await this.db.get(this.lengthKey)
    if (!value) {
      await this.db.set(this.lengthKey, 0)
    }
    this.emit('connect')
  }


  _getTTL(sess) {
    let ttl
    if (sess?.cookie?.expires) {
      ttl = Number(new Date(sess.cookie.expires)) - Date.now()
    } else {
      ttl = this.ttl
    }
    return ttl
  }
  _getKey(key: string): string {
    return `${this.prefix}${key}`
  }
}

const genStore = (namespace: string = '') => {
  const sessionStore = (session) => {
    let EXPRESS_SESSION_STORE = process.env.EXPRESS_SESSION_STORE
    if (process.env.NODE_ENV === 'test') {
      // 测试环境使用 mongodb 保存 session
      EXPRESS_SESSION_STORE = 'mongo'
    }
    if (EXPRESS_SESSION_STORE === 'mongo') {
      logger.debug(`${namespace} use mongo session store`)
      // 使用 mongodb 保存 session
      return new (MongoStore(session))({
        mongooseConnection: mongoose.connection,
        collection: `${process.env.MONGO_COLLECTION_PREFIX || ''}__${namespace}sessions`
      })
    } else if (EXPRESS_SESSION_STORE === 'leveldb') {
      logger.debug(`${namespace} use leveldb session store`)
      // 使用 leveldb 保存 session
      let prefix = `__${namespace}sessions:`
      return new LevelStore({ prefix })
    } else {
      logger.debug(`${namespace} use redis session store`)
      // 使用 redis 保存 session
      let client
      if (process.env.NODE_ENV === 'test') {
        client = redisMock.createClient()
      } else {
        client = createRedisStore().client
      }
      return new (RedisStore(session))({
        prefix: (process.env.REDIS_PREFIX || '') + `__${namespace}sessions:`,
        client,
      })
    }
  }

  return sessionStore
}

export const sessionConfig = (namespace: string = ''): session.SessionOptions => {
  let opts: session.SessionOptions =  {
    secret: namespace === 'admin' ? Config.ADMIN_COOKIE_SECRET : Config.EXPRESS_COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: genStore(namespace)(session),
    name: namespace === 'admin' ? Config.ADMIN_COOKIE_NAME : Config.EXPRESS_COOKIE_NAME,
    unset: 'destroy',
    cookie: {
      maxAge: 1209600000,      // cookie 有效期为 14 天
      domain: Config.EXPRESS_COOKIE_DOMAIN,
      httpOnly: false,
    }
  }

  return opts
}

export default genStore
