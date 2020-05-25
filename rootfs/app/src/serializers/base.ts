import JSONApiSerializer from 'jsonapi-serializer'

export default class BaseJSONApiSerializer {
  _serializer: JSONApiSerializer.Serializer

  constructor(name: string, attributes: string[]) {
    this._serializer = new JSONApiSerializer.Serializer(name, {
      attributes,
      keyForAttribute: 'camelCase',
    })
  }

  serialize(data: any) {
    return this._serializer.serialize(data)
  }
}
