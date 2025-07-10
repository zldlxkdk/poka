// POKA V2 - 갤러리 페이지 JavaScript

// 전역 변수
let allImages = [];
let filteredImages = [];
let currentFilter = 'all';
let currentSearch = '';
let isListView = false;
let currentModalImage = null;

// DOM 요소들
const searchInput = document.getElementById('searchInput');
const filterTags = document.getElementById('filterTags');
const galleryContainer = document.getElementById('galleryContainer');
const imageCount = document.getElementById('imageCount');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const imageModal = document.getElementById('imageModal');

document.addEventListener('DOMContentLoaded', () => {
    console.log('POKA V2 Gallery page loaded');
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 이미지 로드
    loadImages();
    
    // 검색 입력 이벤트
    searchInput.addEventListener('input', debounce(performSearch, 300));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 필터 태그 클릭 이벤트
    filterTags.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tag')) {
            const filter = e.target.dataset.filter;
            setActiveFilter(filter);
        }
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });
}

// 이미지 로드
function loadImages() {
    loadingState.style.display = 'block';
    galleryContainer.style.display = 'none';
    emptyState.style.display = 'none';
    
    console.log('갤러리 이미지 로드 시작');
    
    // 로컬 스토리지에서 이미지 로드
    const savedImages = POKA.AppState.getFromStorage('editedImages') || [];
    const uploadedImages = POKA.AppState.getFromStorage('uploadedImages') || [];
    
    console.log('로드된 이미지:', {
        editedImages: savedImages.length,
        uploadedImages: uploadedImages.length,
        editedImagesData: savedImages,
        uploadedImagesData: uploadedImages
    });
    
    // 모든 이미지 합치기
    allImages = [
        ...savedImages.map(img => ({ ...img, type: 'edited' })),
        ...uploadedImages.map(img => ({ ...img, type: 'uploaded' }))
    ];
    
    console.log('전체 이미지 개수:', allImages.length);
    console.log('전체 이미지 데이터:', allImages);
    
    // 날짜순으로 정렬 (최신순)
    allImages.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.uploadedAt);
        const dateB = new Date(b.createdAt || b.uploadedAt);
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
    
    // 이미지 개수 업데이트
    imageCount.textContent = filteredImages.length;
    
    // 빈 상태 또는 갤러리 표시
    if (filteredImages.length === 0) {
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
    let filtered = [...allImages];
    
    // 필터 적용
    switch (currentFilter) {
        case 'recent':
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            filtered = filtered.filter(img => {
                const imgDate = new Date(img.createdAt || img.uploadedAt);
                return imgDate >= oneWeekAgo;
            });
            break;
        case 'favorite':
            filtered = filtered.filter(img => img.favorite);
            break;
        case 'edited':
            filtered = filtered.filter(img => img.type === 'edited');
            break;
        default:
            // 'all' - 모든 이미지
            break;
    }
    
    // 검색 적용
    if (currentSearch.trim()) {
        const searchTerm = currentSearch.toLowerCase();
        filtered = filtered.filter(img => {
            const name = (img.name || '').toLowerCase();
            const title = (img.title || '').toLowerCase();
            return name.includes(searchTerm) || title.includes(searchTerm);
        });
    }
    
    filteredImages = filtered;
}

// 갤러리 렌더링
function renderGallery() {
    galleryContainer.innerHTML = '';
    
    filteredImages.forEach((image, index) => {
        const galleryItem = createGalleryItem(image, index);
        galleryContainer.appendChild(galleryItem);
    });
}

// 갤러리 아이템 생성
function createGalleryItem(image, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.imageId = image.id;
    
    const imageDate = new Date(image.createdAt || image.uploadedAt);
    const formattedDate = imageDate.toLocaleDateString('ko-KR');
    
    const isFavorite = image.favorite ? 'favorite' : '';
    const favoriteIcon = image.favorite ? '?' : '☆';
    
    item.innerHTML = `
        <img src="${image.dataUrl}" alt="${image.name || '이미지'}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="image-fallback">
            ??
        </div>
        <div class="gallery-item-overlay">
            <div class="gallery-item-info">
                <div class="gallery-item-title">${image.name || '제목 없음'}</div>
                <div class="gallery-item-date">${formattedDate}</div>
            </div>
        </div>
        ${image.type === 'edited' ? '<div class="gallery-item-badge">편집됨</div>' : ''}
    `;
    
    // 클릭 이벤트
    item.addEventListener('click', (e) => {
        openImageModal(image, index);
    });
    
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
                    <button onclick="sortImages('${option.value}')" style="background: none; border: none; color: var(--text-primary); cursor: pointer; width: 100%; text-align: left; padding: 8px;">
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

// 이미지 정렬
function sortImages(sortBy) {
    switch (sortBy) {
        case 'newest':
            allImages.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.uploadedAt);
                const dateB = new Date(b.createdAt || b.uploadedAt);
                return dateB - dateA;
            });
            break;
        case 'oldest':
            allImages.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.uploadedAt);
                const dateB = new Date(b.createdAt || b.uploadedAt);
                return dateA - dateB;
            });
            break;
        case 'name':
            allImages.sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
        case 'size':
            allImages.sort((a, b) => (b.size || 0) - (a.size || 0));
            break;
    }
    
    updateGallery();
    POKA.Toast.success('정렬이 완료되었습니다');
}

// 이미지 즐겨찾기 토글
function toggleImageFavorite(index) {
    if (index >= 0 && index < filteredImages.length) {
        const image = filteredImages[index];
        image.favorite = !image.favorite;
        
        // 원본 배열에서도 업데이트
        const originalIndex = allImages.findIndex(img => img.id === image.id);
        if (originalIndex !== -1) {
            allImages[originalIndex].favorite = image.favorite;
        }
        
        // 저장
        saveImages();
        
        // 갤러리 업데이트
        updateGallery();
        
        POKA.Toast.success(image.favorite ? '즐겨찾기에 추가되었습니다' : '즐겨찾기에서 제거되었습니다');
    }
}

// 이미지 편집
function editImage(index) {
    console.log('editImage 호출됨, 인덱스:', index);
    console.log('filteredImages 길이:', filteredImages.length);
    console.log('filteredImages:', filteredImages);
    
    if (index >= 0 && index < filteredImages.length) {
        const image = filteredImages[index];
        console.log('편집할 이미지 설정:', image);
        console.log('이미지 데이터 URL 존재:', !!image.dataUrl);
        console.log('이미지 데이터 URL 길이:', image.dataUrl ? image.dataUrl.length : '없음');
        
        // AppState에 저장 (더 안전한 방법)
        try {
            POKA.AppState.currentImage = image;
            POKA.AppState.saveToStorage('currentImage', image);
            console.log('AppState.currentImage 설정 후:', POKA.AppState.currentImage);
            console.log('저장된 이미지 데이터 길이:', image.dataUrl ? image.dataUrl.length : '없음');
        } catch (error) {
            console.error('AppState 저장 오류:', error);
            POKA.Toast.error('이미지 데이터 저장 중 오류가 발생했습니다');
            return;
        }
        
        // 편집 페이지로 이동 (URL 파라미터 없이)
        const editUrl = 'edit.html';
        console.log('편집 페이지로 이동:', editUrl);
        POKA.Navigation.navigateTo(editUrl);
    } else {
        console.error('유효하지 않은 이미지 인덱스:', index);
        POKA.Toast.error('이미지를 찾을 수 없습니다');
    }
}

// 이미지 삭제
function deleteImage(index) {
    if (index >= 0 && index < filteredImages.length) {
        const image = filteredImages[index];
        
        POKA.Modal.show(
            `<p>정말로 "${image.name || '이미지'}"을 삭제하시겠습니까?</p>`,
            {
                title: '이미지 삭제',
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
                            const originalIndex = allImages.findIndex(img => img.id === image.id);
                            if (originalIndex !== -1) {
                                allImages.splice(originalIndex, 1);
                            }
                            
                            // 저장
                            saveImages();
                            
                            // 갤러리 업데이트
                            updateGallery();
                            
                            POKA.Toast.success('이미지가 삭제되었습니다');
                        }
                    }
                ]
            }
        );
    }
}

// 이미지 모달 열기
function openImageModal(image, index) {
    currentModalImage = { image, index };
    
    const modalImage = document.getElementById('modalImage');
    const modalImageFallback = document.getElementById('modalImageFallback');
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const modalSize = document.getElementById('modalSize');
    const favoriteIcon = document.getElementById('favoriteIcon');
    const favoriteText = document.getElementById('favoriteText');
    
    // 모달 표시
    imageModal.style.display = 'flex';
    
    // 초기 상태 설정 - 이미지 소스 초기화
    modalImage.src = '';
    modalImage.style.display = 'none';
    modalImageFallback.style.display = 'flex';
    
    // 이벤트 리스너 설정
    modalImage.onload = function() {
        modalImage.style.display = 'block';
        modalImageFallback.style.display = 'none';
    };
    
    modalImage.onerror = function() {
        modalImage.style.display = 'none';
        modalImageFallback.style.display = 'flex';
    };
    
    // 정보 업데이트
    modalTitle.textContent = image.name || '제목 없음';
    modalDate.textContent = `생성일: ${new Date(image.createdAt || image.uploadedAt).toLocaleString('ko-KR')}`;
    modalSize.textContent = `크기: ${formatFileSize(image.size || 0)}`;
    
    if (image.favorite) {
        favoriteIcon.textContent = '?';
        favoriteText.textContent = '즐겨찾기 해제';
    } else {
        favoriteIcon.textContent = '☆';
        favoriteText.textContent = '즐겨찾기';
    }
    
    // 이미지 소스 설정 (이벤트 리스너 설정 후)
    setTimeout(() => {
        modalImage.src = image.dataUrl;
    }, 100);
    
    // 모달 오버레이 클릭 시 모달 닫기
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeImageModal();
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

// 이미지 모달 닫기
function closeImageModal() {
    imageModal.style.display = 'none';
    currentModalImage = null;
    
    // 모달 이미지와 폴백 초기화
    const modalImage = document.getElementById('modalImage');
    const modalImageFallback = document.getElementById('modalImageFallback');
    
    // 이미지 소스와 이벤트 리스너 제거
    modalImage.onload = null;
    modalImage.onerror = null;
    modalImage.src = '';
    modalImage.style.display = 'none';
    modalImageFallback.style.display = 'none';
    
    // 이벤트 리스너는 자동으로 정리되므로 별도 제거 불필요
}

// 현재 이미지 편집
function editCurrentImage() {
    if (currentModalImage) {
        const { image, index } = currentModalImage;
        closeImageModal();
        
        console.log('모달에서 편집할 이미지 설정:', image);
        
        // AppState에 저장 (올바른 키 사용)
        try {
            POKA.AppState.currentImage = image;
            POKA.AppState.saveToStorage('currentImage', image);
            console.log('AppState.currentImage 설정 후:', POKA.AppState.currentImage);
            console.log('저장된 이미지 데이터 길이:', image.dataUrl ? image.dataUrl.length : '없음');
        } catch (error) {
            console.error('AppState 저장 오류:', error);
            POKA.Toast.error('이미지 데이터 저장 중 오류가 발생했습니다');
            return;
        }
        
        // 편집 페이지로 이동 (POKA.Navigation 사용)
        const editUrl = 'edit.html';
        console.log('편집 페이지로 이동:', editUrl);
        POKA.Navigation.navigateTo(editUrl);
    }
}

// 이미지 다운로드
function downloadImage() {
    if (currentModalImage) {
        const { image } = currentModalImage;
        
        const link = document.createElement('a');
        link.href = image.dataUrl;
        link.download = image.name || 'poka_image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('다운로드가 시작되었습니다', 'success');
    }
}

// 이미지 공유
function shareImage() {
    if (currentModalImage && navigator.share) {
        const { image } = currentModalImage;
        
        navigator.share({
            title: image.name || 'POKA V2 이미지',
            text: 'POKA V2로 만든 포토카드입니다',
            url: window.location.href
        }).then(() => {
            showToast('공유되었습니다', 'success');
        }).catch(() => {
            showToast('공유에 실패했습니다', 'error');
        });
    } else {
        // 공유 API가 지원되지 않는 경우 클립보드에 복사
        if (currentModalImage) {
            const { image } = currentModalImage;
            navigator.clipboard.writeText(image.dataUrl).then(() => {
                showToast('이미지 링크가 클립보드에 복사되었습니다', 'success');
            }).catch(() => {
                showToast('클립보드 복사에 실패했습니다', 'error');
            });
        }
    }
}

// 즐겨찾기 토글 (모달에서)
function toggleFavorite() {
    if (currentModalImage) {
        toggleImageFavorite(currentModalImage.index);
        closeImageModal();
    }
}

// 현재 이미지 삭제 (모달에서)
function deleteCurrentImage() {
    if (currentModalImage) {
        const { image, index } = currentModalImage;
        
        // 확인 다이얼로그 표시
        if (confirm('정말로 이 이미지를 삭제하시겠습니까?')) {
            // 원본 배열에서 제거
            const originalIndex = allImages.findIndex(img => img.id === image.id);
            if (originalIndex !== -1) {
                allImages.splice(originalIndex, 1);
            }
            
            // 저장
            saveImages();
            
            // 모달 닫기
            closeImageModal();
            
            // 갤러리 업데이트
            updateGallery();
            
            // 성공 메시지 표시
            showToast('이미지가 삭제되었습니다', 'success');
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

// 이미지 저장
function saveImages() {
    // 편집된 이미지와 업로드된 이미지를 분리하여 저장
    const editedImages = allImages.filter(img => img.type === 'edited');
    const uploadedImages = allImages.filter(img => img.type === 'uploaded');
    
    POKA.AppState.saveToStorage('editedImages', editedImages);
    POKA.AppState.saveToStorage('uploadedImages', uploadedImages);
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            if (currentModalImage) {
                deleteImage(currentModalImage.index);
                closeImageModal();
            }
            break;
        case 'Enter':
            if (currentModalImage) {
                editCurrentImage();
            }
            break;
        case 'Escape':
            closeImageModal();
            break;
    }
});

// 페이지 떠날 때 저장
window.addEventListener('beforeunload', () => {
    saveImages();
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
    POKA.Toast.success('인터넷 연결이 복구되었습니다');
});

window.addEventListener('offline', () => {
    POKA.Toast.warning('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.');
}); 