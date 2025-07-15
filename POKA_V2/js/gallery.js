// POKA V2 - 갤러리 페이지 JavaScript

// 전역 변수
let allImages = []; // 업로드된 원본 이미지들
let photoCards = []; // 포토카드들 (앞면+뒷면 조합)
let filteredPhotoCards = []; // 필터링된 포토카드들
let currentFilter = 'all';
let currentSearch = '';
let isListView = false;
let currentModalPhotoCard = null;

// DOM 요소들
const galleryContainer = document.getElementById('galleryContainer');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const searchInput = document.getElementById('searchInput');
const imageCount = document.getElementById('imageCount');
const imageModal = document.getElementById('imageModal');

document.addEventListener('DOMContentLoaded', () => {
    console.log('POKA V2 Gallery page loaded');
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 포토카드 로드
    loadPhotoCards();
    
    // 검색 입력 이벤트
    searchInput.addEventListener('input', debounce(performSearch, 300));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 페이지 포커스 시 포토카드 다시 로드 (편집 후 갤러리로 돌아왔을 때)
    window.addEventListener('focus', () => {
        console.log('갤러리 페이지 포커스 - 포토카드 다시 로드');
        loadPhotoCards();
    });
    
    // 페이지 가시성 변경 시에도 로드
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('갤러리 페이지 가시성 변경 - 포토카드 다시 로드');
            loadPhotoCards();
        }
    });
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 필터 태그 클릭 이벤트
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const filter = tag.dataset.filter;
            setActiveFilter(filter);
        });
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePhotoCardModal();
        }
    });
}

// 포토카드 로드
function loadPhotoCards() {
    loadingState.style.display = 'block';
    galleryContainer.style.display = 'none';
    emptyState.style.display = 'none';
    
    // localStorage에서 포토카드 데이터 확인
    const savedPhotoCards = JSON.parse(localStorage.getItem('photoCards') || '[]');
    const savedGallery = JSON.parse(localStorage.getItem('gallery') || '[]');

    // 포토카드 타입인 것들만 필터링
    const photoCardItems = savedGallery.filter(item => item.type === 'photoCard');
    
    // 두 배열을 합치고 중복 제거
    const allPhotoCards = [...savedPhotoCards, ...photoCardItems];
    const uniquePhotoCards = allPhotoCards.filter((card, index, self) => 
        index === self.findIndex(c => c.id === card.id)
    );
    
    // 포토카드 배열 설정
    photoCards = uniquePhotoCards;
    
    // 디버깅: 로드된 포토카드 데이터 확인
    console.log('로드된 포토카드 데이터:', photoCards.map(card => ({
        id: card.id,
        name: card.name,
        hasFrontImage: !!card.frontImage,
        hasBackImage: !!card.backImage,
        frontImageLength: card.frontImage ? card.frontImage.length : 0,
        backImageLength: card.backImage ? card.backImage.length : 0
    })));
    
    // 날짜순으로 정렬 (최신순)
    photoCards.sort((a, b) => {
        const dateA = new Date(a.createdAt || Date.now());
        const dateB = new Date(b.createdAt || Date.now());
        return dateB - dateA;
    });
    
    // 로딩 상태 제거하고 갤러리 업데이트
    setTimeout(() => {
        loadingState.style.display = 'none';
        updateGallery();
    }, 300);
}

// 갤러리 업데이트
function updateGallery() {
    // 필터링 및 검색 적용
    applyFiltersAndSearch();
    
    // 포토카드 개수 업데이트
    imageCount.textContent = filteredPhotoCards.length;
    
    // 빈 상태 또는 갤러리 표시
    if (filteredPhotoCards.length === 0) {
        galleryContainer.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        galleryContainer.style.display = 'grid';
        emptyState.style.display = 'none';
        renderGallery();
    }
}

// 필터 및 검색 적용
function applyFiltersAndSearch() {
    let filtered = [...photoCards];
    
    // 필터 적용
    switch (currentFilter) {
        case 'recent':
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            filtered = filtered.filter(card => {
                const cardDate = new Date(card.createdAt);
                return cardDate >= oneWeekAgo;
            });
            break;
        case 'favorite':
            filtered = filtered.filter(card => card.favorite);
            break;
        default:
            // 'all' - 모든 포토카드
            break;
    }
    
    // 검색 적용
    if (currentSearch.trim()) {
        const searchTerm = currentSearch.toLowerCase();
        filtered = filtered.filter(card => {
            const name = (card.name || '').toLowerCase();
            const frontImageName = (card.frontImageName || '').toLowerCase();
            const backImageName = (card.backImageName || '').toLowerCase();
            
            return name.includes(searchTerm) || 
                   frontImageName.includes(searchTerm) || 
                   backImageName.includes(searchTerm);
        });
    }
    
    filteredPhotoCards = filtered;
}

// 갤러리 렌더링
function renderGallery() {
    galleryContainer.innerHTML = '';
    
    filteredPhotoCards.forEach((photoCard, index) => {
        const galleryItem = createPhotoCardItem(photoCard, index);
        galleryContainer.appendChild(galleryItem);
    });
}

// 포토카드 아이템 생성
function createPhotoCardItem(photoCard, index) {
    
    // 디버깅: 포토카드 데이터 확인
    console.log('포토카드 아이템 생성:', {
        id: photoCard.id,
        name: photoCard.name,
        frontImage: photoCard.frontImage ? photoCard.frontImage.substring(0, 50) + '...' : '없음',
        backImage: photoCard.backImage ? photoCard.backImage.substring(0, 50) + '...' : '없음',
        frontImageLength: photoCard.frontImage ? photoCard.frontImage.length : 0,
        backImageLength: photoCard.backImage ? photoCard.backImage.length : 0,
        hasBackImage: !!photoCard.backImage,
        backImageType: photoCard.backImage ? photoCard.backImage.substring(0, 30) : '없음'
    });
    
    const item = document.createElement('div');
    item.className = 'gallery-item photo-card-item';
    item.dataset.cardId = photoCard.id;
    
    const cardDate = new Date(photoCard.createdAt);
    const formattedDate = cardDate.toLocaleDateString('ko-KR');
    
    const isFavorite = photoCard.favorite ? 'favorite' : '';
    const favoriteIcon = photoCard.favorite ? '?' : '☆';
    

    
    item.innerHTML = `
        <div class="photo-card-container">
            <div class="photo-card" id="photoCard-${photoCard.id}">
                <!-- 카드 앞면 -->
                <div class="photo-card-front">
                    <img src="${photoCard.frontImage}" alt="${photoCard.name || '앞면'}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="image-fallback">📷</div>
                </div>
                
                <!-- 카드 뒷면 -->
                <div class="photo-card-back">
                    <img src="${photoCard.backImage}" alt="${photoCard.name || '뒷면'}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="image-fallback">📷</div>
                </div>
            </div>
            <!-- 즐겨찾기 표시 -->
            ${photoCard.favorite ? '<div class="favorite-badge">⭐</div>' : ''}
        </div>
        <!-- 카드 이름 (카드 밑에 표시) -->
        <div class="gallery-item-name">${photoCard.name || '제목 없음'}</div>
        <div class="gallery-item-overlay">
            <div class="gallery-item-info">
                <div class="gallery-item-title">${photoCard.name || '제목 없음'}</div>
                <div class="gallery-item-date">${formattedDate}</div>
            </div>
        </div>
    `;
    
    // 클릭 이벤트
    item.addEventListener('click', (e) => {
        // 카드 회전 효과 시작
        const photoCardContainer = item.querySelector('.photo-card-container');
        if (photoCardContainer) {
            photoCardContainer.classList.add('rotating');
            
            // 3초 후 회전 효과 제거
            setTimeout(() => {
                photoCardContainer.classList.remove('rotating');
            }, 3000);
        }
        
        // 모달 열기
        openPhotoCardModal(photoCard, index);
    });
    
    // 애니메이션 지연 설정
    item.style.animationDelay = `${index * 0.1}s`;
    
    // 이미지 로드 상태 확인 및 CSS 디버깅
    setTimeout(() => {
        const frontImg = item.querySelector('.photo-card-front img');
        const backImg = item.querySelector('.photo-card-back img');
        const photoCard = item.querySelector('.photo-card');
        const photoCardBack = item.querySelector('.photo-card-back');
        
        console.log(`포토카드 ${photoCard.id} 이미지 상태:`, {
            frontImgSrc: frontImg ? frontImg.src.substring(0, 50) + '...' : '없음',
            backImgSrc: backImg ? backImg.src.substring(0, 50) + '...' : '없음',
            frontImgComplete: frontImg ? frontImg.complete : false,
            backImgComplete: backImg ? backImg.complete : false,
            frontImgNaturalWidth: frontImg ? frontImg.naturalWidth : 0,
            backImgNaturalWidth: backImg ? backImg.naturalWidth : 0
        });
        
        // CSS 속성 디버깅
        if (photoCard && photoCardBack) {
            const computedStyle = window.getComputedStyle(photoCard);
            const backComputedStyle = window.getComputedStyle(photoCardBack);
            
            console.log(`포토카드 ${photoCard.id} CSS 상태:`, {
                transformStyle: computedStyle.transformStyle,
                perspective: computedStyle.perspective,
                backfaceVisibility: backComputedStyle.backfaceVisibility,
                transform: backComputedStyle.transform,
                display: backComputedStyle.display,
                visibility: backComputedStyle.visibility,
                opacity: backComputedStyle.opacity
            });
        }
        
        // 이미지 로드 이벤트 추가
        if (frontImg) {
            frontImg.onload = () => console.log(`포토카드 ${photoCard.id} 앞면 이미지 로드 완료`);
            frontImg.onerror = () => console.error(`포토카드 ${photoCard.id} 앞면 이미지 로드 실패`);
        }
        
        if (backImg) {
            backImg.onload = () => console.log(`포토카드 ${photoCard.id} 뒷면 이미지 로드 완료`);
            backImg.onerror = () => console.error(`포토카드 ${photoCard.id} 뒷면 이미지 로드 실패`);
        }
    }, 100);
    
    return item;
}

// 활성 필터 설정
function setActiveFilter(filter) {
    currentFilter = filter;
    
    // 필터 태그 활성화
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // 갤러리 업데이트
    updateGallery();
}

// 검색 수행
function performSearch() {
    currentSearch = searchInput.value.trim();
    updateGallery();
}

// 갤러리 새로고침
function refreshGallery() {
    const refreshIcon = document.getElementById('refreshIcon');
    if (refreshIcon) {
        // 새로고침 중임을 표시
        refreshIcon.textContent = '⏳';
        refreshIcon.style.animation = 'spin 1s linear infinite';
    }
    
    // 포토카드 다시 로드
    loadPhotoCards();
    
    // 1초 후 아이콘 원래대로 복원
    setTimeout(() => {
        if (refreshIcon) {
            refreshIcon.textContent = '🔄';
            refreshIcon.style.animation = '';
        }
    }, 1000);
}

// 포토카드 모달 열기
function openPhotoCardModal(photoCard, index) {
    currentModalPhotoCard = { photoCard, index };
    
    const modalFrontImage = document.getElementById('modalFrontImage');
    const modalFrontImageFallback = document.getElementById('modalFrontImageFallback');
    const modalBackImage = document.getElementById('modalBackImage');
    const modalBackImageFallback = document.getElementById('modalBackImageFallback');
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const favoriteIcon = document.getElementById('favoriteIcon');
    const favoriteText = document.getElementById('favoriteText');
    
    // 모달 표시
    imageModal.style.display = 'flex';
    
    // 초기 상태 설정
    modalFrontImage.src = '';
    modalFrontImage.style.display = 'none';
    modalFrontImageFallback.style.display = 'flex';
    
    modalBackImage.src = '';
    modalBackImage.style.display = 'none';
    modalBackImageFallback.style.display = 'flex';
    
    // 앞면 이미지 이벤트 리스너 설정
    modalFrontImage.onload = function() {
        modalFrontImage.style.display = 'block';
        modalFrontImageFallback.style.display = 'none';
    };
    
    modalFrontImage.onerror = function() {
        modalFrontImage.style.display = 'none';
        modalFrontImageFallback.style.display = 'flex';
    };
    
    // 뒷면 이미지 이벤트 리스너 설정
    modalBackImage.onload = function() {
        modalBackImage.style.display = 'block';
        modalBackImageFallback.style.display = 'none';
    };
    
    modalBackImage.onerror = function() {
        modalBackImage.style.display = 'none';
        modalBackImageFallback.style.display = 'flex';
    };
    
    // 정보 업데이트
    modalTitle.textContent = photoCard.name || '제목 없음';
    modalDate.textContent = `생성일: ${new Date(photoCard.createdAt).toLocaleString('ko-KR')}`;
    
    if (photoCard.favorite) {
        favoriteIcon.textContent = '⭐';
        favoriteText.textContent = '즐겨찾기 해제';
    } else {
        favoriteIcon.textContent = '☆';
        favoriteText.textContent = '즐겨찾기';
    }
    
    // 앞면과 뒷면 이미지 소스 설정
    setTimeout(() => {
        modalFrontImage.src = photoCard.frontImage;
        modalBackImage.src = photoCard.backImage;
    }, 100);
    
    // 모달 오버레이 클릭 시 모달 닫기
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closePhotoCardModal();
            }
        });
    }
    
    // 모달 컨텐츠 클릭 시 이벤트 전파 방지
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}



// 포토카드 모달 닫기
function closePhotoCardModal() {
    imageModal.style.display = 'none';
    currentModalPhotoCard = null;
    
    // 모달 이미지와 폴백 초기화
    const modalFrontImage = document.getElementById('modalFrontImage');
    const modalFrontImageFallback = document.getElementById('modalFrontImageFallback');
    const modalBackImage = document.getElementById('modalBackImage');
    const modalBackImageFallback = document.getElementById('modalBackImageFallback');
    
    // 앞면 이미지 소스와 이벤트 리스너 제거
    modalFrontImage.onload = null;
    modalFrontImage.onerror = null;
    modalFrontImage.src = '';
    modalFrontImage.style.display = 'none';
    modalFrontImageFallback.style.display = 'none';
    
    // 뒷면 이미지 소스와 이벤트 리스너 제거
    modalBackImage.onload = null;
    modalBackImage.onerror = null;
    modalBackImage.src = '';
    modalBackImage.style.display = 'none';
    modalBackImageFallback.style.display = 'none';
}

// 현재 포토카드 편집
function editCurrentPhotoCard() {
    if (currentModalPhotoCard) {
        const { photoCard, index } = currentModalPhotoCard;
        closePhotoCardModal();
        
        console.log('모달에서 편집할 포토카드 설정:', photoCard);
        
        // 저장 공간 확인 및 정리
        const estimatedSize = JSON.stringify(photoCard).length;
        console.log('저장할 데이터 크기:', estimatedSize, 'bytes');
        
        // localStorage 저장 시도
        try {
            localStorage.setItem('currentPhotoCard', JSON.stringify(photoCard));
            console.log('localStorage에 포토카드 데이터 저장됨');
        } catch (error) {
            console.error('localStorage 저장 오류:', error);
            
            // QuotaExceededError인 경우 저장 공간 정리 시도
            if (error.name === 'QuotaExceededError') {
                console.log('저장 공간 부족, 정리 시도...');
                
                // 강력한 저장 공간 정리
                if (cleanupStorageSpace()) {
                    // 다시 저장 시도
                    try {
                        localStorage.setItem('currentPhotoCard', JSON.stringify(photoCard));
                        console.log('정리 후 localStorage에 포토카드 데이터 저장됨');
                    } catch (retryError) {
                        console.error('정리 후에도 저장 실패:', retryError);
                        POKA.Toast.error('저장 공간이 부족합니다. 일부 포토카드를 삭제한 후 다시 시도해주세요.');
                        return;
                    }
                } else {
                    console.error('저장 공간 정리 실패');
                    POKA.Toast.error('저장 공간 정리에 실패했습니다. 일부 포토카드를 삭제한 후 다시 시도해주세요.');
                    return;
                }
            } else {
                POKA.Toast.error('포토카드 데이터 저장 중 오류가 발생했습니다');
                return;
            }
        }
        
        // AppState에도 저장 (호환성)
        try {
            POKA.AppState.saveToStorage('currentPhotoCard', photoCard);
            console.log('AppState.currentPhotoCard 설정 후:', POKA.AppState.getFromStorage('currentPhotoCard'));
        } catch (error) {
            console.error('AppState 저장 오류:', error);
            // localStorage에 저장되었으므로 계속 진행
        }
        
        // 편집 페이지로 이동
        const editUrl = 'edit.html';
        console.log('편집 페이지로 이동:', editUrl);
        POKA.Navigation.navigateTo(editUrl);
    } else {
        POKA.Toast.error('편집할 포토카드를 선택해주세요');
    }
}

// 포토카드 삭제
function deletePhotoCard(index) {
    if (index >= 0 && index < filteredPhotoCards.length) {
        const photoCard = filteredPhotoCards[index];
        
        POKA.Modal.show(
            `<p>정말로 "${photoCard.name || '포토카드'}"을 삭제하시겠습니까?</p>`,
            {
                title: '포토카드 삭제',
                buttons: [
                    {
                        text: '취소',
                        class: 'btn-secondary'
                    },
                    {
                        text: '삭제',
                        class: 'btn-primary',
                        onClick: () => {
                            // 원본 배열에서 제거
                            const originalIndex = photoCards.findIndex(card => card.id === photoCard.id);
                            if (originalIndex !== -1) {
                                photoCards.splice(originalIndex, 1);
                            }
                            
                            // 저장
                            savePhotoCards();
                            
                            // 갤러리 업데이트
                            updateGallery();
                            
                            POKA.Toast.success('포토카드가 삭제되었습니다');
                        }
                    }
                ]
            }
        );
    }
}

// 포토카드 즐겨찾기 토글
function togglePhotoCardFavorite(index) {
    if (index >= 0 && index < filteredPhotoCards.length) {
        const photoCard = filteredPhotoCards[index];
        photoCard.favorite = !photoCard.favorite;
        
        // 원본 배열에서도 업데이트
        const originalIndex = photoCards.findIndex(card => card.id === photoCard.id);
        if (originalIndex !== -1) {
            photoCards[originalIndex].favorite = photoCard.favorite;
        }
        
        // 저장
        savePhotoCards();
        
        // 갤러리 업데이트
        updateGallery();
        
        POKA.Toast.success(photoCard.favorite ? '즐겨찾기에 추가되었습니다' : '즐겨찾기에서 제거되었습니다');
    }
}

// 저장 공간 정리 함수
function cleanupStorageSpace() {
    console.log('저장 공간 정리 시작');
    
    try {
        // 임시 데이터 정리
        const tempKeys = [
            'photoCardEditState', 
            'photoCardNameEdit', 
            'currentImage', 
            'editedImages',
            'uploadedImages',
            'imageEditState'
        ];
        
        tempKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
                console.log('임시 데이터 정리:', key);
            } catch (e) {
                console.error('임시 데이터 정리 실패:', key, e);
            }
        });
        
        // 오래된 포토카드 정리 (최근 20개만 유지)
        try {
            const allPhotoCards = JSON.parse(localStorage.getItem('photoCards') || '[]');
            if (allPhotoCards.length > 20) {
                // 날짜순으로 정렬하여 오래된 것부터 제거
                allPhotoCards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const keepPhotoCards = allPhotoCards.slice(0, 20);
                localStorage.setItem('photoCards', JSON.stringify(keepPhotoCards));
                console.log('오래된 포토카드 정리:', allPhotoCards.length - 20, '개 제거');
            }
        } catch (e) {
            console.error('포토카드 정리 실패:', e);
        }
        
        // gallery 데이터도 정리
        try {
            const gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
            const photoCardItems = gallery.filter(item => item.type === 'photoCard');
            if (photoCardItems.length > 20) {
                photoCardItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const keepPhotoCardItems = photoCardItems.slice(0, 20);
                const nonPhotoCardItems = gallery.filter(item => item.type !== 'photoCard');
                const updatedGallery = [...nonPhotoCardItems, ...keepPhotoCardItems];
                localStorage.setItem('gallery', JSON.stringify(updatedGallery));
                console.log('gallery 데이터 정리 완료');
            }
        } catch (e) {
            console.error('gallery 데이터 정리 실패:', e);
        }
        
        console.log('저장 공간 정리 완료');
        return true;
    } catch (error) {
        console.error('저장 공간 정리 중 오류:', error);
        return false;
    }
}

// 포토카드 저장
function savePhotoCards() {
    try {
        console.log('포토카드 저장 시작:', photoCards.length, '개');
        
        // POKA.AppState를 통한 저장
        if (typeof POKA !== 'undefined' && POKA.AppState) {
            POKA.AppState.saveToStorage('photoCards', photoCards);
            console.log('POKA.AppState 저장 완료');
        }
        
        // localStorage를 통한 직접 저장 (백업)
        localStorage.setItem('photoCards', JSON.stringify(photoCards));
        console.log('localStorage 저장 완료');
        
        // gallery 데이터도 업데이트 (기존 gallery 데이터에서 photoCard 타입만 필터링하고 새로운 포토카드 추가)
        const existingGallery = JSON.parse(localStorage.getItem('gallery') || '[]');
        const nonPhotoCardItems = existingGallery.filter(item => item.type !== 'photoCard');
        const updatedGallery = [...nonPhotoCardItems, ...photoCards.map(card => ({ ...card, type: 'photoCard' }))];
        localStorage.setItem('gallery', JSON.stringify(updatedGallery));
        console.log('gallery 데이터 업데이트 완료');
        
        console.log('포토카드 저장 완료:', photoCards.length, '개');
    } catch (error) {
        console.error('포토카드 저장 중 오류:', error);
        
        // 저장 실패 시 공간 정리 후 재시도
        if (error.name === 'QuotaExceededError') {
            console.log('저장 공간 부족, 정리 후 재시도...');
            if (cleanupStorageSpace()) {
                try {
                    localStorage.setItem('photoCards', JSON.stringify(photoCards));
                    console.log('정리 후 포토카드 저장 완료');
                } catch (retryError) {
                    console.error('정리 후에도 저장 실패:', retryError);
                    POKA.Toast.error('저장 공간이 부족합니다. 일부 포토카드를 삭제한 후 다시 시도해주세요.');
                }
            } else {
                POKA.Toast.error('저장 공간 정리에 실패했습니다.');
            }
        } else {
            POKA.Toast.error('포토카드 저장 중 오류가 발생했습니다');
        }
    }
} 

// 포토카드 다운로드
function downloadPhotoCard() {
    if (currentModalPhotoCard) {
        const { photoCard } = currentModalPhotoCard;
        
        // 앞면 이미지 다운로드
        const frontLink = document.createElement('a');
        frontLink.href = photoCard.frontImage;
        frontLink.download = `${photoCard.name || 'poka_photocard'}_front.jpg`;
        document.body.appendChild(frontLink);
        frontLink.click();
        document.body.removeChild(frontLink);
        
        // 뒷면 이미지 다운로드
        setTimeout(() => {
            const backLink = document.createElement('a');
            backLink.href = photoCard.backImage;
            backLink.download = `${photoCard.name || 'poka_photocard'}_back.jpg`;
            document.body.appendChild(backLink);
            backLink.click();
            document.body.removeChild(backLink);
        }, 500);
        
        POKA.Toast.success('포토카드 다운로드가 시작되었습니다');
    }
}

// 포토카드 공유
function sharePhotoCard() {
    if (currentModalPhotoCard && navigator.share) {
        const { photoCard } = currentModalPhotoCard;
        
        navigator.share({
            title: photoCard.name || 'POKA V2 포토카드',
            text: 'POKA V2로 만든 포토카드입니다',
            url: window.location.href
        }).then(() => {
            POKA.Toast.success('공유되었습니다');
        }).catch(() => {
            POKA.Toast.error('공유에 실패했습니다');
        });
    } else {
        // 공유 API가 지원되지 않는 경우 클립보드에 복사
        if (currentModalPhotoCard) {
            const { photoCard } = currentModalPhotoCard;
            navigator.clipboard.writeText(photoCard.frontImage).then(() => {
                POKA.Toast.success('포토카드 링크가 클립보드에 복사되었습니다');
            }).catch(() => {
                POKA.Toast.error('클립보드 복사에 실패했습니다');
            });
        }
    }
}

// 포토카드 즐겨찾기 토글 (모달에서)
function togglePhotoCardFavorite() {
    if (currentModalPhotoCard) {
        const { photoCard } = currentModalPhotoCard;
        
        // 즐겨찾기 상태 토글
        photoCard.favorite = !photoCard.favorite;
        
        // 원본 배열에서도 업데이트
        const originalIndex = photoCards.findIndex(card => card.id === photoCard.id);
        if (originalIndex !== -1) {
            photoCards[originalIndex].favorite = photoCard.favorite;
        }
        
        // 모달의 즐겨찾기 아이콘과 텍스트 업데이트
        const favoriteIcon = document.getElementById('favoriteIcon');
        const favoriteText = document.getElementById('favoriteText');
        
        if (photoCard.favorite) {
            favoriteIcon.textContent = '⭐';
            favoriteText.textContent = '즐겨찾기 해제';
        } else {
            favoriteIcon.textContent = '☆';
            favoriteText.textContent = '즐겨찾기';
        }
        
        // 저장
        savePhotoCards();
        
        // 갤러리 업데이트 (모달은 닫지 않음)
        updateGallery();
        
        POKA.Toast.success(photoCard.favorite ? '즐겨찾기에 추가되었습니다' : '즐겨찾기에서 제거되었습니다');
    }
}

// 현재 포토카드 삭제 (모달에서)
function deleteCurrentPhotoCard() {
    if (currentModalPhotoCard) {
        const { photoCard, index } = currentModalPhotoCard;
        
        console.log('삭제 시도:', {
            photoCardId: photoCard.id,
            photoCardName: photoCard.name,
            currentPhotoCardsCount: photoCards.length,
            currentFilteredPhotoCardsCount: filteredPhotoCards.length
        });
        
        // 확인 다이얼로그 표시
        if (confirm(`정말로 "${photoCard.name || '포토카드'}"을 삭제하시겠습니까?`)) {
            // 원본 배열에서 제거
            const originalIndex = photoCards.findIndex(card => card.id === photoCard.id);
            console.log('원본 배열에서 찾은 인덱스:', originalIndex);
            
            if (originalIndex !== -1) {
                // 배열에서 제거
                photoCards.splice(originalIndex, 1);
                console.log('삭제 후 포토카드 개수:', photoCards.length);
                
                // 저장
                savePhotoCards();
                
                // 모달 닫기
                closePhotoCardModal();
                
                // 갤러리 업데이트 (약간의 지연 후)
                setTimeout(() => {
                    updateGallery();
                    console.log('갤러리 업데이트 완료');
                }, 100);
                
                // 성공 메시지 표시
                POKA.Toast.success('포토카드가 삭제되었습니다');
            } else {
                console.error('포토카드를 찾을 수 없음:', photoCard.id);
                POKA.Toast.error('포토카드를 찾을 수 없습니다');
            }
        }
    } else {
        console.error('currentModalPhotoCard가 없음');
        POKA.Toast.error('삭제할 포토카드가 없습니다');
    }
} 

function printPhotoCard() {
    if (currentModalPhotoCard) {
        const { photoCard } = currentModalPhotoCard;
        
        // 인쇄용 포토카드 데이터를 세션에 저장
        if (typeof POKA !== 'undefined' && POKA.AppState) {
            POKA.AppState.saveToStorage('printPhotoCard', photoCard);
        }
        
        // 인쇄 페이지로 이동
        POKA.Navigation.navigateTo('print.html');
    } else {
        POKA.Toast.error('인쇄할 포토카드가 없습니다');
    }
}

// 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'Delete':
        case 'Backspace':
            if (currentModalPhotoCard) {
                deletePhotoCard(currentModalPhotoCard.index);
                closePhotoCardModal();
            }
            break;
        case 'Enter':
            if (currentModalPhotoCard) {
                editCurrentPhotoCard();
            }
            break;
        case 'Escape':
            closePhotoCardModal();
            break;
    }
});

// 페이지 떠날 때 저장
window.addEventListener('beforeunload', () => {
    savePhotoCards();
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
    POKA.Toast.success('인터넷 연결이 복구되었습니다');
});

window.addEventListener('offline', () => {
    POKA.Toast.warning('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.');
}); 

// 포토카드 제작하기 버튼 클릭 시 새로운 포토카드 생성 모드로 진입
function createNewPhotoCard() {
    console.log('새로운 포토카드 생성 모드로 진입');
    
    // 기존 포토카드 데이터 초기화
    try {
        localStorage.removeItem('currentPhotoCard');
        if (typeof POKA !== 'undefined' && POKA.AppState) {
            POKA.AppState.removeFromStorage('currentPhotoCard');
        }
        console.log('기존 포토카드 데이터 초기화 완료');
    } catch (error) {
        console.error('기존 포토카드 데이터 초기화 오류:', error);
    }
    
    // 편집 페이지로 이동
    POKA.Navigation.navigateTo('edit.html');
} 