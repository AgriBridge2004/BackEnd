import { Router } from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { uploadFarmerImages } from '../middleware/upload.middleware.js';
import { authorizeOwner } from '../middleware/authorizeOwner.js';
import { validate } from '../middleware/validate.middleware.js';
import { createFarmerSchema, updateFarmerSchema } from './farmer.schema.js';
import {
  createFarmerController,
  getFarmerController,
  getMyFarmerController,
  getFarmerByUserController,
  updateFarmerController,
  getAllFarmersController,
} from './farmer.controller.js';

const router = Router();

/**
 * @swagger
 * /farmer:
 *   post:
 *     summary: Create a new farmer profile
 *     tags: [Farmer]
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
 *               farmName:
 *                 type: string
 *               bio:
 *                 type: string
 *               cropTypes:
 *                 type: string
 *               region:
 *                 type: string
 *               farmSize:
 *                 type: number
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Farmer created successfully
 *       400:
 *         description: Missing required fields or invalid image
 *       401:
 *         description: Unauthorized - Token required
 */
router.post(
  '/',
  verifyToken,
  verifyRole('farmer'),
  uploadFarmerImages.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  validate(createFarmerSchema),
  createFarmerController
);

/**
 * @swagger
 * /farmer/profile:
 *   put:
 *     summary: Update my farmer profile
 *     tags: [Farmer]
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
 *               farmName:
 *                 type: string
 *               bio:
 *                 type: string
 *               cropTypes:
 *                 type: string
 *               region:
 *                 type: string
 *               farmSize:
 *                 type: number
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid image type or size
 *       401:
 *         description: Unauthorized - Token required
 *       404:
 *         description: Farmer not found
 */


router.put(
  '/profile',
  verifyToken,
  verifyRole('farmer'),
  uploadFarmerImages.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  validate(updateFarmerSchema),
  updateFarmerController
);
/**
 * @swagger
 * /farmers/profile/me:
 *   get:
 *     summary: Get the current farmer's own profile
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farmer profile retrieved successfully
 *       401:
 *         description: User authentication required
 *       404:
 *         description: Farmer profile not found
 */
router.get(
  "/profile/me",
  verifyToken,
  verifyRole("farmer"),
  getMyFarmerController
);

/**
 * @swagger
 * /farmers:
 *   get:
 *     summary: Get all farmers (Admin only)
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farmers retrieved successfully
 */
router.get(
  "/",
  verifyToken,
  verifyRole("admin"),
  getAllFarmersController
);


/**
 * @swagger
 * /farmers/{id}:
 *   get:
 *     summary: Get a farmer profile by farmer ID
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Farmer retrieved successfully
 *       404:
 *         description: Farmer not found
 */
router.get(
  "/:id",
  verifyToken,
  getFarmerController
);




export default router;