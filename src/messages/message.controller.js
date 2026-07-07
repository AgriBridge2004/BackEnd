import { createMessage, getMessagesByDeal } from './message.service.js';
import { getDealById } from '../deals/deal.service.js';
import { getFarmerByUserId } from '../farmer/farmer.service.js';
import { getBuyerByUserId } from '../buyer/buyer.service.js';
import { sendMessageSchema } from './message.schema.js';
import { createNotification } from '../notifications/notification.service.js';

// POST /deals/:id/messages — إرسال رسالة
export const sendMessageController = async (req, res) => {
  try {
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { text, type, offerPrice, offerQuantity, offerTerms } = value;
    const dealId = req.params.id;
    const role = req.user.role;

    if (!['farmer', 'buyer'].includes(role)) {
      return res.status(403).json({ message: 'Only farmers and buyers can send messages' });
    }

    const deal = await getDealById(dealId);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    let profileId;
    let receiverUserId;

    if (role === 'buyer') {
      const buyer = await getBuyerByUserId(req.user.id);
      if (!buyer || deal.buyerId !== buyer.id) {
        return res.status(403).json({ message: 'You are not part of this deal' });
      }
      profileId = buyer.id;
      // الـ receiver هو الـ Farmer
      const farmer = await getFarmerByUserId(null);
      receiverUserId = deal.farmerId;
    } else if (role === 'farmer') {
      const farmer = await getFarmerByUserId(req.user.id);
      if (!farmer || deal.farmerId !== farmer.id) {
        return res.status(403).json({ message: 'You are not part of this deal' });
      }
      profileId = farmer.id;
      // الـ receiver هو الـ Buyer
      receiverUserId = deal.buyerId;
    }

    const message = await createMessage({
      dealId,
      senderId: profileId,
      senderRole: role,
      text,
      type: type || 'text',
      offerPrice: type === 'offer' ? offerPrice : null,
      offerQuantity: type === 'offer' ? offerQuantity : null,
      offerTerms: type === 'offer' ? offerTerms : null,
    });

    const io = req.app.get('io');

    // إشعار للطرف الثاني
    const isOffer = type === 'offer';
    const notification = await createNotification({
      userId: receiverUserId,
      type: isOffer ? 'new_offer' : 'new_message',
      title: isOffer ? 'New Offer Received 📦' : 'New Message 💬',
      body: isOffer ? `New offer: $${offerPrice}` : text,
      link: `/deals/${dealId}`,
    });

    if (io) {
      io.to(`deal_${dealId}`).emit('new_message', message);
      io.to(`user_${receiverUserId}`).emit('new_notification', notification);
    }

    return res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });

  } catch (error) {
    console.error('SEND MESSAGE ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /deals/:id/messages — جلب كل الرسائل
export const getMessagesController = async (req, res) => {
  try {
    const dealId = req.params.id;
    const role = req.user.role;

    const deal = await getDealById(dealId);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    if (role === 'buyer') {
      const buyer = await getBuyerByUserId(req.user.id);
      if (!buyer || deal.buyerId !== buyer.id) {
        return res.status(403).json({ message: 'You are not part of this deal' });
      }
    } else if (role === 'farmer') {
      const farmer = await getFarmerByUserId(req.user.id);
      if (!farmer || deal.farmerId !== farmer.id) {
        return res.status(403).json({ message: 'You are not part of this deal' });
      }
    }

    const messages = await getMessagesByDeal(dealId);

    return res.status(200).json({
      count: messages.length,
      messages,
    });

  } catch (error) {
    console.error('GET MESSAGES ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /deals/:id/messages/:messageId/respond — قبول أو Counter Offer
export const respondToOfferController = async (req, res) => {
  try {
    const { action, counterPrice, counterQuantity, counterTerms } = req.body;
    const { id: dealId, messageId } = req.params;
    const role = req.user.role;

    if (!['accept', 'counter'].includes(action)) {
      return res.status(400).json({ message: 'Action must be accept or counter' });
    }

    const deal = await getDealById(dealId);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    let profileId;
    let receiverUserId;

    if (role === 'buyer') {
      const buyer = await getBuyerByUserId(req.user.id);
      if (!buyer || deal.buyerId !== buyer.id) {
        return res.status(403).json({ message: 'You are not part of this deal' });
      }
      profileId = buyer.id;
      receiverUserId = deal.farmerId;
    } else if (role === 'farmer') {
      const farmer = await getFarmerByUserId(req.user.id);
      if (!farmer || deal.farmerId !== farmer.id) {
        return res.status(403).json({ message: 'You are not part of this deal' });
      }
      profileId = farmer.id;
      receiverUserId = deal.buyerId;
    }

    const io = req.app.get('io');

    if (action === 'accept') {
      const message = await createMessage({
        dealId,
        senderId: profileId,
        senderRole: role,
        text: '✅ Offer accepted!',
        type: 'text',
      });

      // إشعار للطرف الثاني
      const notification = await createNotification({
        userId: receiverUserId,
        type: 'new_offer',
        title: 'Offer Accepted ✅',
        body: 'Your offer has been accepted!',
        link: `/deals/${dealId}`,
      });

      if (io) {
        io.to(`deal_${dealId}`).emit('offer_accepted', { dealId, acceptedBy: role });
        io.to(`deal_${dealId}`).emit('new_message', message);
        io.to(`user_${receiverUserId}`).emit('new_notification', notification);
      }

      return res.status(200).json({
        message: 'Offer accepted successfully',
        data: message,
      });

    } else if (action === 'counter') {
      if (!counterPrice || counterPrice <= 0) {
        return res.status(400).json({ message: 'counterPrice is required for counter action' });
      }

      const message = await createMessage({
        dealId,
        senderId: profileId,
        senderRole: role,
        text: `Counter offer: ${counterPrice}`,
        type: 'offer',
        offerPrice: counterPrice,
        offerQuantity: counterQuantity || null,
        offerTerms: counterTerms || null,
      });

      // إشعار للطرف الثاني
      const notification = await createNotification({
        userId: receiverUserId,
        type: 'new_offer',
        title: 'Counter Offer Received 🔄',
        body: `New counter offer: $${counterPrice}`,
        link: `/deals/${dealId}`,
      });

      if (io) {
        io.to(`deal_${dealId}`).emit('new_message', message);
        io.to(`user_${receiverUserId}`).emit('new_notification', notification);
      }

      return res.status(201).json({
        message: 'Counter offer sent successfully',
        data: message,
      });
    }

  } catch (error) {
    console.error('RESPOND TO OFFER ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};