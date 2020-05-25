// a key-value store base redis or leveldb.
import redis from 'redis'
import { promisify } from 'util'
import levelup from 'levelup'
import leveldown from 'leveldown'
import levelttl from 'level-ttl'
import path from 'path'
import _ from 'lodash'
import fs from 'fs-extra'
import redisMock from 'redis-mock'

interface Store {
  key_prefix?: string;
  client: any;
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<boolean>;
  del(key: string): Promise<boolean>;
}

export class RedisStore implements Store {
  key_prefix: string;
  client: redis.RedisClient

  _get: Function;
  _set: Function;
  _del: Function;
  constructor (redis_uri: string, key_prefix: string = '') {
    this.key_prefix = key_prefix
    if (process.env.NODE_ENV === 'test') {
      this.client = redisMock.createClient()
    } else {
      this.client = redis.createClient(redis_uri)
    }

    this._get = this.promisify('get')
    this._set = this.promisify('set')
    this._del = this.promisify('del')
  }
  async get (key: string): Promise<any> {
    return await this._get(`${this.key_prefix}${key}`)
  }
  async set (key: string, value: any, ttl?: number): Promise<boolean> {
    if (!_.isString(value)) {
      value = JSON.stringify(value)
    }
    if (ttl) {
      await this._set(`${this.key_prefix}${key}`, value, 'EX', ttl)
    } else {
      await this._set(`${this.key_prefix}${key}`, value)
    }
    return true
  }
  async del (key: string): Promise<boolean> {
    return await this._del(`${this.key_prefix}${key}`)
  }

  private promisify(method: string) {
    return promisify(this.client[method]).bind(this.client)
  }
}

export class LevelDBStore implements Store {
  client: any;
  constructor (db_path: string) {
    this.client = levelttl(levelup(leveldown(db_path)))
  }
  async get (key: string): Promise<string|undefined> {
    try {
      return await this.client.get(key)
    } catch (error) {
      return
    }
  }
  async set (key: string, value: any, ttl?: number): Promise<boolean> {
    if (!_.isString(value)) {
      value = JSON.stringify(value)
    }
    let options: {ttl?: number} = {}
    if (ttl) {
      options.ttl = ttl * 1000
    }
    await this.client.put(key, value, options)
    return true
  }
  async del (key: string): Promise<boolean> {
    return await this.client.del(key)
  }
}

let levelDBStore: LevelDBStore
let redisStore: RedisStore
export const createLevelDBStore = (): Store => {
  if (!levelDBStore) {
    let LEVELDB_PATH = process.env.LEVELDB_PATH || path.resolve('tmp/data')
    LEVELDB_PATH = `${LEVELDB_PATH}-${process.env.NODE_ENV || 'production'}`
    let dirname = path.dirname(LEVELDB_PATH)
    fs.ensureDirSync(dirname)
    levelDBStore = new LevelDBStore(LEVELDB_PATH)
  }
  return levelDBStore
}
export const createRedisStore = (): Store => {
  if (!redisStore) {
    redisStore = new RedisStore(process.env.REDIS_URI, process.env.REDIS_PREFIX || '')
  }
  return redisStore
}

let db: Store
if (process.env.CACHE_STORE_TYPE === 'leveldb' && process.env.NODE_ENV !== 'test') {
  db = createLevelDBStore()
} else {
  db = createRedisStore()
}

export default db
