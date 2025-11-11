# KY Photo - 사진 관리 시스템

회원가입, 로그인, 관리자 페이지를 포함한 완전한 인증 및 사용자 관리 시스템입니다.

## 주요 기능

### 인증 시스템
- ✅ 회원가입 (이름, 이메일, 비밀번호, 전화번호)
- ✅ 로그인 (JWT 토큰 기반)
- ✅ 로그아웃
- ✅ 비밀번호 암호화 (bcrypt)
- ✅ 보호된 라우트
- ✅ 역할 기반 접근 제어 (사용자/관리자)

### 관리자 기능
- ✅ 대시보드 통계
  - 전체 사용자 수
  - 활성/비활성 사용자
  - 관리자/일반 사용자 비율
  - 최근 7일 가입자 수
- ✅ 사용자 관리
  - 사용자 목록 조회 (페이지네이션)
  - 검색 기능 (이름, 이메일)
  - 역할별 필터링
  - 사용자 정보 수정
  - 사용자 활성화/비활성화
  - 역할 변경 (사용자 ↔ 관리자)
  - 사용자 삭제

### 사용자 기능
- ✅ 개인 대시보드
- ✅ 회원 정보 조회
- ✅ 비밀번호 변경

## 기술 스택

### 백엔드
- **Node.js** - 런타임 환경
- **Express.js** - 웹 프레임워크
- **MongoDB** - 데이터베이스
- **Mongoose** - ODM (Object Data Modeling)
- **JWT** - 인증 토큰
- **bcrypt** - 비밀번호 암호화
- **cors** - CORS 처리
- **dotenv** - 환경 변수 관리

### 프론트엔드
- **React** - UI 라이브러리
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **Context API** - 상태 관리

## 프로젝트 구조

```
ky-photo-jihoon/
├── backend/
│   ├── models/
│   │   └── User.js              # 사용자 모델
│   ├── routes/
│   │   ├── auth.js              # 인증 라우트
│   │   └── admin.js             # 관리자 라우트
│   ├── middleware/
│   │   ├── auth.js              # 인증 미들웨어
│   │   └── admin.js             # 관리자 미들웨어
│   ├── server.js                # 메인 서버 파일
│   ├── .env.example             # 환경 변수 예시
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx       # 네비게이션
    │   │   ├── ProtectedRoute.jsx  # 보호된 라우트
    │   │   └── AdminRoute.jsx   # 관리자 라우트
    │   ├── context/
    │   │   └── AuthContext.jsx  # 인증 컨텍스트
    │   ├── pages/
    │   │   ├── Home.jsx         # 홈 페이지
    │   │   ├── Login.jsx        # 로그인
    │   │   ├── Register.jsx     # 회원가입
    │   │   ├── Dashboard.jsx    # 사용자 대시보드
    │   │   └── admin/
    │   │       ├── AdminDashboard.jsx    # 관리자 대시보드
    │   │       └── UserManagement.jsx    # 사용자 관리
    │   ├── utils/
    │   │   └── api.js           # API 요청 유틸리티
    │   ├── App.jsx              # 메인 앱 컴포넌트
    │   ├── main.jsx             # 엔트리 포인트
    │   └── index.css            # 전역 스타일
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd ky-photo-jihoon
```

### 2. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# .env 파일 생성
cp .env.example .env

# .env 파일 수정 (MongoDB URI, JWT Secret 등)
# nano .env 또는 텍스트 에디터 사용

# 서버 실행
npm run dev
```

**백엔드 .env 설정 예시:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ky-photo-jihoon
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 3. 프론트엔드 설정

```bash
cd ../frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 4. 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:5000

## API 엔드포인트

### 인증 API (`/api/auth`)

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|----------|
| POST | `/register` | 회원가입 | ❌ |
| POST | `/login` | 로그인 | ❌ |
| POST | `/logout` | 로그아웃 | ❌ |
| GET | `/me` | 현재 사용자 정보 | ✅ |
| PUT | `/change-password` | 비밀번호 변경 | ✅ |

### 관리자 API (`/api/admin`)

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| GET | `/dashboard/stats` | 대시보드 통계 | 관리자 |
| GET | `/users` | 사용자 목록 (페이지네이션) | 관리자 |
| GET | `/users/:id` | 특정 사용자 조회 | 관리자 |
| PUT | `/users/:id` | 사용자 정보 수정 | 관리자 |
| DELETE | `/users/:id` | 사용자 삭제 | 관리자 |
| PATCH | `/users/:id/toggle-active` | 활성화 토글 | 관리자 |
| PATCH | `/users/:id/change-role` | 역할 변경 | 관리자 |
| GET | `/users/recent/list` | 최근 사용자 목록 | 관리자 |

## 첫 관리자 계정 생성

처음 시스템을 시작할 때는 관리자 계정이 없으므로, 다음 방법 중 하나를 사용하세요:

### 방법 1: 회원가입 후 MongoDB에서 직접 역할 변경
```bash
# MongoDB 접속
mongosh

# 데이터베이스 선택
use ky-photo-jihoon

# 사용자 역할을 관리자로 변경
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

### 방법 2: 초기 관리자 계정 생성 스크립트 (선택사항)
백엔드에서 다음 스크립트를 실행할 수 있습니다:

```javascript
// backend/createAdmin.js 파일 생성 후 실행
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const admin = new User({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    await admin.save();
    console.log('관리자 계정이 생성되었습니다.');
    process.exit(0);
  });
```

## 보안 고려사항

- ✅ 비밀번호는 bcrypt로 해싱되어 저장
- ✅ JWT 토큰은 httpOnly 쿠키에 저장
- ✅ CORS 설정으로 허용된 도메인만 접근 가능
- ✅ 민감한 정보는 .env 파일로 관리
- ⚠️ 프로덕션 환경에서는 반드시 강력한 JWT_SECRET 사용
- ⚠️ HTTPS 사용 권장

## 환경 변수

### 백엔드 (.env)
```env
PORT=5000                    # 서버 포트
NODE_ENV=development         # 환경 (development/production)
MONGODB_URI=...              # MongoDB 연결 URI
JWT_SECRET=...               # JWT 비밀키 (강력한 값 사용)
JWT_EXPIRES_IN=7d            # 토큰 만료 시간
FRONTEND_URL=...             # 프론트엔드 URL
```

## 개발 가이드

### 새로운 API 엔드포인트 추가
1. `backend/routes/`에 라우트 정의
2. 필요시 `backend/models/`에 모델 추가
3. 미들웨어가 필요하면 `backend/middleware/`에 추가
4. `server.js`에 라우트 등록

### 새로운 페이지 추가
1. `frontend/src/pages/`에 컴포넌트 생성
2. `App.jsx`에 라우트 추가
3. 필요시 `context/`에 상태 관리 추가

## 라이센스

ISC

## 작성자

KY Photo Team

## 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.
