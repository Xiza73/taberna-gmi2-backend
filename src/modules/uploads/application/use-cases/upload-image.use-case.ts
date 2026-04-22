import { Inject, Injectable } from '@nestjs/common';

import { DomainException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  IMAGE_UPLOADER,
  type IImageUploader,
} from '../../domain/interfaces/image-uploader.interface';
import { UploadImageResponseDto } from '../dtos/upload-image-response.dto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class UploadImageUseCase {
  constructor(
    @Inject(IMAGE_UPLOADER) private readonly imageUploader: IImageUploader,
  ) {}

  async execute(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadImageResponseDto> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new DomainException(ErrorMessages.UPLOAD_INVALID_FORMAT);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new DomainException(ErrorMessages.UPLOAD_TOO_LARGE);
    }

    const result = await this.imageUploader.upload(file.buffer, folder);
    return new UploadImageResponseDto(result.url, result.publicId);
  }
}
