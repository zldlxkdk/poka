// POKA V2 - 공통 JavaScript

// PWA 서비스 워커 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// 앱 상태 관리
const AppState = {
    user: null,
    currentImage: null,
    editedImages: [],
    deviceId: null,
    
    // 로컬 스토리지에서 상태 복원
    init() {
        this.user = this.getFromStorage('user');
        this.editedImages = this.getFromStorage('editedImages') || [];
        this.deviceId = this.getFromStorage('deviceId') || this.generateDeviceId();
        this.saveToStorage('deviceId', this.deviceId);
    },
    
    // 로컬 스토리지에 저장
    saveToStorage(key, value) {
        try {
            localStorage.setItem(`poka_v2_${key}`, JSON.stringify(value));
        } catch (error) {
            console.error('Storage save error:', error);
        }
    },
    
    // 로컬 스토리지에서 불러오기
    getFromStorage(key) {
        try {
            const item = localStorage.getItem(`poka_v2_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    },
    
    // 디바이스 ID 생성
    generateDeviceId() {
        return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // 사용자 정보 업데이트
    updateUser(userData) {
        this.user = userData;
        this.saveToStorage('user', userData);
    },
    
    // 편집된 이미지 추가
    addEditedImage(imageData) {
        this.editedImages.unshift({
            id: Date.now(),
            ...imageData,
            createdAt: new Date().toISOString()
        });
        
        // 최대 50개까지만 유지
        if (this.editedImages.length > 50) {
            this.editedImages = this.editedImages.slice(0, 50);
        }
        
        this.saveToStorage('editedImages', this.editedImages);
    },
    
    // 편집된 이미지 삭제
    removeEditedImage(imageId) {
        this.editedImages = this.editedImages.filter(img => img.id !== imageId);
        this.saveToStorage('editedImages', this.editedImages);
    }
};

// 토스트 메시지 관리
const Toast = {
    show(message, type = 'info', duration = 3000) {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 애니메이션을 위한 지연
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // 자동 제거
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    },
    
    success(message, duration) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration) {
        this.show(message, 'error', duration);
    },
    
    warning(message, duration) {
        this.show(message, 'warning', duration);
    }
};

// 모달 관리
const Modal = {
    show(content, options = {}) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // 헤더
        if (options.title) {
            const header = document.createElement('div');
            header.className = 'modal-header';
            
            const title = document.createElement('div');
            title.className = 'modal-title';
            title.textContent = options.title;
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = () => this.hide(modalOverlay);
            
            header.appendChild(title);
            header.appendChild(closeBtn);
            modal.appendChild(header);
        }
        
        // 컨텐츠
        if (typeof content === 'string') {
            const contentDiv = document.createElement('div');
            contentDiv.className = 'modal-content';
            contentDiv.innerHTML = content;
            modal.appendChild(contentDiv);
        } else {
            modal.appendChild(content);
        }
        
        // 버튼들
        if (options.buttons) {
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '12px';
            buttonContainer.style.justifyContent = 'flex-end';
            buttonContainer.style.marginTop = '20px';
            
            options.buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = `btn ${btn.class || 'btn-secondary'}`;
                button.textContent = btn.text;
                button.onclick = () => {
                    if (btn.onClick) btn.onClick();
                    if (btn.close !== false) this.hide(modalOverlay);
                };
                buttonContainer.appendChild(button);
            });
            
            modal.appendChild(buttonContainer);
        }
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // 애니메이션을 위한 지연
        setTimeout(() => {
            modalOverlay.classList.add('show');
        }, 100);
        
        // 배경 클릭으로 닫기
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                this.hide(modalOverlay);
            }
        };
        
        // ESC 키로 닫기
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.hide(modalOverlay);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        return modalOverlay;
    },
    
    hide(modalOverlay) {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
            if (modalOverlay.parentNode) {
                modalOverlay.parentNode.removeChild(modalOverlay);
            }
        }, 300);
    }
};

// 이미지 처리 유틸리티
const ImageUtils = {
    // 이미지 압축
    compressImage(file, maxWidth = 1024, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // 비율 유지하면서 크기 조정
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                const newWidth = img.width * ratio;
                const newHeight = img.height * ratio;
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    },
    
    // 이미지를 Base64로 변환
    toBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    },
    
    // 이미지 크기 조정
    resizeImage(base64, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            
            img.src = base64;
        });
    }
};

// API 통신 유틸리티
const API = {
    baseURL: 'https://pkapi.ting.ovh',
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    // 사용자 로그인
    async login(username, password) {
        return this.request('/user/Kiosk/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },
    
    // 현금 결제 생성
    async createCashPayment(orderData) {
        return this.request('/api/Cash/create', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },
    
    // LinePay 결제 생성
    async createLinePayPayment(orderData) {
        return this.request('/api/LinePay/create', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },
    
    // 쿠폰 사용
    async useCoupon(code) {
        return this.request(`/api/Kiosk/useCoupon?code=${code}`, {
            method: 'GET'
        });
    }
};

// 네비게이션 관리
const Navigation = {
    // 현재 페이지 활성화
    setActivePage(pageName) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === pageName) {
                item.classList.add('active');
            }
        });
    },
    
    // 페이지 이동
    navigateTo(page) {
        window.location.href = page;
    },
    
    // 뒤로가기
    goBack() {
        window.history.back();
    }
};

// 디바이스 정보
const DeviceInfo = {
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    },
    
    isAndroid() {
        return /Android/.test(navigator.userAgent);
    },
    
    getScreenSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
};

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 앱 상태 초기화
    AppState.init();
    
    // 현재 페이지 네비게이션 활성화
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    Navigation.setActivePage(currentPage);
    
    // 터치 디바이스 최적화
    if (DeviceInfo.isMobile()) {
        document.body.classList.add('touch-device');
    }
    
    // 스크롤 성능 최적화
    let ticking = false;
    function updateScroll() {
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScroll);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
    
    console.log('POKA V2 App initialized');
});

// 전역 객체에 유틸리티 추가
window.POKA = {
    AppState,
    Toast,
    Modal,
    ImageUtils,
    API,
    Navigation,
    DeviceInfo
}; 