import UserForm from './user'
import _ from 'lodash'

describe('UserForm', () => {
  it('验证失败 - email无效', () => {
    let form = new UserForm({})
    expect(form.isValid()).toBeFalsy()
    expect(form.errors.email?.email).toBeTruthy()

    form = new UserForm({email: 'asdf'})
    expect(form.isValid()).toBeFalsy()
    expect(form.errors.email?.email).toBeTruthy()
  })
  it('验证失败 - password不能为空', () => {
    let form = new UserForm({})
    expect(form.isValid()).toBeFalsy()
    expect(form.errors.password?.required).toBeTruthy()
  })
  it('验证通过', () => {
    let form = new UserForm({email: 'abcd@example.com', password: '123456'})
    expect(form.isValid()).toBeTruthy()
  })
})
