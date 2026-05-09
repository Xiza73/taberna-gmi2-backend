import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelPosOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
