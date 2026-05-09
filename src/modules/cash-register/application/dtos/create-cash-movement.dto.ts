import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { CashMovementType } from '../../domain/enums/cash-movement-type.enum';

export class CreateCashMovementDto {
  @IsEnum(CashMovementType)
  type: CashMovementType;

  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
