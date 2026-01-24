// MES Helper App - QR Scanner with Clipboard Copy

class MESHelper {
  constructor() {
    this.scanner = null;
    this.history = this.loadHistory();
    this.init();
  }

  init() {
    // 스캔 버튼
    document.getElementById('btn-scan').addEventListener('click', () => this.startScan());
    
    // 닫기 버튼
    document.getElementById('btn-close-scanner').addEventListener('click', () => this.stopScan());
    
    // 현재 스캔 복사 버튼
    const copyBtn = document.getElementById('btn-copy-current');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyCurrentToClipboard());
    }
    
    // 이력 표시
    this.renderHistory();
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

  handleScan(qrData) {
    console.log('Scanned:', qrData);

    // QR 파싱: CSW_SKIRT|SKIRT=SK-0001|HEAT=23712041
    const parsed = this.parseQR(qrData);
    
    if (!parsed.skirt_id) {
      this.showToast('❌ QR 형식 오류\n올바른 Skirt QR이 아닙니다', 'error');
      return;
    }

    // 스캐너 중지
    this.stopScan();

    // 이력에 추가
    const scanRecord = {
      skirt_id: parsed.skirt_id,
      heat_no: parsed.heat_no,
      timestamp: new Date().toISOString(),
      raw_qr: qrData
    };
    
    this.addToHistory(scanRecord);

    // 현재 스캔 표시
    this.displayCurrentScan(scanRecord);

    // 자동으로 클립보드 복사
    this.copyToClipboard(parsed.skirt_id);
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

  displayCurrentScan(record) {
    const currentScanDiv = document.getElementById('current-scan');
    currentScanDiv.classList.remove('hidden');

    document.getElementById('current-skirt-id').textContent = record.skirt_id;
    
    const heatDiv = document.getElementById('current-heat-no');
    if (record.heat_no) {
      heatDiv.textContent = 'Heat No: ' + record.heat_no;
      heatDiv.classList.remove('hidden');
    } else {
      heatDiv.classList.add('hidden');
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(`✓ 복사 완료!\n${text}\n\nMES 앱으로 전환하여 붙여넣기 하세요`, 'success');
    } catch (err) {
      // Fallback: 수동 복사 안내
      this.showToast(`📋 복사 준비됨\n${text}\n\n복사 버튼을 눌러주세요`, 'info');
    }
  }

  copyCurrentToClipboard() {
    const skirtId = document.getElementById('current-skirt-id').textContent;
    this.copyToClipboard(skirtId);
  }

  addToHistory(record) {
    // 중복 제거 (최근 10분 내 동일 skirt_id)
    const now = new Date().getTime();
    this.history = this.history.filter(item => {
      if (item.skirt_id === record.skirt_id) {
        const itemTime = new Date(item.timestamp).getTime();
        return (now - itemTime) > 10 * 60 * 1000; // 10분 이상 차이나면 유지
      }
      return true;
    });

    // 최신 항목을 맨 앞에 추가
    this.history.unshift(record);

    // 최대 20개까지만 유지
    if (this.history.length > 20) {
      this.history = this.history.slice(0, 20);
    }

    // localStorage 저장
    this.saveHistory();

    // UI 업데이트
    this.renderHistory();
  }

  renderHistory() {
    const historyList = document.getElementById('history-list');
    
    if (this.history.length === 0) {
      historyList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <i class="fas fa-inbox text-4xl mb-2"></i>
          <div>아직 스캔한 이력이 없습니다</div>
        </div>
      `;
      return;
    }

    historyList.innerHTML = this.history.map((item, index) => {
      const time = new Date(item.timestamp);
      const timeStr = time.toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="history-item bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs bg-blue-600 text-white px-2 py-1 rounded">#${index + 1}</span>
                <span class="text-xl font-bold text-blue-700">${item.skirt_id}</span>
              </div>
              ${item.heat_no ? `
                <div class="text-sm text-gray-600">
                  <i class="fas fa-fire mr-1"></i>
                  Heat: ${item.heat_no}
                </div>
              ` : ''}
              <div class="text-xs text-gray-500 mt-1">
                <i class="fas fa-clock mr-1"></i>
                ${timeStr}
              </div>
            </div>
            <button 
              onclick="copyFromHistory('${item.skirt_id}')"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all active:scale-95"
            >
              <i class="fas fa-copy mr-1"></i>
              복사
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  loadHistory() {
    try {
      const stored = localStorage.getItem('mes_scan_history');
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      return [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('mes_scan_history', JSON.stringify(this.history));
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  }

  showToast(message, type = 'info') {
    const colors = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-blue-600 text-white'
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
    }, type === 'success' ? 5000 : 3000);
  }
}

// 전역 함수: 이력에서 복사
function copyFromHistory(skirtId) {
  navigator.clipboard.writeText(skirtId).then(() => {
    // Toast 표시
    const event = new CustomEvent('show-toast', {
      detail: {
        message: `✓ 복사 완료!\n${skirtId}`,
        type: 'success'
      }
    });
    window.dispatchEvent(event);
  });
}

// Toast 이벤트 리스너
window.addEventListener('show-toast', (e) => {
  const helper = new MESHelper();
  helper.showToast(e.detail.message, e.detail.type);
});

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
  new MESHelper();
});
