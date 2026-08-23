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
    // ─── Extra Fields ───────────────────────────────
    harvestDate: {
      type: 'date',
      nullable: true,
    },
    grade: {
      type: 'enum',
      enum: ['A', 'B', 'C'],
      nullable: true,
    },
    variety: {
      type: 'varchar',
      nullable: true,
    },
    farmingMethod: {
      type: 'enum',
      enum: ['Organic', 'Conventional', 'Hydroponic', 'Other'],
      nullable: true,
    },
    packaging: {
      type: 'varchar',
      nullable: true,
    },
    shelfLife: {
      type: 'varchar',
      nullable: true,
    },
    storage: {
      type: 'varchar',
      nullable: true,
    },
    certifications: {
      type: 'simple-array',
      nullable: true,
    },
    listingType: {
      type: 'enum',
      enum: ['Spot', 'Pre-Harvest'],
      default: 'Spot',
      nullable: true,
    },
    // ────────────────────────────────────────────────
    search_vector: {
      type: 'tsvector',
      nullable: true,
      select: false,
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
  indices: [
    {
      name: 'IDX_LISTING_NAME',
      columns: ['name'],
    },
    {
      name: 'IDX_LISTING_DESCRIPTION',
      columns: ['description'],
    },
  ],
});