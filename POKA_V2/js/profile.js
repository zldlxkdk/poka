// POKA V2 - 프로필 페이지 JavaScript

// 전역 변수
let userProfile = null;
let deferredPrompt = null;

// DOM 요소들
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userJoinDate = document.getElementById('userJoinDate');
const totalImages = document.getElementById('totalImages');
const editedImages = document.getElementById('editedImages');
const favoriteImages = document.getElementById('favoriteImages');
const daysActive = document.getElementById('daysActive');
const darkModeToggle = document.getElementById('darkModeToggle');
const notificationToggle = document.getElementById('notificationToggle');
const autoSaveToggle = document.getElementById('autoSaveToggle');
const installBtn = document.getElementById('installBtn');

document.addEventListener('DOMContentLoaded', () => {
    console.log('POKA V2 Profile page loaded');
    
    // 사용자 정보 로드
    loadUserProfile();
    
    // 통계 업데이트
    updateStatistics();
    
    // 설정 로드
    loadSettings();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // PWA 설치 프롬프트 설정
    setupPWAInstall();
});

// 사용자 정보 로드
function loadUserProfile() {
    userProfile = POKA.AppState.getFromStorage('userProfile') || {
        name: '사용자',
        email: '사용자@example.com',
        joinDate: new Date().toISOString(),
        avatar: null
    };
    
    // 사용자 정보 표시
    userName.textContent = userProfile.name;
    userEmail.textContent = userProfile.email;
    
    const joinDate = new Date(userProfile.joinDate);
    userJoinDate.textContent = `가입일: ${joinDate.toLocaleDateString('ko-KR')}`;
}

// 통계 업데이트
function updateStatistics() {
    const savedImages = POKA.AppState.getFromStorage('editedImages') || [];
    const uploadedImages = POKA.AppState.getFromStorage('uploadedImages') || [];
    
    const allImages = [...savedImages, ...uploadedImages];
    const favoriteCount = allImages.filter(img => img.favorite).length;
    const editedCount = savedImages.length;
    
    // 총 이미지 수
    totalImages.textContent = allImages.length;
    
    // 편집된 이미지 수
    editedImages.textContent = editedCount;
    
    // 즐겨찾기 수
    favoriteImages.textContent = favoriteCount;
    
    // 활동일 계산
    const joinDate = new Date(userProfile.joinDate);
    const today = new Date();
    const daysDiff = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
    daysActive.textContent = Math.max(1, daysDiff);
}

// 설정 로드
function loadSettings() {
    const settings = POKA.AppState.getFromStorage('settings') || {
        darkMode: false,
        notifications: false,
        autoSave: true
    };
    
    darkModeToggle.checked = settings.darkMode;
    notificationToggle.checked = settings.notifications;
    autoSaveToggle.checked = settings.autoSave;
    
    // 다크 모드 적용
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 다크 모드 토글
    darkModeToggle.addEventListener('change', (e) => {
        const isDarkMode = e.target.checked;
        document.body.classList.toggle('dark-mode', isDarkMode);
        saveSettings();
        POKA.Toast.success(isDarkMode ? '다크 모드가 활성화되었습니다' : '라이트 모드가 활성화되었습니다');
    });
    
    // 알림 토글
    notificationToggle.addEventListener('change', (e) => {
        const notificationsEnabled = e.target.checked;
        saveSettings();
        
        if (notificationsEnabled) {
            requestNotificationPermission();
        } else {
            POKA.Toast.success('알림이 비활성화되었습니다');
        }
    });
    
    // 자동 저장 토글
    autoSaveToggle.addEventListener('change', (e) => {
        const autoSaveEnabled = e.target.checked;
        saveSettings();
        POKA.Toast.success(autoSaveEnabled ? '자동 저장이 활성화되었습니다' : '자동 저장이 비활성화되었습니다');
    });
}

// PWA 설치 설정
function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
    });
    
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installBtn.style.display = 'none';
        }
    });
}

// 설정 저장
function saveSettings() {
    const settings = {
        darkMode: darkModeToggle.checked,
        notifications: notificationToggle.checked,
        autoSave: autoSaveToggle.checked
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
            notificationToggle.checked = false;
            saveSettings();
        }
    } else {
        POKA.Toast.warning('이 브라우저는 알림을 지원하지 않습니다');
        notificationToggle.checked = false;
        saveSettings();
    }
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
        editedImages: POKA.AppState.getFromStorage('editedImages') || [],
        uploadedImages: POKA.AppState.getFromStorage('uploadedImages') || [],
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
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // 데이터 유효성 검사
                if (!data.exportDate) {
                    POKA.Toast.error('유효하지 않은 백업 파일입니다');
                    return;
                }
                
                // 데이터 복원 확인
                POKA.Modal.show(
                    `<p>백업 파일을 가져오시겠습니까?</p>
                     <p style="font-size: 0.9rem; color: var(--text-secondary);">
                         내보내기 날짜: ${new Date(data.exportDate).toLocaleString('ko-KR')}
                     </p>
                     <p style="font-size: 0.9rem; color: var(--text-secondary);">
                         기존 데이터는 덮어쓰기됩니다.
                     </p>`,
                    {
                        title: '데이터 가져오기',
                        buttons: [
                            {
                                text: '취소',
                                class: 'btn-secondary'
                            },
                            {
                                text: '가져오기',
                                class: 'btn-primary',
                                onClick: () => {
                                    // 데이터 복원
                                    if (data.userProfile) {
                                        POKA.AppState.saveToStorage('userProfile', data.userProfile);
                                    }
                                    if (data.editedImages) {
                                        POKA.AppState.saveToStorage('editedImages', data.editedImages);
                                    }
                                    if (data.uploadedImages) {
                                        POKA.AppState.saveToStorage('uploadedImages', data.uploadedImages);
                                    }
                                    if (data.settings) {
                                        POKA.AppState.saveToStorage('settings', data.settings);
                                    }
                                    
                                    // 페이지 새로고침
                                    window.location.reload();
                                }
                            }
                        ]
                    }
                );
                
            } catch (error) {
                console.error('Import error:', error);
                POKA.Toast.error('파일을 읽는 중 오류가 발생했습니다');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// 모든 데이터 삭제
function clearAllData() {
    POKA.Modal.show(
        `<p style="color: #dc3545; font-weight: bold;">?? 주의: 이 작업은 되돌릴 수 없습니다!</p>
         <p>모든 이미지, 설정, 프로필 정보가 영구적으로 삭제됩니다.</p>`,
        {
            title: '모든 데이터 삭제',
            buttons: [
                {
                    text: '취소',
                    class: 'btn-secondary'
                },
                {
                    text: '삭제',
                    class: 'btn-primary',
                    onClick: () => {
                        // 모든 로컬 스토리지 데이터 삭제
                        const keys = Object.keys(localStorage);
                        keys.forEach(key => {
                            if (key.startsWith('poka_v2_')) {
                                localStorage.removeItem(key);
                            }
                        });
                        
                        POKA.Toast.success('모든 데이터가 삭제되었습니다');
                        
                        // 페이지 새로고침
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }
                }
            ]
        }
    );
}

// 설정 초기화
function resetSettings() {
    POKA.Modal.show(
        `<p>모든 설정을 기본값으로 초기화하시겠습니까?</p>`,
        {
            title: '설정 초기화',
            buttons: [
                {
                    text: '취소',
                    class: 'btn-secondary'
                },
                {
                    text: '초기화',
                    class: 'btn-primary',
                    onClick: () => {
                        // 기본 설정으로 초기화
                        const defaultSettings = {
                            darkMode: false,
                            notifications: false,
                            autoSave: true
                        };
                        
                        POKA.AppState.saveToStorage('settings', defaultSettings);
                        
                        // UI 업데이트
                        darkModeToggle.checked = false;
                        notificationToggle.checked = false;
                        autoSaveToggle.checked = true;
                        
                        // 다크 모드 해제
                        document.body.classList.remove('dark-mode');
                        
                        POKA.Toast.success('설정이 초기화되었습니다');
                    }
                }
            ]
        }
    );
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
    
    const modal = POKA.Modal.show(content, {
        title: '고급 설정',
        buttons: [
            {
                text: '닫기',
                class: 'btn-secondary',
                onClick: () => {
                    // 설정 저장 로직 추가
                    const debugMode = document.getElementById('debugMode')?.checked || false;
                    const analyticsMode = document.getElementById('analyticsMode')?.checked || false;
                    const autoUpdate = document.getElementById('autoUpdate')?.checked || false;
                    
                    const newAdvancedSettings = {
                        debugMode,
                        analyticsMode,
                        autoUpdate
                    };
                    
                    POKA.AppState.saveToStorage('advancedSettings', newAdvancedSettings);
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

// 페이지 떠날 때 저장
window.addEventListener('beforeunload', () => {
    saveSettings();
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
    POKA.Toast.success('인터넷 연결이 복구되었습니다');
});

window.addEventListener('offline', () => {
    POKA.Toast.warning('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.');
}); 