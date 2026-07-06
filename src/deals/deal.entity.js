import { EntitySchema } from 'typeorm';

export const DealEntity = new EntitySchema({
  name: 'Deal',
  tableName: 'deals',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    // مصدر الـ Deal — من RFQ أو من Listing مباشرة
    source: {
      type: 'enum',
      enum: ['rfq', 'listing'],
    },
    // لو من RFQ
    rfqId: {
      type: 'uuid',
      nullable: true,
    },
    // لو من Listing
    listingId: {
      type: 'uuid',
      nullable: true,
    },
    buyerId: {
      type: 'uuid',
    },
    farmerId: {
      type: 'uuid',
    },
    // تفاصيل الصفقة
    productType: {
      type: 'varchar',
    },
    quantity: {
      type: 'float',
    },
    price: {
      type: 'float',
    },
    location: {
      type: 'varchar',
    },
    deliveryDate: {
      type: 'date',
      nullable: true,
    },
    notes: {
      type: 'text',
      nullable: true,
    },
    // حالة الـ Deal
    status: {
      type: 'enum',
      enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    // العقد
    contract: {
      type: 'jsonb',
      nullable: true,
    },
    buyerSigned: {
      type: 'boolean',
      default: false,
    },
    farmerSigned: {
      type: 'boolean',
      default: false,
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
});