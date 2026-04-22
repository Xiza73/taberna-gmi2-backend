import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

import { DomainException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { type IImageUploader } from '../../domain/interfaces/image-uploader.interface';

@Injectable()
export class CloudinaryImageUploader implements IImageUploader {
  private readonly logger = new Logger(CloudinaryImageUploader.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(
    file: Buffer,
    folder: string,
  ): Promise<{ url: string; publicId: string }> {
    try {
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
              if (error || !result) {
                const err = error
                  ? new Error(error.message)
                  : new Error('Upload failed');
                return reject(err);
              }
              resolve(result);
            },
          )
          .end(file);
      });

      return { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
      this.logger.error('Cloudinary upload failed', error);
      throw new DomainException(ErrorMessages.UPLOAD_FAILED);
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error(`Cloudinary delete failed for ${publicId}`, error);
      throw new DomainException(ErrorMessages.UPLOAD_FAILED);
    }
  }
}
