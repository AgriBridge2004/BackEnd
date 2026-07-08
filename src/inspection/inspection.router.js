import { Router } from 'express';
import {
  assignInspectionController,
  respondToAssignmentController,
  submitReportController,
  getInspectionController,
  getInspectionsByDealController,
  getMyInspectionsController,
  getAllInspectionsController,
} from './inspection.controller.js';

import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { uploadFields } from '../middleware/upload.middleware.js';
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inspections
 *   description: Quality Officer inspection assignment and reporting workflow
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Inspection:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         dealId:
 *           type: string
 *           format: uuid
 *         qoId:
 *           type: string
 *           format: uuid
 *         inspectionLocation:
 *           type: string
 *           example: "Nablus, West Bank"
 *         requiredDate:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [assigned, accepted, declined, submitted]
 *         inspectionDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         verifiedQuantity:
 *           type: number
 *           nullable: true
 *         qualityGrade:
 *           type: string
 *           enum: [A, B, C, fail]
 *           nullable: true
 *         summary:
 *           type: string
 *           nullable: true
 *         outcome:
 *           type: string
 *           enum: [approved, partially_approved, rejected]
 *           nullable: true
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AssignInspectionRequest:
 *       type: object
 *       required:
 *         - dealId
 *         - qoId
 *         - inspectionLocation
 *         - requiredDate
 *       properties:
 *         dealId:
 *           type: string
 *           format: uuid
 *         qoId:
 *           type: string
 *           format: uuid
 *         inspectionLocation:
 *           type: string
 *         requiredDate:
 *           type: string
 *           format: date
 *     SubmitReportRequest:
 *       type: object
 *       required:
 *         - inspectionDate
 *         - verifiedQuantity
 *         - qualityGrade
 *         - outcome
 *         - reportPhotos
 *       properties:
 *         inspectionDate:
 *           type: string
 *           format: date
 *         verifiedQuantity:
 *           type: number
 *           example: 450
 *         qualityGrade:
 *           type: string
 *           enum: [A, B, C, fail]
 *         summary:
 *           type: string
 *         outcome:
 *           type: string
 *           enum: [approved, partially_approved, rejected]
 *         reportPhotos:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           minItems: 5
 */

/**
 * @swagger
 * /inspections/assign:
 *   post:
 *     summary: Assign a Quality Officer to a deal (Admin only)
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignInspectionRequest'
 *     responses:
 *       201:
 *         description: Inspection assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 inspection:
 *                   $ref: '#/components/schemas/Inspection'
 *       400:
 *         description: Missing fields or duplicate active inspection
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post(
  '/inspections/assign',
  verifyToken,
  verifyRole('admin'),
  assignInspectionController,
);

/**
 * @swagger
 * /inspections:
 *   get:
 *     summary: Get all inspections in the system (Admin only)
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all inspections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 inspections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inspection'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/inspections',
  verifyToken,
  verifyRole('admin'),
  getAllInspectionsController,
);

/**
 * @swagger
 * /inspections/{id}/respond:
 *   patch:
 *     summary: QO accepts or declines an inspection assignment
 *     tags: [Inspections]
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
 *             required:
 *               - accept
 *             properties:
 *               accept:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Assignment response recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 inspection:
 *                   $ref: '#/components/schemas/Inspection'
 *       400:
 *         description: Invalid state or invalid accept value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Quality Officer role required
 *       404:
 *         description: Quality officer profile or inspection not found
 */
router.patch(
  '/inspections/:id/respond',
  verifyToken,
  verifyRole('quality_officer'),
  respondToAssignmentController,
);

/**
 * @swagger
 * /inspections/{id}/report:
 *   post:
 *     summary: QO submits the full inspection report
 *     tags: [Inspections]
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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/SubmitReportRequest'
 *     responses:
 *       200:
 *         description: Inspection report submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 inspection:
 *                   $ref: '#/components/schemas/Inspection'
 *       400:
 *         description: Missing fields, less than 5 photos, or invalid state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Quality Officer role required
 *       404:
 *         description: Quality officer profile or inspection not found
 */
router.post(
  '/inspections/:id/report',
  verifyToken,
  verifyRole('quality_officer'),
  uploadFields([{ name: 'reportPhotos', maxCount: 10 }]),
  submitReportController,
);

/**
 * @swagger
 * /inspections/mine:
 *   get:
 *     summary: Get inspections assigned to the currently logged-in QO
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the QO's inspections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 inspections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inspection'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Quality officer profile not found
 */
router.get(
  '/inspections/mine',
  verifyToken,
  verifyRole('quality_officer'),
  getMyInspectionsController,
);

/**
 * @swagger
 * /deals/{dealId}/inspections:
 *   get:
 *     summary: Get all inspections for a specific deal
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of inspections for the deal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 inspections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inspection'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/deals/:dealId/inspections',
  verifyToken,
  getInspectionsByDealController,
);

/**
 * @swagger
 * /inspections/{id}:
 *   get:
 *     summary: Get a single inspection by ID
 *     tags: [Inspections]
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
 *         description: Inspection details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inspection'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Inspection not found
 */
router.get(
  '/inspections/:id',
  verifyToken,
  getInspectionController,
);

export default router;