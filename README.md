# 🍽️ Matspot (맛스팟) - 맛집 매칭 시스템

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.0.0-61DAFB.svg?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100.0-009688.svg?logo=fastapi)
![Express](https://img.shields.io/badge/Express-4.18.0-000000.svg?logo=express)
![Status](https://img.shields.io/badge/status-완료-green.svg)

**맛스팟**은 카카오모빌리티 Navigation API와 SNS 데이터 분석을 통한 고급 맛집 추천 웹 애플리케이션입니다. 구간별 경로 계산, 다중 경유지 경로 표시, SNS 인기순 기반 맛집 추천 등 다양한 기능을 제공합니다.

## 📋 목차
- [프로젝트 소개](#프로젝트-소개)
- [시스템 아키텍처](#시스템-아키텍처)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [서버 포트 구성](#서버-포트-구성)
- [설치 및 실행](#설치-및-실행)
- [API 엔드포인트](#api-엔드포인트)
- [데이터베이스 구조](#데이터베이스-구조)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)

## 🍳 프로젝트 소개

맛스팟은 **카카오모빌리티 Navigation API**와 **SNS 데이터 분석**을 결합한 고급 맛집 추천 시스템입니다. 단순한 맛집 검색을 넘어서 구간별 경로 계산, 다중 경유지 최적화, SNS 인기도 기반 추천 등 실용적인 기능들을 제공합니다.

### 🎯 핵심 특징
- **구간별 개별 경로 계산**: 각 구간의 거리, 시간, 통행료 정보 제공
- **다중 경유지 경로 표시**: 검색위치 → 1번장소 → 2번장소 통합 경로
- **동적 검색 기준**: 1번째는 현재 위치, 2번째부터는 이전 장소 기준 검색
- **SNS 인기순 정렬**: Instagram 언급수와 리뷰수 기반 추천
- **카테고리 필터링**: 음식점(FD6), 카페+편의점(CE7, CS2) 정확한 분류

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Express API    │    │  FastAPI ML     │
│   (Port 3000)   │◄──►│   (Port 5001)   │◄──►│   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Kakao Maps     │    │   User Auth     │    │  Instagram DB   │
│  Navigation API │    │   SQLite DB     │    │  Review DB      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 데이터 플로우
1. **사용자 검색** → React 프론트엔드
2. **장소 검색** → 카카오 Places API (카테고리 필터링)
3. **경로 계산** → 카카오모빌리티 Navigation API
4. **SNS 분석** → FastAPI 추천 백엔드 (Instagram/리뷰 DB)
5. **최종 결과** → 점수 기반 정렬된 맛집 리스트

## ✨ 주요 기능

### 🗺️ 고급 경로 시스템
- **구간별 경로 계산**: 각 구간의 거리, 소요시간, 통행료 개별 계산
- **다중 경유지 표시**: 검색위치 → 1번장소 → 2번장소 통합 경로 시각화
- **실시간 경로 정보**: 카카오모빌리티 API 기반 정확한 경로 데이터
- **경로 최적화**: 직선거리 대신 실제 도로 기반 경로 계산

### 🔍 스마트 검색 시스템
- **동적 검색 기준**: 
  - 1번째 장소: 사용자 현재 위치 기준
  - 2번째 장소: 1번째 선택 장소 위치 기준
- **카테고리 필터링**: 
  - 음식점: FD6 코드로 정확한 식당만 검색
  - 카페: CE7(카페) + CS2(편의점/간식) 통합 검색
- **페이지네이션**: 최대 45개 결과 수집 (3페이지)

### 📊 SNS 인기순 추천
- **4가지 정렬 옵션**:
  - 🏃 거리순: 가까운 순서
  - 📱 SNS 인기순: Instagram 언급수 우선
  - ⭐ 리뷰순: 리뷰 개수 우선  
  - 🎯 종합점수: 거리+SNS+리뷰 균형 점수
- **실시간 점수 계산**: 거리, SNS 언급수, 리뷰수 가중치 적용
- **하버사인 공식**: 정확한 거리 재계산

### 🎨 사용자 경험
- **직관적 UI**: 검색 헤더, 결과 카드, 점수 표시
- **지도 연동**: 마커 클릭 시 상세 정보 표시
- **실시간 피드백**: 검색 상태, 에러 메시지 제공

## 🛠️ 기술 스택

### Frontend
- **React 18.0.0**: 컴포넌트 기반 UI 개발
- **JavaScript ES6+**: 모던 자바스크립트 문법
- **CSS3**: 반응형 스타일링
- **Kakao Maps API**: 지도 시각화 및 위치 서비스

### Backend
- **Express.js**: Node.js 웹 프레임워크 (포트 5001)
- **FastAPI**: Python 고성능 API 프레임워크 (포트 8000)
- **JWT**: 사용자 인증 및 권한 관리
- **SQLite**: 경량 데이터베이스

### APIs & Services
- **카카오모빌리티 Navigation API**: 실제 경로 계산
- **카카오 Places API**: 장소 검색 및 카테고리 필터링
- **Geolocation API**: 사용자 현재 위치 획득

### Data & ML
- **SQLite Database**: 
  - `finally.db`: Instagram 게시물 데이터
  - `restarant.db`: 맛집 리뷰 데이터
  - `matspot.db`: 사용자 인증 데이터
- **Python aiosqlite**: 비동기 데이터베이스 처리
- **하버사인 공식**: 정확한 거리 계산 알고리즘

## 🔧 서버 포트 구성

| 서비스 | 포트 | 설명 | 상태 |
|--------|------|------|------|
| React Frontend | 3000 | 메인 웹 애플리케이션 | ✅ 실행중 |
| Express Backend | 5001 | 사용자 인증, 로그 API | ✅ 실행중 |
| FastAPI ML Backend | 8000 | SNS 분석, 추천 시스템 | ✅ 실행중 |

### API 연동 구조
```
프론트엔드 (3000)
    ├── 사용자 인증 → Express (5001)
    ├── 검색 로그 → Express (5001)  
    └── SNS 추천 → FastAPI (8000)
```

## 🚀 설치 및 실행

### 사전 요구사항
- Node.js 16.0 이상
- Python 3.8 이상
- Git

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 클론
git clone <repository-url>
cd Matspot

# React 의존성 설치
npm install

# Express 서버 의존성 설치
cd server
npm install
cd ..

# Python 의존성 설치
cd recommend_backend
pip3 install fastapi uvicorn aiosqlite
cd ..
```

### 2. API 키 설정
카카오 개발자 콘솔에서 API 키를 발급받아 설정:
- JavaScript 키: 카카오맵 표시용
- REST API 키: 카카오모빌리티 Navigation API용

### 3. 모든 서버 실행

#### 방법 1: 개별 실행
```bash
# 터미널 1: React 개발 서버 (포트 3000)
npm start

# 터미널 2: Express 백엔드 (포트 5001)
cd server && npm start

# 터미널 3: FastAPI 추천 백엔드 (포트 8000)
cd recommend_backend && python3 "test 3.py"
```

#### 방법 2: 한번에 실행 (권장)
```bash
# 모든 서버를 백그라운드로 실행
npm start &
cd server && npm start &
cd ../recommend_backend && python3 "test 3.py" &
```

### 4. 서버 상태 확인
```bash
# 실행 중인 포트 확인
lsof -i :3000,5001,8000
```

정상 실행 시 다음과 같이 표시됩니다:
- ✅ **React**: http://localhost:3000
- ✅ **Express**: http://localhost:5001  
- ✅ **FastAPI**: http://localhost:8000
- 📖 **API 문서**: http://localhost:8000/docs

## 📡 API 엔드포인트

### Express Backend (포트 5001)
```bash
# 사용자 인증
POST /api/auth/register    # 회원가입
POST /api/auth/login       # 로그인

# 검색 로그
POST /api/restaurants/process-search  # 검색 결과 로깅
```

### FastAPI Backend (포트 8000)
```bash
# SNS 추천 시스템
POST /recommend           # 맛집 추천 및 정렬
GET  /docs               # API 문서 (Swagger UI)
```

#### 추천 API 사용 예시
```javascript
const response = await fetch('http://localhost:8000/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    places: searchResults,
    ranking_preference: 'instagram' // 'distance', 'reviews', 'balanced'
  })
});
```

## 🗄️ 데이터베이스 구조

### Instagram DB (`finally.db`)
```sql
-- Instagram 게시물 분석 데이터
CREATE TABLE instagram_posts (
  id INTEGER PRIMARY KEY,
  caption_text TEXT,           -- 게시물 텍스트
  hashtags_representation TEXT -- 해시태그 모음
);
```

### Review DB (`restarant.db`)  
```sql
-- 맛집 리뷰 정보
CREATE TABLE mapinformation (
  id INTEGER PRIMARY KEY,
  name TEXT,        -- 맛집 이름
  address2 TEXT,    -- 주소
  reviewnum INTEGER -- 리뷰 개수
);
```

### User DB (`matspot.db`)
```sql
-- 사용자 계정 정보
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  name TEXT,
  created_at DATETIME
);
```

## 📁 프로젝트 구조

```
Matspot/
├── 📂 public/                    # 정적 파일
│   ├── index.html               # 메인 HTML
│   └── favicon.ico             # 파비콘
├── 📂 src/                      # React 소스코드  
│   ├── 📂 components/           # 리액트 컴포넌트
│   │   ├── KakaoMap.js         # 🗺️ 지도 통합 컴포넌트
│   │   ├── RouteCreationPage.js # 🛣️ 루트 생성 페이지
│   │   ├── KeywordFilter.js    # 🔍 검색 필터
│   │   └── ...
│   ├── 📂 pages/                # 페이지 컴포넌트
│   ├── 📂 services/             # API 서비스
│   └── 📂 styles/               # CSS 스타일
├── 📂 server/                   # Express 백엔드
│   ├── server.js               # 🖥️ 서버 진입점 (포트 5001)
│   ├── 📂 routes/              # API 라우트
│   │   ├── authRoutes.js       # 인증 라우트
│   │   └── restaurantRoutes.js # 맛집 라우트
│   ├── 📂 controllers/         # 컨트롤러
│   └── matspot.db              # 사용자 DB
├── 📂 recommend_backend/        # FastAPI 추천 시스템
│   ├── test 3.py               # 🤖 추천 API 서버 (포트 8000)
│   ├── finally.db              # Instagram 데이터
│   └── restarant.db            # 리뷰 데이터
├── package.json                # React 의존성
└── README.md                   # 프로젝트 문서
```

## 🔧 핵심 컴포넌트 설명

### 🗺️ KakaoMap.js
```javascript
// 주요 기능
- 카카오맵 API 통합
- 마커 관리 (검색, 현재위치, 커스텀)
- 경로 계산 및 표시
- SNS 추천 시스템 연동
- 카테고리 필터링 (FD6, CE7, CS2)
```

### 🛣️ RouteCreationPage.js  
```javascript
// 주요 기능
- 다중 장소 선택 (최대 2개)
- 동적 검색 기준 위치 설정
- 경로 정보 표시 (거리, 시간, 통행료)
- SNS 인기순 정렬 UI
```

### 🤖 test 3.py (FastAPI)
```python
# 주요 기능
- /recommend 엔드포인트
- Instagram/리뷰 DB 비동기 조회
- 4가지 가중치 프리셋 (distance, reviews, instagram, balanced)
- 하버사인 공식 거리 재계산
```

## ⚙️ 개발 가이드

### 환경변수 설정
```bash
# .env 파일 생성 (선택사항)
KAKAO_JAVASCRIPT_KEY=your_javascript_key
KAKAO_REST_API_KEY=your_rest_api_key
KAKAO_MOBILITY_API_KEY=402798a9751102f837f8f9d70a7e8a35
```

### 개발 팁
1. **디버깅**: 브라우저 개발자 도구 콘솔에서 로그 확인
2. **API 테스트**: http://localhost:8000/docs 에서 FastAPI 문서 확인
3. **데이터베이스**: SQLite 브라우저로 DB 내용 확인 가능
4. **포트 충돌**: `lsof -i :포트번호`로 사용 중인 포트 확인

### 트러블슈팅
| 문제 | 해결방법 |
|------|---------|
| 서버 연결 실패 | 모든 서버(3000, 5001, 8000) 실행 상태 확인 |
| 지도 로드 실패 | 카카오 API 키 확인 및 도메인 등록 |
| SNS 데이터 없음 | finally.db, restarant.db 파일 존재 확인 |
| 경로 계산 실패 | 카카오모빌리티 API 키 및 할당량 확인 |

## 🎯 주요 성과

### ✅ 완료된 기능
- [x] 카카오모빌리티 API 연동 및 실제 경로 계산
- [x] FastAPI 추천 백엔드 구현 (4가지 가중치 프리셋)
- [x] SNS 인기순 프론트엔드 연동 (점수, 언급수, 리뷰수 표시)
- [x] 동적 검색 기준 위치 시스템 (1번째는 현재위치, 2번째는 이전장소 기준)
- [x] 카테고리 필터링 (음식점 FD6, 카페+간식 CE7+CS2)
- [x] 구간별 경로 정보 표시 (거리, 시간, 통행료)
- [x] 다중 경유지 경로 표시 (검색위치 → 1번장소 → 2번장소)

### 📊 시스템 성능
- **검색 속도**: 평균 2-3초 (카카오 API + DB 조회)
- **추천 정확도**: SNS 언급수와 리뷰수 기반 가중치 적용
- **사용자 경험**: 직관적인 UI와 실시간 피드백 제공

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 👥 기여자

- **개발팀**: 맛스팟 개발팀
- **API 제공**: 카카오 개발자센터
- **데이터**: Instagram 크롤링 데이터, 맛집 리뷰 데이터

---

📧 **문의사항**: 개발 관련 문의는 이슈를 등록해주세요.  
🌟 **별표**: 프로젝트가 도움이 되셨다면 별표를 눌러주세요!

© 2025 Matspot Team. All Rights Reserved.
© 2025 Matspot Team. All Rights Reserved.
