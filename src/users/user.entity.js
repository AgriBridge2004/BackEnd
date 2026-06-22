import { EntitySchema } from 'typeorm';

export const UserEntity = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    email: {
      type: 'varchar',
      unique: true,
    },
    password: {
      type: 'varchar',
    },
    role: {
      type: 'enum',
      enum: ['farmer', 'buyer', 'quality_officer', 'admin'],
    },
    isVerified: {
      type: 'boolean',
      default: false,
    },
    otp: {
      type: 'varchar',
      nullable: true,
    },
    otpExpiresAt: {
      type: 'timestamp',
      nullable: true,
    },
    refreshToken: {
      type: 'varchar',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
});