import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterStaffDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  // Opcional: si la DB ya tiene staff, este token es obligatorio (debe
  // venir de una invitación válida). Si la DB está vacía, se ignora y
  // el usuario se promueve a SUPER_ADMIN.
  @IsOptional()
  @IsString()
  invitationToken?: string;
}
