import { Router } from 'express';
import {
  createDealController,
  getMyDealsController,
  getDealController,
  signContractController,
  getContractPDFController,
} from './deal.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /deals:
 *   post:
 *     summary: Create a new deal (buyer only)
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [source, price, quantity]
 *             properties:
 *               source:
 *                 type: string
 *                 enum: [rfq, listing]
 *               rfqId:
 *                 type: string
 *               listingId:
 *                 type: string
 *               farmerId:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: number
 *               deliveryDate:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Deal created successfully + contract generated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Buyer/RFQ/Listing not found
 */
router.post('/', verifyToken, verifyRole('buyer'), createDealController);

/**
 * @swagger
 * /deals/my:
 *   get:
 *     summary: Get my deals (buyer or farmer)
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of deals
 */
router.get('/my', verifyToken, verifyRole('buyer', 'farmer'), getMyDealsController);

/**
 * @swagger
 * /deals/{id}/contract/sign:
 *   post:
 *     summary: Sign the deal contract (buyer or farmer)
 *     tags: [Deals]
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
 *         description: Contract signed successfully
 *       409:
 *         description: Already signed or contract locked
 *       403:
 *         description: Not a party to this deal
 *       404:
 *         description: Deal not found
 */
router.post('/:id/contract/sign', verifyToken, verifyRole('buyer', 'farmer'), signContractController);

/**
 * @swagger
 * /deals/{id}/contract/pdf:
 *   get:
 *     summary: Download deal contract as PDF
 *     tags: [Deals]
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
 *         description: PDF file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Contract not generated yet
 *       404:
 *         description: Deal not found
 */
router.get('/:id/contract/pdf', verifyToken, verifyRole('buyer', 'farmer'), getContractPDFController);

/**
 * @swagger
 * /deals/{id}:
 *   get:
 *     summary: Get deal details
 *     tags: [Deals]
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
 *         description: Deal details with contract
 *       404:
 *         description: Deal not found
 */
router.get('/:id', verifyToken, getDealController);

export default router;