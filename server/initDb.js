const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function initializeDatabase() {
  try {
    // MySQL 서버에 연결 (데이터베이스 없이)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    // 데이터베이스 생성 (없는 경우)
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`데이터베이스 ${process.env.DB_NAME} 생성 완료 또는 이미 존재함`);

    // 생성된 데이터베이스 사용
    await connection.query(`USE ${process.env.DB_NAME}`);

    // 사용자 테이블 생성
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('users 테이블 생성 완료 또는 이미 존재함');

    await connection.end();
    console.log('데이터베이스 초기화 완료');
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시 데이터베이스 초기화
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
