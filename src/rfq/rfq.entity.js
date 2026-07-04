import { EntitySchema } from 'typeorm';

export const RFQEntity = new EntitySchema({
  name: 'RFQ',
  tableName: 'rfqs',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    productType: {
      type: 'varchar',
    },
    quantity: {
      type: 'float',
    },
    location: {
      type: 'varchar',
    },
    deliveryDate: {
      type: 'date',
      nullable: true,
    },
    budget: {
      type: 'float',
      nullable: true,
    },
    notes: {
      type: 'text',
      nullable: true,
    },
    status: {
      type: 'enum',
      enum: ['open', 'closed', 'cancelled'],
      default: 'open',
    },
    buyerId: {
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
    buyer: {
      target: 'Buyer',
      type: 'many-to-one',
      joinColumn: { name: 'buyerId' },
      onDelete: 'CASCADE',
    },
  },
});