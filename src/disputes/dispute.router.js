import { Router } from 'express';
import {
  createDisputeController,
  addEvidenceController,
  getAllDisputesController,
  getDisputeController,
  resolveDisputeController,
  getMyDisputesController,
  getDisputeByDealController,
  getEvidenceByIdController,
  getDisputeStatsController,
} from './dispute.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { uploadFarmerImages } from '../middleware/upload.middleware.js';

const router = Router();

// ============================================================
// POST /disputes — فتح نزاع
// ============================================================
/**
 * @swagger
 * /disputes:
 *   post:
 *     summary: Open a new dispute for a deal
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dealId, reason]
 *             properties:
 *               dealId:
 *                 type: string
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               reason:
 *                 type: string
 *                 example: "Product quality does not match description"
 *     responses:
 *       201:
 *         description: Dispute opened and deal frozen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 dispute:
 *                   $ref: '#/components/schemas/Dispute'
 *       400:
 *         description: Deal is completed or cancelled
 *       403:
 *         description: Not part of this deal
 *       404:
 *         description: Deal not found
 *       409:
 *         description: Dispute already exists for this deal
 */
router.post('/', verifyToken, verifyRole('buyer', 'farmer'), createDisputeController);

// ============================================================
// POST /disputes/:id/evidence — إضافة أدلة
// ============================================================
/**
 * @swagger
 * /disputes/{id}/evidence:
 *   post:
 *     summary: Add evidence to a dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dispute ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 files (images, PDFs, etc.)
 *               description:
 *                 type: string
 *                 description: Optional description of the evidence
 *     responses:
 *       201:
 *         description: Evidence added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 evidence:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DisputeEvidence'
 *       400:
 *         description: No files uploaded or dispute resolved
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Dispute not found
 */
router.post(
  '/:id/evidence',
  verifyToken,
  verifyRole('buyer', 'farmer'),
  uploadFarmerImages.array('files', 5),
  addEvidenceController
);

// ============================================================
// GET /disputes — كل النزاعات (مدير فقط مع فلترة)
// ============================================================
/**
 * @swagger
 * /disputes:
 *   get:
 *     summary: Get all disputes with filtering (Admin only)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, resolved]
 *         description: Filter by dispute status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of disputes with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 disputes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dispute'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 */
router.get('/', verifyToken, verifyRole('admin'), getAllDisputesController);

// ============================================================
// GET /disputes/my — نزاعات المستخدم الحالي
// ============================================================
/**
 * @swagger
 * /disputes/my:
 *   get:
 *     summary: Get all disputes raised by the current user
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's disputes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 disputes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dispute'
 */
router.get('/my', verifyToken, getMyDisputesController);

// ============================================================
// GET /disputes/deal/:dealId — نزاع صفقة معينة
// ============================================================
/**
 * @swagger
 * /disputes/deal/{dealId}:
 *   get:
 *     summary: Get dispute by deal ID
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *     responses:
 *       200:
 *         description: Dispute details with evidence
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dispute:
 *                   $ref: '#/components/schemas/Dispute'
 *                 evidence:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DisputeEvidence'
 *       403:
 *         description: Not authorized to view this dispute
 *       404:
 *         description: No dispute found for this deal
 */
router.get('/deal/:dealId', verifyToken, getDisputeByDealController);

// ============================================================
// GET /disputes/evidence/:id — جلب دليل معين
// ============================================================
/**
 * @swagger
 * /disputes/evidence/{id}:
 *   get:
 *     summary: Get specific evidence by ID
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Evidence ID
 *     responses:
 *       200:
 *         description: Evidence details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 evidence:
 *                   $ref: '#/components/schemas/DisputeEvidence'
 *       403:
 *         description: Not authorized to view this evidence
 *       404:
 *         description: Evidence not found
 */
router.get('/evidence/:id', verifyToken, getEvidenceByIdController);

// ============================================================
// GET /disputes/stats — إحصائيات النزاعات (مدير فقط)
// ============================================================
/**
 * @swagger
 * /disputes/stats:
 *   get:
 *     summary: Get dispute statistics (Admin only)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dispute statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 open:
 *                   type: integer
 *                 resolved:
 *                   type: integer
 *                 resolutionBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       resolution:
 *                         type: string
 *                         enum: [full_release, partial, refund]
 *                       count:
 *                         type: integer
 */
router.get('/stats', verifyToken, verifyRole('admin'), getDisputeStatsController);

// ============================================================
// GET /disputes/:id — تفاصيل نزاع + أدلة
// ============================================================
/**
 * @swagger
 * /disputes/{id}:
 *   get:
 *     summary: Get dispute details with evidence
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dispute ID
 *     responses:
 *       200:
 *         description: Dispute details with all evidence
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dispute:
 *                   $ref: '#/components/schemas/Dispute'
 *                 evidence:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DisputeEvidence'
 *       403:
 *         description: Not authorized to view this dispute
 *       404:
 *         description: Dispute not found
 */
router.get('/:id', verifyToken, getDisputeController);

// ============================================================
// POST /disputes/:id/resolve — حل النزاع (مدير فقط)
// ============================================================
/**
 * @swagger
 * /disputes/{id}/resolve:
 *   post:
 *     summary: Resolve a dispute (Admin only)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dispute ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resolution]
 *             properties:
 *               resolution:
 *                 type: string
 *                 enum: [full_release, partial, refund]
 *                 description: |
 *                   - full_release: Release full payment to farmer
 *                   - partial: Release partial payment
 *                   - refund: Refund full payment to buyer
 *               resolutionNote:
 *                 type: string
 *                 description: Optional note explaining the resolution
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 dispute:
 *                   $ref: '#/components/schemas/Dispute'
 *       400:
 *         description: Invalid resolution value
 *       409:
 *         description: Dispute already resolved
 *       404:
 *         description: Dispute not found
 */
router.post('/:id/resolve', verifyToken, verifyRole('admin'), resolveDisputeController);

export default router;