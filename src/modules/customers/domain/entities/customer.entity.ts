import { BaseEntity } from '@shared/domain/entities/base.entity.js';
import { DomainException } from '@shared/domain/exceptions/index.js';

export class Customer extends BaseEntity {
  private _name: string;
  private _email: string;
  private _password: string;
  private _phone: string | null;
  private _isActive: boolean;
  private _resetPasswordToken: string | null;
  private _resetPasswordExpires: Date | null;
  private _googleId: string | null;

  private constructor(
    id: string,
    name: string,
    email: string,
    password: string,
    phone: string | null,
    isActive: boolean,
    resetPasswordToken: string | null,
    resetPasswordExpires: Date | null,
    googleId: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._name = name;
    this._email = email;
    this._password = password;
    this._phone = phone;
    this._isActive = isActive;
    this._resetPasswordToken = resetPasswordToken;
    this._resetPasswordExpires = resetPasswordExpires;
    this._googleId = googleId;
  }

  static create(props: {
    name: string;
    email: string;
    password: string;
    phone?: string | null;
    googleId?: string | null;
  }): Customer {
    if (!props.name || !props.email || !props.password) {
      throw new DomainException('Customer requires name, email, and password');
    }
    return new Customer(
      undefined!,
      props.name,
      props.email.toLowerCase().trim(),
      props.password,
      props.phone ?? null,
      true,
      null,
      null,
      props.googleId ?? null,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    name: string;
    email: string;
    password: string;
    phone: string | null;
    isActive: boolean;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    googleId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Customer {
    return new Customer(
      props.id,
      props.name,
      props.email,
      props.password,
      props.phone,
      props.isActive,
      props.resetPasswordToken,
      props.resetPasswordExpires,
      props.googleId,
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
  get phone(): string | null {
    return this._phone;
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
  get googleId(): string | null {
    return this._googleId;
  }

  updateProfile(props: { name?: string; phone?: string | null }): void {
    if (props.name !== undefined) this._name = props.name;
    if (props.phone !== undefined) this._phone = props.phone;
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

  linkGoogle(googleId: string): void {
    this._googleId = googleId;
    this.markUpdated();
  }
}
