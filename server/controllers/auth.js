const User = require('../models/User');
const config = require('../config/config');
const axios = require('axios');

// 쿠키에 토큰 설정하는 유틸리티 함수
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateToken();

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token
    });
};

// 회원가입
exports.register = async (req, res) => {
  try {
    const { name, email, password, nickname } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 가입된 이메일입니다.'
      });
    }

    // 닉네임 중복 확인
    const existingNickname = await User.findOne({ nickname });
    if (existingNickname) {
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 닉네임입니다.'
      });
    }

    // 사용자 생성
    const user = await User.create({
      name,
      email,
      password,
      nickname
    });

    // 토큰 응답
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일과 비밀번호 필수 입력 확인
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 검색 및 비밀번호 필드 포함
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 이메일 또는 비밀번호입니다.'
      });
    }

    // 비밀번호 일치 확인
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 이메일 또는 비밀번호입니다.'
      });
    }

    // 토큰 응답
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 로그아웃
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10초 후 만료
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: '로그아웃 되었습니다.'
  });
};

// 현재 로그인된 사용자 정보 조회
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 카카오 로그인 URL 제공
exports.kakaoLogin = (req, res) => {
  const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${config.KAKAO.CLIENT_ID}&redirect_uri=${config.KAKAO.REDIRECT_URI}&response_type=code`;
  res.json({ success: true, url: kakaoAuthURL });
};

// 카카오 로그인 콜백 처리
exports.kakaoCallback = async (req, res) => {
  const { code } = req.query;

  try {
    // 인증 코드로 토큰 요청
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: config.KAKAO.CLIENT_ID,
        redirect_uri: config.KAKAO.REDIRECT_URI,
        code
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      }
    );

    const { access_token } = tokenResponse.data;

    // 토큰으로 사용자 정보 요청
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    const { id, kakao_account } = userResponse.data;
    const { email, profile } = kakao_account;

    // 이메일이 없는 경우 (동의 안함)
    if (!email) {
      return res.status(400).json({
        success: false,
        message: '카카오 계정의 이메일 제공에 동의해주세요.'
      });
    }

    // 기존 사용자 확인
    let user = await User.findOne({ email });

    if (user) {
      // 기존 사용자가 있으나 카카오 아이디가 없는 경우 연결
      if (!user.kakaoId) {
        user.kakaoId = id.toString();
        await user.save();
      }
    } else {
      // 새 사용자 생성
      user = await User.create({
        email,
        name: profile.nickname || '카카오 사용자',
        nickname: `${profile.nickname || '사용자'}_${Math.floor(Math.random() * 10000)}`,
        profileImage: profile.profile_image_url || '',
        kakaoId: id.toString()
      });
    }

    // 토큰 응답
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('카카오 로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '카카오 로그인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}; 