# 🍽️ Matspot (맛스팟) - 맛집 매칭 시스템

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![React](https://img.shields.io/badge/React-18.0.0-61DAFB.svg?logo=react)
![Status](https://img.shields.io/badge/status-개발%20중-yellow.svg)

**맛스팟**은 위치 기반의 맛집 검색과 SNS 데이터 분석을 통한 맛집 추천 웹 애플리케이션입니다. 사용자 위치 기반 검색, SNS 인기 맛집 매칭, 소셜 기능을 제공합니다.

## 📋 목차
- [프로젝트 소개](#프로젝트-소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [문제 해결 가이드](#문제-해결-가이드)
- [프로젝트 구조](#프로젝트-구조)

## 🍳 프로젝트 소개

맛스팟은 SNS 웹 크롤링과 위치 기반 서비스를 활용하여 사용자에게 최적화된 맛집 정보를 제공합니다. 위치 검색, SNS 데이터 기반 추천, 소셜 기능으로 사용자가 원하는 맛집을 쉽게 찾고 공유할 수 있습니다.

![Matspot Preview](https://via.placeholder.com/800x400?text=Matspot+Preview)

## ✨ 주요 기능

### 🔍 맛집 검색 및 필터링
- **키워드 기반 검색**: 특정 메뉴나 가게 이름으로 검색
- **위치 기반 서비스**: 현재 위치 주변의 맛집 검색
- **SNS 인기 맛집 매칭**: 소셜 미디어 데이터 기반 추천

### 🗺️ 지도 통합
- **카카오맵 연동**: 직관적인 맛집 위치 확인
- **지도 검색**: 지도에서 직접 맛집 검색
- **위치 필터링**: 거리별 맛집 필터링

### 👥 소셜 기능
- **맛집 추천**: 사용자 맛집 추천 및 공유
- **동행자 모집**: 함께 식사할 동행자 찾기
- **SNS 인기 맛집**: 소셜 미디어 데이터 기반 인기 맛집 추천

## 🛠️ 기술 스택
- **프론트엔드**: React, JavaScript, HTML/CSS
- **백엔드**: Node.js, Express
- **데이터베이스**: SQLite
- **API**: Kakao Maps API
- **웹 크롤링**: Python, Selenium
- **인증**: JWT

## 📁 프로젝트 구조

```
matspot/
├── crawling/            # 웹 크롤링 관련 파일
│   ├── test/            # 테스트 및 최종 크롤링 API
│   │   ├── crawling_api.py  # 크롤링 API 서버
│   │   └── finally.db   # 최종 크롤링 데이터 DB
├── public/              # 정적 파일
├── server/              # 백엔드 서버
│   ├── controllers/     # 컨트롤러
│   ├── middleware/      # 미들웨어
│   ├── models/          # 데이터 모델
│   ├── routes/          # API 라우트
│   └── server.js        # 서버 진입점
└── src/                 # 프론트엔드 소스
    ├── components/      # 리액트 컴포넌트
    ├── context/         # 컨텍스트 API
    ├── pages/           # 페이지 컴포넌트
    ├── services/        # API 서비스
    └── styles/          # CSS 스타일
```

## 🚀 시작하기

### 사전 요구사항
- Node.js (v14 이상)
- Python (v3.8 이상)
- Chrome 브라우저

### 설치 및 실행

1. **통합 실행 스크립트 사용 (권장)**
   ```
   start-all-improved.bat
   ```
   이 스크립트는 모든 필요한 서버를 순차적으로 시작하고 상태를 모니터링합니다.
   서버 오류 발생 시 자동으로 재시작을 시도합니다.

2. **수동으로 각 서버 실행**
   
   **프론트엔드 설정**
   ```bash
   npm install
   npm start
   ```

   **백엔드 서버 실행**
   ```bash
   cd server
   npm install
   node server.js
   ```

   **Python 크롤링 API 실행**
   ```bash
   cd crawling/test
   pip install -r requirements.txt
   python crawling_api.py
   ```

## 🔧 문제 해결 가이드

### 로그인 문제 (ERR_CONNECTION_REFUSED)
1. **자동 해결 방법**: `start-all-improved.bat` 스크립트를 사용하여 모든 서버를 자동으로 실행합니다.
2. **수동 해결 방법**:
   - 백엔드 서버가 실행 중인지 확인: `server` 디렉토리에서 `node server.js` 실행
   - 포트 충돌 확인: 기본 포트(5000)가 사용 중인지 확인
   - 네트워크 설정 확인: 방화벽이 포트를 차단하지 않는지 확인
3. **서버 상태 확인**: 
   - 백엔드 서버: http://localhost:5000/api/auth/status
   - 크롤링 API: http://localhost:5001/api/health

### 지도 핀 사라짐 문제
1. **문제 원인**: 새로운 검색을 할 때 기존 마커가 모두 제거되는 문제
2. **해결책**:
   - 검색 시 마커 관리 로직이 개선되어 SNS 마커와 일반 마커가 별도로 관리됩니다.
   - SNS 검색 모드를 켜면 빨간색 마커가 표시되고, 끄면 일반 마커만 표시됩니다.
   - 마커 상태는 개발자 도구 콘솔에서 확인할 수 있습니다.

### 크롤링 API 문제
1. **데이터베이스 경로 확인**: 
   - `finally.db` 파일이 `crawling/test` 디렉토리에 있는지 확인
   - API 서버 시작 시 표시되는 데이터베이스 경로 확인
2. **API 엔드포인트 테스트**:
   - 상태 확인: http://localhost:5001/api/health
   - SNS 맛집 목록: http://localhost:5001/api/sns-restaurants
3. **오류 메시지 확인**: 
   - 크롤링 API 서버 콘솔에서 오류 메시지 확인
   - 프론트엔드에서 네트워크 탭에서 API 호출 상태 확인

## 📝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m '새로운 기능 추가'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📝 추가 정보

- **실행 스크립트**: `start-all.bat` 파일을 실행하면 모든 필요한 서버가 한번에 시작됩니다.
- **포트 정보**:
  - 프론트엔드: http://localhost:3000
  - 백엔드 API: http://localhost:5000
  - 크롤링 API: http://localhost:5001
- 개발 중인 프로젝트로 기능이 계속 추가될 예정입니다.

---

© 2025 Matspot Team. All Rights Reserved.
