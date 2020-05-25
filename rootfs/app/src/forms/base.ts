import validator from 'validator';
import _ from 'lodash';

const allValidator = _.assign({
  isRequired(value) {
    return !_.isEmpty(value)
  }
}, validator)

export default abstract class BaseForm {
  _fields: {[field: string]: {validatorName: string, args: any[]}[]}
  _data: any;
  _isValid?: boolean;
  errors: {[field: string]: {[validator: string]: boolean}}

  constructor(data: any = {}) {
    this._fields = {}
    this._data = data
    this.errors = {}
  }

  attributes(field: string, validatorName: string, ...args) {
    if (!this._fields[field]) {
      this._fields[field] = []
    }
    this._fields[field].push({validatorName, args})
  }

  validate(): boolean {
    for (let field in this._fields) {
      let items = this._fields[field]
      let value = _.get(this._data, field)

      for (let item of items) {
        let validatorName = _.camelCase(`is-${item.validatorName}`)
        let func = allValidator[validatorName]
        if (!func) { continue }
        try {
          if (func(value, ...item.args)) { continue }
        } catch (error) {
        }
        if (!this.errors[field]) {
          this.errors[field] = {}
        }
        this.errors[field][item.validatorName] = true
      }
    }
    return _.isEmpty(this.errors)
  }
  isValid() {
    if (!_.isBoolean(this._isValid)) {
      this._isValid = this.validate()
    }

    return this._isValid
  }

  abstract toData(): any;
}
