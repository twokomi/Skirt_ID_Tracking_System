# Skirt Tracking System

QR 기반 Skirt 위치 트래킹 웹앱 (공장 PoC)

## 📱 프로젝트 개요

- **목표**: 공장 내 Skirt의 실시간 위치 추적 및 이력 관리
- **주요 기능**:
  - Location QR 스캔으로 작업 위치 설정
  - Skirt QR 스캔으로 자동 이벤트 생성 (서버 타임스탬프)
  - Skirt ID 조회로 현재 위치 및 이동 이력 확인
  - 모바일 최적화 UI (PWA 지원)
  - **NEW: MES Helper** - QR 스캔 후 클립보드 자동 복사

## 🌐 URLs

### **⚠️ 중요: 새로운 배포 URL**
이전에 `webapp-3sm.pages.dev`를 사용했으나, **프로젝트 충돌 문제**로 인해 새로운 도메인으로 이전했습니다.

### **✅ 새 메인 도메인 (skirt-tracking)**
- **Production**: https://skirt-tracking.pages.dev
- **최신 배포**: https://eec7a96e.skirt-tracking.pages.dev
- **기능**: 세 가지 사용 모드 선택

### **모드 1: MES 입력 도우미** 📋
- **URL**: https://skirt-tracking.pages.dev/mes-helper
- **목적**: MES 앱에서 작업물 번호 입력 시 실수 방지
- **기능**: Skirt QR 스캔 → 작업물 번호 자동 복사 → MES 앱에 붙여넣기
- **특징**: Location QR 불필요, 빠른 작업

### **모드 2: MES 자동 연동 🆕** ⚡
- **URL**: https://skirt-tracking.pages.dev/mes-auto
- **목적**: QR 스캔으로 MES API 자동 연동
- **기능**: Skirt QR 스캔 → MES 작업 오더 검색 → 작업 시작 자동 기록
- **특징**: 트레이서빌리티 자동화, Mock 모드 지원
- **상태**: ⚠️ Mock 모드 (MES API 연동 대기)

### **모드 3: 위치 추적 시스템** 📍
- **URL**: https://skirt-tracking.pages.dev/tracking
- **목적**: 트레이서빌리티 강화, 작업물 위치 이동 추적
- **기능**: 
  - Location + Skirt QR 스캔 → D1 저장 → 이력 조회
  - 최근 스캔 이력 20건 테이블로 실시간 표시
- **특징**: 정확한 위치 기록, 이동 이력 관리, 가로 테이블 뷰

### **GitHub Repository**
- https://github.com/twokomi/Skirt_ID_Tracking_System

### **⚠️ 구 도메인 (사용 중단)**
- ~~https://webapp-3sm.pages.dev~~ → Issue Log 분석 앱 (다른 프로젝트)
- 현재 `webapp-3sm.pages.dev`는 다른 프로젝트로 사용 중입니다.
- **반드시 `skirt-tracking.pages.dev`를 사용하세요!**

---

## 🎯 세 가지 모드 비교

| 구분 | MES 입력 도우미 | MES 자동 연동 🆕 | 위치 추적 시스템 |
|------|----------------|----------------|-----------------|
| **URL** | `/mes-helper` | `/mes-auto` | `/tracking` |
| **Location QR** | ❌ 불필요 | ❌ 불필요 | ✅ 필수 |
| **Skirt QR** | ✅ 필수 | ✅ 필수 | ✅ 필수 |
| **데이터 저장** | localStorage만 | D1 + MES API | D1 데이터베이스 |
| **주 목적** | MES 입력 편의성 | MES 자동 연동 | 위치 추적 이력 |
| **사용 빈도** | 작업 시작 시 | 작업 시작 시 | 위치 이동 시마다 |
| **네트워크** | 선택적 | 필수 | 필수 |
| **상태** | ✅ 완료 | ⚠️ Mock 모드 | ✅ 완료 |

---

## 🆕 MES Helper 사용 가이드

### **문제점 해결**
기존 MES 시스템에서 작업자가 작업물 번호(예: VB056-B5)를 **수동으로 검색/선택**하면서 **실수가 발생**하는 문제를 해결합니다.

### **사용 방법**

```
1. [MES Helper 앱 열기]
   https://041a05e0.webapp-3sm.pages.dev/mes-helper

2. [QR 스캔 버튼 클릭]
   📷 Skirt QR 스캔 버튼 터치

3. [Skirt QR 코드 스캔]
   Inkjet으로 마킹된 QR을 카메라에 비춤
   → VB056-B5 자동 추출
   → 클립보드에 자동 복사
   → "복사 완료" 토스트 알림

4. [MES 앱으로 전환]
   앱 전환 (홈 버튼 또는 멀티태스킹)

5. [MES 검색창에 붙여넣기]
   검색창 길게 누르기 → 붙여넣기
   → 검색 버튼 클릭
   → 작업 오더 선택
```

### **장점**

✅ **실수 방지**: QR 스캔으로 정확한 작업물 번호 입력  
✅ **속도 향상**: 타이핑 없이 즉시 복사  
✅ **이력 관리**: 최근 스캔 이력 20건 저장  
✅ **MES 수정 불필요**: 기존 MES 앱 그대로 사용  
✅ **즉시 도입 가능**: 별도 설치 없이 웹 앱으로 바로 사용

### **UI 예시**

```
┌─────────────────────────────────────┐
│  📷 Skirt QR 스캔                   │  ← 큰 스캔 버튼
├─────────────────────────────────────┤
│  방금 스캔한 작업물:                 │
│  VB056-B5                    [복사] │  ← 현재 스캔
│  Heat: 23712041                     │
├─────────────────────────────────────┤
│  💡 사용 방법:                      │
│  1. QR 스캔                         │
│  2. 자동 복사됨                      │
│  3. MES 앱으로 전환                  │
│  4. 붙여넣기                        │
├─────────────────────────────────────┤
│  📋 최근 스캔 이력:                  │
│                                     │
│  #1  VB056-B5          [복사]       │
│      Heat: 23712041                 │
│      01-24 14:30                    │
│                                     │
│  #2  VB057-C3          [복사]       │
│      Heat: 23712042                 │
│      01-24 14:25                    │
└─────────────────────────────────────┘
```

---

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
- **프로덕션**: Cloudflare D1 (database_id: a236ee02-4f7b-4260-a833-bbb3573bc28e)

### 데이터 플로우

#### **메인 앱 (위치 추적)**
1. **Location 설정**: QR 스캔 → localStorage에 저장 → UI 업데이트
2. **Skirt 스캔**: QR 스캔 → 파싱 → POST /api/event → D1에 저장 (서버 타임스탬프 생성)
3. **Skirt 조회**: GET /api/skirt/:id → D1 쿼리 → 최신 위치 + 이력 반환

#### **MES Helper (클립보드 복사)**
1. **QR 스캔**: Skirt QR → 파싱 (VB056-B5 추출)
2. **클립보드 복사**: navigator.clipboard.writeText()
3. **이력 저장**: localStorage에 최근 20건 저장
4. **사용자 액션**: MES 앱으로 전환 → 붙여넣기

---

## 📋 QR 코드 형식

### Location QR
```
CSW_LOC|MOD_01
```
- 형식: `CSW_LOC|{LOCATION_ID}`
- 예시: `CSW_LOC|MOD_01`, `CSW_LOC|MOD_02`

### Skirt QR
```
CSW_SKIRT|SKIRT=VB056-B5|HEAT=23712041
```
- 형식: `CSW_SKIRT|SKIRT={SKIRT_ID}|HEAT={HEAT_NO}`
- 예시: `CSW_SKIRT|SKIRT=VB056-B5|HEAT=23712041`
- **MES Helper 지원**: 단순 작업물 번호(VB056-B5)도 인식 가능

---

## 🚀 메인 앱 사용 가이드

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

---

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

---

## 💻 기술 스택

- **Backend**: Hono (Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: HTML + TailwindCSS + Vanilla JavaScript
- **QR Scanner**: html5-qrcode (CDN)
- **Icons**: Font Awesome 6
- **Build Tool**: Vite
- **Deployment**: Cloudflare Pages

---

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
curl http://localhost:3000/mes-helper
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

---

## 🌍 배포

### Cloudflare Pages 배포

```bash
# 1. Cloudflare API 키 설정 (필수)
export CLOUDFLARE_API_TOKEN="your-api-token"

# 2. 빌드
npm run build

# 3. 배포
npx wrangler pages deploy dist --project-name webapp
```

---

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
- [x] Cloudflare D1 프로덕션 배포
- [x] GitHub 저장소 연동
- [x] Cloudflare Pages 배포 완료
- [x] **MES Helper** - QR 스캔 후 클립보드 자동 복사
- [x] **스캔 이력 관리** - 최근 20건 localStorage 저장

---

## 🚧 향후 개선 사항

- [ ] Service Worker 추가 (오프라인 지원)
- [ ] 오프라인 Queue (네트워크 복구 시 동기화)
- [ ] Layout 맵 화면 (MOD 위치 시각화)
- [ ] 통계 대시보드
- [ ] 중복 스캔 방지 로직
- [ ] QR 코드 생성 도구
- [ ] PWA 아이콘 생성
- [ ] MES API 직접 연동 (선택사항)

---

## 📝 배포 상태

- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 프로덕션 배포 완료
- **프로젝트 이름**: skirt-tracking
- **메인 URL**: https://skirt-tracking.pages.dev
- **최신 배포**: https://eec7a96e.skirt-tracking.pages.dev
- **D1 Database**: webapp-production (a236ee02-4f7b-4260-a833-bbb3573bc28e)
- **마지막 업데이트**: 2026-01-24

### 배포된 페이지
- ✅ `/` - 모드 선택 홈 페이지 (3가지 옵션)
- ✅ `/mes-helper` - MES 입력 도우미 (클립보드 복사)
- ⚠️ `/mes-auto` - MES 자동 연동 (Mock 모드, API 연동 대기)
- ✅ `/tracking` - 위치 추적 시스템

## 📊 위치 추적 화면 구성

```
┌──────────────────────────────────────┐
│  ← 메인으로 돌아가기                  │
├──────────────────────────────────────┤
│  📍 Skirt 위치 추적                  │
│                                      │
│  현재 작업 위치: MOD_01              │
│  작업자: (선택)                       │
│                                      │
│  [Location QR 스캔]                  │
│  [Skirt QR 스캔]                     │
│                                      │
│  Skirt 조회: ___________  [🔍]      │
├──────────────────────────────────────┤
│  📋 최근 스캔 이력          [🔄]     │
├────┬──────────┬──────┬─────┬────────┤
│ No │ Skirt ID │ Loc  │ Heat│ 작업자 │
├────┼──────────┼──────┼─────┼────────┤
│  1 │ SK-0001  │ MOD_03│23712│TestUser│
│  2 │ SK-0001  │ MOD_02│23712│TestUser│
│  3 │ SK-0001  │ MOD_01│23712│TestUser│
└────┴──────────┴──────┴─────┴────────┘
```

---

## 🧪 테스트

### **1. 메인 페이지 (모드 선택)**
모바일 브라우저로 접속:
- https://skirt-tracking.pages.dev

세 가지 카드 중 하나 선택:
- 📋 **MES 입력 도우미** - 빠른 작업물 번호 입력
- ⚡ **MES 자동 연동 🆕** - MES API 자동 연동 (Mock 모드)
- 📍 **위치 추적 시스템** - 위치 이동 이력 관리

### **2. MES Helper 테스트**
- https://skirt-tracking.pages.dev/mes-helper

**테스트 시나리오:**
1. "Skirt QR 스캔" 버튼 클릭
2. QR 코드 스캔 (아래 생성)
3. "✓ 복사 완료!" 토스트 확인
4. MES 앱으로 전환
5. 검색창에 붙여넣기

### **3. MES Auto 테스트 (Mock 모드)**
- https://skirt-tracking.pages.dev/mes-auto

**테스트 시나리오:**
1. PD 번호 입력: `PD-TEST-001`
2. 작업자 입력: `John Doe` (선택)
3. Skirt QR 스캔: `VB056-B5`
4. Mock 작업 오더 표시 확인
5. "작업 시작" 버튼 클릭
6. D1 로그 확인 (백업 기록)

### **4. 위치 추적 테스트**
- https://skirt-tracking.pages.dev/tracking

**테스트 시나리오:**
1. Location QR 스캔: `CSW_LOC|MOD_01`
2. Skirt QR 스캔: `CSW_SKIRT|SKIRT=SK-9999|HEAT=99999999`
3. 저장 확인 Toast
4. **자동으로 최근 스캔 리스트에 추가됨** ✨
5. 조회: `SK-0001` (시드 데이터)

**QR 코드 생성 도구**: https://www.qr-code-generator.com/

**테스트용 QR 페이로드:**
1. 표준 형식: `CSW_SKIRT|SKIRT=VB056-B5|HEAT=23712041`
2. 단순 형식: `VB056-B5` (MES Helper용)
3. Location: `CSW_LOC|MOD_01`

---

## 📞 문의

문제가 발생하거나 기능 추가 요청이 있으면 이슈를 등록해주세요.
