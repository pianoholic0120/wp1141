import mongoose from 'mongoose';
import { logger } from '@/lib/utils/logger';

const uri = process.env.MONGODB_URI || '';

let isConnecting = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;
const CONNECTION_TIMEOUT = 10000; // 10 seconds

export async function connectMongo(): Promise<typeof mongoose> {
  // 如果已經連接，直接返回
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  
  // 如果正在連接中，等待一下再檢查
  if (isConnecting) {
    // 等待最多 2 秒
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      // @ts-ignore - readyState can be 1 when connected
      if (mongoose.connection.readyState === 1) {
        return mongoose;
      }
    }
  }
  
  if (!uri) {
    logger.warn('MONGODB_URI is not set, some features may not work');
    throw new Error('MONGODB_URI is not set');
  }
  
  isConnecting = true;
  connectionAttempts++;
  
  try {
    // 設置連接選項，包括超時
    const connectOptions = {
      dbName: 'line-chatbot',
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
      socketTimeoutMS: CONNECTION_TIMEOUT,
      connectTimeoutMS: CONNECTION_TIMEOUT,
      maxPoolSize: 10,
      retryWrites: true,
    };
    
    await mongoose.connect(uri, connectOptions);
    logger.info('Connected to MongoDB');
    connectionAttempts = 0; // 重置計數器
    return mongoose;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(`MongoDB connection failed (attempt ${connectionAttempts}/${MAX_RETRIES}):`, errorMessage);
    
    // 如果是超時錯誤，提供更明確的提示
    if (errorMessage.includes('ETIMEOUT') || errorMessage.includes('timeout')) {
      logger.warn('MongoDB connection timeout. Please check:');
      logger.warn('1. Network connection');
      logger.warn('2. MongoDB Atlas IP whitelist settings');
      logger.warn('3. MongoDB Atlas cluster status');
    }
    
    // 如果未達到最大重試次數，拋出錯誤讓調用者處理
    if (connectionAttempts < MAX_RETRIES) {
      throw error;
    }
    
    // 達到最大重試次數，仍然拋出錯誤（讓調用者決定是否降級）
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * 檢查 MongoDB 連接狀態
 */
export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
