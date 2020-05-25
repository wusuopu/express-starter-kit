// 初始化管理员账号
import Models from '../models'

const main = async () => {
  let email = process.argv[2]
  let password = process.argv[3]
  if (!email || !password) {
    console.error('缺少参数')
    return
  }

  await Models.connectDB()

  let role = await Models.Role.findOne({name: 'admin'})
  if (!role) {
    role = await Models.Role.create({name: 'admin'})
  }
  let user = await Models.User.findOne({email})
  if (!user) {
    user = new Models.User({email})
  }
  user.password = password
  user.roles.push(role._id)
  await user.save()
  console.log(`管理员账号添加成功: ${email}`)
  process.exit(0)
}

main()
