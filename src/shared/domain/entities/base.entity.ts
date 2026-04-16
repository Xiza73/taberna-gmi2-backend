import { randomUUID } from 'crypto';

export abstract class BaseEntity {
  private readonly _id: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  protected constructor(id: string, createdAt: Date, updatedAt: Date) {
    this._id = id ?? randomUUID();
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected markUpdated(): void {
    this._updatedAt = new Date();
  }
}
