import mongoose from 'mongoose';
import { createModel, Schema } from './lib/mongoose';
import { IRole } from './types.d'

const RoleSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  permission: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
  description: { type: String },
}, {
  timestamps: true,
})

const Role = createModel<IRole>('Role', RoleSchema)
export default Role
