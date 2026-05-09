import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CloseCashRegisterDto {
  @IsInt()
  @Min(0)
  closingAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
