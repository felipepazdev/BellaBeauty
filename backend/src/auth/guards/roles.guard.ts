import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se a rota exige papéis, mas não há usuário na request (por exemplo, rota não autenticada)
    if (!user || !user.role) {
      return false;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Sem permissão para acessar este recurso');
    }

    return true;
  }
}
