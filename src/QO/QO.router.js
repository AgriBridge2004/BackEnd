import express from "express";
import * as qoController from "./QO.controller.js";
import { verifyToken, verifyRole } from "../middleware/auth.middleware.js";
import { validate } from '../middleware/validate.middleware.js';
import { createQOSchema, updateQOSchema, updateQOStatusSchema } from './QO.schema.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: QualityOfficer
 *   description: Quality Officer profile management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     QualityOfficer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         fullName:
 *           type: string
 *           example: "Ahmad Khaled"
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+970599123456"
 *         region:
 *           type: string
 *           nullable: true
 *           example: "Nablus"
 *         status:
 *           type: string
 *           enum: [available, busy, on_leave]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateQORequest:
 *       type: object
 *       required:
 *         - fullName
 *       properties:
 *         fullName:
 *           type: string
 *         phone:
 *           type: string
 *         region:
 *           type: string
 *     UpdateQORequest:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *         phone:
 *           type: string
 *         region:
 *           type: string
 *     UpdateQOStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [available, busy, on_leave]
 */

/**
 * @swagger
 * /qo/profile:
 *   post:
 *     summary: Create the Quality Officer profile for the logged-in user
 *     tags: [QualityOfficer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQORequest'
 *     responses:
 *       201:
 *         description: QO profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 qo:
 *                   $ref: '#/components/schemas/QualityOfficer'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Quality Officer role required
 *       409:
 *         description: QO profile already exists for this user
 */
router.post(
  "/profile",
  verifyToken,
  validate(createQOSchema),
  verifyRole("quality_officer"),
  qoController.createQOProfile
);

/**
 * @swagger
 * /qo/profile/me:
 *   get:
 *     summary: Get the logged-in QO's own profile
 *     tags: [QualityOfficer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QO profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QualityOfficer'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Quality Officer role required
 *       404:
 *         description: QO profile not found
 */
router.get(
  "/profile/me",
  verifyToken,
  verifyRole("quality_officer"),
  qoController.getMyQOProfile
);

/**
 * @swagger
 * /qo/profile/me:
 *   put:
 *     summary: Update the logged-in QO's profile
 *     tags: [QualityOfficer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQORequest'
 *     responses:
 *       200:
 *         description: QO profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 qo:
 *                   $ref: '#/components/schemas/QualityOfficer'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Quality Officer role required
 *       404:
 *         description: QO profile not found
 */
router.put(
  "/profile/me",
  verifyToken,
  validate(updateQOSchema),
  verifyRole("quality_officer"),
  qoController.updateQOProfile
);

/**
 * @swagger
 * /qo/profile/me/status:
 *   patch:
 *     summary: Update the logged-in QO's availability status
 *     tags: [QualityOfficer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQOStatusRequest'
 *     responses:
 *       200:
 *         description: QO status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 qo:
 *                   $ref: '#/components/schemas/QualityOfficer'
 *       400:
 *         description: Validation error - invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Quality Officer role required
 *       404:
 *         description: QO profile not found
 */
router.patch(
  "/profile/me/status",
  verifyToken,
  validate(updateQOStatusSchema),
  verifyRole("quality_officer"),
  qoController.updateQOStatus
);

/**
 * @swagger
 * /qo:
 *   get:
 *     summary: Get all Quality Officers (Admin only)
 *     tags: [QualityOfficer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all Quality Officers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 qos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QualityOfficer'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  "/",
  verifyToken,
  verifyRole("admin"),
  qoController.getAllQOs
);

/**
 * @swagger
 * /qo/{id}:
 *   get:
 *     summary: Get a single Quality Officer by ID (Admin only)
 *     tags: [QualityOfficer]
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
 *         description: QO details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QualityOfficer'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Quality Officer not found
 */
router.get(
  "/:id",
  verifyToken,
  verifyRole("admin"),
  qoController.getQOById
);

export default router;