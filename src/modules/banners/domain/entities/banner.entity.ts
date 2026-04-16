import { BaseEntity } from '@shared/domain/entities/base.entity.js';
import { DomainException } from '@shared/domain/exceptions/index.js';

import { type BannerPosition } from '../enums/banner-position.enum.js';

export class Banner extends BaseEntity {
  private _title: string;
  private _imageUrl: string;
  private _linkUrl: string | null;
  private _position: BannerPosition;
  private _isActive: boolean;
  private _sortOrder: number;
  private _startDate: Date | null;
  private _endDate: Date | null;

  private constructor(
    id: string,
    title: string,
    imageUrl: string,
    linkUrl: string | null,
    position: BannerPosition,
    isActive: boolean,
    sortOrder: number,
    startDate: Date | null,
    endDate: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._title = title;
    this._imageUrl = imageUrl;
    this._linkUrl = linkUrl;
    this._position = position;
    this._isActive = isActive;
    this._sortOrder = sortOrder;
    this._startDate = startDate;
    this._endDate = endDate;
  }

  static create(props: {
    title: string;
    imageUrl: string;
    linkUrl?: string | null;
    position: BannerPosition;
    isActive?: boolean;
    sortOrder?: number;
    startDate?: Date | null;
    endDate?: Date | null;
  }): Banner {
    if (!props.title || !props.imageUrl) {
      throw new DomainException('Banner requires title and imageUrl');
    }
    return new Banner(
      undefined!,
      props.title,
      props.imageUrl,
      props.linkUrl ?? null,
      props.position,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.startDate ?? null,
      props.endDate ?? null,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    title: string;
    imageUrl: string;
    linkUrl: string | null;
    position: BannerPosition;
    isActive: boolean;
    sortOrder: number;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Banner {
    return new Banner(
      props.id,
      props.title,
      props.imageUrl,
      props.linkUrl,
      props.position,
      props.isActive,
      props.sortOrder,
      props.startDate,
      props.endDate,
      props.createdAt,
      props.updatedAt,
    );
  }

  get title(): string {
    return this._title;
  }
  get imageUrl(): string {
    return this._imageUrl;
  }
  get linkUrl(): string | null {
    return this._linkUrl;
  }
  get position(): BannerPosition {
    return this._position;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get sortOrder(): number {
    return this._sortOrder;
  }
  get startDate(): Date | null {
    return this._startDate;
  }
  get endDate(): Date | null {
    return this._endDate;
  }

  update(props: {
    title?: string;
    imageUrl?: string;
    linkUrl?: string | null;
    position?: BannerPosition;
    isActive?: boolean;
    sortOrder?: number;
    startDate?: Date | null;
    endDate?: Date | null;
  }): void {
    if (props.title !== undefined) this._title = props.title;
    if (props.imageUrl !== undefined) this._imageUrl = props.imageUrl;
    if (props.linkUrl !== undefined) this._linkUrl = props.linkUrl;
    if (props.position !== undefined) this._position = props.position;
    if (props.isActive !== undefined) this._isActive = props.isActive;
    if (props.sortOrder !== undefined) this._sortOrder = props.sortOrder;
    if (props.startDate !== undefined) this._startDate = props.startDate;
    if (props.endDate !== undefined) this._endDate = props.endDate;
    this.markUpdated();
  }
}
