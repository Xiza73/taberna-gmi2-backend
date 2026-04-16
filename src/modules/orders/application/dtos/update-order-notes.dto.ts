import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrderNotesDto {
  @IsString()
  @IsNotEmpty()
  adminNotes: string;
}
