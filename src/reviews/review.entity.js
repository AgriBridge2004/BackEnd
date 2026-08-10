import { EntitySchema } from 'typeorm';

export const ReviewEntity = new EntitySchema({
  name: 'Review',
  tableName: 'reviews',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    dealId: {
      type: 'uuid',
    },
    reviewerId: {
      type: 'uuid',
    },
    reviewedUserId: {
      type: 'uuid',
    },
    rating: {
      type: 'int',
    },
    comment: {
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