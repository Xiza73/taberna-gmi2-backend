import { Global, Module } from '@nestjs/common';

import { IMAGE_UPLOADER } from './domain/interfaces/image-uploader.interface';
import { CloudinaryImageUploader } from './infrastructure/services/cloudinary-image-uploader.service';
import { UploadImageUseCase } from './application/use-cases/upload-image.use-case';
import { DeleteImageUseCase } from './application/use-cases/delete-image.use-case';
import { AdminUploadsController } from './presentation/admin-uploads.controller';

@Global()
@Module({
  controllers: [AdminUploadsController],
  providers: [
    { provide: IMAGE_UPLOADER, useClass: CloudinaryImageUploader },
    UploadImageUseCase,
    DeleteImageUseCase,
  ],
  exports: [IMAGE_UPLOADER],
})
export class UploadsModule {}
