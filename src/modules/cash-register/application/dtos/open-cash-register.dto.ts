import { IsInt, Min } from 'class-validator';

export class OpenCashRegisterDto {
  @IsInt()
  @Min(0)
  initialAmount: number;
}
