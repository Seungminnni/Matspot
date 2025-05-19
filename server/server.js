const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/config');
const db = require('./config/db');
const bcrypt = require('bcrypt');

// 라우터 임포트
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();

// 서버 로그 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS 설정 - 모든 요청 허용으로 변경
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

// 미들웨어 설정
app.use(express.json());
app.use(cookieParser());

// 디버깅을 위한 요청 바디 출력
app.use((req, res, next) => {
  if (req.method === 'POST' && req.url.includes('/api/auth')) {
    console.log('요청 바디:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// 회원가입 처리 미들웨어
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('회원가입 요청 수신:', req.body);
    
    const { name, email, password, nickname } = req.body;
    
    if (!name || !email || !password || !nickname) {
      console.log('필수 필드 누락:', { name, email, password: '***', nickname });
      return res.status(400).json({
        success: false,
        message: '모든 필수 항목을 입력해주세요.'
      });
    }
    
    // 이메일 중복 확인
    const existingUserEmail = await db.User.findOne({ where: { email } });
    if (existingUserEmail) {
      console.log('중복된 이메일:', email);
      return res.status(400).json({
        success: false,
        message: '이미 가입된 이메일입니다.'
      });
    }
    
    // 닉네임 중복 확인
    const existingNickname = await db.User.findOne({ where: { nickname } });
    if (existingNickname) {
      console.log('중복된 닉네임:', nickname);
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 닉네임입니다.'
      });
    }
    
    // 새 사용자 생성
    const newUser = await db.User.create({
      name,
      email,
      password, // Sequelize 모델의 hooks에서 해싱 처리함
      nickname
    });
    
    console.log('새 사용자 생성 완료:', { id: newUser.id, email: newUser.email, name: newUser.name });
    
    // 토큰 생성
    const token = newUser.generateToken();
    
    res.status(201).json({
      success: true,
      token,
      message: '회원가입이 완료되었습니다.'
    });
  } catch (error) {
    console.error('회원가입 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 로그인 처리 미들웨어
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('로그인 요청 수신:', { ...req.body, password: '***' });
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.'
      });
    }
    
    // 사용자 찾기
    const user = await db.User.findOne({ where: { email } });
    
    if (!user) {
      console.log('사용자를 찾을 수 없음:', email);
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 이메일 또는 비밀번호입니다.'
      });
    }
    
    // 비밀번호 확인
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log('비밀번호 불일치:', email);
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 이메일 또는 비밀번호입니다.'
      });
    }
    
    console.log('로그인 성공:', user.email);
    
    // 토큰 생성
    const token = user.generateToken();
    
    res.status(200).json({
      success: true,
      token,
      message: '로그인 성공'
    });
  } catch (error) {
    console.error('로그인 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 사용자 정보 확인용 엔드포인트
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // JWT 검증 로직이 필요합니다. 지금은 임시 구현
    const jwt = require('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }
    
    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 원래 라우트 설정 (DB 연결 후에만 사용)
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);

// 루트 라우트
app.get('/', (req, res) => {
  res.send('MatSpot API 서버가 실행 중입니다.');
});

// 데이터베이스 연결 및 서버 시작
const PORT = config.PORT;

db.sequelize.sync({ force: false })
  .then(() => {
    console.log('MySQL 데이터베이스에 성공적으로 연결되었습니다.');
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`회원가입 API: http://localhost:${PORT}/api/auth/register`);
    });
  })
  .catch(err => {
    console.error('MySQL 데이터베이스 연결 실패:', err);
    console.log('MySQL 없이 서버를 시작합니다.');
    
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다. (MySQL 없이)`);
      console.log(`회원가입 API: http://localhost:${PORT}/api/auth/register`);
    });
  });

module.exports = app; 