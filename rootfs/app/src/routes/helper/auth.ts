import { Request } from 'express';
import _ from 'lodash';
import {IUser} from "../../models";

export default {
  async login(req: Request, user: IUser) {
    user.lastLoginAt = user.currentLoginAt
    user.lastLoginIp = user.currentLoginIp
    user.currentLoginAt = new Date()
    user.currentLoginIp = req.ip
    await user.save()
    req.session.user = _.pick(user, ['id', 'email'])
  },
  logout(req: Request) {
    req.session.user = undefined
  }
}
