import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, isAuthenticated } from '../services/authService';

// 인증 컨텍스트 생성
const AuthContext = createContext(null);

// 인증 컨텍스트 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 앱 시작 시 로컬 스토리지의 토큰으로 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated()) {
        try {
          // 스토리지에 저장된 사용자 정보 먼저 사용
          const storedUser = JSON.parse(localStorage.getItem('user'));
          if (storedUser) {
            setUser(storedUser);
          }
          
          // API 호출로 최신 사용자 정보 가져오기
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          } else {
            // API 호출 실패 시 로컬에 저장된 사용자 정보도 삭제
            setUser(null);
            localStorage.removeItem('user');
          }
        } catch (err) {
          setError(err.message);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // 로그인 상태 업데이트
  const updateAuthState = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 로그아웃 처리
  const clearAuthState = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // 컨텍스트 값
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    updateAuthState,
    clearAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 인증 컨텍스트 사용을 위한 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
