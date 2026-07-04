import { EntitySchema } from 'typeorm';

export const BuyerEntity = new EntitySchema({
  name: 'Buyer',
  tableName: 'buyers',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    fullName: {
      type: 'varchar',
    },
    phone: {
      type: 'varchar',
    },
    companyName: {
      type: 'varchar',
      nullable: true,
    },
    businessType: {
      type: 'enum',
      enum: ['Restaurant', 'Factory', 'Wholesaler', 'Retailer', 'Other'],
      nullable: true,
    },
    address: {
      type: 'varchar',
      nullable: true,
    },
    bio: {
      type: 'text',
      nullable: true,
    },
    profileImage: {
      type: 'varchar',
      nullable: true,
    },
    userId: {
      type: 'uuid',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
  relations: {
    user: {
      target: 'User',
      type: 'one-to-one',
      joinColumn: true,
      cascade: true,
      onDelete: 'CASCADE',
    },
  },
});