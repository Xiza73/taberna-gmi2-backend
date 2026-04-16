import { BaseEntity } from '@shared/domain/entities/base.entity.js';
import { DomainException } from '@shared/domain/exceptions/index.js';

export class StaffMember extends BaseEntity {
  private _name: string;
  private _email: string;
  private _password: string;
  private _isActive: boolean;
  private _resetPasswordToken: string | null;
  private _resetPasswordExpires: Date | null;

  private constructor(
    id: string,
    name: string,
    email: string,
    password: string,
    isActive: boolean,
    resetPasswordToken: string | null,
    resetPasswordExpires: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._name = name;
    this._email = email;
    this._password = password;
    this._isActive = isActive;
    this._resetPasswordToken = resetPasswordToken;
    this._resetPasswordExpires = resetPasswordExpires;
  }

  static create(props: {
    name: string;
    email: string;
    password: string;
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
      true,
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
    isActive: boolean;
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
      props.isActive,
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
  get isActive(): boolean {
    return this._isActive;
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

  changePassword(hashedPassword: string): void {
    this._password = hashedPassword;
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
