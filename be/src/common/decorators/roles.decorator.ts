import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
