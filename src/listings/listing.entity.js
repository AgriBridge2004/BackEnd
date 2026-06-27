import { EntitySchema } from 'typeorm';

export const ListingEntity = new EntitySchema({
  name: 'Listing',
  tableName: 'listings',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
    },
    productType: {
      type: 'enum',
      enum: ['Plant', 'Animal'],
    },
    category: {
      type: 'enum',
      enum: ['Fruits', 'Vegetables', 'Nuts', 'Herbs', 'Grains', 'Meat', 'Dairy', 'Eggs', 'Honey'],
    },
    description: {
      type: 'text',
    },
    qty: {
      type: 'float',
    },
    unit: {
      type: 'enum',
      enum: ['kg', 'ton', 'piece', 'liter', 'box'],
    },
    price: {
      type: 'float',
    },
    location: {
      type: 'varchar',
    },
    expiry: {
      type: 'date',
      nullable: true,
    },
    status: {
      type: 'enum',
      enum: ['Available', 'Sold', 'Expired'],
      default: 'Available',
    },
    images: {
      type: 'simple-array',
      nullable: true,
    },
    farmerId: {
      type: 'uuid',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    farmer: {
      target: 'Farmer',
      type: 'many-to-one',
      joinColumn: { name: 'farmerId' },
      onDelete: 'CASCADE',
    },
  },
});