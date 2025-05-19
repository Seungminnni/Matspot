const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// 회원가입
router.post('/register', authController.register);

// 로그인
router.post('/login', authController.login);

// 로그아웃
router.get('/logout', authController.logout);

// 현재 로그인된 사용자 정보 조회
router.get('/me', protect, authController.getMe);

// 카카오 로그인 시작
router.get('/kakao', authController.kakaoLogin);

// 카카오 로그인 콜백
router.get('/kakao/callback', authController.kakaoCallback);

module.exports = router; 