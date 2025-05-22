const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// 회원가입 라우트
router.post('/register', authController.register);

// 로그인 라우트
router.post('/login', authController.login);

// 현재 로그인된 사용자 정보 조회 라우트
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
