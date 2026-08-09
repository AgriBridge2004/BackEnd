import { Router } from 'express';
import {
  createReviewController,
  getUserReviewsController,
  getDealReviewsController,
} from './review.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Submit a review after deal completion
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dealId, reviewedUserId, rating]
 *             properties:
 *               dealId:
 *                 type: string
 *               reviewedUserId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Deal not completed or invalid rating
 *       403:
 *         description: Not part of this deal
 *       409:
 *         description: Already reviewed this deal
 */
router.post('/', verifyToken, verifyRole('buyer', 'farmer'), createReviewController);

/**
 * @swagger
 * /reviews/user/{userId}:
 *   get:
 *     summary: Get all reviews for a specific user
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews with average rating
 */
router.get('/user/:userId', getUserReviewsController);

/**
 * @swagger
 * /reviews/deal/{dealId}:
 *   get:
 *     summary: Get all reviews for a specific deal
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews for the deal
 */
router.get('/deal/:dealId', verifyToken, getDealReviewsController);

export default router;