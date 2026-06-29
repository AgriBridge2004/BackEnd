import cron from 'node-cron';
import { AppDataSource } from './database.js';
import { ListingEntity } from '../listings/listing.entity.js';

export const startCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running listing expiry check...');

    try {
      const repo = AppDataSource.getRepository(ListingEntity);

      const expiredListings = await repo
        .createQueryBuilder('listing')
        .where('listing.status = :status', { status: 'Available' })
        .andWhere('listing.expiry < :today', { today: new Date() })
        .andWhere('listing.expiry IS NOT NULL')
        .getMany();

      if (expiredListings.length === 0) {
        console.log('✅ No expired listings found');
        return;
      }

      for (const listing of expiredListings) {
        await repo.update(listing.id, { status: 'Expired' });
        console.log(`❌ Listing expired: ${listing.name} (${listing.id})`);
        // TODO: sendListingExpiredEmail(listing) — لما نضيف الدالة بالـ mailer
      }

      console.log(`✅ ${expiredListings.length} listings marked as Expired`);

    } catch (error) {
      console.error('CRON JOB ERROR:', error);
    }
  });

  console.log('✅ Cron jobs started');
};