# Skirt Tracking System

QR 기반 Skirt 위치 트래킹 웹앱 (공장 PoC)

## 📱 프로젝트 개요

- **목표**: 공장 내 Skirt의 실시간 위치 추적 및 이력 관리
- **주요 기능**:
  - Location QR 스캔으로 작업 위치 설정
  - Skirt QR 스캔으로 자동 이벤트 생성 (서버 타임스탬프)
  - Skirt ID 조회로 현재 위치 및 이동 이력 확인
  - 모바일 최적화 UI (PWA 지원)

## 🌐 URLs

- **샌드박스 개발 서버**: https://3000-icaubolsu8pq8e3z9yskr-2e1b9533.sandbox.novita.ai
- **API Base URL**: `/api`
- **Production** (배포 후): https://webapp.pages.dev

## 🗄️ 데이터 아키텍처

### 데이터 모델

**Locations (작업 위치)**
- `id` (TEXT): Location ID (예: MOD_01)
- `name` (TEXT): 위치 이름 (예: Fit-up MOD 01)
- `zone` (TEXT): 구역 (Assembly, Welding)
- `x`, `y` (INTEGER): 맵 좌표

**Events (스캔 이벤트 로그)**
- `id` (TEXT): UUID
- `ts` (TEXT): 서버 생성 타임스탬프 (ISO8601)
- `operator` (TEXT): 작업자 이름/사번 (선택)
- `location_id` (TEXT): 작업 위치
- `skirt_id` (TEXT): Skirt ID
- `heat_no` (TEXT): Heat Number
- `source` (TEXT): 데이터 소스 (기본값: PD)

### 스토리지 서비스

- **Cloudflare D1**: SQLite 기반 글로벌 분산 데이터베이스
- **로컬 개발**: `.wrangler/state/v3/d1` 경로의 로컬 SQLite
- **프로덕션**: Cloudflare D1 (database_id 필요)

### 데이터 플로우

1. **Location 설정**: QR 스캔 → localStorage에 저장 → UI 업데이트
2. **Skirt 스캔**: QR 스캔 → 파싱 → POST /api/event → D1에 저장 (서버 타임스탬프 생성)
3. **Skirt 조회**: GET /api/skirt/:id → D1 쿼리 → 최신 위치 + 이력 반환

## 📋 QR 코드 형식

### Location QR
```
CSW_LOC|MOD_01
```
- 형식: `CSW_LOC|{LOCATION_ID}`
- 예시: `CSW_LOC|MOD_01`, `CSW_LOC|MOD_02`

### Skirt QR
```
CSW_SKIRT|SKIRT=SK-0001|HEAT=23712041
```
- 형식: `CSW_SKIRT|SKIRT={SKIRT_ID}|HEAT={HEAT_NO}`
- 예시: `CSW_SKIRT|SKIRT=SK-0001|HEAT=23712041`

## 🚀 사용 가이드

### 1. Location 설정
1. 앱 실행
2. "Location QR 스캔" 버튼 클릭
3. Location QR 코드 스캔 (예: MOD_01)
4. 현재 위치 표시 확인

### 2. Skirt 스캔
1. Location이 설정된 상태에서
2. "Skirt QR 스캔" 버튼 클릭
3. Skirt QR 코드 스캔 (Inkjet 마킹)
4. **자동으로 서버에 전송** (별도 버튼 불필요)
5. Toast 알림으로 저장 확인

### 3. Skirt 조회
1. 하단 "Skirt 조회" 입력창에 Skirt ID 입력 (예: SK-0001)
2. 검색 버튼 클릭
3. 현재 위치 및 최근 이력 20건 확인

### 4. 작업자 정보 (선택)
- "작업자" 입력창에 이름/사번 입력
- 한 번 입력하면 localStorage에 저장되어 유지

## 🔌 API 명세

### GET /api/locations
모든 Location 목록 조회

**Response:**
```json
{
  "ok": true,
  "locations": [
    {
      "id": "MOD_01",
      "name": "Fit-up MOD 01",
      "zone": "Assembly",
      "x": 100,
      "y": 100
    }
  ]
}
```

### POST /api/event
새로운 스캔 이벤트 생성 (서버에서 타임스탬프 생성)

**Request:**
```json
{
  "operator": "John Doe",
  "location_id": "MOD_01",
  "skirt_id": "SK-0001",
  "heat_no": "23712041",
  "source": "PD"
}
```

**Response:**
```json
{
  "ok": true,
  "event_id": "31cd266c-78f2-4ebf-ab79-377694739307",
  "ts": "2026-01-24T20:01:37.896Z",
  "location_id": "MOD_01",
  "skirt_id": "SK-0001",
  "heat_no": "23712041"
}
```

### GET /api/skirt/:skirt_id
Skirt 현재 위치 및 이력 조회

**Response:**
```json
{
  "ok": true,
  "skirt_id": "SK-0001",
  "heat_no": "23712041",
  "current_location": "MOD_03",
  "current_ts": "2026-01-24T02:00:00Z",
  "history": [
    {
      "ts": "2026-01-24T02:00:00Z",
      "location_id": "MOD_03",
      "heat_no": "23712041",
      "operator": "TestUser",
      "source": "PD"
    }
  ]
}
```

## 💻 기술 스택

- **Backend**: Hono (Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: HTML + TailwindCSS + Vanilla JavaScript
- **QR Scanner**: html5-qrcode (CDN)
- **Icons**: Font Awesome 6
- **Build Tool**: Vite
- **Deployment**: Cloudflare Pages

## 🛠️ 로컬 개발

### 사전 요구사항
- Node.js 18+
- npm

### 설치 및 실행

```bash
# 의존성 설치
cd /home/user/webapp
npm install

# D1 로컬 데이터베이스 초기화
npm run db:migrate:local
npm run db:seed

# 빌드
npm run build

# 개발 서버 시작 (PM2)
pm2 start ecosystem.config.cjs

# 또는 직접 실행
npm run dev:sandbox

# 서버 확인
curl http://localhost:3000/api/locations
```

### 유용한 명령어

```bash
# D1 데이터베이스 리셋
npm run db:reset

# D1 콘솔 (로컬)
npm run db:console:local

# 포트 정리
npm run clean-port

# PM2 로그 확인
pm2 logs webapp --nostream

# PM2 재시작
pm2 restart webapp

# PM2 중지
pm2 delete webapp
```

## 🌍 배포

### Cloudflare Pages 배포

```bash
# 1. Cloudflare API 키 설정 (필수)
# setup_cloudflare_api_key 도구 사용

# 2. 프로덕션 D1 데이터베이스 생성
npx wrangler d1 create webapp-production
# database_id를 wrangler.jsonc에 입력

# 3. 프로덕션 마이그레이션
npm run db:migrate:prod

# 4. 배포
npm run deploy
```

## ✅ 완료된 기능

- [x] Location QR 스캔 및 설정
- [x] Skirt QR 스캔 및 자동 저장
- [x] 서버 타임스탬프 생성 (클라이언트가 아닌 Worker에서)
- [x] Skirt ID 조회 (현재 위치 + 이력)
- [x] 모바일 최적화 UI
- [x] PWA Manifest
- [x] 작업자 정보 입력 (localStorage 저장)
- [x] Toast 알림
- [x] D1 로컬 개발 환경
- [x] API 에러 처리

## 🚧 향후 개선 사항

- [ ] Service Worker 추가 (오프라인 지원)
- [ ] 오프라인 Queue (네트워크 복구 시 동기화)
- [ ] Layout 맵 화면 (MOD 위치 시각화)
- [ ] 통계 대시보드
- [ ] 중복 스캔 방지 로직
- [ ] QR 코드 생성 도구
- [ ] PWA 아이콘 생성

## 📝 배포 상태

- **플랫폼**: Cloudflare Pages
- **상태**: 🟡 로컬 개발 완료 / 프로덕션 배포 대기
- **마지막 업데이트**: 2026-01-24

## 📞 문의

문제가 발생하거나 기능 추가 요청이 있으면 이슈를 등록해주세요.
