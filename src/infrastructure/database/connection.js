const mongoose = require('mongoose');
const logger = require('../logging/logger');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/postech_blog';

    await mongoose.connect(uri);

    logger.info('Conectado ao MongoDB com sucesso');

    mongoose.connection.on('error', (err) => {
      logger.error('Erro na conexão com MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Desconectado do MongoDB');
    });
  } catch (error) {
    logger.error('Falha ao conectar ao MongoDB:', error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise<void>}
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    logger.info('Desconectado do MongoDB');
  } catch (error) {
    logger.error('Erro ao desconectar do MongoDB:', error);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
