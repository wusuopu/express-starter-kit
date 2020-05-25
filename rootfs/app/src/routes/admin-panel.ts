import AdminBro, { Action, ActionResponse, ActionContext, ResourceOptions, ActionRequest } from 'admin-bro'
import express, { Request, Response } from 'express'
import session from 'express-session'
import AdminBroExpressjs from 'admin-bro-expressjs'
import AdminBroMongoose from 'admin-bro-mongoose'
import bcryptjs from 'bcryptjs'
import _ from 'lodash'
import flat from 'flat'
import Models, { IUser } from '../models'
import Config from '../constants/config'
import { sessionConfig } from '../lib/session-store'

interface MyResourceOptions extends ResourceOptions {
  sortableProperties?: string[];
}

AdminBro.registerAdapter(AdminBroMongoose)

const ADMIN_LIST = (process.env.ADMIN_USER_LIST || '').split(',')
const userGroup = {
  name: '用户相关',
  icon: 'Group',
}

// 检查当前用户是否为员工
function isStaff(user: IUser) {
  // 角色不为空
  return !_.isEmpty(user._roles)
}
// 检查当前用户是否为管理员
function isAdmin(user: IUser) {
  if (_.includes(ADMIN_LIST, user.email)) {
    return true
  }
  return _.some(user._roles, {name: 'admin'})
}
// 用户的所有权限
function allPermissions(user: IUser) {
  let permission = { }
  for (let role of user._roles || []) {
    if (!role.permission) {
      continue
    }
    for (let resource in role.permission) {
      if (!permission[resource]) {
        permission[resource] = { }
      }
      let actions = role.permission[resource]
      for (let action in actions) {
        if (actions[action]) {
          permission[resource][action] = actions[action]
        }
      }
    }
  }
  return permission
}
function checkResourceAccessible(context: ActionContext) {
  if (isAdmin(context.currentAdmin as IUser)) {
    return true
  }
  const actionPermissionMap = {
    // 各个 action 对应的权限名
    new: 'can_create',
    list: 'can_list',
    search: 'can_list',
    edit: 'can_update',
    show: 'can_show',
    delete: 'can_delete',
    bulkDelete: 'can_delete',
  }
  let permissions = allPermissions(context.currentAdmin as IUser)
  return _.get(
    permissions,
    `${context.resource.name()}${actionPermissionMap[context.action.name]}`,
    false
  )
}

function allSchemaProperties (schema, excludes: string[] = []): string[] {
  let excludePaths = excludes.concat(['_id', '__v'])
  let allPaths = _.reduce(schema.paths, (ret, value, key: string) => {
    if (!_.includes(excludePaths, key)) {
      ret.push(key)
    }
    return ret
  }, ['_id'])

  return allPaths
}

function genResourceOption (model, opts: MyResourceOptions = {}): {resource: any, options: ResourceOptions} {
  let options: MyResourceOptions = _.assign({}, opts)
  if (!options.sort) {
    // 默认按 _id 排序
    options.sort = {
      direction: 'desc',
      sortBy: '_id',
    }
  }

  // 配置各个页面所显示的字段
  let allProperties = allSchemaProperties(model.schema)
  let propertyVisibleActions = ['list', 'show', 'filter', 'edit']
  let sortableProperties = options.sortableProperties || ['_id', 'createdAt', 'updatedAt']
  delete options.sortableProperties
  options.properties = options.properties || {}
  for (let property of allProperties) {
    // 配置 properties.[property].isVisible.[action]
    for (let actionName of propertyVisibleActions) {
      // 配置 listProperties, showProperties, filterProperties, editProperties
      let propertyName = `${actionName}Properties`
      let actionProperties = options[propertyName] || allProperties
      if (actionName === 'edit') {
        // 不能编辑 id, createdAt, updatedAt 字段
        actionProperties = _.filter(
          actionProperties,
          p => !_.includes(['_id', 'createdAt', 'updatedAt'], p)
        )
      }
      delete options[propertyName]

      let isVisiblePath = `${property}.isVisible.${actionName}`
      if (!_.isBoolean(_.get(options.properties, `${property}.isVisible`)) && !_.has(options.properties, isVisiblePath)) {
        _.set(
          options.properties,
          isVisiblePath,
          _.includes(actionProperties, property)
        )
      }
    }
    // 配置 properties.[property].isSortable
    _.set(
      options.properties,
      `${property}.isSortable`,
      _.includes(sortableProperties, property)
    )
  }
  // 配置各个 action 的权限
  // 配置 actions.[action].isVisible
  let actions = _.assign({}, options.actions)
  let allActions = ['new', 'list', 'search', 'edit', 'show', 'delete', 'bulkDelete']
  for (let actionName of allActions) {
    let action: Action<ActionResponse> = _.assign({}, actions[actionName])
    action.isAccessible = checkResourceAccessible
    actions[actionName] = action
  }
  options.actions = actions

  return { resource: model, options }
}


export default (rootPath: string) => {
  const admin = new AdminBro({
    resources: [
      genResourceOption(Models.User, {
        parent: userGroup,
        filterProperties: ['_id', 'email', 'createdAt', 'updatedAt'],
        properties: {
          encryptedPassword: {
            isVisible: {
              list: false, edit: false, filter: false, show: true,
            },
          },
          password: {
            type: 'string',     // https://adminbro.com/BaseProperty.html#PropertyType
            isRequired: true,
            isVisible: {
              list: false, edit: true, filter: false, show: false,
            },
          },
          roles: {
            type: 'reference',
            components: {
              list: AdminBro.bundle('../views/admin-panel/_common/reference-array-list'),
            }
          }
        },
        actions: {
          new: {
            after: async (res: ActionResponse, req: ActionRequest) => {
              if (req.method === 'post' && !req.payload.password) {
                // 缺少密码
                _.set(res, 'record.errors.password', {
                  message: 'Path `password` is required.',
                  type: 'required'
                })
              }
              return res
            },
          },
          edit: {
            before: async (request) => {
              if (request.method === 'post') {
                let payload = flat.unflatten(request.payload)
                // 去掉重复的 role
                payload.roles = _.uniqBy(payload.roles || [], r => r.toString())
                if (payload.password) {
                  // 加密密码
                  payload.encryptedPassword = bcryptjs.hashSync(payload.password)
                  delete payload.password
                }
                payload.email = payload.email?.toLowerCase()
                request.payload = payload
              }
              return request
            }
          },
        },
      }),
      genResourceOption(Models.Role, {
        parent: userGroup,
        filterProperties: ['_id', 'name', 'createdAt', 'updatedAt'],
        properties: {
          permission: {
            type: 'mixed',
            isVisible: {
              list: false,
            },
            components: {
              show: AdminBro.bundle('../views/admin-panel/roles/show/permission'),
              edit: AdminBro.bundle('../views/admin-panel/roles/edit/permission'),
            }
          }
        },
        actions: {
          new: {
            before: async (req) => {
              if (req.method === 'post') {
                try {
                  req.payload.permission = JSON.parse(req.payload.permission)
                } catch(err) {
                  req.payload.permission = {}
                }
              }
              return req
            }
          },
          edit: {
            before: async (req) => {
              if (req.method === 'post') {
                try {
                  req.payload.permission = JSON.parse(req.payload.permission)
                } catch(err) {
                  req.payload.permission = {}
                }
              }
              return req
            }
          }
        },
      }),
    ],
    dashboard: {
      component: AdminBro.bundle('../views/admin-panel/dashboard')
    },
    branding: {
      companyName: 'Express Demo c.o.',
      softwareBrothers: false,
    },
    rootPath,
  })

  const sessionOptins = sessionConfig('admin')
  const router = express.Router()
  router.use(session(sessionOptins))
  router.use(async (req: Request, __: Response, next) => {
    if (req.path.startsWith('/frontend/') || req.path.startsWith('/api/')) {
      // 静态文件 或者 api路由
      return next()
    }
    let userId = req.session?.adminUser?.id
    if (!userId) {
      return next()
    }
    let user = await Models.User.findById(userId)
    if (!user) {
      req.session.adminUser = undefined
      return next()
    }
    await user.populate('_roles').execPopulate()
    req.session.adminUser = {
      id: user.id,
      email: user.email,
      _roles: _.map(user._roles, r => _.pick(r, ['name', 'permission']))
    }
    next()
  })
  return AdminBroExpressjs.buildAuthenticatedRouter(
    admin,
    {
      // auth options
      authenticate: async (email: string, password: string) => {
        const user = await Models.User.findOne({ email })
        if (!user?.checkAuth(password)) {
          // 密码不正确
          return false
        }
        await user.populate('_roles').execPopulate()
        if (!isAdmin(user) && !isStaff(user)) {
          // 不是管理员
          return false
        }
        return _.pick(user, ['id', 'email'])
      },
      cookiePassword: Config.ADMIN_COOKIE_SECRET,
      cookieName: Config.ADMIN_COOKIE_NAME,
    },
    router,
    sessionOptins
  )
}
