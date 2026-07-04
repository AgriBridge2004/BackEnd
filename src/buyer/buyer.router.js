import { Router } from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { uploadFarmerImages } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createBuyerSchema, updateBuyerSchema } from './buyer.schema.js';
import {
  createBuyerController,
  getBuyerController,
  getBuyerByUserController,
  updateBuyerController,
  deleteBuyerController,
  getAllBuyersController,
} from './buyer.controller.js';

const router = Router();

/**
 * @swagger
 * /buyer:
 *   post:
 *     summary: Create a new buyer profile
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fullName, phone]
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               companyName:
 *                 type: string
 *               businessType:
 *                 type: string
 *                 enum: [Restaurant, Factory, Wholesaler, Retailer, Other]
 *               address:
 *                 type: string
 *               bio:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Buyer profile created successfully
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Profile already exists
 */
router.post(
  '/',
  verifyToken,
  verifyRole('buyer'),
  uploadFarmerImages.fields([
    { name: 'profileImage', maxCount: 1 },
  ]),
  validate(createBuyerSchema),
  createBuyerController
);

/**
 * @swagger
 * /buyer/profile:
 *   put:
 *     summary: Update my buyer profile
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               companyName:
 *                 type: string
 *               businessType:
 *                 type: string
 *               address:
 *                 type: string
 *               bio:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Buyer profile not found
 */
router.put(
  '/profile',
  verifyToken,
  verifyRole('buyer'),
  uploadFarmerImages.fields([
    { name: 'profileImage', maxCount: 1 },
  ]),
  validate(updateBuyerSchema),
  updateBuyerController
);

/**
 * @swagger
 * /buyer/all:
 *   get:
 *     summary: Get all buyers (admin only)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all buyers
 */
router.get('/all', verifyToken, verifyRole('admin'), getAllBuyersController);

/**
 * @swagger
 * /buyer/user/{userId}:
 *   get:
 *     summary: Get buyer profile by user ID
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buyer profile
 *       404:
 *         description: Buyer not found
 */
router.get('/user/:userId', verifyToken, getBuyerByUserController);

/**
 * @swagger
 * /buyer/{id}:
 *   get:
 *     summary: Get buyer by ID
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buyer details
 *       404:
 *         description: Buyer not found
 */
router.get('/:id', verifyToken, getBuyerController);

/**
 * @swagger
 * /buyer/{id}:
 *   delete:
 *     summary: Delete buyer profile
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buyer deleted successfully
 *       404:
 *         description: Buyer not found
 */
router.delete('/:id', verifyToken, verifyRole('admin'), deleteBuyerController);

export default router;