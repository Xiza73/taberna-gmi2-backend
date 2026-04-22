import { Inject, Injectable } from '@nestjs/common';

import {
  IMAGE_UPLOADER,
  type IImageUploader,
} from '../../domain/interfaces/image-uploader.interface';

@Injectable()
export class DeleteImageUseCase {
  constructor(
    @Inject(IMAGE_UPLOADER) private readonly imageUploader: IImageUploader,
  ) {}

  async execute(publicId: string): Promise<void> {
    await this.imageUploader.delete(publicId);
  }
}
