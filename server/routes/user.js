const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { protect } = require('../middleware/auth');

// 사용자 프로필 조회
router.get('/profile', protect, userController.getUserProfile);

// 사용자 프로필 업데이트
router.put('/profile', protect, userController.updateUserProfile);

// 사용자 비밀번호 변경
router.put('/password', protect, userController.updatePassword);

// 사용자 맛집 루트 조회
router.get('/routes', protect, userController.getUserRoutes);

module.exports = router; 