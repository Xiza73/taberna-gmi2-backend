export class UploadImageResponseDto {
  url: string;
  publicId: string;

  constructor(url: string, publicId: string) {
    this.url = url;
    this.publicId = publicId;
  }
}
