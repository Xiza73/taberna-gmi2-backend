import { BaseEntity } from '@shared/domain/entities/base.entity.js';
import { DomainException } from '@shared/domain/exceptions/index.js';
import { StaffRole } from '@shared/domain/enums/staff-role.enum.js';

export class StaffMember extends BaseEntity {
  private _name: string;
  private _email: string;
  private _password: string;
  private _role: StaffRole;
  private _isActive: boolean;
  private _invitedBy: string | null;
  private _googleId: string | null;
  private _resetPasswordToken: string | null;
  private _resetPasswordExpires: Date | null;

  private constructor(
    id: string,
    name: string,
    email: string,
    password: string,
    role: StaffRole,
    isActive: boolean,
    invitedBy: string | null,
    googleId: string | null,
    resetPasswordToken: string | null,
    resetPasswordExpires: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._name = name;
    this._email = email;
    this._password = password;
    this._role = role;
    this._isActive = isActive;
    this._invitedBy = invitedBy;
    this._googleId = googleId;
    this._resetPasswordToken = resetPasswordToken;
    this._resetPasswordExpires = resetPasswordExpires;
  }

  static create(props: {
    name: string;
    email: string;
    password: string;
    role?: StaffRole;
    invitedBy?: string;
  }): StaffMember {
    if (!props.name || !props.email || !props.password) {
      throw new DomainException(
        'StaffMember requires name, email, and password',
      );
    }
    return new StaffMember(
      undefined!,
      props.name,
      props.email.toLowerCase().trim(),
      props.password,
      props.role ?? StaffRole.USER,
      true,
      props.invitedBy ?? null,
      null,
      null,
      null,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: StaffRole;
    isActive: boolean;
    invitedBy: string | null;
    googleId: string | null;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): StaffMember {
    return new StaffMember(
      props.id,
      props.name,
      props.email,
      props.password,
      props.role,
      props.isActive,
      props.invitedBy,
      props.googleId,
      props.resetPasswordToken,
      props.resetPasswordExpires,
      props.createdAt,
      props.updatedAt,
    );
  }

  get name(): string {
    return this._name;
  }
  get email(): string {
    return this._email;
  }
  get password(): string {
    return this._password;
  }
  get role(): StaffRole {
    return this._role;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get invitedBy(): string | null {
    return this._invitedBy;
  }
  get googleId(): string | null {
    return this._googleId;
  }
  get resetPasswordToken(): string | null {
    return this._resetPasswordToken;
  }
  get resetPasswordExpires(): Date | null {
    return this._resetPasswordExpires;
  }

  updateProfile(props: { name?: string }): void {
    if (props.name !== undefined) this._name = props.name;
    this.markUpdated();
  }

  changeRole(newRole: StaffRole): void {
    this._role = newRole;
    this.markUpdated();
  }

  changePassword(hashedPassword: string): void {
    this._password = hashedPassword;
    this.markUpdated();
  }

  linkGoogle(googleId: string): void {
    this._googleId = googleId;
    this.markUpdated();
  }

  setResetPasswordToken(tokenHash: string, expires: Date): void {
    this._resetPasswordToken = tokenHash;
    this._resetPasswordExpires = expires;
    this.markUpdated();
  }

  clearResetPasswordToken(): void {
    this._resetPasswordToken = null;
    this._resetPasswordExpires = null;
    this.markUpdated();
  }

  suspend(): void {
    this._isActive = false;
    this.markUpdated();
  }

  activate(): void {
    this._isActive = true;
    this.markUpdated();
  }
}
