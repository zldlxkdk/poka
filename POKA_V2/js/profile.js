// POKA V2 - 프로필 페이지 JavaScript

// 전역 변수
let userProfile = null;
let isLoggedIn = false;

// DOM 요소들
const loginRequired = document.getElementById('loginRequired');
const userContent = document.getElementById('userContent');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userJoinDate = document.getElementById('userJoinDate');
const createdPhotocards = document.getElementById('createdPhotocards');
const printedPhotocards = document.getElementById('printedPhotocards');
const favoriteImages = document.getElementById('favoriteImages');
const daysActive = document.getElementById('daysActive');
const darkModeToggle = document.getElementById('darkModeToggle');
const notificationToggle = document.getElementById('notificationToggle');
const autoSaveToggle = document.getElementById('autoSaveToggle');

document.addEventListener('DOMContentLoaded', () => {
    console.log('POKA V2 Profile page loaded');
    
    // 로그인 상태 확인
    checkLoginStatus();
    
    // 설정 로드
    loadSettings();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 다크모드 변경 이벤트 리스너
    document.addEventListener('darkModeChanged', handleDarkModeChange);
    
    // 쿠폰 데이터 로드
    loadCouponData();
});

// 로그인 상태 확인
function checkLoginStatus() {
    const userProfile = POKA.AppState.getFromStorage('userProfile');
    isLoggedIn = !!(userProfile && userProfile.isLoggedIn);
    
    if (isLoggedIn) {
        showUserContent();
        loadUserProfile();
        updateStatistics();
    } else {
        showLoginRequired();
    }
}

// 로그인 필요 화면 표시
function showLoginRequired() {
    loginRequired.style.display = 'block';
    userContent.style.display = 'none';
}

// 사용자 컨텐츠 표시
function showUserContent() {
    loginRequired.style.display = 'none';
    userContent.style.display = 'block';
}

// 사용자 정보 로드
function loadUserProfile() {
    userProfile = POKA.AppState.getFromStorage('userProfile') || {
        name: '사용자',
        email: '사용자@example.com',
        joinDate: new Date().toISOString(),
        avatar: null,
        isLoggedIn: true
    };
    
    // 사용자 정보 표시
    userName.textContent = userProfile.name;
    userEmail.textContent = userProfile.email;
    
    const joinDate = new Date(userProfile.joinDate);
    userJoinDate.textContent = `가입일: ${joinDate.toLocaleDateString('ko-KR')}`;
}

// 통계 업데이트 (새로운 구조)
function updateStatistics() {
    // 새로운 통계 구조
    const statistics = POKA.AppState.getFromStorage('statistics') || {};
    
    // 기본값 설정
    const defaultStatistics = {
        createdPhotocards: 0,
        printedPhotocards: 0,
        favoriteImages: 0,
        daysActive: 1,
        lastActivity: new Date().toISOString()
    };
    
    // 기존 데이터와 기본값 병합
    const mergedStatistics = { ...defaultStatistics, ...statistics };
    
    // 활동일 계산
    const joinDate = new Date(userProfile.joinDate);
    const today = new Date();
    const daysDiff = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
    mergedStatistics.daysActive = Math.max(1, daysDiff);
    
    // 통계 표시
    createdPhotocards.textContent = mergedStatistics.createdPhotocards || 0;
    printedPhotocards.textContent = mergedStatistics.printedPhotocards || 0;
    favoriteImages.textContent = mergedStatistics.favoriteImages || 0;
    daysActive.textContent = mergedStatistics.daysActive || 0;
    
    // 통계 저장
    POKA.AppState.saveToStorage('statistics', mergedStatistics);
}

// 설정 로드
function loadSettings() {
    const settings = POKA.AppState.getFromStorage('settings') || {
        darkMode: false,
        notifications: false,
        autoSave: true
    };
    
    if (darkModeToggle) darkModeToggle.checked = settings.darkMode;
    if (notificationToggle) notificationToggle.checked = settings.notifications;
    if (autoSaveToggle) autoSaveToggle.checked = settings.autoSave;
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 다크 모드 토글
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            const isDarkMode = e.target.checked;
            POKA.DarkMode.setDarkMode(isDarkMode);
            POKA.Toast.success(isDarkMode ? '다크 모드가 활성화되었습니다' : '라이트 모드가 활성화되었습니다');
        });
    }
    
    // 알림 토글
    if (notificationToggle) {
        notificationToggle.addEventListener('change', (e) => {
            const notificationsEnabled = e.target.checked;
            saveSettings();
            
            if (notificationsEnabled) {
                requestNotificationPermission();
            } else {
                POKA.Toast.success('알림이 비활성화되었습니다');
            }
        });
    }
    
    // 자동 저장 토글
    if (autoSaveToggle) {
        autoSaveToggle.addEventListener('change', (e) => {
            const autoSaveEnabled = e.target.checked;
            saveSettings();
            POKA.Toast.success(autoSaveEnabled ? '자동 저장이 활성화되었습니다' : '자동 저장이 비활성화되었습니다');
        });
    }
}

// 다크모드 변경 이벤트 핸들러
function handleDarkModeChange(event) {
    if (darkModeToggle) {
        darkModeToggle.checked = event.detail.isDarkMode;
    }
}

// 설정 저장
function saveSettings() {
    const settings = {
        darkMode: POKA.DarkMode.isDarkMode(),
        notifications: notificationToggle ? notificationToggle.checked : false,
        autoSave: autoSaveToggle ? autoSaveToggle.checked : true
    };
    
    POKA.AppState.saveToStorage('settings', settings);
}

// 알림 권한 요청
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            POKA.Toast.success('알림 권한이 허용되었습니다');
        } else {
            POKA.Toast.warning('알림 권한이 거부되었습니다');
            if (notificationToggle) {
                notificationToggle.checked = false;
                saveSettings();
            }
        }
    } else {
        POKA.Toast.warning('이 브라우저는 알림을 지원하지 않습니다');
        if (notificationToggle) {
            notificationToggle.checked = false;
            saveSettings();
        }
    }
}

// 로그인 모달 표시
function showLoginModal() {
    const content = `
        <div style="text-align: left;">
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">이메일</label>
                <input type="email" id="loginEmail" placeholder="이메일을 입력하세요" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">비밀번호</label>
                <input type="password" id="loginPassword" placeholder="비밀번호를 입력하세요" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
        </div>
    `;
    
    POKA.Modal.show(content, {
        title: '로그인',
        buttons: [
            {
                text: '취소',
                class: 'btn-secondary'
            },
            {
                text: '로그인',
                class: 'btn-primary',
                onClick: () => {
                    const email = document.getElementById('loginEmail').value.trim();
                    const password = document.getElementById('loginPassword').value.trim();
                    
                    if (!email || !password) {
                        POKA.Toast.error('이메일과 비밀번호를 입력해주세요');
                        return;
                    }
                    
                    // 간단한 로그인 처리 (실제로는 서버 인증 필요)
                    loginUser(email, password);
                }
            }
        ]
    });
}

// 회원가입 모달 표시
function showSignupModal() {
    const content = `
        <div style="text-align: left;">
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">이름</label>
                <input type="text" id="signupName" placeholder="이름을 입력하세요" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">이메일</label>
                <input type="email" id="signupEmail" placeholder="이메일을 입력하세요" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">비밀번호</label>
                <input type="password" id="signupPassword" placeholder="비밀번호를 입력하세요" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">비밀번호 확인</label>
                <input type="password" id="signupPasswordConfirm" placeholder="비밀번호를 다시 입력하세요" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
        </div>
    `;
    
    POKA.Modal.show(content, {
        title: '회원가입',
        buttons: [
            {
                text: '취소',
                class: 'btn-secondary'
            },
            {
                text: '가입하기',
                class: 'btn-primary',
                onClick: () => {
                    const name = document.getElementById('signupName').value.trim();
                    const email = document.getElementById('signupEmail').value.trim();
                    const password = document.getElementById('signupPassword').value.trim();
                    const passwordConfirm = document.getElementById('signupPasswordConfirm').value.trim();
                    
                    if (!name || !email || !password || !passwordConfirm) {
                        POKA.Toast.error('모든 필드를 입력해주세요');
                        return;
                    }
                    
                    if (!isValidEmail(email)) {
                        POKA.Toast.error('유효한 이메일을 입력해주세요');
                        return;
                    }
                    
                    if (password !== passwordConfirm) {
                        POKA.Toast.error('비밀번호가 일치하지 않습니다');
                        return;
                    }
                    
                    if (password.length < 6) {
                        POKA.Toast.error('비밀번호는 6자 이상이어야 합니다');
                        return;
                    }
                    
                    // 간단한 회원가입 처리 (실제로는 서버 처리 필요)
                    signupUser(name, email, password);
                }
            }
        ]
    });
}

// 로그인 처리
function loginUser(email, password) {
    // 실제로는 서버에서 인증 처리
    // 여기서는 간단한 시뮬레이션
    const storedUser = POKA.AppState.getFromStorage('registeredUsers') || {};
    
    if (storedUser[email] && storedUser[email].password === password) {
        const userProfile = {
            name: storedUser[email].name,
            email: email,
            joinDate: storedUser[email].joinDate,
            avatar: null,
            isLoggedIn: true
        };
        
        POKA.AppState.saveToStorage('userProfile', userProfile);
        POKA.Toast.success('로그인되었습니다');
        
        // 화면 업데이트
        checkLoginStatus();
    } else {
        POKA.Toast.error('이메일 또는 비밀번호가 올바르지 않습니다');
    }
}

// 회원가입 처리
function signupUser(name, email, password) {
    // 실제로는 서버에서 처리
    // 여기서는 간단한 시뮬레이션
    const storedUser = POKA.AppState.getFromStorage('registeredUsers') || {};
    
    if (storedUser[email]) {
        POKA.Toast.error('이미 가입된 이메일입니다');
        return;
    }
    
    const newUser = {
        name: name,
        email: email,
        password: password,
        joinDate: new Date().toISOString()
    };
    
    storedUser[email] = newUser;
    POKA.AppState.saveToStorage('registeredUsers', storedUser);
    
    // 자동 로그인
    const userProfile = {
        name: name,
        email: email,
        joinDate: newUser.joinDate,
        avatar: null,
        isLoggedIn: true
    };
    
    POKA.AppState.saveToStorage('userProfile', userProfile);
    POKA.Toast.success('회원가입이 완료되었습니다');
    
    // 화면 업데이트
    checkLoginStatus();
}

// 로그아웃
function logout() {
    if (userProfile) {
        userProfile.isLoggedIn = false;
        POKA.AppState.saveToStorage('userProfile', userProfile);
    }
    
    POKA.Toast.success('로그아웃되었습니다');
    checkLoginStatus();
}

// 프로필 편집
function editProfile() {
    const content = `
        <div style="text-align: left;">
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">이름</label>
                <input type="text" id="editName" value="${userProfile.name}" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">이메일</label>
                <input type="email" id="editEmail" value="${userProfile.email}" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
        </div>
    `;
    
    POKA.Modal.show(content, {
        title: '프로필 편집',
        buttons: [
            {
                text: '취소',
                class: 'btn-secondary'
            },
            {
                text: '저장',
                class: 'btn-primary',
                onClick: () => {
                    const newName = document.getElementById('editName').value.trim();
                    const newEmail = document.getElementById('editEmail').value.trim();
                    
                    if (!newName) {
                        POKA.Toast.error('이름을 입력해주세요');
                        return;
                    }
                    
                    if (!newEmail || !isValidEmail(newEmail)) {
                        POKA.Toast.error('유효한 이메일을 입력해주세요');
                        return;
                    }
                    
                    userProfile.name = newName;
                    userProfile.email = newEmail;
                    
                    POKA.AppState.saveToStorage('userProfile', userProfile);
                    loadUserProfile();
                    
                    POKA.Toast.success('프로필이 업데이트되었습니다');
                }
            }
        ]
    });
}

// 이메일 유효성 검사
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 데이터 내보내기
function exportData() {
    const data = {
        userProfile: POKA.AppState.getFromStorage('userProfile'),
        statistics: POKA.AppState.getFromStorage('statistics') || {},
        settings: POKA.AppState.getFromStorage('settings'),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `poka_v2_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    POKA.Toast.success('데이터가 내보내기되었습니다');
}

// 데이터 가져오기
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.userProfile) {
                    POKA.AppState.saveToStorage('userProfile', data.userProfile);
                }
                
                if (data.statistics) {
                    POKA.AppState.saveToStorage('statistics', data.statistics);
                }
                
                if (data.settings) {
                    POKA.AppState.saveToStorage('settings', data.settings);
                    // 다크모드 설정 적용
                    POKA.DarkMode.loadSettings();
                    POKA.DarkMode.applyTheme();
                }
                
                POKA.Toast.success('데이터가 가져와졌습니다');
                
                // 화면 새로고침
                checkLoginStatus();
                loadSettings();
                if (isLoggedIn) {
                    updateStatistics();
                }
                
            } catch (error) {
                POKA.Toast.error('데이터 파일을 읽을 수 없습니다');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// 모든 데이터 삭제
function clearAllData() {
    const content = `
        <div style="text-align: center;">
            <p style="margin-bottom: 16px; color: #e74c3c;">⚠️ 주의</p>
            <p>모든 데이터가 영구적으로 삭제됩니다.</p>
            <p>이 작업은 되돌릴 수 없습니다.</p>
        </div>
    `;
    
    POKA.Modal.show(content, {
        title: '데이터 삭제 확인',
        buttons: [
            {
                text: '취소',
                class: 'btn-secondary'
            },
            {
                text: '삭제',
                class: 'btn-danger',
                onClick: () => {
                    // 모든 데이터 삭제
                    localStorage.clear();
                    
                    POKA.Toast.success('모든 데이터가 삭제되었습니다');
                    
                    // 로그인 상태로 리셋
                    checkLoginStatus();
                }
            }
        ]
    });
}

// 설정 초기화
function resetSettings() {
    const content = `
        <div style="text-align: center;">
            <p style="margin-bottom: 16px;">모든 설정이 기본값으로 초기화됩니다.</p>
        </div>
    `;
    
    POKA.Modal.show(content, {
        title: '설정 초기화 확인',
        buttons: [
            {
                text: '취소',
                class: 'btn-secondary'
            },
            {
                text: '초기화',
                class: 'btn-primary',
                onClick: () => {
                    // 설정만 초기화
                    const defaultSettings = {
                        darkMode: false,
                        notifications: false,
                        autoSave: true
                    };
                    
                    POKA.AppState.saveToStorage('settings', defaultSettings);
                    
                    // 다크모드 설정 적용
                    POKA.DarkMode.loadSettings();
                    POKA.DarkMode.applyTheme();
                    
                    // 설정 UI 업데이트
                    loadSettings();
                    
                    POKA.Toast.success('설정이 초기화되었습니다');
                }
            }
        ]
    });
}

// 설정 표시
function showSettings() {
    // 기존 고급 설정 로드
    const advancedSettings = POKA.AppState.getFromStorage('advancedSettings') || {
        debugMode: false,
        analyticsMode: false,
        autoUpdate: false
    };
    
    const content = `
        <div style="text-align: left;">
            <h4 style="margin-bottom: 16px;">고급 설정</h4>
            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="debugMode" ${advancedSettings.debugMode ? 'checked' : ''}>
                    디버그 모드
                </label>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="analyticsMode" ${advancedSettings.analyticsMode ? 'checked' : ''}>
                    사용 통계 수집
                </label>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="autoUpdate" ${advancedSettings.autoUpdate ? 'checked' : ''}>
                    자동 업데이트
                </label>
            </div>
        </div>
    `;
    
    POKA.Modal.show(content, {
        title: '고급 설정',
        buttons: [
            {
                text: '취소',
                class: 'btn-secondary'
            },
            {
                text: '저장',
                class: 'btn-primary',
                onClick: () => {
                    const newSettings = {
                        debugMode: document.getElementById('debugMode').checked,
                        analyticsMode: document.getElementById('analyticsMode').checked,
                        autoUpdate: document.getElementById('autoUpdate').checked
                    };
                    
                    POKA.AppState.saveToStorage('advancedSettings', newSettings);
                    POKA.Toast.success('고급 설정이 저장되었습니다');
                }
            }
        ]
    });
}

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'e':
        case 'E':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                editProfile();
            }
            break;
        case 's':
        case 'S':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                exportData();
            }
            break;
    }
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
    POKA.Toast.success('인터넷 연결이 복구되었습니다');
});

window.addEventListener('offline', () => {
    POKA.Toast.warning('인터넷 연결이 끊어졌습니다');
});

// 페이지 떠날 때 데이터 저장
window.addEventListener('beforeunload', () => {
    if (isLoggedIn) {
        // 마지막 활동 시간 업데이트
        const statistics = POKA.AppState.getFromStorage('statistics') || {};
        statistics.lastActivity = new Date().toISOString();
        POKA.AppState.saveToStorage('statistics', statistics);
    }
});

// 쿠폰 관련 기능
function loadCouponData() {
    if (!isLoggedIn) return;
    
    // 쿠폰 데이터 로드
    const coupons = JSON.parse(localStorage.getItem('poka_coupons') || '[]');
    
    // 사용 가능한 쿠폰 개수 업데이트
    const availableCoupons = coupons.filter(coupon => 
        coupon.status === 'available' && !isCouponExpired(coupon)
    );
    
    const couponCountElement = document.getElementById('profileCouponCount');
    if (couponCountElement) {
        couponCountElement.textContent = `${availableCoupons.length}개`;
    }
}

// 쿠폰 만료 확인
function isCouponExpired(coupon) {
    const today = new Date();
    const expiryDate = new Date(coupon.expiryDate);
    return today > expiryDate;
}



// 쿠폰 데이터 새로고침 (다른 페이지에서 쿠폰 변경 시 호출)
function refreshCouponData() {
    loadCouponData();
}

// 쿠폰 페이지에서 돌아올 때 데이터 새로고침
window.addEventListener('focus', () => {
    if (isLoggedIn) {
        loadCouponData();
    }
});

// 통계 증가 함수들
function incrementCreatedPhotocards() {
    if (!isLoggedIn) return;
    
    const statistics = POKA.AppState.getFromStorage('statistics') || {};
    const defaultStatistics = {
        createdPhotocards: 0,
        printedPhotocards: 0,
        favoriteImages: 0,
        daysActive: 1,
        lastActivity: new Date().toISOString()
    };
    const mergedStatistics = { ...defaultStatistics, ...statistics };
    
    mergedStatistics.createdPhotocards++;
    POKA.AppState.saveToStorage('statistics', mergedStatistics);
    
    // UI 업데이트
    if (createdPhotocards) {
        createdPhotocards.textContent = mergedStatistics.createdPhotocards || 0;
    }
}

function incrementPrintedPhotocards() {
    if (!isLoggedIn) return;
    
    const statistics = POKA.AppState.getFromStorage('statistics') || {};
    const defaultStatistics = {
        createdPhotocards: 0,
        printedPhotocards: 0,
        favoriteImages: 0,
        daysActive: 1,
        lastActivity: new Date().toISOString()
    };
    const mergedStatistics = { ...defaultStatistics, ...statistics };
    
    mergedStatistics.printedPhotocards++;
    POKA.AppState.saveToStorage('statistics', mergedStatistics);
    
    // UI 업데이트
    if (printedPhotocards) {
        printedPhotocards.textContent = mergedStatistics.printedPhotocards || 0;
    }
}

function incrementFavoriteImages() {
    if (!isLoggedIn) return;
    
    const statistics = POKA.AppState.getFromStorage('statistics') || {};
    const defaultStatistics = {
        createdPhotocards: 0,
        printedPhotocards: 0,
        favoriteImages: 0,
        daysActive: 1,
        lastActivity: new Date().toISOString()
    };
    const mergedStatistics = { ...defaultStatistics, ...statistics };
    
    mergedStatistics.favoriteImages++;
    POKA.AppState.saveToStorage('statistics', mergedStatistics);
    
    // UI 업데이트
    if (favoriteImages) {
        favoriteImages.textContent = mergedStatistics.favoriteImages || 0;
    }
}

// 전역 함수로 노출 (다른 페이지에서 호출 가능)
window.POKA = window.POKA || {};
window.POKA.Statistics = {
    incrementCreatedPhotocards,
    incrementPrintedPhotocards,
    incrementFavoriteImages
}; 