import factory from 'factory-girl'
import Role from '../../models/role.model'

factory.define('Role', Role, {
  name: factory.chance('string', {length: 8}),
})
