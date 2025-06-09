const { run } = require('./db');

async function initializeDatabase() {
  try {
    // users 테이블 생성 (SQLite 문법)
    await run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('users 테이블 생성 완료 또는 이미 존재함');
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
