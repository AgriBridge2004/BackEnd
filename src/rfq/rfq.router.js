import { Router } from 'express';
import {
  createRFQController,
  getAllRFQsController,
  getMyRFQsController,
  getRFQController,
  createQuoteController,
  updateQuoteController,
} from './rfq.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createRFQSchema,
  createQuoteSchema,
  updateQuoteSchema,
} from './rfq.schema.js';

const router = Router();

/**
 * @swagger
 * /rfqs:
 *   post:
 *     summary: Create a new RFQ
 *     tags: [RFQ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productType, quantity, location]
 *             properties:
 *               productType:
 *                 type: string
 *               quantity:
 *                 type: number
 *               location:
 *                 type: string
 *               deliveryDate:
 *                 type: string
 *               budget:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: RFQ created successfully
 *       403:
 *         description: Access denied
 */
router.post('/', verifyToken, verifyRole('buyer'), validate(createRFQSchema), createRFQController);

/**
 * @swagger
 * /rfqs:
 *   get:
 *     summary: Get all open RFQs (farmers browse)
 *     tags: [RFQ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of open RFQs
 */
router.get('/', verifyToken, verifyRole('farmer'), getAllRFQsController);

/**
 * @swagger
 * /rfqs/my:
 *   get:
 *     summary: Get my RFQs (buyer only)
 *     tags: [RFQ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of buyer RFQs
 */
router.get('/my', verifyToken, verifyRole('buyer'), getMyRFQsController);

/**
 * @swagger
 * /rfqs/{id}:
 *   get:
 *     summary: Get RFQ details with quotes
 *     tags: [RFQ]
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
 *         description: RFQ details with all quotes
 *       404:
 *         description: RFQ not found
 */
router.get('/:id', verifyToken, getRFQController);

/**
 * @swagger
 * /rfqs/{id}/quotes:
 *   post:
 *     summary: Farmer submits a quote for an RFQ
 *     tags: [RFQ]
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
 *             required: [price]
 *             properties:
 *               price:
 *                 type: number
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Quote submitted successfully
 *       409:
 *         description: Already submitted a quote
 */
router.post('/:id/quotes', verifyToken, verifyRole('farmer'), validate(createQuoteSchema), createQuoteController);

/**
 * @swagger
 * /rfqs/{id}/quotes/{qid}:
 *   patch:
 *     summary: Buyer accepts, rejects, or counters a quote
 *     tags: [RFQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: qid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, reject, counter]
 *               counterPrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Quote updated successfully
 *       400:
 *         description: Invalid action
 */
router.patch('/:id/quotes/:qid', verifyToken, verifyRole('buyer'), validate(updateQuoteSchema), updateQuoteController);

export default router;