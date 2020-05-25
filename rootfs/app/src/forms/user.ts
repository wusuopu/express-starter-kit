import _ from 'lodash';
import BaseForm from './base'

export default class UserForm extends BaseForm {
  constructor(data: any) {
    super(data)
    this.attributes('email', 'email')
    this.attributes('password', 'required')
  }

  toData(): {email: string, password: string} {
    return _.pick(this._data, ['email', 'password'])
  }
}
