import { Router } from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateUserStatusSchema } from './admin.schema.js';
import {
  getPlatformStatsController,
  getAllUsersController,
  getUserByIdController,
  updateUserStatusController,
  verifyUserController,
  deleteUserController,
  getRevenueReportController,
  getDealGrowthController,
  getRecentDisputesController,
} from './admin.controller.js';

const router = Router();

// ============================================================
// GET /admin/stats — US-43
// ============================================================
/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get platform overview stats (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month]
 *           default: week
 *         description: Comparison period vs previous period of same length
 *     responses:
 *       200:
 *         description: Platform stats retrieved successfully
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Access denied - Admin role required
 */
router.get('/stats', verifyToken, verifyRole('admin'), getPlatformStatsController);

// ============================================================
// GET /admin/dashboard/deal-growth — chart data
// ============================================================
/**
 * @swagger
 * /admin/dashboard/deal-growth:
 *   get:
 *     summary: Get weekly deal growth time-series (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weeks
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Deal growth data retrieved successfully
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Access denied - Admin role required
 */
router.get(
  '/dashboard/deal-growth',
  verifyToken,
  verifyRole('admin'),
  getDealGrowthController
);

// ============================================================
// GET /admin/dashboard/recent-disputes — Action Required panel
// ============================================================
/**
 * @swagger
 * /admin/dashboard/recent-disputes:
 *   get:
 *     summary: Get recent open disputes with buyer/farmer names (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Recent open disputes retrieved successfully
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Access denied - Admin role required
 */
router.get(
  '/dashboard/recent-disputes',
  verifyToken,
  verifyRole('admin'),
  getRecentDisputesController
);

// ============================================================
// GET /admin/revenue — US-45
// ============================================================
/**
 * @swagger
 * /admin/revenue:
 *   get:
 *     summary: Get revenue report (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Revenue report retrieved successfully
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Access denied - Admin role required
 */
router.get('/revenue', verifyToken, verifyRole('admin'), getRevenueReportController);

// ============================================================
// GET /admin/users — US-44 (search/filter)
// ============================================================
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Search and filter all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [farmer, buyer, quality_officer, admin]
 *       - in: query
 *         name: isSuspended
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Access denied - Admin role required
 */
router.get('/users', verifyToken, verifyRole('admin'), getAllUsersController);

// ============================================================
// GET /admin/users/:id — US-44
// ============================================================
/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get a single user by ID (Admin only)
 *     tags: [Admin]
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
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/users/:id', verifyToken, verifyRole('admin'), getUserByIdController);

// ============================================================
// PATCH /admin/users/:id/status — US-44 (suspend/unsuspend)
// ============================================================
/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Suspend or unsuspend a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isSuspended]
 *             properties:
 *               isSuspended:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       404:
 *         description: User not found
 */
router.patch(
  '/users/:id/status',
  verifyToken,
  verifyRole('admin'),
  validate(updateUserStatusSchema),
  updateUserStatusController
);

// ============================================================
// PATCH /admin/users/:id/verify — US-44
// ============================================================
/**
 * @swagger
 * /admin/users/{id}/verify:
 *   patch:
 *     summary: Manually verify a user (Admin only)
 *     tags: [Admin]
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
 *         description: User verified successfully
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/verify', verifyToken, verifyRole('admin'), verifyUserController);

// ============================================================
// DELETE /admin/users/:id — US-44
// ============================================================
/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Admin]
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
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', verifyToken, verifyRole('admin'), deleteUserController);

export default router;