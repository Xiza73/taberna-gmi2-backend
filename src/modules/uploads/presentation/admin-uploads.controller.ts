import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { UploadImageUseCase } from '../application/use-cases/upload-image.use-case';
import { DeleteImageUseCase } from '../application/use-cases/delete-image.use-case';

@Controller('admin/uploads')
@RequireSubjectType(SubjectType.STAFF)
export class AdminUploadsController {
  constructor(
    private readonly uploadImageUseCase: UploadImageUseCase,
    private readonly deleteImageUseCase: DeleteImageUseCase,
  ) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'products',
  ) {
    const result = await this.uploadImageUseCase.execute(file, folder);
    return BaseResponse.ok(result);
  }

  @Delete('image/:publicId')
  async delete(@Param('publicId') publicId: string) {
    await this.deleteImageUseCase.execute(publicId);
    return BaseResponse.ok(null, 'Image deleted successfully');
  }
}
