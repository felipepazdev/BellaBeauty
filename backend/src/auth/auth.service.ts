import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

import { JwtPayload } from './types/jwt-payload.type';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    // REGISTER
    async register(dto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const salon = await this.prisma.salon.create({
            data: {
                name: `${dto.name} Salon`,
            },
        });

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
                role: Role.ADMIN,
                salonId: salon.id,
            },
        });

        const tokens = await this.generateTokens(user);

        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: hashedRefreshToken,
            },
        });

        return tokens;
    }

    // LOGIN
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Credenciais inválidas ou conta inativa');
        }

        const passwordValid = await bcrypt.compare(dto.password, user.password);

        if (!passwordValid) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const tokens = await this.generateTokens(user);

        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: hashedRefreshToken,
            },
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                salonId: user.salonId,
                professionalId: user.professionalId,
                permissions: user.permissions,
            },
        };
    }

    async generateTokens(user: any) {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            salonId: user.salonId,
            professionalId: user.professionalId ?? null,
            permissions: user.permissions ?? null,
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.refreshToken) {
                throw new UnauthorizedException();
            }

            const isMatch = await bcrypt.compare(
                refreshToken,
                user.refreshToken,
            );

            if (!isMatch) {
                throw new UnauthorizedException();
            }

            const tokens = await this.generateTokens(user);

            const hashedRefreshToken = await bcrypt.hash(
                tokens.refreshToken,
                10,
            );

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    refreshToken: hashedRefreshToken,
                },
            });

            return tokens;
        } catch {
            throw new UnauthorizedException('Refresh token inválido');
        }
    }

    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                refreshToken: null,
            },
        });

        return {
            message: 'Logout realizado com sucesso',
        };
    }
}