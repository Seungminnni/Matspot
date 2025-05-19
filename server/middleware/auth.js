const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

exports.protect = async (req, res, next) => {
  let token;
  
  // 쿠키 또는 헤더에서 토큰 가져오기
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 토큰이 없는 경우
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '이 리소스에 접근하려면 로그인이 필요합니다.'
    });
  }

  try {
    // 토큰 검증
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // 사용자 찾기
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '존재하지 않는 사용자입니다.' 
      });
    }
    
    // 요청 객체에 사용자 정보 추가
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '유효하지 않은 토큰입니다.' 
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `'${req.user.role}' 권한으로는 이 기능에 접근할 수 없습니다.`
      });
    }
    next();
  };
}; 