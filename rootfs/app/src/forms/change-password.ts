import _ from 'lodash';
import BaseForm from './base'

export default class ChangePasswordForm extends BaseForm {
  constructor(data: any) {
    super(data)
    this.attributes('password', 'required')
    this.attributes('newPassword', 'required')
  }

  toData(): {password: string, newPassword: string} {
    return _.pick(this._data, ['password', 'newPassword'])
  }
}
