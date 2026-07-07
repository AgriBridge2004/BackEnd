import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgriBridge API',
      version: '1.0.0',
      description: 'AgriBridge Backend API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    './src/auth/auth.router.js',
    './src/farmer/farmer.router.js',
    './src/listings/listing.router.js',
    './src/buyer/buyer.router.js',
    './src/rfq/rfq.router.js',
    './src/deals/deal.router.js',
    './src/messages/message.router.js',
    './src/notifications/notification.router.js', // ← ضيف هاد
  ],
};

export const swaggerSpec = swaggerJsdoc(options);