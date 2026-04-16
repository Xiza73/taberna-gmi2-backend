import { BaseEntity } from '@shared/domain/entities/base.entity.js';
import { DomainException } from '@shared/domain/exceptions/index.js';

export class Category extends BaseEntity {
  private _name: string;
  private _slug: string;
  private _description: string | null;
  private _parentId: string | null;
  private _isActive: boolean;
  private _sortOrder: number;

  private constructor(
    id: string,
    name: string,
    slug: string,
    description: string | null,
    parentId: string | null,
    isActive: boolean,
    sortOrder: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._name = name;
    this._slug = slug;
    this._description = description;
    this._parentId = parentId;
    this._isActive = isActive;
    this._sortOrder = sortOrder;
  }

  static create(props: {
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
    sortOrder?: number;
  }): Category {
    if (!props.name || !props.slug) {
      throw new DomainException('Category requires name and slug');
    }
    return new Category(
      undefined!,
      props.name,
      props.slug,
      props.description ?? null,
      props.parentId ?? null,
      true,
      props.sortOrder ?? 0,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }): Category {
    return new Category(
      props.id,
      props.name,
      props.slug,
      props.description,
      props.parentId,
      props.isActive,
      props.sortOrder,
      props.createdAt,
      props.updatedAt,
    );
  }

  get name(): string { return this._name; }
  get slug(): string { return this._slug; }
  get description(): string | null { return this._description; }
  get parentId(): string | null { return this._parentId; }
  get isActive(): boolean { return this._isActive; }
  get sortOrder(): number { return this._sortOrder; }

  update(props: {
    name?: string;
    slug?: string;
    description?: string | null;
    parentId?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  }): void {
    if (props.name !== undefined) this._name = props.name;
    if (props.slug !== undefined) this._slug = props.slug;
    if (props.description !== undefined) this._description = props.description;
    if (props.parentId !== undefined) this._parentId = props.parentId;
    if (props.isActive !== undefined) this._isActive = props.isActive;
    if (props.sortOrder !== undefined) this._sortOrder = props.sortOrder;
    this.markUpdated();
  }
}
