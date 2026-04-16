import { type User } from '../../domain/entities/user.entity.js';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
    this.role = user.role;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt.toISOString();
  }
}
