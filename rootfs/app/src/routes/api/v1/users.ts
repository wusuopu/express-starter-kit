// a async router demo
import { Request, Response } from 'express';
import _ from 'lodash';
import safeRouter from '../../../lib/safe-router';
import authMiddleware from '../../middlewares/auth'
import apiResponseHelper from '../../helper/api-response'
import authHelper from '../../helper/auth'
import UserSerializer from '../../../serializers/user'
import UserForm from '../../../forms/user'
import ChangePasswordForm from '../../../forms/change-password'
import Models from '../../../models'

const router = safeRouter()
export default router

router.post('/login', async (req: Request, res: Response) => {
  let form = new UserForm(req.fields)
  if (!form.isValid()) {
    return apiResponseHelper.makeErrorResponse(res, 400, undefined, form.errors)
  }

  let data = form.toData()

  let user = await Models.User.findOne({email: data.email})
  if (!user || !user.checkAuth(data.password)) {
    return apiResponseHelper.makeErrorResponse(res, 400, '邮箱/密码错误')
  }

  await authHelper.login(req, user)

  return apiResponseHelper.makeSuccessResponse(res, UserSerializer.serialize(user))
})

router.post('/logout', async (req: Request, res: Response) => {
  authHelper.logout(req)
  return apiResponseHelper.makeSuccessResponse(res)
})

router.get('/me', authMiddleware.auth, authMiddleware.loginRequire,  async (req: Request, res: Response) => {
  return apiResponseHelper.makeSuccessResponse(res, UserSerializer.serialize(req.user))
})

router.patch('/me/password', authMiddleware.auth, authMiddleware.loginRequire, async (req: Request, res: Response) => {
  let form = new ChangePasswordForm(req.fields)
  if (!form.isValid()) {
    return apiResponseHelper.makeErrorResponse(res, 400, undefined, form.errors)
  }
  let data = form.toData()
  let user = req.user
  if (!user.checkAuth(data.password)) {
    return apiResponseHelper.makeErrorResponse(res, 400, '旧密码错误')
  }

  user.password = data.newPassword
  await user.save()

  return apiResponseHelper.makeSuccessResponse(res)
})
