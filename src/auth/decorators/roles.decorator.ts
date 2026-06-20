import { SetMetadata } from '@nestjs/common';
import { Role } from '../../generated/prisma/enums';

export const ROLES_KEY = 'roles';
// Uso: @Roles(Role.ADMIN) numa rota
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);