import { Document } from 'mongoose';
import { ObjectId } from 'mongodb'

type PermissionItemType = {
  can_list?: boolean;
  can_show?: boolean;
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
}
type PermissionType = {[resource: string]: PermissionItemType}

interface BaseDocument extends Document {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRole extends BaseDocument {
  name: string;
  permission: PermissionType;
  description?: string;
}

export interface IUser extends BaseDocument {
  email: string;
  password: string;
  encryptedPassword: string;
  roles: ObjectId[];
  _roles?: IRole[];
  lastLoginAt?: Date;
  currentLoginAt?: Date;
  lastLoginIp?: string;
  currentLoginIp?: string;

  checkAuth: (password: string) => boolean;
  hasRole: (role: string) => Promise<boolean>;
}

