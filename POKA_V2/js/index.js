// POKA V2 - 메인 페이지 JavaScript

// 카드 클릭 효과 함수
function cardClickEffect(element) {
    // 클릭 애니메이션 클래스 추가
    element.classList.add('clicked');
    
    // 햇빛 반짝임 효과 클래스 추가
    element.classList.add('sunshine');
    
    // 3D 카드 회전 효과 추가
    const cardContainer = element.querySelector('.card-3d-container');
    if (cardContainer) {
        cardContainer.style.animation = 'cardClick 0.6s ease-out, cardRotate 15s linear infinite 0.6s';
    }
    
    // 클릭 사운드 효과 (선택사항)
    playClickSound();
    
    // 클래스 제거 (애니메이션 완료 후)
    setTimeout(() => {
        element.classList.remove('clicked');
        if (cardContainer) {
            cardContainer.style.animation = 'cardRotate 15s linear infinite';
        }
    }, 600);
    
    setTimeout(() => {
        element.classList.remove('sunshine');
    }, 1200);
}

// 3D 카드 마우스 호버 효과
function init3DCardEffects() {
    const cardContainer = document.querySelector('.card-3d-container');
    if (!cardContainer) return;
    
    // 이미지 로딩 상태 확인
    const frontImg = cardContainer.querySelector('.card-front img');
    const backImg = cardContainer.querySelector('.card-back img');
    const cardFront = cardContainer.querySelector('.card-front');
    const cardBack = cardContainer.querySelector('.card-back');
    
    // 뒷면 이미지 로딩 확인
    if (backImg) {
        backImg.addEventListener('load', () => {
            console.log('뒷면 이미지 로딩 완료');
        });
        
        backImg.addEventListener('error', () => {
            console.log('뒷면 이미지 로딩 실패');
            // 뒷면 이미지가 없을 경우 기본 배경 설정
            backImg.style.display = 'none';
            if (cardBack) {
                cardBack.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        });
    }
    
    // 카드 회전 각도에 따른 z-index 조정
    function updateCardZIndex() {
        const computedStyle = window.getComputedStyle(cardContainer);
        const transform = computedStyle.transform;
        
        if (transform && transform !== 'none') {
            try {
                const matrix = new DOMMatrix(transform);
                // Y축 회전 각도 계산 (rotateY)
                const angle = Math.atan2(matrix.m31, matrix.m11) * (180 / Math.PI);
                const normalizedAngle = ((angle % 360) + 360) % 360;
                
                console.log('카드 회전 각도:', normalizedAngle);
                
                // 90도~270도 범위에서는 뒷면을 앞으로
                if (normalizedAngle >= 90 && normalizedAngle <= 270) {
                    if (cardBack) {
                        cardBack.style.zIndex = '10';
                        cardBack.style.opacity = '1';
                        cardBack.style.visibility = 'visible';
                    }
                    if (cardFront) {
                        cardFront.style.zIndex = '5';
                        cardFront.style.opacity = '0.3';
                    }
                } else {
                    if (cardFront) {
                        cardFront.style.zIndex = '10';
                        cardFront.style.opacity = '1';
                    }
                    if (cardBack) {
                        cardBack.style.zIndex = '5';
                        cardBack.style.opacity = '0.3';
                    }
                }
            } catch (error) {
                console.log('회전 각도 계산 오류:', error);
            }
        }
    }
    
    // 애니메이션 프레임마다 z-index 업데이트
    function animateZIndex() {
        updateCardZIndex();
        requestAnimationFrame(animateZIndex);
    }
    
    // z-index 애니메이션 시작
    animateZIndex();
    
    cardContainer.addEventListener('mouseenter', () => {
        cardContainer.style.animationPlayState = 'paused';
    });
    
    cardContainer.addEventListener('mouseleave', () => {
        cardContainer.style.animationPlayState = 'running';
    });
    
    // 마우스 움직임에 따른 3D 효과
    cardContainer.addEventListener('mousemove', (e) => {
        const rect = cardContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // 더 자연스러운 회전을 위한 감도 조정
        const rotateX = (y - centerY) / 12;
        const rotateY = (centerX - x) / 12;
        
        // 부드러운 회전 범위 설정
        const clampedRotateY = Math.max(-45, Math.min(45, rotateY));
        const clampedRotateX = Math.max(-25, Math.min(25, rotateX));
        
        // GPU 가속을 위한 transform3d 사용
        cardContainer.style.transform = `translate3d(0, 0, 0) rotateX(${clampedRotateX}deg) rotateY(${clampedRotateY}deg)`;
        cardContainer.style.webkitTransform = `translate3d(0, 0, 0) rotateX(${clampedRotateX}deg) rotateY(${clampedRotateY}deg)`;
        
        // 성능 최적화
        cardContainer.style.willChange = 'transform';
    });
    
    cardContainer.addEventListener('mouseleave', () => {
        cardContainer.style.transform = 'translate3d(0, 0, 0)';
        cardContainer.style.webkitTransform = 'translate3d(0, 0, 0)';
        cardContainer.style.animationPlayState = 'running';
        cardContainer.style.willChange = 'auto';
    });
}

// 클릭 사운드 효과
function playClickSound() {
    // 간단한 클릭 사운드 생성 (선택사항)
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // 오디오 컨텍스트를 지원하지 않는 경우 무시
        console.log('Audio context not supported');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('POKA V2 Index page loaded');
    
    // 3D 카드 효과 초기화
    init3DCardEffects();
    
    // 기능 카드 클릭 이벤트
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // 클릭 효과
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        });
    });
    
    // 빠른 시작 버튼 애니메이션
    const quickStartBtn = document.querySelector('.quick-start-btn');
    if (quickStartBtn) {
        quickStartBtn.addEventListener('click', (e) => {
            // 클릭 효과
            quickStartBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                quickStartBtn.style.transform = '';
            }, 150);
        });
    }
    
    // 가이드 스텝 호버 효과
    const guideSteps = document.querySelectorAll('.guide-step');
    guideSteps.forEach(step => {
        step.addEventListener('mouseenter', () => {
            step.style.transform = 'translateX(8px)';
        });
        
        step.addEventListener('mouseleave', () => {
            step.style.transform = '';
        });
    });
    
    // 스크롤 애니메이션
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 애니메이션 대상 요소들
    const animateElements = document.querySelectorAll('.feature-card, .guide-step');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // 환영 카드 애니메이션
    const welcomeCard = document.querySelector('.welcome-card');
    if (welcomeCard) {
        setTimeout(() => {
            welcomeCard.style.opacity = '1';
            welcomeCard.style.transform = 'translateY(0)';
        }, 300);
    }
    
    // 터치 디바이스 최적화
    if (POKA.DeviceInfo.isMobile()) {
        // 터치 이벤트 최적화
        let touchStartY = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].clientY;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartY - touchEndY;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // 위로 스와이프 - 새로고침
                    console.log('Swipe up detected');
                } else {
                    // 아래로 스와이프
                    console.log('Swipe down detected');
                }
            }
        }
    }
    
    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'Enter':
                // Enter 키로 빠른 시작
                if (document.activeElement === quickStartBtn) {
                    quickStartBtn.click();
                }
                break;
            case '1':
                // 1번 키로 업로드 페이지
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    POKA.Navigation.navigateTo('upload.html');
                }
                break;
            case '2':
                // 2번 키로 갤러리 페이지
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    POKA.Navigation.navigateTo('gallery.html');
                }
                break;
        }
    });
    
    // 온라인/오프라인 상태 감지
    window.addEventListener('online', () => {
        POKA.Toast.success('인터넷 연결이 복구되었습니다', 2000);
    });
    
    window.addEventListener('offline', () => {
        POKA.Toast.warning('인터넷 연결이 끊어졌습니다', 3000);
    });
    
    // 앱 설치 프롬프트
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // 설치 버튼 표시 (선택사항)
        showInstallButton();
    });
    
    function showInstallButton() {
        // 설치 버튼을 동적으로 생성하여 표시
        const installBtn = document.createElement('button');
        installBtn.className = 'btn btn-primary';
        installBtn.innerHTML = '? 앱 설치하기';
        installBtn.style.position = 'fixed';
        installBtn.style.top = '20px';
        installBtn.style.right = '20px';
        installBtn.style.zIndex = '1000';
        
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                installBtn.remove();
            }
        });
        
        document.body.appendChild(installBtn);
        
        // 10초 후 자동 제거
        setTimeout(() => {
            if (installBtn.parentNode) {
                installBtn.remove();
            }
        }, 10000);
    }
    
    // 성능 모니터링
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
            }, 0);
        });
    }
    
    // 사용자 활동 추적
    let userActivity = {
        pageLoadTime: Date.now(),
        interactions: 0,
        scrollDepth: 0
    };
    
    // 사용자 상호작용 추적
    document.addEventListener('click', () => {
        userActivity.interactions++;
    });
    
    // 스크롤 깊이 추적
    window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        userActivity.scrollDepth = Math.max(userActivity.scrollDepth, scrollPercent);
    });
    
    // 페이지 떠날 때 데이터 저장
    window.addEventListener('beforeunload', () => {
        userActivity.sessionDuration = Date.now() - userActivity.pageLoadTime;
        POKA.AppState.saveToStorage('userActivity', userActivity);
    });
    
    // 디버그 모드 (개발 환경에서만)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Debug mode enabled');
        
        // 디버그 패널 생성
        const debugPanel = document.createElement('div');
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
            font-family: monospace;
        `;
        debugPanel.innerHTML = `
            <div>POKA V2 Debug</div>
            <div>Device: ${POKA.DeviceInfo.isMobile() ? 'Mobile' : 'Desktop'}</div>
            <div>User: ${POKA.AppState.user ? 'Logged in' : 'Guest'}</div>
            <div>Images: ${POKA.AppState.editedImages.length}</div>
        `;
        document.body.appendChild(debugPanel);
    }
}); 