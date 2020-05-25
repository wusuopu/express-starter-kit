import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs'
import _ from 'lodash'
import { createModel, Schema } from './lib/mongoose';
import { IUser } from './types.d'

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  encryptedPassword: { type: String, required: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: [], index: true }],
  lastLoginAt: { type: Date },
  currentLoginAt: { type: Date },
  lastLoginIp: { type: String },
  currentLoginIp: { type: String },
}, {
  timestamps: true,
})

UserSchema.method('checkAuth', function (password: string): boolean {
  // 验证密码
  if (!this.encryptedPassword) {
    return false
  }
  return bcryptjs.compareSync(password, this.encryptedPassword)
})
UserSchema.method('hasRole', async function (role: string): Promise<boolean> {
  let r = await mongoose.models.Role.findOne({_id: this.roles, name: role})
  return !_.isEmpty(r)
})
UserSchema.virtual('password')
  .get(function() {
    return this._password
  })
  .set(function(value: string) {
    this._password = value
  })
UserSchema.virtual('_roles', {
  ref: 'Role',
  localField: 'roles',
  foreignField: '_id',
  justOne: false,
})
UserSchema.pre('validate', function(next) {
  let obj: IUser = this as IUser
  if (obj.password) {
    // 密码加密
    obj.encryptedPassword = bcryptjs.hashSync(obj.password)
  }
  obj.roles = _.uniqBy(obj.roles, r => r.toString())
  obj.email = obj.email?.toLowerCase()
  next()
})

const User = createModel<IUser>('User', UserSchema)
export default User
