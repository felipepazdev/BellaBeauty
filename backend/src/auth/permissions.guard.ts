import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se a rota não exige permissões específicas, permite acesso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Administrador tem acesso total sempre
    if (user.role === 'ADMIN') {
      return true;
    }

    // Se o usuário não tem permissões definidas, bloqueia
    if (!user.permissions) {
      throw new ForbiddenException(
        'Você não possui as permissões necessárias para este recurso',
      );
    }

    const userPermissions: string[] = user.permissions.split(',');

    // Verifica se o usuário tem pelo menos uma das permissões exigidas (OR logic)
    // Ou se quiséssemos AND logic, mudaríamos para .every
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Acesso negado: permissão insuficiente');
    }

    return true;
  }
}
