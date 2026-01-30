# AutoQuote

**통신사 상품 견적 관리 시스템** — 인터넷, CCTV, 정수기, 포스기 등 KT 상품 조합에 따른 실시간 견적 계산 및 견적서 발급 웹 애플리케이션입니다.

---

## 📌 프로젝트 소개

AutoQuote는 영업/고객 담당자가 통신 서비스 조합을 선택하면 **상품 혜택(상품권·현금)**, **결합 할인**, **카드 할인**을 실시간으로 계산해 견적서를 생성하는 B2B/B2C 도구입니다. 관리자 페이지에서 서비스·혜택 규칙을 DB 기반으로 유연하게 관리할 수 있습니다.

### 주요 기능

| 구분 | 설명 |
|------|------|
| **견적 계산** | 인터넷 속도, CCTV 채널, 정수기/포스기 등 상품 선택 시 실시간 금액·혜택 계산 |
| **결합 할인** | 서비스 조합별 월정액 할인 적용 (규칙 기반) |
| **혜택 규칙** | 조건부 결합 혜택(required + options 매칭) |
| **견적서 저장/불러오기** | JSON 기반 견적 저장, 최근 견적 목록 |
| **견적서 이미지 내보내기** | html2canvas 기반 화면 캡처 |
| **관리자 페이지** | 서비스, 결합 규칙, 상품별 혜택, 묶음 혜택 CRUD (admin 전용) |
| **인증** | Cookie 기반 세션, bcrypt 비밀번호, user/admin 역할 분리 |

---

## 🛠 기술 스택

### Frontend
- **React 18** · **Vite** (빌드/번들링)
- **Material UI (MUI)** · Emotion (UI/스타일링)
- **React Router v6** (라우팅)
- **Axios** (API 통신)
- **html2canvas** (견적서 이미지 내보내기)

### Backend
- **Node.js** · **Express 5** (REST API)
- **bcryptjs** (비밀번호 해싱)
- **JSON 파일** (db.json, users.json, sessions.json) — 파일 기반 데이터 저장

### DevOps / 기타
- **Docker** · **Docker Compose** (컨테이너 배포)
- **Nginx** (리버스 프록시, SPA 라우팅)
- **Jest** · **Babel** (유닛 테스트)
- **ESLint** (코드 품질)

---

## 🏗 아키텍처

### Clean Architecture / DIP 적용

도메인 로직을 인프라로부터 분리하고, Repository 인터페이스로 구현체를 교체할 수 있도록 설계했습니다.

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation (React, hooks, pages)                          │
├─────────────────────────────────────────────────────────────┤
│  Domain (EstimateService, QuoteCalculator, IQuoteRepository) │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure (QuoteJsonRepository, discountRules, API)    │
└─────────────────────────────────────────────────────────────┘
```

- **Domain**: `QuoteCalculator`, `EstimateService` — 비즈니스 규칙 순수 로직
- **Repository 패턴**: `IQuoteRepository` 인터페이스, `QuoteJsonRepository` 구현체
- **Dependency Injection**: Calculator 생성 시 Repository 주입 가능

### 프로젝트 구조

```
autoquote_web/
├── server/              # Express API 서버
│   ├── server.js        # 인증, CRUD, quotes API
│   └── quotes/          # 견적 JSON 파일 저장
├── src/
│   ├── domain/          # 도메인 로직
│   │   ├── EstimateService.js
│   │   ├── QuoteCalculator.js
│   │   └── repositories/IQuoteRepository.js
│   ├── infrastructure/  # Repository 구현체
│   │   └── json/QuoteJsonRepository.js
│   ├── hooks/           # 데이터 fetch 커스텀 훅
│   ├── components/      # UI 컴포넌트
│   ├── pages/           # 페이지 (Login, Admin)
│   ├── constants/       # 할인/혜택 규칙 알고리즘
│   └── utils/           # 계산·규칙 적용 유틸
├── docker-compose.yml
├── Dockerfile.backend
└── nginx/
```

---

## 🚀 실행 방법

### 사전 요건
- Node.js 20+
- npm

### 로컬 개발

```bash
# 의존성 설치
npm install

# 백엔드 API 서버 실행 (포트 4000)
node server/server.js

# 별도 터미널에서 프론트엔드 개발 서버 (포트 5174)
npm run dev
```

- 프론트: http://localhost:5174
- API: http://localhost:4000/api

> DB 폴더(db.json, users.json 등)가 없으면 서버 기동 시 자동 생성됩니다.

### Docker 배포

```bash
# 프론트 빌드
npm run build

# 컨테이너 실행
docker-compose up -d
```

- 프론트: http://localhost:8010
- 백엔드 API: http://localhost:8009

---

## 📋 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | Vite 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run test` | Jest 테스트 실행 |
| `npm run lint` | ESLint 실행 |

---

## 🔐 인증

- **Cookie 기반 세션** (httpOnly, sameSite)
- 기본 계정: `genieone` / `genieone_admin` (초기 비밀번호는 서버 코드 참조)
- **ProtectedRoute**: `/admin` 경로는 admin 역할만 접근 가능

---

## 📁 주요 API

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/login | 로그인 |
| GET | /api/services | 서비스 목록 |
| GET/POST/PUT/DELETE | /api/combo-rules | 결합 할인 규칙 |
| GET/POST/PUT/DELETE | /api/product-benefits | 상품별 혜택 |
| GET/POST | /api/quotes | 견적 목록 / 저장 |
| GET | /api/memo | 메모 조회 |

---

## ✨ 개발 포인트 (이력서/포트폴리오용)

- **Clean Architecture** — 도메인/인프라 분리, Repository 패턴, DIP 적용
- **복잡한 비즈니스 로직** — 조건부 할인·혜택 규칙, 수량별 혜택, 결합 규칙 엔진
- **풀스택 웹앱** — React + Express, 인증, CRUD, 파일 기반 DB
- **커스텀 훅 기반 상태 관리** — useEstimateData, useServicesData 등으로 관심사 분리
- **테스트 코드** — Jest로 도메인·유틸 단위 테스트
- **Docker 기반 배포** — 멀티 스테이지, Nginx 리버스 프록시

---

## 📄 라이선스

Private
