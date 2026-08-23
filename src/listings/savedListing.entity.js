import { EntitySchema } from 'typeorm';

export const SavedListingEntity = new EntitySchema({
  name: 'SavedListing',
  tableName: 'saved_listings',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    userId: {
      type: 'uuid',
    },
    listingId: {
      type: 'uuid',
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
  relations: {
    listing: {
      target: 'Listing',
      type: 'many-to-one',
      joinColumn: { name: 'listingId' },
      onDelete: 'CASCADE',
    },
  },
});