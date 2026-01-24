// Skirt Tracking App - Frontend JavaScript

class SkirtTracker {
  constructor() {
    this.currentLocation = null;
    this.operator = null;
    this.scanner = null;
    this.scanMode = null; // 'location' or 'skirt'
    this.init();
  }

  init() {
    // Load saved data from localStorage
    this.currentLocation = localStorage.getItem('currentLocation');
    this.operator = localStorage.getItem('operator');

    // Set initial UI state
    if (this.currentLocation) {
      this.updateLocationDisplay(this.currentLocation);
      document.getElementById('btn-scan-skirt').disabled = false;
    }

    if (this.operator) {
      document.getElementById('operator-input').value = this.operator;
    }

    // Event listeners
    document.getElementById('btn-scan-location').addEventListener('click', () => this.startScan('location'));
    document.getElementById('btn-scan-skirt').addEventListener('click', () => this.startScan('skirt'));
    document.getElementById('btn-close-scanner').addEventListener('click', () => this.stopScan());
    document.getElementById('btn-search').addEventListener('click', () => this.searchSkirt());
    document.getElementById('search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchSkirt();
    });

    // Refresh button for recent scans
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadRecentScans());
    }

    // Save operator on change
    document.getElementById('operator-input').addEventListener('change', (e) => {
      this.operator = e.target.value.trim();
      if (this.operator) {
        localStorage.setItem('operator', this.operator);
      } else {
        localStorage.removeItem('operator');
      }
    });

    // Load recent scans on init
    this.loadRecentScans();
  }

  updateLocationDisplay(locationId) {
    const display = document.getElementById('current-location');
    if (locationId) {
      display.textContent = locationId;
      display.className = 'location-badge bg-green-100 text-green-800 text-center';
    } else {
      display.textContent = '위치 미설정';
      display.className = 'location-badge bg-gray-200 text-gray-500 text-center';
    }
  }

  startScan(mode) {
    this.scanMode = mode;
    const scannerDiv = document.getElementById('qr-scanner');
    scannerDiv.classList.remove('hidden');

    // Initialize HTML5 QR Code scanner
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
        // Ignore scan errors (continuous scanning)
      }
    ).catch((err) => {
      this.showToast('카메라 접근 실패: ' + err, 'error');
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

    if (this.scanMode === 'location') {
      await this.handleLocationScan(qrData);
    } else if (this.scanMode === 'skirt') {
      await this.handleSkirtScan(qrData);
    }
  }

  async handleLocationScan(qrData) {
    // Parse: CSW_LOC|MOD_01
    const parts = qrData.split('|');
    if (parts.length !== 2 || parts[0] !== 'CSW_LOC') {
      this.showToast('올바르지 않은 Location QR 형식입니다', 'error');
      return;
    }

    const locationId = parts[1];
    this.currentLocation = locationId;
    localStorage.setItem('currentLocation', locationId);
    
    this.updateLocationDisplay(locationId);
    document.getElementById('btn-scan-skirt').disabled = false;
    
    this.showToast(`위치 설정: ${locationId}`, 'success');
    this.stopScan();
  }

  async handleSkirtScan(qrData) {
    // Check if location is set
    if (!this.currentLocation) {
      this.showToast('먼저 Location QR을 스캔해주세요', 'error');
      this.stopScan();
      return;
    }

    // Parse: CSW_SKIRT|SKIRT=SK-0001|HEAT=23712041
    const parts = qrData.split('|');
    if (parts.length !== 3 || parts[0] !== 'CSW_SKIRT') {
      this.showToast('올바르지 않은 Skirt QR 형식입니다', 'error');
      return;
    }

    const skirtPart = parts[1].split('=');
    const heatPart = parts[2].split('=');

    if (skirtPart.length !== 2 || skirtPart[0] !== 'SKIRT' ||
        heatPart.length !== 2 || heatPart[0] !== 'HEAT') {
      this.showToast('QR 데이터 파싱 실패', 'error');
      return;
    }

    const skirtId = skirtPart[1];
    const heatNo = heatPart[1];

    // Stop scanning immediately
    this.stopScan();

    // Send to server
    await this.saveEvent(skirtId, heatNo);
  }

  async saveEvent(skirtId, heatNo) {
    try {
      const payload = {
        operator: this.operator,
        location_id: this.currentLocation,
        skirt_id: skirtId,
        heat_no: heatNo,
        source: 'PD'
      };

      const response = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.ok) {
        const timestamp = new Date(data.ts).toLocaleString('ko-KR');
        this.showToast(`✓ ${skirtId} 저장 완료\n${this.currentLocation} @ ${timestamp}`, 'success');
        
        // Reload recent scans list
        this.loadRecentScans();
      } else {
        this.showToast('저장 실패: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showToast('네트워크 오류: ' + error.message, 'error');
      // TODO: Add to offline queue
    }
  }

  async searchSkirt() {
    const input = document.getElementById('search-input');
    const skirtId = input.value.trim();

    if (!skirtId) {
      this.showToast('Skirt ID를 입력하세요', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/skirt/${skirtId}`);
      const data = await response.json();

      if (data.ok) {
        this.displaySearchResults(data);
      } else {
        this.showToast('조회 실패: ' + (data.error || 'Not found'), 'error');
        document.getElementById('search-results').classList.add('hidden');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showToast('네트워크 오류: ' + error.message, 'error');
    }
  }

  displaySearchResults(data) {
    const resultsDiv = document.getElementById('search-results');
    const contentDiv = document.getElementById('search-content');

    const html = `
      <div class="border-b pb-3 mb-3">
        <div class="text-sm text-gray-600">Skirt ID</div>
        <div class="text-xl font-bold text-blue-700">${data.skirt_id}</div>
      </div>
      <div class="border-b pb-3 mb-3">
        <div class="text-sm text-gray-600">Heat No</div>
        <div class="text-lg font-semibold">${data.heat_no || 'N/A'}</div>
      </div>
      <div class="border-b pb-3 mb-3">
        <div class="text-sm text-gray-600">현재 위치</div>
        <div class="text-lg font-bold text-green-700">${data.current_location}</div>
        <div class="text-xs text-gray-500">${new Date(data.current_ts).toLocaleString('ko-KR')}</div>
      </div>
      <div>
        <div class="text-sm font-medium text-gray-700 mb-2">최근 이력</div>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          ${data.history.map(event => `
            <div class="bg-gray-50 p-3 rounded border border-gray-200">
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-semibold text-blue-700">${event.location_id}</div>
                  <div class="text-sm text-gray-600">${event.heat_no || 'N/A'}</div>
                  ${event.operator ? `<div class="text-sm text-gray-500"><i class="fas fa-user mr-1"></i>${event.operator}</div>` : ''}
                </div>
                <div class="text-xs text-gray-500 text-right">
                  ${new Date(event.ts).toLocaleString('ko-KR', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    contentDiv.innerHTML = html;
    resultsDiv.classList.remove('hidden');
  }

  async loadRecentScans() {
    const listBody = document.getElementById('recent-scans-list');
    
    try {
      const response = await fetch('/api/recent-scans');
      const data = await response.json();

      if (data.ok && data.scans.length > 0) {
        listBody.innerHTML = data.scans.map((scan, index) => {
          const time = new Date(scan.ts);
          const timeStr = time.toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });

          return `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-3 py-2 text-gray-700">${index + 1}</td>
              <td class="px-3 py-2 font-semibold text-blue-700">${scan.skirt_id}</td>
              <td class="px-3 py-2 text-gray-700">${scan.location_id}</td>
              <td class="px-3 py-2 text-gray-600">${scan.heat_no || '-'}</td>
              <td class="px-3 py-2 text-gray-600">${scan.operator || '-'}</td>
              <td class="px-3 py-2 text-gray-500 text-xs">${timeStr}</td>
            </tr>
          `;
        }).join('');
      } else {
        listBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-8 text-gray-500">
              <i class="fas fa-inbox text-2xl mb-2"></i>
              <div>스캔 이력이 없습니다</div>
            </td>
          </tr>
        `;
      }
    } catch (error) {
      console.error('Error loading recent scans:', error);
      listBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-red-500">
            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <div>로딩 실패</div>
          </td>
        </tr>
      `;
    }
  }

  showToast(message, type = 'info') {
    const colors = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-blue-600 text-white'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${colors[type]}`;
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} text-xl"></i>
        <div class="flex-1" style="white-space: pre-line;">${message}</div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  new SkirtTracker();
});
