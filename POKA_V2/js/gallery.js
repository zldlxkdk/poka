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
    
    console.log('포토카드 로드 시작');
    
    // localStorage에서 포토카드 데이터 확인
    const savedPhotoCards = JSON.parse(localStorage.getItem('photoCards') || '[]');
    const savedGallery = JSON.parse(localStorage.getItem('gallery') || '[]');
    console.log('포토카드 데이터:', savedPhotoCards);
    console.log('갤러리 데이터:', savedGallery);

    // 첫 번째 포토카드의 상세 정보 확인
    if (savedPhotoCards.length > 0) {
        const firstCard = savedPhotoCards[0];
        console.log('첫 번째 포토카드:', {
            id: firstCard.id,
            name: firstCard.name,
            frontImage: firstCard.frontImage ? firstCard.frontImage.substring(0, 100) + '...' : '없음',
            backImage: firstCard.backImage ? firstCard.backImage.substring(0, 100) + '...' : '없음',
            frontImageName: firstCard.frontImageName,
            backImageName: firstCard.backImageName
        });
    }
    
    // 포토카드 타입인 것들만 필터링
    const photoCardItems = savedGallery.filter(item => item.type === 'photoCard');
    
    // 두 배열을 합치고 중복 제거
    const allPhotoCards = [...savedPhotoCards, ...photoCardItems];
    const uniquePhotoCards = allPhotoCards.filter((card, index, self) => 
        index === self.findIndex(c => c.id === card.id)
    );
    
    console.log('최종 로드된 포토카드:', {
        photoCards: uniquePhotoCards.length,
        photoCardsData: uniquePhotoCards
    });
    
    // 각 포토카드의 이미지 데이터 확인
    uniquePhotoCards.forEach((card, index) => {
        console.log(`포토카드 ${index + 1}:`, {
            id: card.id,
            name: card.name,
            frontImageLength: card.frontImage ? card.frontImage.length : 0,
            backImageLength: card.backImage ? card.backImage.length : 0,
            frontImageStart: card.frontImage ? card.frontImage.substring(0, 50) : '없음',
            backImageStart: card.backImage ? card.backImage.substring(0, 50) : '없음',
            frontImageEnd: card.frontImage ? card.frontImage.substring(card.frontImage.length - 20) : '없음',
            backImageEnd: card.backImage ? card.backImage.substring(card.backImage.length - 20) : '없음'
        });
    });
    
    // 포토카드 배열 설정
    photoCards = uniquePhotoCards;
    
    console.log('전체 포토카드 개수:', photoCards.length);
    console.log('전체 포토카드 데이터:', photoCards);
    
    // 날짜순으로 정렬 (최신순)
    photoCards.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
    });
    
    setTimeout(() => {
        loadingState.style.display = 'none';
        updateGallery();
    }, 500);
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
    console.log('포토카드 생성:', {
        id: photoCard.id,
        name: photoCard.name,
        frontImage: photoCard.frontImage ? photoCard.frontImage.substring(0, 100) + '...' : '없음',
        backImage: photoCard.backImage ? photoCard.backImage.substring(0, 100) + '...' : '없음',
        frontImageName: photoCard.frontImageName,
        backImageName: photoCard.backImageName,
        frontImageLength: photoCard.frontImage ? photoCard.frontImage.length : 0,
        backImageLength: photoCard.backImage ? photoCard.backImage.length : 0
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
            <div class="photo-card">
                <div class="photo-card-front">
                    <img src="${photoCard.frontImage}" alt="${photoCard.name || '앞면'}" loading="eager" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; console.log('앞면 이미지 로드 실패:', this.src);" onload="this.style.opacity='1'; this.style.display='block'; this.nextElementSibling.style.display='none'; console.log('앞면 이미지 로드 성공:', this.src);">
                    <div class="image-fallback">??</div>
                </div>
                <div class="photo-card-back">
                    <img src="${photoCard.backImage}" alt="${photoCard.name || '뒷면'}" loading="eager" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; console.log('뒷면 이미지 로드 실패:', this.src);" onload="this.style.opacity='1'; this.style.display='block'; this.nextElementSibling.style.display='none'; console.log('뒷면 이미지 로드 성공:', this.src);">
                    <div class="image-fallback">??</div>
                </div>
                <!-- 카드 측면들 (두께감 표현) -->
                <div class="photo-card-side photo-card-side-top"></div>
                <div class="photo-card-side photo-card-side-bottom"></div>
                <div class="photo-card-side photo-card-side-left"></div>
                <div class="photo-card-side photo-card-side-right"></div>
                
                <!-- 카드 내부 측면들 (앞면과 뒷면 사이) -->
                <div class="photo-card-inner-side photo-card-inner-top"></div>
                <div class="photo-card-inner-side photo-card-inner-bottom"></div>
                <div class="photo-card-inner-side photo-card-inner-left"></div>
                <div class="photo-card-inner-side photo-card-inner-right"></div>
            </div>
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
    
    // 이미지 로드 후 추가 처리
    setTimeout(() => {
        const frontImg = item.querySelector('.photo-card-front img');
        const backImg = item.querySelector('.photo-card-back img');
        
        if (frontImg) {
            console.log('앞면 이미지 상태 확인:', {
                src: frontImg.src.substring(0, 100) + '...',
                display: frontImg.style.display,
                opacity: frontImg.style.opacity,
                naturalWidth: frontImg.naturalWidth,
                naturalHeight: frontImg.naturalHeight,
                complete: frontImg.complete
            });
        }
        
        if (backImg) {
            console.log('뒷면 이미지 상태 확인:', {
                src: backImg.src.substring(0, 100) + '...',
                display: backImg.style.display,
                opacity: backImg.style.opacity,
                naturalWidth: backImg.naturalWidth,
                naturalHeight: backImg.naturalHeight,
                complete: backImg.complete,
                transform: backImg.style.transform,
                computedTransform: window.getComputedStyle(backImg).transform
            });
        }
    }, 200);
    
    // 클릭 이벤트
    item.addEventListener('click', (e) => {
        openPhotoCardModal(photoCard, index);
    });
    
    // 애니메이션 지연 설정
    item.style.animationDelay = `${index * 0.1}s`;
    
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

// 보기 모드 토글
function toggleViewMode() {
    isListView = !isListView;
    
    if (isListView) {
        galleryContainer.classList.add('list-view');
        document.querySelector('.header-btn .btn-icon').textContent = '?';
    } else {
        galleryContainer.classList.remove('list-view');
        document.querySelector('.header-btn .btn-icon').textContent = '??';
    }
    
    // 갤러리 다시 렌더링
    renderGallery();
}

// 정렬 옵션 표시
function showSortOptions() {
    const options = [
        { text: '최신순', value: 'newest' },
        { text: '오래된순', value: 'oldest' },
        { text: '이름순', value: 'name' },
        { text: '크기순', value: 'size' }
    ];
    
    const content = `
        <div style="text-align: left;">
            <p><strong>정렬 기준을 선택하세요:</strong></p>
            ${options.map(option => `
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <button onclick="sortPhotoCards('${option.value}')" style="background: none; border: none; color: var(--text-primary); cursor: pointer; width: 100%; text-align: left; padding: 8px;">
                        ${option.text}
                    </button>
                </div>
            `).join('')}
        </div>
    `;
    
    POKA.Modal.show(content, {
        title: '정렬 옵션',
        buttons: [
            {
                text: '닫기',
                class: 'btn-secondary'
            }
        ]
    });
}

// 포토카드 정렬
function sortPhotoCards(sortBy) {
    switch (sortBy) {
        case 'newest':
            photoCards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            photoCards.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'name':
            photoCards.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'size':
            // 포토카드는 크기 정렬이 의미없으므로 최신순으로 정렬
            photoCards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    updateGallery();
    POKA.Toast.success('정렬이 적용되었습니다');
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
        favoriteIcon.textContent = '?';
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
        
        // localStorage에 직접 저장 (더 안정적)
        try {
            localStorage.setItem('currentPhotoCard', JSON.stringify(photoCard));
            console.log('localStorage에 포토카드 데이터 저장됨');
        } catch (error) {
            console.error('localStorage 저장 오류:', error);
            POKA.Toast.error('포토카드 데이터 저장 중 오류가 발생했습니다');
            return;
        }
        
        // AppState에도 저장 (호환성)
        try {
            POKA.AppState.currentPhotoCard = photoCard;
            POKA.AppState.saveToStorage('currentPhotoCard', photoCard);
            console.log('AppState.currentPhotoCard 설정 후:', POKA.AppState.currentPhotoCard);
        } catch (error) {
            console.error('AppState 저장 오류:', error);
            // localStorage에 저장되었으므로 계속 진행
        }
        
        // 편집 페이지로 이동
        const editUrl = 'edit.html';
        console.log('편집 페이지로 이동:', editUrl);
        POKA.Navigation.navigateTo(editUrl);
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

// 포토카드 저장
function savePhotoCards() {
    POKA.AppState.saveToStorage('photoCards', photoCards);
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
        
        showToast('포토카드 다운로드가 시작되었습니다', 'success');
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
            showToast('공유되었습니다', 'success');
        }).catch(() => {
            showToast('공유에 실패했습니다', 'error');
        });
    } else {
        // 공유 API가 지원되지 않는 경우 클립보드에 복사
        if (currentModalPhotoCard) {
            const { photoCard } = currentModalPhotoCard;
            navigator.clipboard.writeText(photoCard.frontImage).then(() => {
                showToast('포토카드 링크가 클립보드에 복사되었습니다', 'success');
            }).catch(() => {
                showToast('클립보드 복사에 실패했습니다', 'error');
            });
        }
    }
}

// 포토카드 즐겨찾기 토글 (모달에서)
function togglePhotoCardFavorite() {
    if (currentModalPhotoCard) {
        togglePhotoCardFavorite(currentModalPhotoCard.index);
        closePhotoCardModal();
    }
}

// 현재 포토카드 삭제 (모달에서)
function deleteCurrentPhotoCard() {
    if (currentModalPhotoCard) {
        const { photoCard, index } = currentModalPhotoCard;
        
        // 확인 다이얼로그 표시
        if (confirm('정말로 이 포토카드를 삭제하시겠습니까?')) {
            // 원본 배열에서 제거
            const originalIndex = photoCards.findIndex(card => card.id === photoCard.id);
            if (originalIndex !== -1) {
                photoCards.splice(originalIndex, 1);
            }
            
            // 저장
            savePhotoCards();
            
            // 모달 닫기
            closePhotoCardModal();
            
            // 갤러리 업데이트
            updateGallery();
            
            // 성공 메시지 표시
            showToast('포토카드가 삭제되었습니다', 'success');
        }
    }
} 

// 토스트 메시지 표시 함수
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // 애니메이션
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 100);
    
    // 자동 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
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