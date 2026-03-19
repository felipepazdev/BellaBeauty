import { Role } from '../enums/role.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  salonId: string;
  role: Role;
  professionalId?: string | null;
  permissions?: string | null;
};
