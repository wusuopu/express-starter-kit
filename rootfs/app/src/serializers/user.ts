import BaseJSONApiSerializer from './base'


class UserSerializer extends BaseJSONApiSerializer {
  constructor() {
    super('users', [
      'email',
      'createdAt',
      'updatedAt',
    ])
  }
}

export default new UserSerializer()
