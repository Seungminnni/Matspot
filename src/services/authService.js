const API_BASE_URL = 'http://localhost:5000/api';

// 서버 상태 확인 함수 추가
export const checkServerStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Server check error:', error);
    return false;
  }
};

// 회원가입 요청
export const registerUser = async (userData) => {
  try {
    console.log('회원가입 요청 데이터:', userData);
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '회원가입에 실패했습니다.');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// 로그인 요청
export const loginUser = async (credentials) => {
  try {
    console.log('로그인 요청 데이터:', credentials);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '로그인에 실패했습니다.');
    }
    
    // 로그인 성공 시 토큰을 로컬 스토리지에 저장
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// 로그아웃 (토큰 제거)
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // 인증 실패 시 로그아웃 처리
        logoutUser();
        return null;
      }
      throw new Error('사용자 정보를 가져오는데 실패했습니다.');
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// 토큰 존재 여부로 로그인 상태 확인
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};
