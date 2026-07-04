import { Router } from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { uploadFarmerImages } from '../middleware/upload.middleware.js';
import { authorizeOwner } from '../middleware/authorizeOwner.js';
import { validate } from '../middleware/validate.middleware.js';
import { createFarmerSchema, updateFarmerSchema } from './farmer.schema.js';
import {
  createFarmerController,
  getFarmerController,
  getFarmerByUserController,
  updateFarmerController,
  deleteFarmerController,
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
 * /farmer/{id}:
 *   delete:
 *     summary: Delete a farmer profile
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
 *         description: Farmer deleted successfully
 *       404:
 *         description: Farmer not found
 *       401:
 *         description: Unauthorized - Token required
 */
router.delete(
  '/:id',
  verifyToken,
  verifyRole('farmer', 'admin'),
  authorizeOwner,
  deleteFarmerController
);

export default router;