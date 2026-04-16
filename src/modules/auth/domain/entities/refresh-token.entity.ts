import { BaseEntity } from '@shared/domain/entities/base.entity.js';

export class RefreshToken extends BaseEntity {
  private _userId: string;
  private _tokenHash: string;
  private _familyId: string;
  private _expiresAt: Date;
  private _isRevoked: boolean;

  private constructor(
    id: string,
    userId: string,
    tokenHash: string,
    familyId: string,
    expiresAt: Date,
    isRevoked: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._userId = userId;
    this._tokenHash = tokenHash;
    this._familyId = familyId;
    this._expiresAt = expiresAt;
    this._isRevoked = isRevoked;
  }

  static create(props: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      undefined!,
      props.userId,
      props.tokenHash,
      props.familyId,
      props.expiresAt,
      false,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      props.id,
      props.userId,
      props.tokenHash,
      props.familyId,
      props.expiresAt,
      props.isRevoked,
      props.createdAt,
      props.updatedAt,
    );
  }

  get userId(): string {
    return this._userId;
  }
  get tokenHash(): string {
    return this._tokenHash;
  }
  get familyId(): string {
    return this._familyId;
  }
  get expiresAt(): Date {
    return this._expiresAt;
  }
  get isRevoked(): boolean {
    return this._isRevoked;
  }

  revoke(): void {
    this._isRevoked = true;
    this.markUpdated();
  }

  isExpired(): boolean {
    return this._expiresAt < new Date();
  }
}
