import { EntitySchema } from 'typeorm';

export const MessageEntity = new EntitySchema({
  name: 'Message',
  tableName: 'messages',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    dealId: {
      type: 'uuid',
    },
    senderId: {
      type: 'uuid',
    },
    senderRole: {
      type: 'enum',
      enum: ['farmer', 'buyer'],
    },
    text: {
      type: 'text',
    },
    type: {
      type: 'enum',
      enum: ['text', 'offer'],
      default: 'text',
    },
    offerPrice: {
      type: 'float',
      nullable: true,
    },
    offerQuantity: {
      type: 'float',
      nullable: true,
    },
    offerTerms: {
      type: 'text',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
  relations: {
    deal: {
      target: 'Deal',
      type: 'many-to-one',
      joinColumn: { name: 'dealId' },
      onDelete: 'CASCADE',
    },
  },
});