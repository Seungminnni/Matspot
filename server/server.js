const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const initializeDatabase = require('./initDb');

// 환경 변수 로드
dotenv.config({ path: path.resolve(__dirname, '.env') });

// 데이터베이스 초기화
initializeDatabase().catch(console.error);

// Express 앱 생성
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트 설정
app.use('/api/auth', authRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Matspot API 서버에 오신 것을 환영합니다!');
});

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
