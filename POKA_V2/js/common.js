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
        this.currentImage = this.getFromStorage('currentImage');
        this.editedImages = this.getFromStorage('editedImages') || [];
        this.deviceId = this.getFromStorage('deviceId') || this.generateDeviceId();
        this.saveToStorage('deviceId', this.deviceId);
        
        console.log('AppState 초기화 완료:', {
            user: this.user ? '설정됨' : '없음',
            currentImage: this.currentImage ? '설정됨' : '없음',
            editedImages: this.editedImages.length,
            deviceId: this.deviceId
        });
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

// 전역 다크모드 관리
const DarkMode = {
    // 다크모드 초기화
    init() {
        this.loadSettings();
        this.applyTheme();
    },
    
    // 설정 로드
    loadSettings() {
        this.settings = AppState.getFromStorage('settings') || {
            darkMode: false,
            notifications: false,
            autoSave: true
        };
    },
    
    // 테마 적용
    applyTheme() {
        if (this.settings.darkMode) {
            document.body.classList.add('dark-mode');
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.setAttribute('data-bs-theme', 'light');
        }
    },
    
    // 다크모드 토글
    toggle() {
        this.settings.darkMode = !this.settings.darkMode;
        this.applyTheme();
        this.saveSettings();
        
        // 이벤트 발생
        const event = new CustomEvent('darkModeChanged', {
            detail: { isDarkMode: this.settings.darkMode }
        });
        document.dispatchEvent(event);
        
        return this.settings.darkMode;
    },
    
    // 다크모드 설정
    setDarkMode(enabled) {
        this.settings.darkMode = enabled;
        this.applyTheme();
        this.saveSettings();
        
        // 이벤트 발생
        const event = new CustomEvent('darkModeChanged', {
            detail: { isDarkMode: this.settings.darkMode }
        });
        document.dispatchEvent(event);
    },
    
    // 설정 저장
    saveSettings() {
        AppState.saveToStorage('settings', this.settings);
    },
    
    // 현재 다크모드 상태 확인
    isDarkMode() {
        return this.settings.darkMode;
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
        
        // ESC 키로 닫기
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.hide(modalOverlay);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // 배경 클릭으로 닫기
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.hide(modalOverlay);
            }
        });
        
        // 애니메이션
        setTimeout(() => {
            modalOverlay.classList.add('show');
        }, 10);
        
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
    compressImage(file, maxWidth = 1024, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    },
    
    toBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    },
    
    resizeImage(base64, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
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
    async request(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(endpoint, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    async login(username, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },
    
    async createCashPayment(orderData) {
        return this.request('/api/payment/cash', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },
    
    async createLinePayPayment(orderData) {
        return this.request('/api/payment/linepay', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },
    
    async useCoupon(code) {
        return this.request('/api/coupon/use', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    }
};

// 네비게이션 관리
const Navigation = {
    setActivePage(pageName) {
        // 모든 네비게이션 아이템에서 active 클래스 제거
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        // 현재 페이지에 active 클래스 추가
        const currentNavItem = document.querySelector(`[data-page="${pageName}"]`);
        if (currentNavItem) {
            currentNavItem.classList.add('active');
        }
    },
    
    navigateTo(page) {
        window.location.href = page;
    },
    
    goBack() {
        window.history.back();
    }
};

// 디바이스 감지
const DeviceUtils = {
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
            height: window.innerHeight,
            isMobile: this.isMobile(),
            isIOS: this.isIOS(),
            isAndroid: this.isAndroid()
        };
    }
};

// 전역 POKA 객체
window.POKA = {
    AppState,
    DarkMode,
    Toast,
    Modal,
    ImageUtils,
    API,
    Navigation,
    DeviceUtils
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // AppState 초기화
    POKA.AppState.init();
    
    // 다크모드 초기화
    POKA.DarkMode.init();
    
    // 성능 최적화를 위한 스크롤 이벤트 처리
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
    
    console.log('POKA V2 초기화 완료');
}); 