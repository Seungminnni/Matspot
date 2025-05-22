const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 사용자 등록
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 이메일 중복 확인
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
    }
    
    // 새 사용자 생성
    const user = await User.create({ username, email, password });
    
    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 사용자 찾기
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // 비밀번호 확인
    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: '로그인 성공',
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 현재 로그인된 사용자 정보 조회
exports.getCurrentUser = async (req, res) => {
  res.json({ user: req.user });
};
