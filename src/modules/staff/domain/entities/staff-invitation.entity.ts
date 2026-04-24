import { BaseEntity } from '@shared/domain/entities/base.entity';
import { DomainException } from '@shared/domain/exceptions/index';
import { type StaffRole } from '@shared/domain/enums/staff-role.enum';

export class StaffInvitation extends BaseEntity {
  private _email: string;
  private _role: StaffRole;
  private _tokenHash: string;
  private _invitedBy: string;
  private _expiresAt: Date;
  private _acceptedAt: Date | null;
  private _isRevoked: boolean;

  private constructor(
    id: string,
    email: string,
    role: StaffRole,
    tokenHash: string,
    invitedBy: string,
    expiresAt: Date,
    acceptedAt: Date | null,
    isRevoked: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._email = email;
    this._role = role;
    this._tokenHash = tokenHash;
    this._invitedBy = invitedBy;
    this._expiresAt = expiresAt;
    this._acceptedAt = acceptedAt;
    this._isRevoked = isRevoked;
  }

  static create(props: {
    email: string;
    role: StaffRole;
    tokenHash: string;
    invitedBy: string;
    expiresAt: Date;
  }): StaffInvitation {
    if (!props.email || !props.tokenHash || !props.invitedBy) {
      throw new DomainException(
        'StaffInvitation requires email, tokenHash, and invitedBy',
      );
    }
    const now = new Date();
    return new StaffInvitation(
      undefined!,
      props.email.toLowerCase().trim(),
      props.role,
      props.tokenHash,
      props.invitedBy,
      props.expiresAt,
      null,
      false,
      now,
      now,
    );
  }

  static reconstitute(props: {
    id: string;
    email: string;
    role: StaffRole;
    tokenHash: string;
    invitedBy: string;
    expiresAt: Date;
    acceptedAt: Date | null;
    isRevoked: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): StaffInvitation {
    return new StaffInvitation(
      props.id,
      props.email,
      props.role,
      props.tokenHash,
      props.invitedBy,
      props.expiresAt,
      props.acceptedAt,
      props.isRevoked,
      props.createdAt,
      props.updatedAt,
    );
  }

  get email(): string {
    return this._email;
  }
  get role(): StaffRole {
    return this._role;
  }
  get tokenHash(): string {
    return this._tokenHash;
  }
  get invitedBy(): string {
    return this._invitedBy;
  }
  get expiresAt(): Date {
    return this._expiresAt;
  }
  get acceptedAt(): Date | null {
    return this._acceptedAt;
  }
  get isRevoked(): boolean {
    return this._isRevoked;
  }

  get isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  get isPending(): boolean {
    return !this._isRevoked && !this._acceptedAt && !this.isExpired;
  }

  accept(): void {
    this._acceptedAt = new Date();
    this.markUpdated();
  }

  revoke(): void {
    this._isRevoked = true;
    this.markUpdated();
  }
}
