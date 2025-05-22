# 🍽️ Matspot (맛스팟)

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB.svg?logo=react)
![Status](https://img.shields.io/badge/status-개발%20중-yellow.svg)

**맛스팟**은 현대적인 UI 디자인과 최신 웹 기술로 개발된 맛집 추천 웹 애플리케이션입니다. 사용자 위치 기반의 맛집 검색부터 소셜 기능까지 다양한 서비스를 제공합니다.

## 📋 목차
- [프로젝트 소개](#프로젝트-소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [기여하기](#기여하기)

## 🍳 프로젝트 소개

맛스팟은 웹 크롤링과 다양한 기법을 활용하여 사용자에게 최적화된 맛집 정보를 제공합니다. 카테고리별 필터링, 키워드 검색, 위치 기반 서비스를 통해 사용자가 원하는 맛집을 쉽게 찾을 수 있도록 도와줍니다.

![Matspot Preview](https://via.placeholder.com/800x400?text=Matspot+Preview)

## ✨ 주요 기능

### 🔍 맛집 검색 및 필터링
- **카테고리 필터링**: 음식 종류별로 맛집 검색
- **키워드 기반 검색**: 특정 메뉴나 가게 이름으로 검색
- **위치 기반 서비스**: 현재 위치 주변의 맛집 추천

### 🗺️ 지도 통합
- **카카오맵 연동**: 직관적인 맛집 위치 확인
- **주변 맛집 탐색**: 지도 상에서 주변 맛집 정보 제공

### 👥 소셜 기능
- **리뷰 시스템**: 사용자 리뷰 작성 및 조회
- **채팅 기능**: 다른 사용자와의 실시간 소통

### 👤 사용자 경험
- **개인화된 추천**: 사용자 취향 기반 맛집 추천
- **마이페이지**: 개인 설정 및 활동 관리

## 🛠 기술 스택

### 프론트엔드
- **React 19.1.0**: 사용자 인터페이스 구축
- **React Router 7.6.0**: 클라이언트 사이드 라우팅
- **React Icons 5.5.0**: 다양한 아이콘 활용
- **Kakao Map API**: 위치 기반 서비스 구현

### 백엔드
- **Express 5.1.0**: RESTful API 서버
- **MySQL 8.0**: 데이터베이스
- **JWT**: 사용자 인증
- **Bcrypt**: 비밀번호 암호화

### 개발 도구
- **Create React App**: 프로젝트 구성 및 빌드
- **Jest/Testing Library**: 코드 테스팅
- **ESLint/Prettier**: 코드 품질 관리

## 📂 프로젝트 구조

```
project/
├── server/                  # 백엔드 서버
│   ├── controllers/         # 컨트롤러 (비즈니스 로직)
│   │   └── authController.js # 인증 관련 컨트롤러
│   ├── middleware/          # 미들웨어
│   │   └── authMiddleware.js # 인증 관련 미들웨어
│   ├── models/              # 데이터 모델
│   │   └── User.js          # 사용자 모델
│   ├── routes/              # API 라우트
│   │   └── authRoutes.js    # 인증 관련 라우트
│   ├── db.js                # 데이터베이스 연결
│   ├── initDb.js            # 데이터베이스 초기화
│   └── server.js            # 서버 시작점
│
├── src/                     # 프론트엔드 (React)
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── Banner.js        # 메인 배너 컴포넌트
│   │   ├── CategoryFilter.js # 카테고리 필터 컴포넌트
│   │   ├── ChatRoom.js      # 채팅방 컴포넌트
│   │   ├── Footer.js        # 푸터 컴포넌트
│   │   ├── Header.js        # 헤더 컴포넌트
│   │   ├── KakaoMap.js      # 카카오맵 연동 컴포넌트
│   │   ├── KeywordFilter.js # 키워드 필터 컴포넌트
│   │   ├── NearbyPage.js    # 주변 맛집 컴포넌트
│   │   ├── PlaceTypeSelector.js # 장소 유형 선택 컴포넌트
│   │   ├── RestaurantList.js # 맛집 목록 컴포넌트
│   │   ├── RestaurantRecommendation.js # 맛집 추천 컴포넌트
│   │   ├── ReviewSection.js  # 리뷰 섹션 컴포넌트
│   │   ├── SearchBar.js      # 검색 바 컴포넌트
│   │   └── SplashScreen.js   # 스플래시 화면 컴포넌트
│   │
│   ├── context/             # 컨텍스트 (상태 관리)
│   │   └── AuthContext.js   # 인증 관련 컨텍스트
│   │
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── Auth.js          # 인증 페이지
│   │   ├── MyPage.js        # 마이페이지
│   │   ├── Nearby.js        # 주변 맛집 페이지
│   │   └── Social.js        # 소셜 기능 페이지
│   │
│   ├── services/            # API 서비스
│   │   └── authService.js   # 인증 관련 API 서비스
│   │
│   ├── styles/              # CSS 스타일 파일
│   │   ├── Auth.css         # 인증 페이지 스타일
│   │   ├── Banner.css       # 배너 스타일
│   │   └── ...              # 기타 컴포넌트 스타일
│   │
│   ├── App.js               # 앱 루트 컴포넌트
│   └── index.js             # React 렌더링 진입점
│
├── public/                  # 정적 파일
│   └── index.html           # HTML 템플릿
│
├── package.json             # 프로젝트 의존성 및 스크립트
└── README.md                # 프로젝트 문서
```

## 🚀 시작하기

### 사전 요구사항
- Node.js 16.0.0 이상
- npm 또는 yarn

### 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/username/matspot.git
cd matspot
```

2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

3. MySQL 설정
   - MySQL 서버 설치 (필요한 경우):
     - Mac: `brew install mysql`
     - Windows: [MySQL 공식 사이트](https://dev.mysql.com/downloads/installer/)에서 다운로드
     - Linux: `sudo apt install mysql-server`
   
   - MySQL 서버 시작:
     - Mac/Linux: `sudo service mysql start` 또는 `sudo systemctl start mysql`
     - Windows: Windows 서비스에서 MySQL 시작

   - 데이터베이스 설정:
     ```bash
     mysql -u root -p
     ```
     ```sql
     CREATE DATABASE matspot_db;
     CREATE USER 'matspot_user'@'localhost' IDENTIFIED BY 'your_password';
     GRANT ALL PRIVILEGES ON matspot_db.* TO 'matspot_user'@'localhost';
     FLUSH PRIVILEGES;
     EXIT;
     ```

4. 환경 변수 설정
   - `server/.env` 파일을 열고 MySQL 정보를 업데이트
   ```
   DB_HOST=localhost
   DB_USER=matspot_user
   DB_PASSWORD=your_password
   DB_NAME=matspot_db
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

5. 서버와 클라이언트 실행
```bash
# 동시에 서버와 클라이언트 실행
npm run dev

# 또는 각각 실행
npm start         # 클라이언트 실행
npm run server    # 서버만 실행
```

4. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m '새로운 기능 추가'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

> **참고**: 이 프로젝트는 현재 개발 중이며 라이선스는 추후 결정될 예정입니다. 외부 API(예: 카카오맵 API)를 사용할 경우 해당 서비스의 이용약관을 준수해야 합니다.
보안상 취약점이 있을 수 있습니다, 현재는 여러사람이 개발중인 단계로 명시적으로 나타내는 부분이 있을 수 있습니다.

Frontend+Backend
