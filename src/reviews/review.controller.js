import { createReview, getReviewsByUser, getReviewsByDeal, getAverageRating } from './review.service.js';
import { getDealById } from '../deals/deal.service.js';
import { getBuyerByUserId } from '../buyer/buyer.service.js';
import { getFarmerByUserId } from '../farmer/farmer.service.js';

// POST /reviews — إنشاء review
export const createReviewController = async (req, res) => {
  try {
    const { dealId, reviewedUserId, rating, comment } = req.body;
    const reviewerId = req.user.id;

    if (!dealId || !reviewedUserId || !rating) {
      return res.status(400).json({ message: 'dealId, reviewedUserId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // تحقق إن الـ Deal موجود وstatus = completed
    const deal = await getDealById(dealId);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    if (deal.status !== 'completed') {
      return res.status(400).json({ message: 'Reviews are only allowed after deal completion' });
    }

    // تحقق إن المستخدم جزء من الـ Deal
    const role = req.user.role;
    if (role === 'buyer') {
      const buyer = await getBuyerByUserId(reviewerId);
      if (!buyer || deal.buyerId !== buyer.id) {
        return res.status(403).json({ message: 'You are not part of this deal' });
      }
    } else if (role === 'farmer') {
      const farmer = await getFarmerByUserId(reviewerId);
      if (!farmer || deal.farmerId !== farmer.id) {
        return res.status(403).json({ message: 'You are not part of this deal' });
      }
    }

    const review = await createReview({
      dealId,
      reviewerId,
      reviewedUserId,
      rating,
      comment: comment || null,
    });

    return res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });

  } catch (error) {
    console.error('CREATE REVIEW ERROR:', error);
    if (error.message === 'You have already reviewed this deal') {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /reviews/user/:userId — جلب reviews مستخدم معين
export const getUserReviewsController = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await getReviewsByUser(userId);
    const stats = await getAverageRating(userId);

    return res.status(200).json({
      averageRating: stats.average,
      totalReviews: stats.count,
      reviews,
    });

  } catch (error) {
    console.error('GET USER REVIEWS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /reviews/deal/:dealId — جلب reviews صفقة معينة
export const getDealReviewsController = async (req, res) => {
  try {
    const { dealId } = req.params;
    const reviews = await getReviewsByDeal(dealId);

    return res.status(200).json({
      count: reviews.length,
      reviews,
    });

  } catch (error) {
    console.error('GET DEAL REVIEWS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};