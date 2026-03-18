import { IsEmail, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail({}, { message: 'Email inválido' })
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
    password?: string;

    @IsOptional()
    @IsString()
    @IsIn(['ADMIN', 'USER'], { message: 'Role deve ser ADMIN ou USER' })
    role?: string;
}