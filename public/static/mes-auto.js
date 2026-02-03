// MES Auto App - QR Scanner with MES API Integration

class MESAuto {
  constructor() {
    this.scanner = null;
    this.deviceId = this.loadDeviceId();
    this.operator = this.loadOperator();
    this.currentSkirtId = null;
    this.currentOrders = [];
    this.selectedOrder = null;
    this.init();
  }

  init() {
    // Load device ID and operator
    const deviceInput = document.getElementById('device-id-input');
    const operatorInput = document.getElementById('operator-input');
    
    if (this.deviceId) {
      deviceInput.value = this.deviceId;
    }
    if (this.operator) {
      operatorInput.value = this.operator;
    }

    // Save on change
    deviceInput.addEventListener('change', () => {
      this.deviceId = deviceInput.value.trim();
      localStorage.setItem('mes_device_id', this.deviceId);
    });

    operatorInput.addEventListener('change', () => {
      this.operator = operatorInput.value.trim();
      localStorage.setItem('mes_operator', this.operator);
    });

    // Scan button
    document.getElementById('btn-scan').addEventListener('click', () => {
      if (!this.deviceId) {
        this.showToast('❌ PD 번호를 먼저 입력하세요', 'error');
        return;
      }
      this.startScan();
    });
    
    // Close scanner button
    document.getElementById('btn-close-scanner').addEventListener('click', () => this.stopScan());
  }

  startScan() {
    document.getElementById('qr-scanner').classList.remove('hidden');
    
    this.scanner = new Html5Qrcode("qr-reader");
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    this.scanner.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        this.handleScan(decodedText);
      },
      (errorMessage) => {
        // 스캔 오류 무시 (연속 스캔)
      }
    ).catch((err) => {
      this.showToast('❌ 카메라 접근 실패\n' + err, 'error');
      this.stopScan();
    });
  }

  stopScan() {
    if (this.scanner) {
      this.scanner.stop().then(() => {
        this.scanner.clear();
        this.scanner = null;
      }).catch((err) => {
        console.error('Scanner stop error:', err);
      });
    }
    document.getElementById('qr-scanner').classList.add('hidden');
  }

  async handleScan(qrData) {
    console.log('Scanned:', qrData);

    // QR 파싱: CSW_SKIRT|SKIRT=SK-0001|HEAT=23712041
    const parsed = this.parseQR(qrData);
    
    if (!parsed.skirt_id) {
      this.showToast('❌ QR 형식 오류\n올바른 Skirt QR이 아닙니다', 'error');
      return;
    }

    // 스캐너 중지
    this.stopScan();

    this.currentSkirtId = parsed.skirt_id;

    // MES API 호출: 작업 오더 검색
    this.showToast('🔍 MES에서 작업 오더 검색 중...', 'info');
    
    try {
      const response = await fetch('/api/mes/search-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skirt_id: parsed.skirt_id
        })
      });

      const data = await response.json();

      if (!data.ok || !data.orders || data.orders.length === 0) {
        this.showToast('❌ 작업 오더를 찾을 수 없습니다', 'error');
        return;
      }

      // 검색 성공
      this.currentOrders = data.orders;
      this.displayOrders(data.orders);
      this.showToast(`✓ ${data.orders.length}개의 작업 오더를 찾았습니다`, 'success');

    } catch (error) {
      console.error('MES API Error:', error);
      this.showToast('❌ MES API 연동 오류\n' + error.message, 'error');
    }
  }

  parseQR(qrData) {
    // 형식 1: CSW_SKIRT|SKIRT=VB056-B5|HEAT=23712041
    if (qrData.includes('CSW_SKIRT')) {
      const parts = qrData.split('|');
      let skirt_id = null;
      let heat_no = null;

      parts.forEach(part => {
        if (part.startsWith('SKIRT=')) {
          skirt_id = part.split('=')[1];
        } else if (part.startsWith('HEAT=')) {
          heat_no = part.split('=')[1];
        }
      });

      return { skirt_id, heat_no };
    }

    // 형식 2: 단순 작업물 번호 (VB056-B5)
    if (/^[A-Z0-9\-]+$/.test(qrData)) {
      return { skirt_id: qrData, heat_no: null };
    }

    // 파싱 실패
    return { skirt_id: null, heat_no: null };
  }

  displayOrders(orders) {
    const orderSelection = document.getElementById('order-selection');
    const orderList = document.getElementById('order-list');

    orderSelection.classList.remove('hidden');

    if (orders.length === 0) {
      orderList.innerHTML = `
        <div class="text-center text-gray-500 py-4">
          <i class="fas fa-inbox text-3xl mb-2"></i>
          <div>검색된 작업 오더가 없습니다</div>
        </div>
      `;
      return;
    }

    // 첫 번째 오더 자동 선택
    this.selectedOrder = orders[0];

    orderList.innerHTML = orders.map((order, index) => {
      const isSelected = index === 0;
      return `
        <div class="border ${isSelected ? 'border-purple-600 bg-purple-50' : 'border-gray-300'} rounded-lg p-4 mb-3">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <div class="text-xs text-gray-600 mb-1">Order ID</div>
              <div class="text-lg font-bold text-gray-800">${order.order_id}</div>
            </div>
            ${isSelected ? `
              <span class="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                <i class="fas fa-check mr-1"></i>선택됨
              </span>
            ` : ''}
          </div>
          
          <div class="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <div class="text-xs text-gray-600">Skirt ID</div>
              <div class="font-bold">${order.skirt_id}</div>
            </div>
            <div>
              <div class="text-xs text-gray-600">Section ID</div>
              <div class="font-bold">${order.section_id || 'N/A'}</div>
            </div>
            <div>
              <div class="text-xs text-gray-600">공정</div>
              <div class="font-bold">${order.process_type}</div>
            </div>
            <div>
              <div class="text-xs text-gray-600">상태</div>
              <div class="font-bold ${order.status === 'Ready' ? 'text-green-600' : 'text-gray-600'}">
                ${order.status}
              </div>
            </div>
          </div>

          ${isSelected ? `
            <button 
              onclick="startWork('${order.order_id}')"
              class="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all active:scale-95"
            >
              <i class="fas fa-play mr-2"></i>
              작업 시작
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  async startWork(orderId) {
    const order = this.currentOrders.find(o => o.order_id === orderId);
    if (!order) {
      this.showToast('❌ 오더 정보를 찾을 수 없습니다', 'error');
      return;
    }

    this.showToast('⏳ MES에 작업 시작 전송 중...', 'info');

    try {
      const response = await fetch('/api/mes/start-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: order.order_id,
          skirt_id: order.skirt_id,
          section_id: order.section_id,
          operator: this.operator || 'Unknown',
          device_id: this.deviceId
        })
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to start work');
      }

      this.showToast(
        `✅ 작업 시작 완료!\n\n` +
        `Order: ${order.order_id}\n` +
        `Skirt: ${order.skirt_id}\n` +
        `Section: ${order.section_id}\n` +
        `작업자: ${this.operator || 'N/A'}`,
        'success'
      );

      // 오더 목록 숨기기
      setTimeout(() => {
        document.getElementById('order-selection').classList.add('hidden');
        this.currentOrders = [];
        this.selectedOrder = null;
      }, 3000);

    } catch (error) {
      console.error('Start Work Error:', error);
      this.showToast('❌ 작업 시작 실패\n' + error.message, 'error');
    }
  }

  loadDeviceId() {
    try {
      return localStorage.getItem('mes_device_id') || '';
    } catch (err) {
      return '';
    }
  }

  loadOperator() {
    try {
      return localStorage.getItem('mes_operator') || '';
    } catch (err) {
      return '';
    }
  }

  showToast(message, type = 'info') {
    const colors = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-purple-600 text-white'
    };

    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      info: 'info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${colors[type]}`;
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <i class="fas fa-${icons[type]} text-2xl"></i>
        <div class="flex-1 font-bold" style="white-space: pre-line;">${message}</div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, type === 'success' ? 6000 : 3000);
  }
}

// 전역 함수: 작업 시작
function startWork(orderId) {
  const app = window.mesAutoApp;
  if (app) {
    app.startWork(orderId);
  }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
  window.mesAutoApp = new MESAuto();
});
