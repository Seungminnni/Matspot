const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// DB 파일 경로 지정
const dbPath = path.resolve(__dirname, 'matspot.db');

// SQLite DB 연결
let db;
try {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('SQLite 연결 오류:', err);
      process.exit(1);
    }
    console.log('SQLite 데이터베이스 연결 성공:', dbPath);
  });
} catch (err) {
  console.error('SQLite 연결 오류:', err);
  process.exit(1);
}

// Promise 기반 쿼리 함수
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        // this.lastID, this.changes 등의 정보가 포함됨
        resolve(this);
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = { db, run, get, all };
