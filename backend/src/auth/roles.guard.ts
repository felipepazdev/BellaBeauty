import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // Se a rota não tem Roles metadata, está livre para autenticados
    }
    const { user } = context.switchToHttp().getRequest();
    
    if (!requiredRoles.includes(user.role)) {
       throw new ForbiddenException('Você não tem permissão para acessar este recurso');
    }
    return true;
  }
}
