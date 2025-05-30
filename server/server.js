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

// CORS 패키지 미들웨어 사용 - 가장 단순한 방법
app.use(cors({
  origin: true, // 모든 출처 허용 옵션. true 설정은 요청 도메인과 동일한 값으로 설정됨
  credentials: true, // 크로스 도메인 요청에 쿠키 포함
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// 추가 보안 설정 - preflight 요청을 위한 OPTIONS 메서드 처리
app.options('*', cors());

// 요청 로깅
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

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
