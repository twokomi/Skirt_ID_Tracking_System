import { Hono } from 'hono'

const app = new Hono()

// MES Helper 페이지 - QR 스캔 후 클립보드 복사
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

export default app
