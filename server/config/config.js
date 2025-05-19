require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'matspot_secret_key',
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    DATABASE: process.env.DB_DATABASE || 'matspot',
    DIALECT: 'mysql',
    PORT: process.env.DB_PORT || 3306,
    POOL: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  KAKAO: {
    CLIENT_ID: process.env.KAKAO_CLIENT_ID,
    REDIRECT_URI: process.env.KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback'
  }
}; 