import cron from 'node-cron';
import { AppDataSource } from './database.js';
import { ListingEntity } from '../listings/listing.entity.js';
import { sendListingExpiredEmail } from './mailer.js';
import { autoResolveDisputes } from '../disputes/dispute.service.js';

export const startCronJobs = () => {
  // ─── Job 1: Listing Expiry (كل يوم منتصف الليل) ───────────
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running listing expiry check...');

    try {
      const repo = AppDataSource.getRepository(ListingEntity);

      const expiredListings = await repo
        .createQueryBuilder('listing')
        .leftJoinAndSelect('listing.farmer', 'farmer')
        .leftJoinAndSelect('farmer.user', 'user')
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

        if (listing.farmer?.user?.email) {
          await sendListingExpiredEmail(listing.farmer.user.email, listing.name);
          console.log(`📧 Expiry email sent to: ${listing.farmer.user.email}`);
        }
      }

      console.log(`✅ ${expiredListings.length} listings marked as Expired`);

    } catch (error) {
      console.error('LISTING EXPIRY CRON ERROR:', error);
    }
  });

  // ─── Job 2: Auto-Resolve Disputes (كل ساعة) ───────────────
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running auto-resolve disputes check...');

    try {
      const results = await autoResolveDisputes();

      if (results.length > 0) {
        console.log(`✅ Auto-resolved ${results.length} disputes`);
      } else {
        console.log('✅ No disputes to auto-resolve');
      }

    } catch (error) {
      console.error('DISPUTE AUTO-RESOLVE CRON ERROR:', error);
    }
  });

  console.log('✅ Cron jobs started');
};