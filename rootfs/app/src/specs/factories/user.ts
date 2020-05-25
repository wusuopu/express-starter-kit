import factory from 'factory-girl'
import User from '../../models/user.model'

factory.define('User', User, {
  email: factory.chance('email'),
  password: factory.chance('word', {length: 6}),
})
