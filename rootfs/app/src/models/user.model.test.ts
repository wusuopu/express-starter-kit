import Models from '.'

describe('User Model', () => {
  let user

  beforeAll(async () => {
    await Models.connectDB()
    await Models.User.remove({})
    await Models.Role.remove({})

    let role = await Models.Role.create({name: 'admin'})
    user = await Models.User.create({email: 'user1@example.com', password: '123', roles: [role]})
  })
  afterAll(async () => {
    await Models.disconnectDB()
  })

  describe('checkAuth', () => {
    it('密码验证通过', () => {
      expect(user.checkAuth('123')).toBeTruthy()
    })
    it('密码验证不通过', () => {
      expect(user.checkAuth('abcd')).toBeFalsy()
    })
  })

  describe('hasRole', () => {
    it('当前用户属于 admin Role', async () => {
      expect(await user.hasRole('admin')).toBeTruthy()
    })
    it('当前用户不属于 guest Role', async () => {
      expect(await user.hasRole('guest')).toBeFalsy()
    })
  })
})
