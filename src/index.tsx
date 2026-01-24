import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Utility: Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// API: POST /api/event - Create new scan event
app.post('/api/event', async (c) => {
  try {
    const { operator, location_id, skirt_id, heat_no, source = 'PD' } = await c.req.json();

    // Validation
    if (!location_id || !skirt_id) {
      return c.json({ ok: false, error: 'location_id and skirt_id are required' }, 400);
    }

    // Generate server-side timestamp and UUID
    const event_id = generateUUID();
    const ts = new Date().toISOString();

    // Insert event
    await c.env.DB.prepare(`
      INSERT INTO events (id, ts, operator, location_id, skirt_id, heat_no, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(event_id, ts, operator || null, location_id, skirt_id, heat_no || null, source).run();

    return c.json({
      ok: true,
      event_id,
      ts,
      location_id,
      skirt_id,
      heat_no
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return c.json({ ok: false, error: 'Failed to create event' }, 500);
  }
});

// API: GET /api/skirt/:skirt_id - Get skirt details and history
app.get('/api/skirt/:skirt_id', async (c) => {
  try {
    const skirt_id = c.req.param('skirt_id');

    // Get latest event (current location)
    const latestResult = await c.env.DB.prepare(`
      SELECT ts, location_id, heat_no, operator
      FROM events
      WHERE skirt_id = ?
      ORDER BY ts DESC
      LIMIT 1
    `).bind(skirt_id).first();

    if (!latestResult) {
      return c.json({ ok: false, error: 'Skirt not found' }, 404);
    }

    // Get recent history (last 20 events)
    const historyResult = await c.env.DB.prepare(`
      SELECT ts, location_id, heat_no, operator, source
      FROM events
      WHERE skirt_id = ?
      ORDER BY ts DESC
      LIMIT 20
    `).bind(skirt_id).all();

    return c.json({
      ok: true,
      skirt_id,
      heat_no: latestResult.heat_no,
      current_location: latestResult.location_id,
      current_ts: latestResult.ts,
      history: historyResult.results || []
    });
  } catch (error) {
    console.error('Error fetching skirt:', error);
    return c.json({ ok: false, error: 'Failed to fetch skirt data' }, 500);
  }
});

// API: GET /api/locations - Get all locations
app.get('/api/locations', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT id, name, zone, x, y
      FROM locations
      ORDER BY id
    `).all();

    return c.json({
      ok: true,
      locations: result.results || []
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return c.json({ ok: false, error: 'Failed to fetch locations' }, 500);
  }
});

// MES Helper - Quick QR to Clipboard
app.get('/mes-helper', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>MES QR Helper</title>
    <meta name="theme-color" content="#1e40af">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
    <style>
      body {
        overscroll-behavior-y: contain;
        -webkit-user-select: none;
        user-select: none;
      }
      .btn-large {
        min-height: 5rem;
        font-size: 1.5rem;
        font-weight: 700;
      }
      #qr-reader {
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
      }
      #qr-reader video {
        width: 100% !important;
        height: auto !important;
        border-radius: 0.5rem;
      }
      .toast {
        position: fixed;
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        min-width: 280px;
        max-width: 90%;
        padding: 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease-out;
        font-size: 1.1rem;
      }
      @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      .history-item {
        transition: all 0.2s;
      }
      .history-item:active {
        transform: scale(0.98);
      }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div class="container max-w-md mx-auto p-4">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl shadow-2xl mb-4">
            <h1 class="text-2xl font-bold mb-2">
                <i class="fas fa-qrcode mr-2"></i>
                MES QR Helper
            </h1>
            <div class="text-sm opacity-90">작업물 번호 빠른 입력 도구</div>
        </div>

        <!-- Scan Button -->
        <button id="btn-scan" class="btn-large w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-2xl transition-all active:scale-95 mb-4">
            <i class="fas fa-camera text-3xl mb-2"></i>
            <div>Skirt QR 스캔</div>
        </button>

        <!-- QR Scanner -->
        <div id="qr-scanner" class="hidden bg-white rounded-xl shadow-2xl p-4 mb-4">
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-bold">QR 코드 스캔</h3>
                <button id="btn-close-scanner" class="text-red-600 text-2xl">
                    <i class="fas fa-times-circle"></i>
                </button>
            </div>
            <div id="qr-reader"></div>
            <div class="text-sm text-gray-600 text-center mt-3">
                <i class="fas fa-info-circle mr-1"></i>
                Skirt QR을 카메라에 비춰주세요
            </div>
        </div>

        <!-- Current Scanned -->
        <div id="current-scan" class="hidden bg-white rounded-xl shadow-xl p-6 mb-4">
            <div class="text-sm text-gray-600 mb-2">방금 스캔한 작업물</div>
            <div class="flex items-center justify-between">
                <div>
                    <div id="current-skirt-id" class="text-3xl font-bold text-blue-700 mb-1"></div>
                    <div id="current-heat-no" class="text-sm text-gray-600"></div>
                </div>
                <button id="btn-copy-current" class="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-bold hover:bg-blue-700 transition-all active:scale-95">
                    <i class="fas fa-copy mr-2"></i>
                    복사
                </button>
            </div>
        </div>

        <!-- Instructions -->
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-4">
            <div class="flex items-start">
                <i class="fas fa-lightbulb text-yellow-600 text-xl mr-3 mt-1"></i>
                <div class="text-sm text-yellow-800">
                    <div class="font-bold mb-1">사용 방법:</div>
                    <ol class="list-decimal list-inside space-y-1">
                        <li>QR 스캔 버튼 클릭</li>
                        <li>Skirt QR 코드 스캔</li>
                        <li>작업물 번호가 자동으로 복사됨</li>
                        <li>MES 앱으로 전환</li>
                        <li>검색창에 붙여넣기 (길게 누르기)</li>
                    </ol>
                </div>
            </div>
        </div>

        <!-- Scan History -->
        <div class="bg-white rounded-xl shadow-xl p-4">
            <h3 class="text-lg font-bold mb-3 flex items-center">
                <i class="fas fa-history mr-2 text-blue-600"></i>
                최근 스캔 이력
            </h3>
            <div id="history-list" class="space-y-2">
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <div>아직 스캔한 이력이 없습니다</div>
                </div>
            </div>
        </div>
    </div>

    <script src="/static/mes-helper.js"></script>
</body>
</html>
  `);
});

// Root route - Serve mobile UI
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Skirt Tracking</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#1e40af">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
    <style>
      body {
        overscroll-behavior-y: contain;
        -webkit-user-select: none;
        user-select: none;
      }
      .btn-large {
        min-height: 4rem;
        font-size: 1.25rem;
        font-weight: 600;
      }
      #qr-reader {
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
      }
      #qr-reader video {
        width: 100% !important;
        height: auto !important;
        border-radius: 0.5rem;
      }
      .toast {
        position: fixed;
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        min-width: 280px;
        max-width: 90%;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease-out;
      }
      @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      .location-badge {
        font-size: 1.5rem;
        font-weight: bold;
        padding: 1rem 2rem;
        border-radius: 0.75rem;
      }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container max-w-md mx-auto p-4">
        <!-- Header -->
        <div class="bg-blue-700 text-white p-6 rounded-lg shadow-lg mb-4">
            <h1 class="text-2xl font-bold mb-2">
                <i class="fas fa-qrcode mr-2"></i>
                Skirt Tracking
            </h1>
            <div class="text-sm opacity-90">QR 기반 위치 추적 시스템</div>
        </div>

        <!-- Current Location Display -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-4">
            <div class="text-sm text-gray-600 mb-2">현재 작업 위치</div>
            <div id="current-location" class="location-badge bg-gray-200 text-gray-500 text-center">
                위치 미설정
            </div>
        </div>

        <!-- Operator Input -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-user mr-2"></i>작업자 (선택)
            </label>
            <input 
                type="text" 
                id="operator-input" 
                placeholder="이름 또는 사번 입력"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            >
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3 mb-4">
            <button id="btn-scan-location" class="btn-large w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all active:scale-95">
                <i class="fas fa-map-marker-alt mr-2"></i>
                Location QR 스캔
            </button>
            <button id="btn-scan-skirt" class="btn-large w-full bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all active:scale-95" disabled>
                <i class="fas fa-box mr-2"></i>
                Skirt QR 스캔
            </button>
        </div>

        <!-- QR Scanner -->
        <div id="qr-scanner" class="hidden bg-white rounded-lg shadow-lg p-4 mb-4">
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-bold">QR 코드 스캔</h3>
                <button id="btn-close-scanner" class="text-red-600 text-xl">
                    <i class="fas fa-times-circle"></i>
                </button>
            </div>
            <div id="qr-reader"></div>
            <div class="text-sm text-gray-600 text-center mt-3">
                QR 코드를 카메라에 비춰주세요
            </div>
        </div>

        <!-- Search Section -->
        <div class="bg-white rounded-lg shadow-md p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-search mr-2"></i>Skirt 조회
            </label>
            <div class="flex gap-2">
                <input 
                    type="text" 
                    id="search-input" 
                    placeholder="Skirt ID (예: SK-0001)"
                    class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                <button id="btn-search" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95">
                    <i class="fas fa-search"></i>
                </button>
            </div>
        </div>

        <!-- Search Results -->
        <div id="search-results" class="hidden mt-4 bg-white rounded-lg shadow-md p-4">
            <h3 class="text-lg font-bold mb-3">조회 결과</h3>
            <div id="search-content"></div>
        </div>
    </div>

    <script src="/static/app.js"></script>
</body>
</html>
  `);
});

export default app
