// POKA V2 - 쿠폰 관리 JavaScript

// 쿠폰 관리 클래스
class CouponManager {
    constructor() {
        this.coupons = [];
        this.currentTab = 'available';
        this.init();
    }

    // 초기화
    init() {
        this.loadCoupons();
        this.setupEventListeners();
        this.renderCoupons();
        this.updateCouponCount();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 쿠폰 코드 입력 엔터키 처리
        const couponInput = document.getElementById('couponCode');
        if (couponInput) {
            couponInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.registerCoupon();
                }
            });
        }

        // 탭 버튼 이벤트
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    // 쿠폰 데이터 로드
    loadCoupons() {
        const savedCoupons = localStorage.getItem('poka_coupons');
        console.log('저장된 쿠폰 데이터:', savedCoupons);
        
        if (savedCoupons) {
            this.coupons = JSON.parse(savedCoupons);
            console.log('로드된 쿠폰 개수:', this.coupons.length);
            console.log('쿠폰 상태별 개수:', {
                available: this.coupons.filter(c => c.status === 'available').length,
                used: this.coupons.filter(c => c.status === 'used').length,
                expired: this.coupons.filter(c => c.status === 'expired').length
            });
        } else {
            // 개발 중 테스트를 위해 기존 데이터 초기화 (필요시 주석 해제)
            // localStorage.removeItem('poka_coupons');
            // this.coupons = [];
            // this.saveCoupons();
            // return;
            // 샘플 쿠폰 데이터 (테스트용)
            console.log('샘플 쿠폰 데이터 생성 중...');
            this.coupons = [
                // 사용 가능한 쿠폰 8개
                {
                    id: '1',
                    code: 'WELCOME10',
                    name: '신규 고객 할인',
                    discount: 300,
                    discountType: 'fixed',
                    minAmount: 3000,
                    expiryDate: '2025-12-31',
                    status: 'available',
                    registeredAt: '2024-01-15',
                    usedAt: null
                },
                {
                    id: '2',
                    code: 'SUMMER20',
                    name: '여름 특별 할인',
                    discount: 20,
                    discountType: 'percent',
                    minAmount: 5000,
                    expiryDate: '2025-08-31',
                    status: 'available',
                    registeredAt: '2024-06-01',
                    usedAt: null
                },
                {
                    id: '3',
                    code: 'FRIEND15',
                    name: '친구 추천 할인',
                    discount: 15,
                    discountType: 'percent',
                    minAmount: 3000,
                    expiryDate: '2025-12-31',
                    status: 'available',
                    registeredAt: '2024-03-01',
                    usedAt: null
                },
                {
                    id: '4',
                    code: 'HAPPY500',
                    name: '행복 쿠폰',
                    discount: 500,
                    discountType: 'fixed',
                    minAmount: 2000,
                    expiryDate: '2025-12-31',
                    status: 'available',
                    registeredAt: '2024-02-15',
                    usedAt: null
                },
                {
                    id: '5',
                    code: 'NEWYEAR30',
                    name: '새해 특별 할인',
                    discount: 30,
                    discountType: 'percent',
                    minAmount: 5000,
                    expiryDate: '2025-12-31',
                    status: 'available',
                    registeredAt: '2024-01-01',
                    usedAt: null
                },
                {
                    id: '6',
                    code: 'BIRTHDAY25',
                    name: '생일 축하 할인',
                    discount: 25,
                    discountType: 'percent',
                    minAmount: 3000,
                    expiryDate: '2025-12-31',
                    status: 'available',
                    registeredAt: '2024-04-15',
                    usedAt: null
                },
                {
                    id: '7',
                    code: 'VIP1000',
                    name: 'VIP 고객 할인',
                    discount: 1000,
                    discountType: 'fixed',
                    minAmount: 5000,
                    expiryDate: '2025-12-31',
                    status: 'available',
                    registeredAt: '2024-05-01',
                    usedAt: null
                },
                {
                    id: '8',
                    code: 'STUDENT25',
                    name: '학생 할인',
                    discount: 25,
                    discountType: 'percent',
                    minAmount: 2000,
                    expiryDate: '2025-12-31',
                    status: 'available',
                    registeredAt: '2024-05-01',
                    usedAt: null
                },
                // 사용 완료된 쿠폰 5개
                {
                    id: '9',
                    code: 'FIRSTORDER',
                    name: '첫 주문 할인',
                    discount: 1000,
                    discountType: 'fixed',
                    minAmount: 3000,
                    expiryDate: '2025-05-15',
                    status: 'used',
                    registeredAt: '2024-03-01',
                    usedAt: '2024-04-20'
                },
                {
                    id: '10',
                    code: 'SPRING15',
                    name: '봄맞이 할인',
                    discount: 15,
                    discountType: 'percent',
                    minAmount: 4000,
                    expiryDate: '2025-06-30',
                    status: 'used',
                    registeredAt: '2024-03-15',
                    usedAt: '2024-05-10'
                },
                {
                    id: '11',
                    code: 'WEEKEND20',
                    name: '주말 특별 할인',
                    discount: 20,
                    discountType: 'percent',
                    minAmount: 3000,
                    expiryDate: '2025-12-31',
                    status: 'used',
                    registeredAt: '2024-04-01',
                    usedAt: '2024-05-15'
                },
                {
                    id: '12',
                    code: 'MORNING300',
                    name: '아침 할인',
                    discount: 300,
                    discountType: 'fixed',
                    minAmount: 2000,
                    expiryDate: '2025-12-31',
                    status: 'used',
                    registeredAt: '2024-04-10',
                    usedAt: '2024-05-20'
                },
                {
                    id: '13',
                    code: 'EVENING500',
                    name: '저녁 할인',
                    discount: 500,
                    discountType: 'fixed',
                    minAmount: 3000,
                    expiryDate: '2025-12-31',
                    status: 'used',
                    registeredAt: '2024-04-15',
                    usedAt: '2024-05-25'
                },
                // 만료된 쿠폰 5개
                {
                    id: '14',
                    code: 'OLD2023',
                    name: '2023년 특별 할인',
                    discount: 1000,
                    discountType: 'fixed',
                    minAmount: 3000,
                    expiryDate: '2023-12-31',
                    status: 'expired',
                    registeredAt: '2023-10-01',
                    usedAt: null
                },
                {
                    id: '15',
                    code: 'WINTER2023',
                    name: '겨울 시즌 할인',
                    discount: 25,
                    discountType: 'percent',
                    minAmount: 4000,
                    expiryDate: '2023-02-28',
                    status: 'expired',
                    registeredAt: '2023-01-15',
                    usedAt: null
                },
                {
                    id: '16',
                    code: 'SPRING2023',
                    name: '봄 시즌 할인',
                    discount: 20,
                    discountType: 'percent',
                    minAmount: 3000,
                    expiryDate: '2023-05-31',
                    status: 'expired',
                    registeredAt: '2023-03-01',
                    usedAt: null
                },
                {
                    id: '17',
                    code: 'SUMMER2023',
                    name: '여름 시즌 할인',
                    discount: 30,
                    discountType: 'percent',
                    minAmount: 5000,
                    expiryDate: '2023-08-31',
                    status: 'expired',
                    registeredAt: '2023-06-01',
                    usedAt: null
                },
                {
                    id: '18',
                    code: 'AUTUMN2023',
                    name: '가을 시즌 할인',
                    discount: 15,
                    discountType: 'percent',
                    minAmount: 3000,
                    expiryDate: '2023-11-30',
                    status: 'expired',
                    registeredAt: '2023-09-01',
                    usedAt: null
                }
            ];
            console.log('생성된 샘플 쿠폰 개수:', this.coupons.length);
            this.saveCoupons();
        }
    }

    // 쿠폰 데이터 저장
    saveCoupons() {
        localStorage.setItem('poka_coupons', JSON.stringify(this.coupons));
    }

    // 쿠폰 등록
    registerCoupon() {
        const couponInput = document.getElementById('couponCode');
        const code = couponInput.value.trim().toUpperCase();

        if (!code) {
            this.showMessage('쿠폰 코드를 입력해주세요.', 'error');
            return;
        }

        // 이미 등록된 쿠폰인지 확인
        const existingCoupon = this.coupons.find(coupon => coupon.code === code);
        if (existingCoupon) {
            this.showMessage('이미 등록된 쿠폰입니다.', 'error');
            return;
        }

        // 쿠폰 유효성 검증 (실제로는 서버에서 검증)
        const validCoupons = {
            'WELCOME10': {
                name: '신규 고객 할인',
                discount: 300,
                discountType: 'fixed',
                minAmount: 3000,
                expiryDate: '2025-12-31'
            },
            'SUMMER20': {
                name: '여름 특별 할인',
                discount: 20,
                discountType: 'percent',
                minAmount: 5000,
                expiryDate: '2025-08-31'
            },
            'FRIEND15': {
                name: '친구 추천 할인',
                discount: 15,
                discountType: 'percent',
                minAmount: 3000,
                expiryDate: '2025-12-31'
            },
            'HAPPY500': {
                name: '행복 쿠폰',
                discount: 500,
                discountType: 'fixed',
                minAmount: 2000,
                expiryDate: '2025-12-31'
            },
            'NEWYEAR30': {
                name: '새해 특별 할인',
                discount: 30,
                discountType: 'percent',
                minAmount: 5000,
                expiryDate: '2025-12-31'
            },
            'BIRTHDAY25': {
                name: '생일 축하 할인',
                discount: 25,
                discountType: 'percent',
                minAmount: 3000,
                expiryDate: '2025-12-31'
            },
            'VIP1000': {
                name: 'VIP 고객 할인',
                discount: 1000,
                discountType: 'fixed',
                minAmount: 5000,
                expiryDate: '2025-12-31'
            },
            'STUDENT25': {
                name: '학생 할인',
                discount: 25,
                discountType: 'percent',
                minAmount: 2000,
                expiryDate: '2025-12-31'
            }
        };

        if (validCoupons[code]) {
            const couponData = validCoupons[code];
            const newCoupon = {
                id: Date.now().toString(),
                code: code,
                name: couponData.name,
                discount: couponData.discount,
                discountType: couponData.discountType,
                minAmount: couponData.minAmount,
                expiryDate: couponData.expiryDate,
                status: 'available',
                registeredAt: new Date().toISOString().split('T')[0],
                usedAt: null
            };

            this.coupons.push(newCoupon);
            this.saveCoupons();
            this.renderCoupons();
            this.updateCouponCount();
            
            couponInput.value = '';
            this.showMessage('쿠폰이 성공적으로 등록되었습니다!', 'success');
        } else {
            this.showMessage('유효하지 않은 쿠폰 코드입니다.', 'error');
        }
    }

    // 탭 전환
    switchTab(tab) {
        this.currentTab = tab;
        
        // 탭 버튼 활성화 상태 변경
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        this.renderCoupons();
    }

    // 쿠폰 목록 렌더링
    renderCoupons() {
        const couponList = document.getElementById('couponList');
        const emptyState = document.getElementById('emptyState');
        
        if (!couponList) return;

        // 현재 탭에 맞는 쿠폰 필터링
        const filteredCoupons = this.coupons.filter(coupon => {
            console.log(`쿠폰 ${coupon.code} 필터링:`, {
                status: coupon.status,
                isExpired: this.isExpired(coupon),
                currentTab: this.currentTab
            });
            
            if (this.currentTab === 'available') {
                const isAvailable = coupon.status === 'available' && !this.isExpired(coupon);
                console.log(`쿠폰 ${coupon.code} 사용가능 여부:`, isAvailable);
                return isAvailable;
            } else if (this.currentTab === 'used') {
                const isUsed = coupon.status === 'used';
                console.log(`쿠폰 ${coupon.code} 사용완료 여부:`, isUsed);
                return isUsed;
            } else if (this.currentTab === 'expired') {
                const isExpired = coupon.status === 'expired' || (coupon.status === 'available' && this.isExpired(coupon));
                console.log(`쿠폰 ${coupon.code} 만료 여부:`, isExpired);
                return isExpired;
            }
            return false;
        });

        console.log(`현재 탭: ${this.currentTab}, 필터링된 쿠폰 개수: ${filteredCoupons.length}`);
        console.log('필터링된 쿠폰들:', filteredCoupons);

        if (filteredCoupons.length === 0) {
            couponList.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        couponList.innerHTML = filteredCoupons.map(coupon => this.createCouponHTML(coupon)).join('');
    }

    // 쿠폰 HTML 생성
    createCouponHTML(coupon) {
        const isExpired = this.isExpired(coupon);
        const statusClass = coupon.status === 'used' ? 'used' : (isExpired ? 'expired' : 'available');
        const statusText = coupon.status === 'used' ? '사용 완료' : (isExpired ? '만료됨' : '사용 가능');
        const discountText = coupon.discountType === 'percent' ? `${coupon.discount}% 할인` : `${coupon.discount.toLocaleString()}원 할인`;
        
        return `
            <div class="coupon-item ${statusClass}" data-coupon-id="${coupon.id}">
                <div class="coupon-header">
                    <div class="coupon-info">
                        <div class="coupon-code">${coupon.code}</div>
                        <div class="coupon-name">${coupon.name}</div>
                    </div>
                    <div class="coupon-discount">${discountText}</div>
                </div>
                
                <div class="coupon-details">
                    <div class="coupon-expiry">
                        만료일: ${this.formatDate(coupon.expiryDate)}
                        ${coupon.minAmount > 0 ? `<br>최소 주문: ${coupon.minAmount.toLocaleString()}원` : ''}
                    </div>
                    <div class="coupon-status ${statusClass}">${statusText}</div>
                </div>
                
                ${this.createCouponActions(coupon)}
            </div>
        `;
    }

    // 쿠폰 액션 버튼 생성
    createCouponActions(coupon) {
        const isExpired = this.isExpired(coupon);
        
        if (coupon.status === 'used') {
            return `
                <div class="coupon-actions">
                    <button class="coupon-action-btn" onclick="couponManager.deleteCoupon('${coupon.id}')">
                        삭제
                    </button>
                </div>
            `;
        } else if (isExpired) {
            return `
                <div class="coupon-actions">
                    <button class="coupon-action-btn" onclick="couponManager.deleteCoupon('${coupon.id}')">
                        삭제
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="coupon-actions">
                    <button class="coupon-action-btn" onclick="couponManager.copyCouponCode('${coupon.code}')">
                        코드 복사
                    </button>
                    <button class="coupon-action-btn" onclick="couponManager.deleteCoupon('${coupon.id}')">
                        삭제
                    </button>
                </div>
            `;
        }
    }

    // 쿠폰 만료 확인
    isExpired(coupon) {
        const today = new Date();
        // 날짜만 비교하기 위해 시간을 제거
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const expiryDate = new Date(coupon.expiryDate);
        const expiryDateOnly = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
        
        const isExpired = todayDate > expiryDateOnly;
        console.log(`쿠폰 ${coupon.code} 만료 확인:`, {
            today: todayDate.toISOString(),
            expiryDate: expiryDateOnly.toISOString(),
            isExpired: isExpired
        });
        return isExpired;
    }

    // 쿠폰 개수 업데이트
    updateCouponCount() {
        const availableCount = this.coupons.filter(coupon => 
            coupon.status === 'available' && !this.isExpired(coupon)
        ).length;
        
        const countElement = document.getElementById('couponCount');
        if (countElement) {
            countElement.textContent = `${availableCount}개`;
        }
    }

    // 쿠폰 코드 복사
    copyCouponCode(code) {
        navigator.clipboard.writeText(code).then(() => {
            this.showMessage('쿠폰 코드가 클립보드에 복사되었습니다.', 'success');
        }).catch(() => {
            this.showMessage('쿠폰 코드 복사에 실패했습니다.', 'error');
        });
    }

    // 쿠폰 삭제
    deleteCoupon(couponId) {
        if (confirm('이 쿠폰을 삭제하시겠습니까?')) {
            this.coupons = this.coupons.filter(coupon => coupon.id !== couponId);
            this.saveCoupons();
            this.renderCoupons();
            this.updateCouponCount();
            this.showMessage('쿠폰이 삭제되었습니다.', 'success');
        }
    }

    // 날짜 포맷팅
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 메시지 표시
    showMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 새 메시지 생성
        const messageElement = document.createElement('div');
        messageElement.className = `message-toast ${type}`;
        messageElement.textContent = message;
        
        // 스타일 적용
        Object.assign(messageElement.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '1000',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });

        // 타입별 배경색 설정
        if (type === 'success') {
            messageElement.style.backgroundColor = '#28a745';
        } else if (type === 'error') {
            messageElement.style.backgroundColor = '#dc3545';
        } else {
            messageElement.style.backgroundColor = '#17a2b8';
        }

        document.body.appendChild(messageElement);

        // 애니메이션
        setTimeout(() => {
            messageElement.style.opacity = '1';
        }, 100);

        // 자동 제거
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 300);
        }, 3000);
    }

    // 쿠폰 사용 처리 (다른 페이지에서 호출)
    useCoupon(couponId) {
        const coupon = this.coupons.find(c => c.id === couponId);
        if (coupon && coupon.status === 'available' && !this.isExpired(coupon)) {
            coupon.status = 'used';
            coupon.usedAt = new Date().toISOString().split('T')[0];
            this.saveCoupons();
            return coupon;
        }
        return null;
    }

    // 사용 가능한 쿠폰 목록 반환
    getAvailableCoupons() {
        return this.coupons.filter(coupon => 
            coupon.status === 'available' && !this.isExpired(coupon)
        );
    }

    // 쿠폰 데이터 초기화 (개발용)
    resetCoupons() {
        console.log('쿠폰 데이터 초기화 시작...');
        localStorage.removeItem('poka_coupons');
        console.log('localStorage에서 poka_coupons 삭제됨');
        
        // 샘플 데이터로 다시 초기화
        this.coupons = [
            // 사용 가능한 쿠폰 8개
            {
                id: '1',
                code: 'WELCOME10',
                name: '신규 고객 할인',
                discount: 300,
                discountType: 'fixed',
                minAmount: 3000,
                expiryDate: '2025-12-31',
                status: 'available',
                registeredAt: '2024-01-15',
                usedAt: null
            },
            {
                id: '2',
                code: 'SUMMER20',
                name: '여름 특별 할인',
                discount: 20,
                discountType: 'percent',
                minAmount: 5000,
                expiryDate: '2025-08-31',
                status: 'available',
                registeredAt: '2024-06-01',
                usedAt: null
            },
            {
                id: '3',
                code: 'FRIEND15',
                name: '친구 추천 할인',
                discount: 15,
                discountType: 'percent',
                minAmount: 3000,
                expiryDate: '2025-12-31',
                status: 'available',
                registeredAt: '2024-03-01',
                usedAt: null
            },
            {
                id: '4',
                code: 'HAPPY500',
                name: '행복 쿠폰',
                discount: 500,
                discountType: 'fixed',
                minAmount: 2000,
                expiryDate: '2025-12-31',
                status: 'available',
                registeredAt: '2024-02-15',
                usedAt: null
            },
            {
                id: '5',
                code: 'NEWYEAR30',
                name: '새해 특별 할인',
                discount: 30,
                discountType: 'percent',
                minAmount: 5000,
                expiryDate: '2025-12-31',
                status: 'available',
                registeredAt: '2024-01-01',
                usedAt: null
            },
            {
                id: '6',
                code: 'BIRTHDAY25',
                name: '생일 축하 할인',
                discount: 25,
                discountType: 'percent',
                minAmount: 3000,
                expiryDate: '2025-12-31',
                status: 'available',
                registeredAt: '2024-04-15',
                usedAt: null
            },
            {
                id: '7',
                code: 'VIP1000',
                name: 'VIP 고객 할인',
                discount: 1000,
                discountType: 'fixed',
                minAmount: 5000,
                expiryDate: '2025-12-31',
                status: 'available',
                registeredAt: '2024-05-01',
                usedAt: null
            },
            {
                id: '8',
                code: 'STUDENT25',
                name: '학생 할인',
                discount: 25,
                discountType: 'percent',
                minAmount: 2000,
                expiryDate: '2025-12-31',
                status: 'available',
                registeredAt: '2024-05-01',
                usedAt: null
            },
            // 사용 완료된 쿠폰 5개
            {
                id: '9',
                code: 'FIRSTORDER',
                name: '첫 주문 할인',
                discount: 1000,
                discountType: 'fixed',
                minAmount: 3000,
                expiryDate: '2025-05-15',
                status: 'used',
                registeredAt: '2024-03-01',
                usedAt: '2024-04-20'
            },
            {
                id: '10',
                code: 'SPRING15',
                name: '봄맞이 할인',
                discount: 15,
                discountType: 'percent',
                minAmount: 4000,
                expiryDate: '2025-06-30',
                status: 'used',
                registeredAt: '2024-03-15',
                usedAt: '2024-05-10'
            },
            {
                id: '11',
                code: 'WEEKEND20',
                name: '주말 특별 할인',
                discount: 20,
                discountType: 'percent',
                minAmount: 3000,
                expiryDate: '2025-12-31',
                status: 'used',
                registeredAt: '2024-04-01',
                usedAt: '2024-05-15'
            },
            {
                id: '12',
                code: 'MORNING300',
                name: '아침 할인',
                discount: 300,
                discountType: 'fixed',
                minAmount: 2000,
                expiryDate: '2025-12-31',
                status: 'used',
                registeredAt: '2024-04-10',
                usedAt: '2024-05-20'
            },
            {
                id: '13',
                code: 'EVENING500',
                name: '저녁 할인',
                discount: 500,
                discountType: 'fixed',
                minAmount: 3000,
                expiryDate: '2025-12-31',
                status: 'used',
                registeredAt: '2024-04-15',
                usedAt: '2024-05-25'
            },
            // 만료된 쿠폰 5개
            {
                id: '14',
                code: 'OLD2023',
                name: '2023년 특별 할인',
                discount: 1000,
                discountType: 'fixed',
                minAmount: 3000,
                expiryDate: '2023-12-31',
                status: 'expired',
                registeredAt: '2023-10-01',
                usedAt: null
            },
            {
                id: '15',
                code: 'WINTER2023',
                name: '겨울 시즌 할인',
                discount: 25,
                discountType: 'percent',
                minAmount: 4000,
                expiryDate: '2023-02-28',
                status: 'expired',
                registeredAt: '2023-01-15',
                usedAt: null
            },
            {
                id: '16',
                code: 'SPRING2023',
                name: '봄 시즌 할인',
                discount: 20,
                discountType: 'percent',
                minAmount: 3000,
                expiryDate: '2023-05-31',
                status: 'expired',
                registeredAt: '2023-03-01',
                usedAt: null
            },
            {
                id: '17',
                code: 'SUMMER2023',
                name: '여름 시즌 할인',
                discount: 30,
                discountType: 'percent',
                minAmount: 5000,
                expiryDate: '2023-08-31',
                status: 'expired',
                registeredAt: '2023-06-01',
                usedAt: null
            },
            {
                id: '18',
                code: 'AUTUMN2023',
                name: '가을 시즌 할인',
                discount: 15,
                discountType: 'percent',
                minAmount: 3000,
                expiryDate: '2023-11-30',
                status: 'expired',
                registeredAt: '2023-09-01',
                usedAt: null
            }
        ];
        
        console.log('샘플 데이터로 초기화 완료, 쿠폰 개수:', this.coupons.length);
        this.saveCoupons();
        this.renderCoupons();
        this.updateCouponCount();
        this.showMessage('쿠폰 데이터가 초기화되었습니다.', 'success');
    }
}

// 전역 함수들
function goBack() {
    window.history.back();
}

function showCouponInfo() {
    alert(`💡 쿠폰 사용 가이드

🎫 쿠폰 등록
- 쿠폰 코드를 입력하여 등록하세요
- 등록된 쿠폰은 자동으로 저장됩니다

📱 쿠폰 사용
- 포토카드 인쇄 시 쿠폰을 선택할 수 있습니다
- 인쇄 시 자동으로 할인이 적용됩니다

🎫 사용 가능한 쿠폰
- WELCOME10: 신규 고객 300원 할인
- SUMMER20: 여름 특별 20% 할인
- FRIEND15: 친구 추천 15% 할인
- HAPPY500: 행복 쿠폰 500원 할인
- NEWYEAR30: 새해 특별 30% 할인
- BIRTHDAY25: 생일 축하 25% 할인
- VIP1000: VIP 고객 1000원 할인
- NEWUSER10: 신규 사용자 10% 할인
- SPRING15: 봄맞이 15% 할인
- WEEKEND20: 주말 특별 20% 할인
- MORNING300: 아침 300원 할인
- EVENING500: 저녁 500원 할인
- STUDENT25: 학생 25% 할인
- SENIOR30: 시니어 30% 할인
- FAMILY40: 가족 40% 할인
- LOYALTY800: 충성 고객 800원 할인
- FLASH50: 플래시 세일 50% 할인
- HOLIDAY1000: 휴일 특별 1000원 할인

⚠️ 주의사항
- 쿠폰은 1회만 사용 가능합니다
- 만료일이 지난 쿠폰은 사용할 수 없습니다
- 최소 주문 금액을 확인해주세요`);
}

function registerCoupon() {
    couponManager.registerCoupon();
}

function switchTab(tab) {
    couponManager.switchTab(tab);
}

// 쿠폰 데이터 초기화 (개발용)
function resetCouponData() {
    if (couponManager) {
        couponManager.resetCoupons();
    }
}

// 페이지 로드 시 초기화
let couponManager;

document.addEventListener('DOMContentLoaded', () => {
    couponManager = new CouponManager();
    
    // 다크모드 적용
    if (window.darkModeManager) {
        window.darkModeManager.applyDarkMode();
    }
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    // 필요한 정리 작업
}); 