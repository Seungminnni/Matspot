const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// 서버 상태 확인 라우트
router.get('/status', (req, res) => {
  res.status(200).json({ status: 'ok', message: '서버가 정상 작동 중입니다.' });
});

// 회원가입 라우트
router.post('/register', authController.register);

// 로그인 라우트
router.post('/login', authController.login);

// 현재 로그인된 사용자 정보 조회 라우트
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
