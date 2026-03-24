import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateSettingDto {
  @IsEnum(['NONE', 'EVOLUTION', 'OFFICIAL'])
  @IsOptional()
  whatsappProvider?: string;

  @IsString()
  @IsOptional()
  whatsappToken?: string;

  @IsString()
  @IsOptional()
  whatsappPhoneId?: string;

  @IsString()
  @IsOptional()
  whatsappTemplate24h?: string;

  @IsString()
  @IsOptional()
  whatsappTemplate2h?: string;
}
