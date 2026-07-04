import { Router } from 'express';
import {
  createListingController,
  getListingController,
  getMyListingsController,
  updateListingController,
  deleteListingController,
  uploadListingImagesController,
  getAllListingsController,
  deleteListingImageController,
} from './listing.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { uploadFarmerImages } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createListingSchema, updateListingSchema } from './listing.schema.js';

const router = Router();

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all available listings with filter and search (public)
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Fruits, Vegetables, Nuts, Herbs, Grains, Meat, Dairy, Eggs, Honey]
 *       - in: query
 *         name: productType
 *         schema:
 *           type: string
 *           enum: [Plant, Animal]
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: price_min
 *         schema:
 *           type: number
 *       - in: query
 *         name: price_max
 *         schema:
 *           type: number
 *       - in: query
 *         name: qty_min
 *         schema:
 *           type: number
 *       - in: query
 *         name: qty_max
 *         schema:
 *           type: number
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
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', verifyToken, verifyRole('farmer'), validate(createListingSchema), createListingController);

/**
 * @swagger
 * /listings/my:
 *   get:
 *     summary: Get my listings (farmer only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of farmer listings with status
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
 * /listings/{id}/images:
 *   delete:
 *     summary: Delete a specific image from a listing
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
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageUrl]
 *             properties:
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Image or listing not found
 *       403:
 *         description: Access denied
 */
router.delete(
  '/:id/images',
  verifyToken,
  verifyRole('farmer'),
  deleteListingImageController
);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get listing by ID with farmer info
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing details including farmer info
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
 *       400:
 *         description: Validation error
 */
router.put('/:id', verifyToken, verifyRole('farmer'), validate(updateListingSchema), updateListingController);

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