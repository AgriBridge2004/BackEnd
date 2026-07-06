import { AppDataSource } from '../config/database.js';
import { DealEntity } from './deal.entity.js';
import { UserEntity } from '../users/user.entity.js';
import PDFDocument from 'pdfkit';

const dealRepo = () => AppDataSource.getRepository(DealEntity);

// إنشاء Deal جديد
export const createDeal = async (dealData) => {
  const repo = dealRepo();
  const deal = repo.create(dealData);
  return await repo.save(deal);
};

// جلب Deal بالـ ID
export const getDealById = async (id) => {
  return await dealRepo().findOne({ where: { id } });
};

// جلب كل الـ Deals تبع مستخدم معين (Buyer أو Farmer)
export const getDealsByUser = async (userId, role) => {
  const repo = dealRepo();
  const where = role === 'buyer' ? { buyerId: userId } : { farmerId: userId };
  return await repo.find({ where, order: { createdAt: 'DESC' } });
};

// تحديث Deal
export const updateDeal = async (id, updates) => {
  const repo = dealRepo();
  await repo.update(id, updates);
  return await repo.findOne({ where: { id } });
};

// توليد العقد تلقائياً
export const generateContract = (deal) => {
  return {
    dealId: deal.id,
    generatedAt: new Date(),
    parties: {
      buyerId: deal.buyerId,
      farmerId: deal.farmerId,
    },
    product: {
      type: deal.productType,
      quantity: deal.quantity,
      price: deal.price,
      location: deal.location,
      deliveryDate: deal.deliveryDate,
    },
    notes: deal.notes,
    status: 'unsigned',
    signatures: {
      buyer: false,
      farmer: false,
    },
  };
};

// توقيع العقد
export const signContract = async (dealId, role) => {
  const repo = dealRepo();
  const deal = await repo.findOne({ where: { id: dealId } });

  if (!deal) throw new Error('Deal not found');
  if (!deal.contract) throw new Error('Contract not generated yet');
  if (deal.contract.status === 'locked') throw new Error('Contract already locked');

  const updatedContract = { ...deal.contract };

  if (role === 'buyer') {
    if (updatedContract.signatures.buyer) throw new Error('Buyer already signed');
    updatedContract.signatures.buyer = true;
    updatedContract.buyerSignedAt = new Date();
  } else if (role === 'farmer') {
    if (updatedContract.signatures.farmer) throw new Error('Farmer already signed');
    updatedContract.signatures.farmer = true;
    updatedContract.farmerSignedAt = new Date();
  }

  if (updatedContract.signatures.buyer && updatedContract.signatures.farmer) {
    updatedContract.status = 'locked';
    updatedContract.lockedAt = new Date();
    await repo.update(dealId, {
      contract: updatedContract,
      buyerSigned: true,
      farmerSigned: true,
      status: 'active',
    });
  } else {
    await repo.update(dealId, { contract: updatedContract });
  }

  return await repo.findOne({ where: { id: dealId } });
};

// توليد PDF للعقد
export const generateContractPDF = async (deal) => {
  const buyerRepo = AppDataSource.getRepository('Buyer');
  const farmerRepo2 = AppDataSource.getRepository('Farmer');
  const userRepo = AppDataSource.getRepository(UserEntity);

  const buyer = await buyerRepo.findOne({ where: { id: deal.buyerId } });
  const farmer = await farmerRepo2.findOne({ where: { id: deal.farmerId } });

  const buyerUser = buyer ? await userRepo.findOne({ where: { id: buyer.userId } }) : null;
  const farmerUser = farmer ? await userRepo.findOne({ where: { id: farmer.userId } }) : null;

  const buyerName = buyer?.fullName || buyerUser?.email || deal.buyerId;
  const farmerName = farmer?.fullName || farmerUser?.email || deal.farmerId;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const contract = deal.contract;

    // العنوان
    doc
      .fontSize(20)
      .text('AgriBridge — Deal Contract', { align: 'center' })
      .moveDown();

    // معلومات الـ Deal
    doc
      .fontSize(12)
      .text(`Deal ID: ${deal.id}`)
      .text(`Status: ${deal.status}`)
      .text(`Created At: ${new Date(deal.createdAt).toLocaleDateString()}`)
      .moveDown();

    // الأطراف
    doc
      .fontSize(14)
      .text('Parties', { underline: true })
      .fontSize(12)
      .text(`Buyer: ${buyerName}`)
      .text(`Farmer: ${farmerName}`)
      .moveDown();

    // تفاصيل المنتج
    doc
      .fontSize(14)
      .text('Product Details', { underline: true })
      .fontSize(12)
      .text(`Product: ${deal.productType}`)
      .text(`Quantity: ${deal.quantity}`)
      .text(`Price: $${deal.price}`)
      .text(`Location: ${deal.location}`)
      .text(`Delivery Date: ${deal.deliveryDate || 'Not specified'}`)
      .moveDown();

    // الملاحظات
    if (deal.notes) {
      doc
        .fontSize(14)
        .text('Notes', { underline: true })
        .fontSize(12)
        .text(deal.notes)
        .moveDown();
    }

    // التوقيعات
    doc
      .fontSize(14)
      .text('Signatures', { underline: true })
      .fontSize(12)
      .text(`Buyer Signed: ${contract?.signatures?.buyer ? '✓ Yes' : '✗ No'}`)
      .text(`Farmer Signed: ${contract?.signatures?.farmer ? '✓ Yes' : '✗ No'}`)
      .text(`Contract Status: ${contract?.status || 'unsigned'}`)
      .moveDown();

    // Footer
    doc
      .fontSize(10)
      .text('This is a digitally generated contract by AgriBridge platform.', {
        align: 'center',
        color: 'grey',
      });

    doc.end();
  });
};