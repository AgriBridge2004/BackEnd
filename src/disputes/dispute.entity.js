import { EntitySchema } from 'typeorm';

export const DisputeEntity = new EntitySchema({
  name: 'Dispute',
  tableName: 'disputes',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    dealId: {
      type: 'uuid',
    },
    raisedBy: {
      type: 'uuid',
    },
    reason: {
      type: 'text',
    },
    status: {
      type: 'enum',
      enum: ['open', 'resolved'],
      default: 'open',
    },
    resolution: {
      type: 'enum',
      enum: ['full_release', 'partial', 'refund'],
      nullable: true,
    },
    resolutionNote: {
      type: 'text',
      nullable: true,
    },
    resolvedBy: {
      type: 'uuid',
      nullable: true,
    },
    resolvedAt: {
      type: 'timestamp',
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
    deal: {
      target: 'Deal',
      type: 'many-to-one',
      joinColumn: { name: 'dealId' },
      onDelete: 'CASCADE',
    },
  },
});