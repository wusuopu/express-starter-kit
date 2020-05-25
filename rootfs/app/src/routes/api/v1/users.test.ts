import supertest from 'supertest';
import app from '../../../index';
import Models from '../../../models';
import testHelper from '../../../specs/helper/test-helper'
import factory from '../../../specs/factories'

describe('users api v1 endpoint', () => {
  beforeAll(async () => {
    await Models.connectDB()
    await Models.User.remove({})
    await Models.Role.remove({})

    await Models.User.create({email: 'user1@example.com', password: '123'})
  })
  afterAll(async () => {
    await Models.disconnectDB()
  })
  describe('POST /api/v1/users/login', () => {
    let url = '/api/v1/users/login'
    let request = supertest(app);

    it('参数无效，返回400', async () => {
      let res = await request.post(url).expect(400)
      expect(res.body?.data?.email).toBeDefined()
      expect(res.body?.data?.password).toBeDefined()
    })

    it('用户不存在，返回400', async () => {
      let res = await request.post(url)
        .send({email: 'xxxx@absdf.undefined', password: '123'})
        .expect(400)
      expect(res.body?.error).toBeDefined()
    })

    it('密码不正确，返回400', async () => {
      let res = await request.post(url)
        .send({email: 'user1@example.com', password: '123456'})
        .expect(400)
      expect(res.body?.error).toBeDefined()
    })

    it('登录成功，返回200', async () => {
      let res = await request.post(url)
        .send({email: 'user1@example.com', password: '123'})
        .expect(200)
      expect(res.header['set-cookie']).toBeDefined()
    })
  })

  describe('GET /api/v1/users/me', () => {
    let url = '/api/v1/users/me'
    let guestRequest = supertest(app)
    let authRequest = supertest(app)
    beforeAll(async () => {
      await testHelper.login(authRequest, 'user1@example.com', '123')
    })
    it('当前用户未登录，返回401', async () => {
      await guestRequest.get(url).expect(401)
    })

    it('当前用户已登录，返回用户信息', async () => {
      let res = await authRequest
        .get(url)
        .expect(200)
      expect(res.body.data?.data?.attributes?.email).toEqual('user1@example.com')
    })
  })

  describe('PATCH /api/v1/users/me/password', () => {
    let url = '/api/v1/users/me/password'

    let guestRequest = supertest(app)
    let authRequest = supertest(app)
    let user
    beforeAll(async () => {
      user = await factory.create('User')
      await testHelper.login(authRequest, user.email, user.password)
    })

    it('当前用户未登录，返回401', async () => {
      await guestRequest.patch(url).expect(401)
    })

    it('缺少参数，返回400', async () => {
      await authRequest
        .patch(url)
        .expect(400)
    })

    it('旧密码不正确，返回400', async () => {
      await authRequest
        .patch(url)
        .send({
          password: '.',
          newPassword: '123456'
        })
        .expect(400)
    })

    it('密码修改成功，并返回200', async () => {
      await authRequest
        .patch(url)
        .send({
          password: user.password,
          newPassword: '123456'
        })
        .expect(200)

      let u = await Models.User.findOne({email: user.email})
      expect(u.checkAuth('123456')).toBeTruthy()
    })

  })
})
