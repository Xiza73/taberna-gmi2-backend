import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  storeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @Matches(/^\d{11}$/, { message: 'ruc must be exactly 11 digits' })
  ruc?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  igvPercentage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  faviconUrl?: string | null;
}
