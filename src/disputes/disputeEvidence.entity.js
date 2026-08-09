import { EntitySchema } from 'typeorm';

export const DisputeEvidenceEntity = new EntitySchema({
  name: 'DisputeEvidence',
  tableName: 'dispute_evidence',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    disputeId: {
      type: 'uuid',
    },
    uploadedBy: {
      type: 'uuid',
    },
    fileUrl: {
      type: 'varchar',
    },
    fileType: {
      type: 'varchar',
      nullable: true,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
  relations: {
    dispute: {
      target: 'Dispute',
      type: 'many-to-one',
      joinColumn: { name: 'disputeId' },
      onDelete: 'CASCADE',
    },
  },
});