import mongoose, { Schema as MongooseSchema, Model, Document } from 'mongoose';
import type { SchemaOptions } from 'mongoose'
import _ from 'lodash';

export class Schema extends MongooseSchema {
  options: SchemaOptions;
}

export const createModel = function<T extends Document> (name: string, schema: Schema): Model<T> {
  if (schema.options.timestamps) {
    // 为 timestamps 的字段设置索引
    let createdAt = 'createdAt'
    let updatedAt = 'updatedAt'
    if (!_.isBoolean(schema.options.timestamps)) {
      if (_.isBoolean(schema.options.timestamps.createdAt)) {
        createdAt = schema.options.timestamps.createdAt ? 'createdAt' : null
      }
      if (_.isBoolean(schema.options.timestamps.updatedAt)) {
        updatedAt = schema.options.timestamps.updatedAt ? 'updatedAt' : null
      }
    } else {
      createdAt = _.get(schema, 'options.timestamps.createdAt') || 'createdAt'
      updatedAt = _.get(schema, 'options.timestamps.updatedAt') || 'updatedAt'
    }
    let hasCreatedAtIndex = false
    let hasUpdatedAtIndex = false
    for (let idx of schema.indexes()) {
      // 已经定义过 timestamps 字段的索引
      if (idx[0][createdAt]) {
        hasCreatedAtIndex = true
      }
      if (idx[0][updatedAt]) {
        hasUpdatedAtIndex = true
      }
    }
    if (createdAt && !hasCreatedAtIndex) { schema.index({[createdAt]: 1}) }
    if (updatedAt && !hasUpdatedAtIndex) { schema.index({[updatedAt]: 1}) }
  }
  // 定义一个 model，并设置 collection 的前缀名
  const model = mongoose.model<T>(name, schema, `${process.env.MONGO_COLLECTION_PREFIX || ''}${mongoose.pluralize()(name)}`)
  return model
}
