import { Router } from 'express';
import { sendMessageController, getMessagesController, respondToOfferController } from './message.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /deals/{id}/messages:
 *   post:
 *     summary: Send a message in a deal chat
 *     tags: [Messages]
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
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, offer]
 *               offerPrice:
 *                 type: number
 *               offerQuantity:
 *                 type: number
 *               offerTerms:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       403:
 *         description: Not part of this deal
 *       404:
 *         description: Deal not found
 */
router.post('/', verifyToken, verifyRole('buyer', 'farmer'), sendMessageController);

/**
 * @swagger
 * /deals/{id}/messages:
 *   get:
 *     summary: Get all messages in a deal chat
 *     tags: [Messages]
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
 *         description: List of messages
 *       403:
 *         description: Not part of this deal
 *       404:
 *         description: Deal not found
 */
router.get('/', verifyToken, verifyRole('buyer', 'farmer'), getMessagesController);

/**
 * @swagger
 * /deals/{id}/messages/{messageId}/respond:
 *   patch:
 *     summary: Accept or counter an offer message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
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
 *                 enum: [accept, counter]
 *               counterPrice:
 *                 type: number
 *               counterQuantity:
 *                 type: number
 *               counterTerms:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer accepted successfully
 *       201:
 *         description: Counter offer sent successfully
 *       400:
 *         description: Invalid action
 *       403:
 *         description: Not part of this deal
 */
router.patch('/:messageId/respond', verifyToken, verifyRole('buyer', 'farmer'), respondToOfferController);

export default router;