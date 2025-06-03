const Database = require('better-sqlite3');
const path = require('path');

// DB 파일 경로 지정
const dbPath = path.resolve(__dirname, 'matspot.db');

// SQLite DB 연결
let db;
try {
  db = new Database(dbPath);
  console.log('SQLite 데이터베이스 연결 성공:', dbPath);
} catch (err) {
  console.error('SQLite 연결 오류:', err);
  process.exit(1);
}

// Promise 기반 쿼리 함수
function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    // better-sqlite3는 params가 객체 또는 배열 모두 지원
    const result = Array.isArray(params) ? stmt.run(...params) : stmt.run(params);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    // better-sqlite3는 params가 객체 또는 배열 모두 지원
    const row = Array.isArray(params) ? stmt.get(...params) : stmt.get(params);
    return Promise.resolve(row);
  } catch (err) {
    return Promise.reject(err);
  }
}

function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    // better-sqlite3는 params가 객체 또는 배열 모두 지원
    const rows = Array.isArray(params) ? stmt.all(...params) : stmt.all(params);
    return Promise.resolve(rows);
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports = { db, run, get, all };
