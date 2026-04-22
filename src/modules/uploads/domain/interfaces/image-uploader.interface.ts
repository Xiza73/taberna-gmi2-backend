export const IMAGE_UPLOADER = Symbol('IMAGE_UPLOADER');

export interface IImageUploader {
  upload(
    file: Buffer,
    folder: string,
  ): Promise<{ url: string; publicId: string }>;
  delete(publicId: string): Promise<void>;
}
