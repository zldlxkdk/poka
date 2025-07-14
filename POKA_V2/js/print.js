// POKA V2 - 포토카드 인쇄 페이지 JavaScript

// 전역 변수
let currentPhotoCard = null;
let appliedCoupon = null;
let qrStream = null;
let qrScanning = false;
let printStatus = 'idle'; // idle, scanning, processing, success, error

// 가격 설정
const BASE_PRICE = 3000;

// 사용자 쿠폰 데이터를 로컬 스토리지에서 가져오는 함수
function getUserCoupons() {
    try {
        const savedCoupons = localStorage.getItem('poka_coupons');
        if (savedCoupons) {
            const coupons = JSON.parse(savedCoupons);
            // 사용 가능한 쿠폰만 필터링 (만료되지 않고 사용되지 않은 쿠폰)
            return coupons.filter(coupon => 
                coupon.status === 'available' && !isCouponExpired(coupon)
            );
        }
    } catch (error) {
        console.error('쿠폰 데이터 로드 오류:', error);
    }
    return [];
}

// 쿠폰 만료 확인 함수
function isCouponExpired(coupon) {
    if (!coupon.expiryDate) return false;
    const expiryDate = new Date(coupon.expiryDate);
    const currentDate = new Date();
    return currentDate > expiryDate;
}

// 쿠폰 사용 처리 함수
function markCouponAsUsed(couponId) {
    try {
        const savedCoupons = localStorage.getItem('poka_coupons');
        if (savedCoupons) {
            const coupons = JSON.parse(savedCoupons);
            const couponIndex = coupons.findIndex(coupon => coupon.id === couponId);
            
            if (couponIndex !== -1) {
                coupons[couponIndex].status = 'used';
                coupons[couponIndex].usedAt = new Date().toISOString().split('T')[0];
                localStorage.setItem('poka_coupons', JSON.stringify(coupons));
                
                console.log('쿠폰 사용 처리 완료:', couponId);
                POKA.Toast.success('쿠폰이 사용되었습니다');
            }
        }
    } catch (error) {
        console.error('쿠폰 사용 처리 오류:', error);
    }
}

// 로그인 상태 확인
function checkLoginStatus() {
    try {
        if (typeof POKA !== 'undefined' && POKA.AppState) {
            const userProfile = POKA.AppState.getFromStorage('userProfile');
            return !!(userProfile && userProfile.isLoggedIn);
        }
    } catch (error) {
        console.error('로그인 상태 확인 오류:', error);
    }
    return false;
}

// 쿠폰 섹션 UI 업데이트
function updateCouponSectionUI() {
    const isLoggedIn = checkLoginStatus();
    const couponSelection = document.querySelector('.coupon-selection');
    const loginNotice = document.getElementById('loginNotice');
    
    if (isLoggedIn) {
        // 로그인된 경우: 쿠폰 선택 버튼 표시, 로그인 안내 숨김
        if (couponSelection) {
            couponSelection.style.display = 'block';
        }
        if (loginNotice) {
            loginNotice.style.display = 'none';
        }
    } else {
        // 로그인되지 않은 경우: 쿠폰 선택 버튼 숨김, 로그인 안내 표시
        if (couponSelection) {
            couponSelection.style.display = 'none';
        }
        if (loginNotice) {
            loginNotice.style.display = 'block';
        }
    }
}

// 프로필로 이동
function goToProfile() {
    if (typeof POKA !== 'undefined' && POKA.Navigation) {
        POKA.Navigation.navigateTo('profile.html');
    } else {
        window.location.href = 'profile.html';
    }
}

// 페이지 초기화
function initializePrintPage() {
    console.log('포토카드 인쇄 페이지 초기화 시작');
    
    // URL 파라미터에서 포토카드 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const photoCardId = urlParams.get('id');
    
    if (photoCardId) {
        loadPhotoCard(photoCardId);
    } else {
        // 세션 스토리지에서 포토카드 데이터 가져오기
        loadPhotoCardFromSession();
    }
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 가격 초기화
    updatePriceDisplay();
    
    // 쿠폰 섹션 UI 업데이트
    updateCouponSectionUI();
    
    console.log('포토카드 인쇄 페이지 초기화 완료');
}

// 포토카드 로드 (ID로)
function loadPhotoCard(photoCardId) {
    console.log('포토카드 로드 시도:', photoCardId);
    
    try {
        // 로컬 스토리지에서 포토카드 데이터 가져오기
        const photoCards = JSON.parse(localStorage.getItem('photoCards') || '[]');
        const photoCard = photoCards.find(card => card.id === photoCardId);
        
        if (photoCard) {
            currentPhotoCard = photoCard;
            displayPhotoCard();
            console.log('포토카드 로드 성공:', photoCard.name);
        } else {
            console.error('포토카드를 찾을 수 없음:', photoCardId);
            POKA.Toast.error('포토카드를 찾을 수 없습니다');
            POKA.Navigation.goBack();
        }
    } catch (error) {
        console.error('포토카드 로드 오류:', error);
        POKA.Toast.error('포토카드 로드에 실패했습니다');
        POKA.Navigation.goBack();
    }
}

// 세션에서 포토카드 로드
function loadPhotoCardFromSession() {
    console.log('세션에서 포토카드 로드 시도');
    
    try {
        if (typeof POKA !== 'undefined' && POKA.AppState) {
            const sessionPhotoCard = POKA.AppState.getFromStorage('printPhotoCard');
            if (sessionPhotoCard) {
                currentPhotoCard = sessionPhotoCard;
                displayPhotoCard();
                console.log('세션에서 포토카드 로드 성공:', sessionPhotoCard.name);
                return;
            }
        }
        
        // 로컬 스토리지에서 최근 포토카드 가져오기
        const photoCards = JSON.parse(localStorage.getItem('photoCards') || '[]');
        if (photoCards.length > 0) {
            currentPhotoCard = photoCards[photoCards.length - 1];
            displayPhotoCard();
            console.log('최근 포토카드 로드 성공:', currentPhotoCard.name);
        } else {
            console.error('포토카드가 없음');
            POKA.Toast.error('인쇄할 포토카드가 없습니다');
            POKA.Navigation.goBack();
        }
    } catch (error) {
        console.error('세션에서 포토카드 로드 오류:', error);
        POKA.Toast.error('포토카드 로드에 실패했습니다');
        POKA.Navigation.goBack();
    }
}

// 포토카드 표시
function displayPhotoCard() {
    if (!currentPhotoCard) {
        console.error('표시할 포토카드가 없음');
        return;
    }
    
    console.log('포토카드 표시:', currentPhotoCard.name);
    
    // 앞면 이미지
    const frontImage = document.getElementById('previewFrontImage');
    if (frontImage && currentPhotoCard.frontImage) {
        frontImage.src = currentPhotoCard.frontImage;
        frontImage.style.display = 'block';
    }
    
    // 뒷면 이미지
    const backImage = document.getElementById('previewBackImage');
    if (backImage && currentPhotoCard.backImage) {
        backImage.src = currentPhotoCard.backImage;
        backImage.style.display = 'block';
    }
    
    // 포토카드 이름
    const cardName = document.getElementById('previewCardName');
    if (cardName) {
        cardName.textContent = currentPhotoCard.name || '포토카드';
    }
    
    // 카드 회전 애니메이션 시작
    startCardRotation();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 카드 클릭 시 회전 애니메이션 토글
    const cardContainer = document.querySelector('.card-container');
    if (cardContainer) {
        cardContainer.addEventListener('click', function() {
            toggleCardRotation();
        });
    }
    
    // 쿠폰 검색 입력 이벤트
    const couponSearchInput = document.getElementById('couponSearchInput');
    if (couponSearchInput) {
        couponSearchInput.addEventListener('input', function() {
            filterCoupons(this.value);
        });
    }
}

// 카드 회전 애니메이션 시작
function startCardRotation() {
    const cardContainer = document.querySelector('.card-container');
    if (cardContainer) {
        setTimeout(() => {
            cardContainer.classList.add('rotating');
        }, 1000);
    }
}

// 카드 회전 애니메이션 토글
function toggleCardRotation() {
    const cardContainer = document.querySelector('.card-container');
    if (cardContainer) {
        if (cardContainer.classList.contains('rotating')) {
            cardContainer.classList.remove('rotating');
        } else {
            cardContainer.classList.add('rotating');
        }
    }
}

// 쿠폰 리스트 열기
function openCouponList() {
    console.log('쿠폰 리스트 열기');
    
    const couponModal = document.getElementById('couponModal');
    if (couponModal) {
        couponModal.style.display = 'flex';
        loadCouponList();
    }
}

// 쿠폰 리스트 닫기
function closeCouponModal() {
    const couponModal = document.getElementById('couponModal');
    if (couponModal) {
        couponModal.style.display = 'none';
        
        // 검색 입력 초기화
        const searchInput = document.getElementById('couponSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
    }
}

// 쿠폰 리스트 로드
function loadCouponList() {
    console.log('쿠폰 리스트 로드');
    
    const couponList = document.getElementById('couponList');
    const emptyCoupons = document.getElementById('emptyCoupons');
    
    if (!couponList || !emptyCoupons) return;
    
    // 로컬 스토리지에서 사용 가능한 쿠폰 가져오기
    const availableCoupons = getUserCoupons();
    
    if (availableCoupons.length === 0) {
        couponList.style.display = 'none';
        emptyCoupons.style.display = 'block';
        return;
    }
    
    couponList.style.display = 'flex';
    emptyCoupons.style.display = 'none';
    
    // 쿠폰 리스트 렌더링
    couponList.innerHTML = availableCoupons.map(coupon => `
        <div class="coupon-item" onclick="selectCoupon('${coupon.id}')">
            <div class="coupon-item-info">
                <div class="coupon-item-name">${coupon.name}</div>
                <div class="coupon-item-desc">쿠폰 코드: ${coupon.code}</div>
            </div>
            <div class="coupon-item-discount">
                ${coupon.discountType === 'percent' ? `${coupon.discount}%` : `₩${coupon.discount.toLocaleString()}`}
            </div>
        </div>
    `).join('');
}

// 쿠폰 검색
function filterCoupons(searchTerm) {
    console.log('쿠폰 검색:', searchTerm);
    
    const couponItems = document.querySelectorAll('.coupon-item');
    const emptyCoupons = document.getElementById('emptyCoupons');
    const couponList = document.getElementById('couponList');
    
    let visibleCount = 0;
    
    couponItems.forEach(item => {
        const couponName = item.querySelector('.coupon-item-name').textContent.toLowerCase();
        const couponDesc = item.querySelector('.coupon-item-desc').textContent.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        if (couponName.includes(searchLower) || couponDesc.includes(searchLower)) {
            item.style.display = 'flex';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    if (visibleCount === 0) {
        emptyCoupons.style.display = 'block';
        emptyCoupons.innerHTML = `
            <div class="empty-icon">🔍</div>
            <p>"${searchTerm}"에 대한 쿠폰을 찾을 수 없습니다</p>
        `;
    } else {
        emptyCoupons.style.display = 'none';
    }
}

// 쿠폰 선택
function selectCoupon(couponId) {
    console.log('쿠폰 선택:', couponId);
    
    const availableCoupons = getUserCoupons();
    const selectedCoupon = availableCoupons.find(coupon => coupon.id === couponId);
    
    if (selectedCoupon) {
        appliedCoupon = selectedCoupon;
        
        displayCouponStatus();
        updatePriceDisplay();
        closeCouponModal();
        
        POKA.Toast.success('쿠폰이 적용되었습니다');
        console.log('쿠폰 적용 성공:', appliedCoupon);
    } else {
        POKA.Toast.error('쿠폰을 찾을 수 없습니다');
    }
}

// 쿠폰 제거
function removeCoupon() {
    appliedCoupon = null;
    hideCouponStatus();
    updatePriceDisplay();
    
    POKA.Toast.success('쿠폰이 제거되었습니다');
    console.log('쿠폰 제거됨');
}

// 쿠폰 상태 표시
function displayCouponStatus() {
    const couponStatus = document.getElementById('couponStatus');
    const appliedCouponName = document.getElementById('appliedCouponName');
    const couponDiscount = document.getElementById('couponDiscount');
    
    if (couponStatus && appliedCouponName && couponDiscount) {
        appliedCouponName.textContent = appliedCoupon.name;
        
        if (appliedCoupon.discountType === 'percent') {
            couponDiscount.textContent = `${appliedCoupon.discount}% 할인`;
        } else {
            couponDiscount.textContent = `₩${appliedCoupon.discount.toLocaleString()} 할인`;
        }
        
        couponStatus.style.display = 'flex';
    }
}

// 쿠폰 상태 숨기기
function hideCouponStatus() {
    const couponStatus = document.getElementById('couponStatus');
    if (couponStatus) {
        couponStatus.style.display = 'none';
    }
}

// 가격 표시 업데이트
function updatePriceDisplay() {
    const basePriceElement = document.getElementById('basePrice');
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    const totalPrice = document.getElementById('totalPrice');
    
    let finalPrice = BASE_PRICE;
    let discountValue = 0;
    
    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'percent') {
            discountValue = Math.floor(BASE_PRICE * (appliedCoupon.discount / 100));
        } else {
            discountValue = appliedCoupon.discount;
        }
        finalPrice = Math.max(0, BASE_PRICE - discountValue);
    }
    
    // 기본 가격 표시
    if (basePriceElement) {
        basePriceElement.textContent = `₩${BASE_PRICE.toLocaleString()}`;
    }
    
    // 할인 행 표시/숨기기
    if (discountRow) {
        if (appliedCoupon) {
            discountRow.style.display = 'flex';
            if (discountAmount) {
                discountAmount.textContent = `-₩${discountValue.toLocaleString()}`;
            }
        } else {
            discountRow.style.display = 'none';
        }
    }
    
    // 총 금액 표시
    if (totalPrice) {
        totalPrice.textContent = `₩${finalPrice.toLocaleString()}`;
    }
    
    console.log('가격 업데이트:', { basePrice: BASE_PRICE, discount: discountValue, finalPrice });
}

// QR코드 스캔 시작
async function startQRScan() {
    console.log('QR코드 스캔 시작');
    
    if (qrScanning) {
        console.log('이미 스캔 중입니다');
        return;
    }
    
    try {
        // 카메라 권한 요청
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        qrStream = stream;
        qrScanning = true;
        
        // 비디오 요소 설정
        const video = document.getElementById('qrVideo');
        const cameraContainer = document.getElementById('qrCameraContainer');
        const startBtn = document.getElementById('startQRBtn');
        const stopBtn = document.getElementById('stopQRBtn');
        
        if (video && cameraContainer && startBtn && stopBtn) {
            video.srcObject = stream;
            cameraContainer.style.display = 'block';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            
            // QR코드 스캔 시작
            startQRCodeDetection();
        }
        
        POKA.Toast.success('QR코드 스캔이 시작되었습니다');
        console.log('QR코드 스캔 시작 성공');
        
    } catch (error) {
        console.error('QR코드 스캔 시작 실패:', error);
        POKA.Toast.error('카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.');
    }
}

// QR코드 스캔 중지
function stopQRScan() {
    console.log('QR코드 스캔 중지');
    
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
    
    qrScanning = false;
    
    // UI 복원
    const cameraContainer = document.getElementById('qrCameraContainer');
    const startBtn = document.getElementById('startQRBtn');
    const stopBtn = document.getElementById('stopQRBtn');
    
    if (cameraContainer && startBtn && stopBtn) {
        cameraContainer.style.display = 'none';
        startBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
    }
    
    POKA.Toast.success('QR코드 스캔이 중지되었습니다');
    console.log('QR코드 스캔 중지 완료');
}

// QR코드 감지 시작
function startQRCodeDetection() {
    if (!qrScanning) return;
    
    const video = document.getElementById('qrVideo');
    const canvas = document.getElementById('qrCanvas');
    
    if (!video || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    function scanFrame() {
        if (!qrScanning) return;
        
        try {
            // 비디오 프레임을 캔버스에 그리기
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            // QR코드 감지 (간단한 이미지 데이터 분석)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = detectQRCode(imageData);
            
            if (qrCode) {
                console.log('QR코드 감지됨:', qrCode);
                stopQRScan();
                showQRResult(qrCode);
                return;
            }
            
            // 다음 프레임 스캔
            requestAnimationFrame(scanFrame);
            
        } catch (error) {
            console.error('QR코드 스캔 오류:', error);
            requestAnimationFrame(scanFrame);
        }
    }
    
    // 비디오 로드 완료 후 스캔 시작
    video.addEventListener('loadeddata', () => {
        scanFrame();
    });
}

// QR코드 감지 (시뮬레이션)
function detectQRCode(imageData) {
    // 실제 QR코드 감지 라이브러리를 사용해야 하지만, 
    // 여기서는 시뮬레이션으로 키오스크 QR코드를 감지
    const data = imageData.data;
    const length = data.length;
    
    // 간단한 패턴 매칭 (실제로는 QR코드 라이브러리 사용)
    // 여기서는 랜덤하게 키오스크 QR코드를 감지하는 것으로 시뮬레이션
    if (Math.random() < 0.01) { // 1% 확률로 감지
        return {
            type: 'kiosk',
            id: 'KIOSK_' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            location: '1층 로비',
            status: 'ready'
        };
    }
    
    return null;
}

// QR코드 결과 표시
function showQRResult(qrData) {
    console.log('QR코드 결과 표시:', qrData);
    
    const qrResult = document.getElementById('qrResult');
    const qrModal = document.getElementById('qrModal');
    
    if (qrResult && qrModal) {
        if (qrData.type === 'kiosk') {
            qrResult.innerHTML = `
                <div class="qr-success">
                    <div class="qr-icon">✅</div>
                    <h4>키오스크 연결 성공</h4>
                    <p><strong>키오스크 ID:</strong> ${qrData.id}</p>
                    <p><strong>위치:</strong> ${qrData.location}</p>
                    <p><strong>상태:</strong> ${qrData.status === 'ready' ? '인쇄 준비 완료' : '사용 불가'}</p>
                </div>
            `;
            
            // 키오스크 상태에 따라 전송 버튼 활성화/비활성화
            const sendButton = qrModal.querySelector('[onclick="sendToKiosk()"]');
            if (sendButton) {
                if (qrData.status === 'ready') {
                    sendButton.disabled = false;
                    sendButton.textContent = '키오스크로 전송';
                } else {
                    sendButton.disabled = true;
                    sendButton.textContent = '키오스크 사용 불가';
                }
            }
        } else {
            qrResult.innerHTML = `
                <div class="qr-error">
                    <div class="qr-icon">❌</div>
                    <h4>유효하지 않은 QR코드</h4>
                    <p>키오스크의 QR코드를 다시 촬영해주세요.</p>
                </div>
            `;
        }
        
        qrModal.style.display = 'flex';
    }
}

// QR코드 모달 닫기
function closeQRModal() {
    const qrModal = document.getElementById('qrModal');
    if (qrModal) {
        qrModal.style.display = 'none';
    }
}

// 키오스크로 전송
async function sendToKiosk() {
    console.log('키오스크로 전송 시작');
    
    if (!currentPhotoCard) {
        POKA.Toast.error('전송할 포토카드가 없습니다');
        return;
    }
    
    // 인쇄 상태 섹션 표시
    showPrintStatus();
    
    try {
        // 인쇄 데이터 준비
        const printData = {
            photoCard: {
                id: currentPhotoCard.id,
                name: currentPhotoCard.name,
                frontImage: currentPhotoCard.frontImage,
                backImage: currentPhotoCard.backImage,
                createdAt: currentPhotoCard.createdAt
            },
            coupon: appliedCoupon,
            price: {
                base: BASE_PRICE,
                discount: appliedCoupon ? (appliedCoupon.discountType === 'percent' ? 
                    Math.floor(BASE_PRICE * (appliedCoupon.discount / 100)) : 
                    appliedCoupon.discount) : 0,
                total: calculateTotalPrice()
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('인쇄 데이터:', printData);
        
        // 진행 상태 업데이트
        updatePrintProgress(25, '포토카드 데이터 준비 중...');
        
        // 키오스크로 데이터 전송 (시뮬레이션)
        await simulateKioskTransfer(printData);
        
        // 진행 상태 업데이트
        updatePrintProgress(75, '키오스크에서 인쇄 준비 중...');
        
        // 인쇄 완료 시뮬레이션
        await simulatePrinting();
        
        // 쿠폰 사용 처리
        if (appliedCoupon) {
            markCouponAsUsed(appliedCoupon.id);
        }
        
        // 완료 상태
        updatePrintProgress(100, '인쇄 완료!');
        showPrintSuccess();
        
        console.log('키오스크 전송 및 인쇄 완료');
        
    } catch (error) {
        console.error('키오스크 전송 실패:', error);
        showPrintError('키오스크 연결에 실패했습니다');
    }
}

// 인쇄 상태 표시
function showPrintStatus() {
    const printStatusSection = document.getElementById('printStatusSection');
    if (printStatusSection) {
        printStatusSection.style.display = 'block';
    }
    
    // 다른 섹션들 숨기기
    const sectionsToHide = [
        'preview-section',
        'coupon-section', 
        'price-section',
        'qr-section',
        'actions-section'
    ];
    
    sectionsToHide.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
    });
}

// 인쇄 진행률 업데이트
function updatePrintProgress(percentage, message) {
    const progressFill = document.getElementById('progressFill');
    const statusMessage = document.getElementById('statusMessage');
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    if (statusMessage) {
        statusMessage.textContent = message;
    }
    
    console.log(`인쇄 진행률: ${percentage}% - ${message}`);
}

// 인쇄 성공 표시
function showPrintSuccess() {
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    
    if (statusIcon) {
        statusIcon.textContent = '✅';
        statusIcon.style.animation = 'none';
    }
    
    if (statusTitle) {
        statusTitle.textContent = '인쇄 완료!';
    }
    
    POKA.Toast.success('포토카드 인쇄가 완료되었습니다!');
    
    // 3초 후 갤러리로 이동
    setTimeout(() => {
        POKA.Navigation.navigateTo('gallery.html');
    }, 3000);
}

// 인쇄 오류 표시
function showPrintError(message) {
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusMessage = document.getElementById('statusMessage');
    
    if (statusIcon) {
        statusIcon.textContent = '❌';
        statusIcon.style.animation = 'none';
    }
    
    if (statusTitle) {
        statusTitle.textContent = '인쇄 실패';
    }
    
    if (statusMessage) {
        statusMessage.textContent = message;
    }
    
    POKA.Toast.error(message);
    
    // 3초 후 상태 섹션 숨기기
    setTimeout(() => {
        const printStatusSection = document.getElementById('printStatusSection');
        if (printStatusSection) {
            printStatusSection.style.display = 'none';
        }
        
        // 다른 섹션들 다시 표시
        const sectionsToShow = [
            'preview-section',
            'coupon-section', 
            'price-section',
            'qr-section',
            'actions-section'
        ];
        
        sectionsToShow.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'block';
            }
        });
    }, 3000);
}

// 키오스크 전송 시뮬레이션
function simulateKioskTransfer(printData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // 90% 확률로 성공
            if (Math.random() < 0.9) {
                console.log('키오스크 전송 성공:', printData);
                resolve();
            } else {
                console.log('키오스크 전송 실패');
                reject(new Error('키오스크 연결 실패'));
            }
        }, 2000);
    });
}

// 인쇄 시뮬레이션
function simulatePrinting() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('인쇄 완료');
            resolve();
        }, 1500);
    });
}

// 총 가격 계산
function calculateTotalPrice() {
    let total = BASE_PRICE;
    
    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'percent') {
            total -= Math.floor(BASE_PRICE * (appliedCoupon.discount / 100));
        } else {
            total -= appliedCoupon.discount;
        }
    }
    
    return Math.max(0, total);
}

// 인쇄 확인
function confirmPrint() {
    if (!currentPhotoCard) {
        POKA.Toast.error('인쇄할 포토카드가 없습니다');
        return;
    }
    
    const totalPrice = calculateTotalPrice();
    
    const message = `포토카드 "${currentPhotoCard.name}"을(를) 인쇄하시겠습니까?\n\n` +
                   `총 금액: ₩${totalPrice.toLocaleString()}` +
                   (appliedCoupon ? `\n적용된 쿠폰: ${appliedCoupon.name}` : '');
    
    if (confirm(message)) {
        // QR코드 스캔으로 진행
        startQRScan();
    }
}

// 페이지 떠날 때 정리
window.addEventListener('beforeunload', () => {
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
    }
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'Escape':
            if (qrScanning) {
                stopQRScan();
            } else if (document.getElementById('qrModal').style.display === 'flex') {
                closeQRModal();
            } else if (document.getElementById('couponModal').style.display === 'flex') {
                closeCouponModal();
            }
            break;
        case 'Enter':
            const couponSearchInput = document.getElementById('couponSearchInput');
            if (document.activeElement === couponSearchInput) {
                // 검색 결과가 있으면 첫 번째 쿠폰 선택
                const firstCoupon = document.querySelector('.coupon-item');
                if (firstCoupon) {
                    const couponId = firstCoupon.getAttribute('onclick').match(/'([^']+)'/)[1];
                    selectCoupon(couponId);
                }
            }
            break;
    }
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
    POKA.Toast.success('인터넷 연결이 복구되었습니다');
});

window.addEventListener('offline', () => {
    POKA.Toast.warning('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.');
}); 