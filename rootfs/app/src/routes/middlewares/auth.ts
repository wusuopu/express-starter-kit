import { Request, Response } from 'express';
import _ from 'lodash';
import apiResponse from '../helper/api-response'
import Models from '../../models';

export default {
  async auth(req: Request, res: Response, next) {
    if (req.session.user?.id) {
      let user = await Models.User.findById(req.session.user?.id)
      req.user = user
    }
    next()
  },
  loginRequire(req: Request, res: Response, next) {
    if (!req.user?.id) {
      return apiResponse.makeErrorResponse(res, 401)
    }
    next()
  },
  roleRequire(roles: string|string[]) {
    if (_.isString(roles)) {
      roles = [roles]
    }

    return async function(req: Request, res: Response, next) {
      if (!req.user?.id) {
        return apiResponse.makeErrorResponse(res, 401)
      }
      roles = roles as string[]
      if (roles.length === 0) {
        // 没有权限限制
        return next()
      }

      if (_.isEmpty(req.user.roles)) {
        // 当前用户没有属于任何Role
        return apiResponse.makeErrorResponse(res, 403)
      }
      if (_.isEmpty(req.user._roles)) {
        await req.user.populate('_roles').execPopulate()
      }

      for (let i in roles) {
        if (_.find(req.user._roles, {name: i})) {
          return next()
        }
      }

      return apiResponse.makeErrorResponse(res, 403)
    }
  }
}
