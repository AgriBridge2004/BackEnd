import { Router } from 'express';
import {
  createListingController,
  getListingController,
  getMyListingsController,
  updateListingController,
  deleteListingController,
  uploadListingImagesController,
  getAllListingsController,
} from './listing.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { uploadFarmerImages } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all available listings (public)
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: List of all available listings
 */
router.get('/', getAllListingsController);

/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, productType, category, description, qty, unit, price, location]
 *             properties:
 *               name:
 *                 type: string
 *               productType:
 *                 type: string
 *                 enum: [Plant, Animal]
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               qty:
 *                 type: number
 *               unit:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: string
 *               expiry:
 *                 type: string
 *     responses:
 *       201:
 *         description: Listing created successfully
 *       403:
 *         description: Access denied
 */
router.post('/', verifyToken, verifyRole('farmer'), createListingController);

/**
 * @swagger
 * /listings/my:
 *   get:
 *     summary: Get my listings
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of farmer listings
 */
router.get('/my', verifyToken, verifyRole('farmer'), getMyListingsController);

/**
 * @swagger
 * /listings/{id}/images:
 *   patch:
 *     summary: Upload images to a listing (max 10)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: Maximum 10 images allowed
 *       403:
 *         description: Access denied
 */
router.patch(
  '/:id/images',
  verifyToken,
  verifyRole('farmer'),
  (req, res, next) => {
    uploadFarmerImages.array('images', 10)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ message: 'Maximum 10 images allowed' });
        }
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadListingImagesController
);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing details
 *       404:
 *         description: Listing not found
 */
router.get('/:id', getListingController);

/**
 * @swagger
 * /listings/{id}:
 *   put:
 *     summary: Update listing
 *     tags: [Listings]
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
 *         description: Listing updated successfully
 */
router.put('/:id', verifyToken, verifyRole('farmer'), updateListingController);

/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete listing
 *     tags: [Listings]
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
 *         description: Listing deleted successfully
 */
router.delete('/:id', verifyToken, verifyRole('farmer'), deleteListingController);

export default router;