import { type Banner } from '../../domain/entities/banner.entity.js';

export class BannerResponseDto {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
  isActive: boolean;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;

  constructor(banner: Banner) {
    this.id = banner.id;
    this.title = banner.title;
    this.imageUrl = banner.imageUrl;
    this.linkUrl = banner.linkUrl;
    this.position = banner.position;
    this.isActive = banner.isActive;
    this.sortOrder = banner.sortOrder;
    this.startDate = banner.startDate?.toISOString() ?? null;
    this.endDate = banner.endDate?.toISOString() ?? null;
    this.createdAt = banner.createdAt.toISOString();
    this.updatedAt = banner.updatedAt.toISOString();
  }
}
