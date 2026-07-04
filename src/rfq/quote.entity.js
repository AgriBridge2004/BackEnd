import { EntitySchema } from 'typeorm';

export const QuoteEntity = new EntitySchema({
  name: 'Quote',
  tableName: 'quotes',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    price: {
      type: 'float',
    },
    message: {
      type: 'text',
      nullable: true,
    },
    status: {
      type: 'enum',
      enum: ['pending', 'accepted', 'rejected', 'countered'],
      default: 'pending',
    },
    counterPrice: {
      type: 'float',
      nullable: true,
    },
    rfqId: {
      type: 'uuid',
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
    rfq: {
      target: 'RFQ',
      type: 'many-to-one',
      joinColumn: { name: 'rfqId' },
      onDelete: 'CASCADE',
    },
    farmer: {
      target: 'Farmer',
      type: 'many-to-one',
      joinColumn: { name: 'farmerId' },
      onDelete: 'CASCADE',
    },
  },
});