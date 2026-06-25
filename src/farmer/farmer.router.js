import { Router } from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { uploadFarmerImages } from '../middleware/upload.middleware.js';
import { authorizeOwner } from '../middleware/authorizeOwner.js';
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
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "مثال: زيتون، قمح"
 *               region:
 *                 type: string
 *               farmSize:
 *                 type: number
 *                 description: "المساحة بالدونم"
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: "JPG أو PNG فقط، max 5MB"
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
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "مثال: زيتون، قمح"
 *               region:
 *                 type: string
 *               farmSize:
 *                 type: number
 *                 description: "المساحة بالدونم"
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: "JPG أو PNG فقط، max 5MB"
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

//  /profile بدل /:id — والـ id بيجي من الـ token مباشرة
router.put(
  '/profile',
  verifyToken,
  verifyRole('farmer'),
  uploadFarmerImages.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
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
  verifyRole('farmer'),
  authorizeOwner,
  deleteFarmerController
);

export default router;