const User = require('../models/User');
const Route = require('../models/Route');

// 사용자 프로필 조회
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

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
    res.status(500).json({
      success: false,
      message: '프로필 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 사용자 프로필 업데이트
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, nickname, profileImage } = req.body;
    
    // 닉네임 중복 확인 (다른 사용자가 사용 중인지)
    if (nickname && nickname !== req.user.nickname) {
      const existingNickname = await User.findOne({ nickname });
      if (existingNickname) {
        return res.status(400).json({
          success: false,
          message: '이미 사용 중인 닉네임입니다.'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (nickname) updateData.nickname = nickname;
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 사용자 비밀번호 변경
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 카카오 로그인 사용자의 경우 비밀번호가 없을 수 있음
    if (req.user.kakaoId && !req.user.password) {
      return res.status(400).json({
        success: false,
        message: '소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다.'
      });
    }

    // 사용자 찾기 (비밀번호 포함)
    const user = await User.findById(req.user.id).select('+password');

    // 현재 비밀번호 확인
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '현재 비밀번호가 일치하지 않습니다.'
      });
    }

    // 새 비밀번호로 업데이트
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: '비밀번호가 변경되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 사용자의 맛집 루트 조회
exports.getUserRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ creator: req.user.id });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '맛집 루트 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}; 