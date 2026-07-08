import { EntitySchema } from 'typeorm';

export const NotificationEntity = new EntitySchema({
  name: 'Notification',
  tableName: 'notifications',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    userId: {
      type: 'uuid',
    },
    type: {
      type: 'enum',
      enum: ['new_message', 'new_offer', 'deal_status', 'quote_action'],
    },
    title: {
      type: 'varchar',
    },
    body: {
      type: 'text',
    },
    link: {
      type: 'varchar',
      nullable: true,
    },
    isRead: {
      type: 'boolean',
      default: false,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
});