import { AppDataSource } from '../config/database.js';
import { ReviewEntity } from './review.entity.js';

const reviewRepo = () => AppDataSource.getRepository(ReviewEntity);

export const createReview = async (data) => {
  // تحقق إنه ما في review سابق لنفس الـ deal من نفس المستخدم
  const existing = await reviewRepo().findOne({
    where: {
      dealId: data.dealId,
      reviewerId: data.reviewerId,
    },
  });

  if (existing) {
    throw new Error('You have already reviewed this deal');
  }

  const review = reviewRepo().create(data);
  return await reviewRepo().save(review);
};

export const getReviewsByUser = async (reviewedUserId) => {
  return await reviewRepo().find({
    where: { reviewedUserId },
    order: { createdAt: 'DESC' },
  });
};

export const getReviewsByDeal = async (dealId) => {
  return await reviewRepo().find({
    where: { dealId },
    order: { createdAt: 'DESC' },
  });
};

export const getAverageRating = async (reviewedUserId) => {
  const result = await reviewRepo()
    .createQueryBuilder('review')
    .select('AVG(review.rating)', 'average')
    .addSelect('COUNT(review.id)', 'count')
    .where('review.reviewedUserId = :reviewedUserId', { reviewedUserId })
    .getRawOne();

  return {
    average: parseFloat(result.average) || 0,
    count: parseInt(result.count) || 0,
  };
};