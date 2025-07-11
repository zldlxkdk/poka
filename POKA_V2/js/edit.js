// POKA V2 - 이미지 편집 페이지 JavaScript

// 전역 변수
let currentImage = null;
let originalImage = null;
let currentRotation = 0;
let currentFlipHorizontal = false;
let currentFlipVertical = false;
let currentFilter = 'none';
let isCropping = false;
let emojis = [];
let selectedEmoji = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let hasDragged = false; // 드래그 여부 추적

// 포토카드 관련 변수
let selectedFrontImage = null;
let selectedBackImage = null;
let uploadedImages = [];
let currentPhotoCard = null; // 현재 편집 중인 포토카드
let currentEditingSide = 'front'; // 현재 편집 중인 면 ('front' 또는 'back')
let frontImageEditState = null; // 앞면 이미지 편집 상태
let backImageEditState = null; // 뒷면 이미지 편집 상태

// 포토카드 편집 상태
let photoCardEditState = {
    front: {
        image: null,
        rotation: 0,
        flip: { horizontal: false, vertical: false },
        filter: 'none',
        emojis: []
    },
    back: {
        image: null,
        rotation: 0,
        flip: { horizontal: false, vertical: false },
        filter: 'none',
        emojis: []
    }
};

// 편집 모드 상태
let editMode = 'single'; // 'single' 또는 'photoCard'

// 현재 선택된 이미지 면
let currentSelectedSide = 'front'; // 'front' 또는 'back'

// 이미지 편집 상태 (기존 단일 이미지용)
let imageEditState = {
    rotation: 0,
    flip: { horizontal: false, vertical: false },
    filter: 'none',
    emojis: []
};

// DOM 요소들
const editImage = document.getElementById('editImage');
const imageFallback = document.getElementById('imageFallback');
const imageSelectionSection = document.getElementById('imageSelectionSection');
const editSection = document.getElementById('editSection');
const frontImageGrid = document.getElementById('frontImageGrid');
const backImageGrid = document.getElementById('backImageGrid');
const createPhotoCardBtn = document.getElementById('createPhotoCardBtn');
const photoCardNameInput = document.getElementById('photoCardNameInput');
const nameCounter = document.getElementById('nameCounter');
const photoCardEditControls = document.getElementById('photoCardEditControls');

// 새로운 이미지 선택 관련 DOM 요소들
const frontImageSelector = document.getElementById('frontImageSelector');
const backImageSelector = document.getElementById('backImageSelector');
const frontSelectedImage = document.getElementById('frontSelectedImage');
const backSelectedImage = document.getElementById('backSelectedImage');
const frontImageOverlay = document.getElementById('frontImageOverlay');
const backImageOverlay = document.getElementById('backImageOverlay');

// 이미지 편집 상태 클래스
class ImageEditState {
    constructor(imageDataUrl) {
        this.dataUrl = imageDataUrl;
        this.rotation = 0;
        this.flipHorizontal = false;
        this.flipVertical = false;
        this.filter = 'none';
        this.emojis = [];
        this.originalDataUrl = imageDataUrl;
    }
    
    // 편집 상태를 이미지에 적용
    applyToImage() {
        // 여기서는 간단히 원본 이미지를 사용
        // 실제로는 편집 상태를 적용한 이미지를 생성해야 함
        return this.dataUrl;
    }
    
    // 편집 상태 초기화
    reset() {
        this.rotation = 0;
        this.flipHorizontal = false;
        this.flipVertical = false;
        this.filter = 'none';
        this.emojis = [];
        this.dataUrl = this.originalDataUrl;
    }
}

// 이미지 업로드를 위한 선택 함수
function selectImageForUpload(side) {
    console.log('이미지 업로드 선택:', side);
    
    // 파일 입력 요소 생성
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    dataUrl: e.target.result,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString()
                };
                
                // 선택된 이미지 설정
                if (side === 'front') {
                    selectedFrontImage = imageData;
                    updateImageSelector('front', imageData);
                } else {
                    selectedBackImage = imageData;
                    updateImageSelector('back', imageData);
                }
                
                // 포토카드 만들기 버튼 상태 업데이트
                updateCreatePhotoCardButton();
                
                POKA.Toast.success(`${side === 'front' ? '앞면' : '뒷면'} 이미지가 선택되었습니다`);
            };
            reader.readAsDataURL(file);
        }
    };
    
    // 파일 선택 다이얼로그 열기
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// 이미지 선택기 업데이트
function updateImageSelector(side, imageData) {
    const selector = side === 'front' ? frontImageSelector : backImageSelector;
    const selectedImage = side === 'front' ? frontSelectedImage : backSelectedImage;
    const overlay = side === 'front' ? frontImageOverlay : backImageOverlay;
    const placeholder = selector.querySelector('.selector-placeholder');
    
    if (imageData) {
        // 이미지 표시
        selectedImage.src = imageData.dataUrl;
        selectedImage.style.display = 'block';
        overlay.style.display = 'flex';
        placeholder.style.display = 'none';
        
        // 선택자 스타일 업데이트
        selector.style.borderStyle = 'solid';
        selector.style.borderColor = 'var(--primary-color)';
    } else {
        // 이미지 숨기기
        selectedImage.style.display = 'none';
        overlay.style.display = 'none';
        placeholder.style.display = 'flex';
        
        // 선택자 스타일 초기화
        selector.style.borderStyle = 'dashed';
        selector.style.borderColor = 'var(--border-color)';
    }
}

// 선택된 이미지 편집
function editSelectedImage(side) {
    console.log('이미지 편집 시작:', side);
    
    const imageData = side === 'front' ? selectedFrontImage : selectedBackImage;
    
    if (!imageData) {
        POKA.Toast.warning('편집할 이미지가 없습니다');
        return;
    }
    
    // 현재 편집 중인 면 설정
    currentEditingSide = side;
    
    // 편집 섹션 표시
    editSection.style.display = 'block';
    
    // 편집 모드 헤더 표시
    const editModeHeader = document.getElementById('editModeHeader');
    if (editModeHeader) {
        editModeHeader.style.display = 'block';
    }
    
    // 편집 중인 면 텍스트 업데이트
    const editingSideText = document.getElementById('editingSideText');
    if (editingSideText) {
        editingSideText.textContent = `${side === 'front' ? '앞면' : '뒷면'} 편집 중`;
    }
    
    // 포토카드 편집 컨트롤 숨기기 (편집 중에는 숨김)
    photoCardEditControls.style.display = 'none';
    
    // 이미지 편집 상태 로드
    loadImageEditState(side);
    
    POKA.Toast.success(`${side === 'front' ? '앞면' : '뒷면'} 이미지 편집 모드로 전환되었습니다`);
}

// 포토카드 만들기 버튼 상태 업데이트
function updateCreatePhotoCardButton() {
    const canCreate = selectedFrontImage && selectedBackImage;
    
    createPhotoCardBtn.disabled = !canCreate;
    
    if (canCreate) {
        createPhotoCardBtn.innerHTML = '<span class="btn-icon">🎴</span><span class="btn-text">포토카드 만들기</span>';
    } else {
        createPhotoCardBtn.innerHTML = '<span class="btn-icon">⚠️</span><span class="btn-text">앞면과 뒷면 이미지를 선택하세요</span>';
    }
}

// 포토카드 생성
function createPhotoCard() {
    if (!selectedFrontImage || !selectedBackImage) {
        POKA.Toast.warning('앞면과 뒷면 이미지를 모두 선택해주세요');
        return;
    }
    
    console.log('포토카드 생성:', { 
        front: selectedFrontImage, 
        back: selectedBackImage 
    });
    
    // 포토카드 데이터 생성
    const photoCard = {
        id: Date.now() + Math.random(),
        name: `포토카드_${Date.now()}`,
        frontImage: selectedFrontImage.dataUrl,
        frontImageName: selectedFrontImage.name,
        backImage: selectedBackImage.dataUrl,
        backImageName: selectedBackImage.name,
        createdAt: new Date().toISOString(),
        favorite: false
    };
    
    // AppState에 저장
    POKA.AppState.currentPhotoCard = photoCard;
    POKA.AppState.saveToStorage('currentPhotoCard', photoCard);
    
    // 편집 모드로 전환
    loadPhotoCardForEdit(photoCard);
}

// 포토카드 편집 모드 로드
function loadPhotoCardForEdit(photoCard) {
    console.log('포토카드 편집 모드 로드:', photoCard);
    
    // 포토카드 정보 저장
    currentPhotoCard = photoCard;
    POKA.AppState.currentPhotoCard = photoCard; // AppState도 업데이트
    localStorage.setItem('currentPhotoCard', JSON.stringify(photoCard));

    // 이미지 선택 섹션 숨기기
    imageSelectionSection.style.display = 'none';
    
    // 편집 섹션 표시
    editSection.style.display = 'block';
    
    // 포토카드 동시 편집 모드 표시
    const photoCardSimultaneousEdit = document.getElementById('photoCardSimultaneousEdit');
    const singleImageEdit = document.getElementById('singleImageEdit');
    
    if (photoCardSimultaneousEdit) {
        photoCardSimultaneousEdit.style.display = 'block';
    }
    
    if (singleImageEdit) {
        singleImageEdit.style.display = 'none';
    }
    
    // 포토카드 이름 설정
    const nameInput = document.getElementById('photoCardNameEditInput');
    const nameCounter = document.getElementById('nameCounterEdit');
    
    if (nameInput) {
        nameInput.value = photoCard.name || '';
        if (nameCounter) {
            nameCounter.textContent = (photoCard.name || '').length;
        }
    }
    
    // 앞면 이미지 로드
    if (photoCard.frontImage) {
        console.log('앞면 이미지 데이터 확인:', {
            frontImageLength: photoCard.frontImage.length,
            frontImageStart: photoCard.frontImage.substring(0, 50),
            frontImageEnd: photoCard.frontImage.substring(photoCard.frontImage.length - 20)
        });
        
        photoCardEditState.front.image = photoCard.frontImage;
        const frontImage = document.getElementById('frontEditImage');
        const frontFallback = document.getElementById('frontImageFallback');
        
        if (frontImage && frontFallback) {
            frontImage.src = photoCard.frontImage;
            frontImage.style.display = 'block';
            frontFallback.style.display = 'none';
            
            // 저장된 편집 상태 적용
            if (photoCard.frontTransform) {
                photoCardEditState.front.rotation = photoCard.frontTransform.rotation || 0;
                photoCardEditState.front.flip = photoCard.frontTransform.flip || { horizontal: false, vertical: false };
            }
            if (photoCard.frontFilter) {
                photoCardEditState.front.filter = photoCard.frontFilter;
            }
            if (photoCard.frontEmojis) {
                photoCardEditState.front.emojis = photoCard.frontEmojis;
            }
            
            applyImageEditState('front');
            
            // 이모지 렌더링
            renderEmojisForSide('front');
            console.log('앞면 이미지 로드됨');
        }
    }
    
    // 뒷면 이미지 로드
    if (photoCard.backImage) {
        console.log('뒷면 이미지 데이터 확인:', {
            backImageLength: photoCard.backImage.length,
            backImageStart: photoCard.backImage.substring(0, 50),
            backImageEnd: photoCard.backImage.substring(photoCard.backImage.length - 20)
        });
        
        photoCardEditState.back.image = photoCard.backImage;
        const backImage = document.getElementById('backEditImage');
        const backFallback = document.getElementById('backImageFallback');
        
        if (backImage && backFallback) {
            backImage.src = photoCard.backImage;
            backImage.style.display = 'block';
            backFallback.style.display = 'none';
            
            // 저장된 편집 상태 적용
            if (photoCard.backTransform) {
                photoCardEditState.back.rotation = photoCard.backTransform.rotation || 0;
                photoCardEditState.back.flip = photoCard.backTransform.flip || { horizontal: false, vertical: false };
            }
            if (photoCard.backFilter) {
                photoCardEditState.back.filter = photoCard.backFilter;
            }
            if (photoCard.backEmojis) {
                photoCardEditState.back.emojis = photoCard.backEmojis;
            }
            
            applyImageEditState('back');
            
            // 이모지 렌더링
            renderEmojisForSide('back');
            console.log('뒷면 이미지 로드됨');
        }
    }
    
    // 이미지 클릭 이벤트 설정
    setupImageClickEvents();
    
    // 초기 선택 상태 설정
    updateImageSelectionState();
    
    POKA.Toast.success('포토카드 편집 모드로 전환되었습니다');
}

// 현재 이미지 로드
function loadCurrentImage() {
    console.log('AppState:', POKA.AppState);
    console.log('currentImage from AppState:', POKA.AppState.currentImage);
    
    // AppState에서 이미지 가져오기
    currentImage = POKA.AppState.currentImage;
    
    // AppState에 없으면 로컬 스토리지에서 직접 가져오기 시도
    if (!currentImage) {
        console.log('AppState에서 이미지를 찾을 수 없음, 로컬 스토리지에서 시도...');
        try {
            const storedImage = POKA.AppState.getFromStorage('currentImage');
            if (storedImage) {
                currentImage = storedImage;
                POKA.AppState.currentImage = storedImage;
                console.log('로컬 스토리지에서 이미지 복원됨:', currentImage);
            }
        } catch (error) {
            console.error('로컬 스토리지에서 이미지 로드 오류:', error);
        }
    }
    
    if (!currentImage) {
        console.error('편집할 이미지가 없습니다');
        console.log('AppState 전체:', POKA.AppState);
        
        // 테스트용 샘플 이미지 생성
        createSampleImage();
        return;
    }
    
    if (!currentImage.dataUrl) {
        console.error('이미지 데이터 URL이 없습니다:', currentImage);
        POKA.Toast.error('이미지 데이터를 찾을 수 없습니다. 이미지를 다시 선택해주세요.');
        setTimeout(() => {
            POKA.Navigation.goBack();
        }, 3000);
        return;
    }
    
    // 원본 이미지 저장 (깊은 복사)
    originalImage = JSON.parse(JSON.stringify(currentImage));
    
    // 포토카드 편집 컨트롤 숨기기 (일반 이미지 편집 모드)
    photoCardEditControls.style.display = 'none';
    
    // 편집 모드 헤더 숨기기 (일반 이미지 편집 모드)
    const editModeHeader = document.getElementById('editModeHeader');
    if (editModeHeader) {
        editModeHeader.style.display = 'none';
    }
    
    // 이미지 표시
    editImage.src = currentImage.dataUrl;
    editImage.style.display = 'block';
    imageFallback.style.display = 'none';
    
    // 이미지 로드 완료 대기
    editImage.onload = function() {
        console.log('일반 이미지 로드 완료');
        editImage.style.display = 'block';
        imageFallback.style.display = 'none';
        
        // 편집 상태 초기화
        currentRotation = 0;
        currentFlipHorizontal = false;
        currentFlipVertical = false;
        currentFilter = 'none';
        isCropping = false;
        emojis = currentImage.emojis || [];
        renderEmojis();
        
        // 필터 버튼 초기화
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 회전 슬라이더 초기화
        initRotationSlider();
        
        // 이미지 정보 표시
        console.log('편집할 이미지:', currentImage);
        console.log('원본 이미지 저장됨:', originalImage);
        console.log('이미지 데이터 URL 길이:', currentImage.dataUrl.length);
        
        // 성공 메시지
        POKA.Toast.success('이미지가 성공적으로 로드되었습니다');
    };
    
    editImage.onerror = function() {
        console.error('일반 이미지 로드 실패');
        editImage.style.display = 'none';
        imageFallback.style.display = 'flex';
        POKA.Toast.error('이미지 로드에 실패했습니다');
    };
}

// 테스트용 샘플 이미지 생성
function createSampleImage() {
    console.log('테스트용 샘플 이미지 생성');
    
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // 그라데이션 배경
    const gradient = ctx.createLinearGradient(0, 0, 400, 300);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(1, '#0099cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 300);
    
    // 텍스트 추가
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('POKA V2', 200, 120);
    ctx.font = '16px Arial';
    ctx.fillText('테스트 이미지', 200, 150);
    ctx.fillText('편집 기능 테스트용', 200, 180);
    
    const sampleDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    currentImage = {
        id: 'sample_' + Date.now(),
        name: '테스트 이미지',
        dataUrl: sampleDataUrl,
        size: sampleDataUrl.length * 0.75,
        type: 'image/jpeg',
        uploadedAt: new Date().toISOString()
    };
    
    originalImage = JSON.parse(JSON.stringify(currentImage));
    editImage.src = sampleDataUrl;
    
    console.log('샘플 이미지 생성됨:', currentImage);
    console.log('원본 이미지 저장됨:', originalImage);
    POKA.Toast.warning('테스트용 샘플 이미지가 로드되었습니다. 실제 이미지를 편집하려면 업로드나 갤러리에서 이미지를 선택해주세요.');
}

// URL 파라미터에서 이미지 로드
function loadFromUrl() {
    POKA.Toast.warning('URL 파라미터 방식은 더 이상 지원되지 않습니다. AppState를 사용합니다.');
    
    // AppState에서 이미지 다시 로드 시도
    currentImage = POKA.AppState.currentImage;
    
    if (currentImage && currentImage.dataUrl) {
        originalImage = JSON.parse(JSON.stringify(currentImage));
        editImage.src = currentImage.dataUrl;
        POKA.Toast.success('AppState에서 이미지를 성공적으로 로드했습니다');
    } else {
        POKA.Toast.error('AppState에서 이미지를 찾을 수 없습니다');
    }
}

// 회전 슬라이더 초기화
function initRotationSlider() {
    const rotationSlider = document.getElementById('rotationSlider');
    const rotationValue = document.getElementById('rotationValue');
    
    if (rotationSlider && rotationValue) {
        rotationSlider.value = currentRotation;
        rotationValue.textContent = currentRotation + '°';
        
        rotationSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            rotationValue.textContent = value + '°';
            currentRotation = value;
            applyImageTransform();
        });
    }
}

// 특정 각도로 회전 설정
function setRotation(degrees) {
    const rotationSlider = document.getElementById('rotationSlider');
    const rotationValue = document.getElementById('rotationValue');
    
    if (rotationSlider && rotationValue) {
        rotationSlider.value = degrees;
        rotationValue.textContent = degrees + '°';
    }
    
    currentRotation = degrees;
    applyImageTransform();
}

// 필터 적용
function applyFilter(filterType) {
    currentFilter = filterType;
    
    // 필터 버튼 활성화 상태 업데이트
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 현재 필터 버튼 활성화
    const activeBtn = document.querySelector(`[onclick="applyFilter('${filterType}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = editImage.naturalWidth;
    canvas.height = editImage.naturalHeight;
    
    // 이미지 그리기
    ctx.drawImage(editImage, 0, 0);
    
    // 필터 적용
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    switch (filterType) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            break;
            
        case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
            break;
            
        case 'blur':
            // 간단한 블러 효과 (가우시안 블러 대신 박스 블러)
            const blurRadius = 2;
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            
            // 원본 이미지를 임시 캔버스에 그리기
            tempCtx.drawImage(editImage, 0, 0);
            
            // 블러 효과 적용
            ctx.filter = `blur(${blurRadius}px)`;
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.filter = 'none';
            break;
            
        case 'brightness':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.3);
                data[i + 1] = Math.min(255, data[i + 1] * 1.3);
                data[i + 2] = Math.min(255, data[i + 2] * 1.3);
            }
            break;
            
        default:
            // 원본 - 필터 없음
            break;
    }
    
    if (filterType !== 'blur') {
        ctx.putImageData(imageData, 0, 0);
    }
    
    // 새로운 이미지 데이터 생성
    const newDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // 이미지 업데이트
    editImage.src = newDataUrl;
    currentImage.dataUrl = newDataUrl;
    
    // 포토카드 편집 모드에서 편집 상태 저장
    if (currentPhotoCard) {
        saveCurrentEditState();
    }
    
    POKA.Toast.success('필터가 적용되었습니다');
}

// 이미지 회전
function rotateImage(degrees) {
    if (degrees === 0) return;
    
    currentRotation += degrees;
    
    // 360도 범위로 정규화
    currentRotation = ((currentRotation % 360) + 360) % 360;
    
    applyImageTransform();
    
    // 슬라이더 업데이트
    const rotationSlider = document.getElementById('rotationSlider');
    const rotationValue = document.getElementById('rotationValue');
    
    if (rotationSlider && rotationValue) {
        rotationSlider.value = currentRotation;
        rotationValue.textContent = currentRotation + '°';
    }
    
    // 포토카드 편집 모드에서 편집 상태 저장
    if (currentPhotoCard) {
        saveCurrentEditState();
    }
    
    console.log('이미지 회전됨:', currentRotation + '°');
    POKA.Toast.success(`이미지가 ${currentRotation}°로 회전되었습니다`);
}

// 이미지 반전
function flipImage(direction) {
    if (direction === 'horizontal') {
        currentFlipHorizontal = !currentFlipHorizontal;
        POKA.Toast.success('이미지가 좌우 반전되었습니다');
    } else if (direction === 'vertical') {
        currentFlipVertical = !currentFlipVertical;
        POKA.Toast.success('이미지가 상하 반전되었습니다');
    }
    
    applyImageTransform();
    
    // 포토카드 편집 모드에서 편집 상태 저장
    if (currentPhotoCard) {
        saveCurrentEditState();
    }
}

// 이미지 변환 적용 (회전 + 반전)
function applyImageTransform() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 원본 이미지 크기
    const originalWidth = editImage.naturalWidth;
    const originalHeight = editImage.naturalHeight;
    
    // 회전된 크기 계산
    const rad = (currentRotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    
    // 회전된 이미지의 새로운 크기 계산
    const newWidth = Math.ceil(originalWidth * cos + originalHeight * sin);
    const newHeight = Math.ceil(originalWidth * sin + originalHeight * cos);
    
    // 캔버스 크기 설정 (이미지가 잘리지 않도록 여유 공간 확보)
    canvas.width = Math.max(newWidth, originalWidth) + 20;
    canvas.height = Math.max(newHeight, originalHeight) + 20;
    
    // 캔버스 중앙으로 이동
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // 회전 적용
    ctx.rotate(rad);
    
    // 반전 적용
    if (currentFlipHorizontal) {
        ctx.scale(-1, 1);
    }
    if (currentFlipVertical) {
        ctx.scale(1, -1);
    }
    
    // 이미지 그리기 (중앙 정렬)
    ctx.drawImage(editImage, -originalWidth / 2, -originalHeight / 2);
    
    // 새로운 이미지 데이터 생성
    const newDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // 이미지 업데이트
    editImage.src = newDataUrl;
    currentImage.dataUrl = newDataUrl;
}



// 이모지 관련 함수들

// 이모지 추가
function addEmoji(emoji) {
    const emojiLayer = document.getElementById('emojiLayer');
    const container = document.getElementById('imageContainer');
    
    // 컨테이너 중앙에 이모지 배치
    const rect = container.getBoundingClientRect();
    const x = (rect.width / 2) - 20; // 이모지 크기의 절반
    const y = (rect.height / 2) - 20;
    
    const emojiData = {
        id: Date.now() + Math.random(),
        emoji: emoji,
        x: x,
        y: y
    };
    
    emojis.push(emojiData);
    renderEmojis();
    
    // 포토카드 편집 모드에서 편집 상태 저장
    if (currentPhotoCard) {
        saveCurrentEditState();
    }
    
    POKA.Toast.success('이모지가 추가되었습니다. 드래그하여 위치를 조정하세요.');
}

// 이모지 렌더링
function renderEmojis() {
    const emojiLayer = document.getElementById('emojiLayer');
    
    if (!emojiLayer) {
        console.error('emojiLayer를 찾을 수 없습니다');
        return;
    }
    
    // 기존 이모지 요소들을 모두 제거
    const existingEmojis = emojiLayer.querySelectorAll('.emoji-item');
    existingEmojis.forEach(element => {
        element.remove();
    });
    
    console.log('이모지 렌더링 시작. 이모지 개수:', emojis.length);
    
    emojis.forEach(emojiData => {
        const emojiElement = document.createElement('div');
        emojiElement.className = 'emoji-item';
        emojiElement.textContent = emojiData.emoji;
        emojiElement.style.left = emojiData.x + 'px';
        emojiElement.style.top = emojiData.y + 'px';
        emojiElement.dataset.emojiId = String(emojiData.id); // ID를 문자열로 저장
        
        // 드래그 이벤트
        emojiElement.addEventListener('mousedown', startEmojiDrag);
        emojiElement.addEventListener('touchstart', startEmojiDrag);
        
        // 클릭 이벤트 (삭제)
        emojiElement.addEventListener('click', selectEmoji);
        
        emojiLayer.appendChild(emojiElement);
        console.log('이모지 요소 생성됨:', emojiData.emoji, 'ID:', emojiData.id);
    });
    
    console.log('이모지 렌더링 완료. 총 요소 수:', emojiLayer.children.length);
}

// 이모지 선택 (삭제)
function selectEmoji(event) {
    event.stopPropagation();
    event.preventDefault();
    
    // 드래그가 있었으면 삭제 팝업을 표시하지 않음
    if (hasDragged) {
        console.log('드래그가 있었으므로 삭제 팝업을 표시하지 않음');
        hasDragged = false;
        return;
    }
    
    const emojiId = event.target.dataset.emojiId;
    console.log('삭제하려는 이모지 ID:', emojiId);
    console.log('현재 이모지 목록:', emojis);
    
    // 이모지가 실제로 존재하는지 확인
    const emojiExists = emojis.some(e => String(e.id) === String(emojiId));
    if (!emojiExists) {
        console.error('이모지를 찾을 수 없습니다:', emojiId);
        POKA.Toast.error('이모지를 찾을 수 없습니다');
        return;
    }
    
    // 이모지 삭제 확인
    POKA.Modal.show(
        `<p>이 이모지를 삭제하시겠습니까?</p>`,
        {
            title: '이모지 삭제',
            buttons: [
                {
                    text: '삭제',
                    class: 'btn-danger',
                    onclick: () => {
                        console.log('삭제 버튼 클릭됨, ID:', emojiId);
                        const success = deleteEmoji(emojiId);
                        if (success) {
                            // 삭제 후 렌더링 업데이트
                            renderEmojis();
                        }
                    }
                },
                {
                    text: '취소',
                    class: 'btn-secondary'
                }
            ]
        }
    );
}

// 이모지 삭제 함수 (직접 호출용)
function deleteEmoji(emojiId) {
    console.log('deleteEmoji 함수 호출됨, ID:', emojiId);
    console.log('삭제 전 이모지 개수:', emojis.length);
    console.log('전체 이모지 배열:', emojis);
    
    // ID를 문자열로 통일하여 비교
    const targetId = String(emojiId);
    
    // 배열에서 이모지 찾기
    const index = emojis.findIndex(e => String(e.id) === targetId);
    
    console.log('찾은 인덱스:', index);
    console.log('타겟 ID:', targetId);
    console.log('배열의 ID들:', emojis.map(e => String(e.id)));
    
    if (index !== -1) {
        const deletedEmoji = emojis.splice(index, 1)[0];
        console.log('삭제된 이모지:', deletedEmoji);
        console.log('삭제 후 이모지 개수:', emojis.length);
        
        // DOM에서도 직접 제거
        const emojiElement = document.querySelector(`[data-emoji-id="${emojiId}"]`);
        if (emojiElement) {
            emojiElement.remove();
            console.log('DOM에서 이모지 요소 제거됨');
        } else {
            console.log('DOM에서 이모지 요소를 찾을 수 없음, 전체 렌더링으로 업데이트');
        }
        
        // 포토카드 편집 모드에서 편집 상태 저장
        if (currentPhotoCard) {
            saveCurrentEditState();
        }
        
        POKA.Toast.success('이모지가 삭제되었습니다');
        return true;
    } else {
        console.error('이모지를 찾을 수 없습니다. ID:', emojiId);
        console.error('사용 가능한 ID들:', emojis.map(e => e.id));
        POKA.Toast.error('이모지를 찾을 수 없습니다');
        return false;
    }
}



// 이모지 드래그 시작
function startEmojiDrag(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const emojiElement = event.target;
    const emojiId = emojiElement.dataset.emojiId;
    const emojiData = emojis.find(e => String(e.id) === String(emojiId));
    
    if (!emojiData) {
        console.error('드래그할 이모지 데이터를 찾을 수 없습니다:', emojiId);
        return;
    }
    
    selectedEmoji = emojiData;
    isDragging = true;
    hasDragged = false; // 드래그 시작 시 초기화
    
    // 드래그 오프셋 계산
    const rect = emojiElement.getBoundingClientRect();
    const clientX = event.clientX || event.touches[0].clientX;
    const clientY = event.clientY || event.touches[0].clientY;
    
    dragOffset.x = clientX - rect.left;
    dragOffset.y = clientY - rect.top;
    
    emojiElement.classList.add('dragging');
    
    console.log('드래그 시작:', emojiData.emoji, 'ID:', emojiId);
    
    // 드래그 이벤트 리스너 추가
    document.addEventListener('mousemove', onEmojiDrag);
    document.addEventListener('touchmove', onEmojiDrag);
    document.addEventListener('mouseup', stopEmojiDrag);
    document.addEventListener('touchend', stopEmojiDrag);
}

// 이모지 드래그 중
function onEmojiDrag(event) {
    if (!isDragging || !selectedEmoji) return;
    
    event.preventDefault();
    
    // 드래그가 발생했음을 표시
    hasDragged = true;
    
    const container = document.getElementById('imageContainer');
    const rect = container.getBoundingClientRect();
    const clientX = event.clientX || event.touches[0].clientX;
    const clientY = event.clientY || event.touches[0].clientY;
    
    // 새로운 위치 계산
    let newX = clientX - rect.left - dragOffset.x;
    let newY = clientY - rect.top - dragOffset.y;
    
    // 경계 제한
    newX = Math.max(0, Math.min(newX, rect.width - 40));
    newY = Math.max(0, Math.min(newY, rect.height - 40));
    
    // 이모지 데이터 업데이트
    selectedEmoji.x = newX;
    selectedEmoji.y = newY;
    
    // DOM 업데이트
    const emojiElement = document.querySelector(`[data-emoji-id="${String(selectedEmoji.id)}"]`);
    if (emojiElement) {
        emojiElement.style.left = newX + 'px';
        emojiElement.style.top = newY + 'px';
    }
}

// 이모지 드래그 종료
function stopEmojiDrag() {
    if (selectedEmoji) {
        const emojiElement = document.querySelector(`[data-emoji-id="${String(selectedEmoji.id)}"]`);
        if (emojiElement) {
            emojiElement.classList.remove('dragging');
        }
    }
    
    console.log('드래그 종료, hasDragged:', hasDragged);
    
    isDragging = false;
    selectedEmoji = null;
    
    // 이벤트 리스너 제거
    document.removeEventListener('mousemove', onEmojiDrag);
    document.removeEventListener('touchmove', onEmojiDrag);
    document.removeEventListener('mouseup', stopEmojiDrag);
    document.removeEventListener('touchend', stopEmojiDrag);
    
    // 드래그가 있었으면 편집 상태 저장
    if (hasDragged) {
        // 포토카드 편집 모드에서 편집 상태 저장
        if (currentPhotoCard) {
            saveCurrentEditState();
        }
        
        setTimeout(() => {
            hasDragged = false;
            console.log('hasDragged가 false로 설정됨');
        }, 200); // 시간을 조금 더 늘림
    }
}

// 모든 이모지 삭제
function clearAllEmojis() {
    if (emojis.length === 0) {
        POKA.Toast.info('삭제할 이모지가 없습니다');
        return;
    }
    
    POKA.Modal.show(
        `<p>모든 이모지를 삭제하시겠습니까?</p>`,
        {
            title: '모든 이모지 삭제',
            buttons: [
                {
                    text: '삭제',
                    class: 'btn-danger',
                    onclick: () => {
                        console.log('모든 이모지 삭제 버튼 클릭됨');
                        console.log('삭제 전 이모지 개수:', emojis.length);
                        
                        // 배열을 완전히 비우기
                        emojis = [];
                        console.log('배열 초기화 후 이모지 개수:', emojis.length);
                        
                        // DOM에서도 직접 제거
                        const emojiLayer = document.getElementById('emojiLayer');
                        if (emojiLayer) {
                            const existingEmojis = emojiLayer.querySelectorAll('.emoji-item');
                            existingEmojis.forEach(element => {
                                element.remove();
                            });
                            console.log('DOM에서 모든 이모지 요소 제거됨');
                        }
                        
                        // 렌더링 업데이트
                        renderEmojis();
                        
                        // 포토카드 편집 모드에서 편집 상태 저장
                        if (currentPhotoCard) {
                            saveCurrentEditState();
                        }
                        
                        console.log('최종 이모지 개수:', emojis.length);
                        POKA.Toast.success('모든 이모지가 삭제되었습니다');
                    }
                },
                {
                    text: '취소',
                    class: 'btn-secondary'
                }
            ]
        }
    );
}

// 이미지 초기화
function resetImage() {
    console.log('resetImage 호출됨');
    console.log('originalImage:', originalImage);
    
    if (!originalImage) {
        console.error('원본 이미지가 없습니다');
        POKA.Toast.error('원본 이미지를 찾을 수 없습니다');
        return;
    }
    
    if (!originalImage.dataUrl) {
        console.error('원본 이미지 데이터 URL이 없습니다');
        POKA.Toast.error('원본 이미지 데이터를 찾을 수 없습니다');
        return;
    }
    
    // 현재 이미지를 원본으로 복원
    currentImage = { ...originalImage };
    editImage.src = originalImage.dataUrl;
    
    // 편집 상태 초기화
    currentRotation = 0;
    currentFlipHorizontal = false;
    currentFlipVertical = false;
    currentFilter = 'none';
    isCropping = false;
    emojis = []; // 이모지도 초기화
    renderEmojis(); // 이모지 렌더링 업데이트
    
    // 필터 버튼 초기화
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 회전 슬라이더 초기화
    initRotationSlider();
    
    console.log('이미지 초기화 완료:', currentImage);
    POKA.Toast.success('이미지가 원본으로 초기화되었습니다');
}

// 이미지 저장
function saveImage() {
    if (!currentImage) {
        POKA.Toast.error('저장할 이미지가 없습니다');
        return;
    }
    
    // 포토카드 편집 모드인지 확인
    const currentPhotoCard = POKA.AppState.getFromStorage('currentPhotoCard');
    if (currentPhotoCard) {
        savePhotoCard(currentPhotoCard);
        return;
    }
    
    // 일반 이미지 저장
    saveRegularImage();
}

// 포토카드 저장
function savePhotoCard(photoCard) {
    // 이모지가 포함된 이미지 생성
    createImageWithEmojis().then(mergedImageDataUrl => {
        // 포토카드 정보 업데이트
        photoCard.frontImage = mergedImageDataUrl;
        photoCard.emojis = [...emojis];
        photoCard.updatedAt = new Date().toISOString();
        
        // 로컬 스토리지에 저장
        const savedPhotoCards = POKA.AppState.getFromStorage('photoCards') || [];
        
        // 기존 포토카드가 있으면 업데이트, 없으면 새로 추가
        const existingIndex = savedPhotoCards.findIndex(card => card.id === photoCard.id);
        if (existingIndex !== -1) {
            savedPhotoCards[existingIndex] = photoCard;
        } else {
            savedPhotoCards.unshift(photoCard);
        }
        
        // 최대 100개까지만 저장
        if (savedPhotoCards.length > 100) {
            savedPhotoCards.splice(100);
        }
        
        POKA.AppState.saveToStorage('photoCards', savedPhotoCards);
        
        POKA.Toast.success('포토카드가 저장되었습니다');
        
        // 갤러리로 이동
        setTimeout(() => {
            POKA.Navigation.navigateTo('gallery.html');
        }, 1500);
    }).catch(error => {
        console.error('포토카드 저장 오류:', error);
        POKA.Toast.error('포토카드 저장 중 오류가 발생했습니다');
    });
}

// 일반 이미지 저장
function saveRegularImage() {
    // 이모지가 포함된 이미지 생성
    createImageWithEmojis().then(mergedImageDataUrl => {
        // 편집된 이미지 정보 업데이트
        currentImage.createdAt = new Date().toISOString();
        currentImage.type = 'edited';
        currentImage.dataUrl = mergedImageDataUrl;
        currentImage.emojis = [...emojis]; // 이모지 데이터도 저장
        
        // 로컬 스토리지에 저장
        const editedImages = POKA.AppState.getFromStorage('editedImages') || [];
        editedImages.unshift(currentImage);
        
        // 최대 100개까지만 저장
        if (editedImages.length > 100) {
            editedImages.splice(100);
        }
        
        POKA.AppState.saveToStorage('editedImages', editedImages);
        
        POKA.Toast.success('이미지가 저장되었습니다');
        
        // 갤러리로 이동
        setTimeout(() => {
            POKA.Navigation.navigateTo('gallery.html');
        }, 1500);
    }).catch(error => {
        console.error('이미지 저장 오류:', error);
        POKA.Toast.error('이미지 저장 중 오류가 발생했습니다');
    });
}

// 이모지가 포함된 이미지 생성
function createImageWithEmojis() {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // 캔버스 크기를 이미지 크기로 설정
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            // 이미지 그리기
            ctx.drawImage(img, 0, 0);
            
            // 이모지 그리기
            if (emojis.length > 0) {
                const container = document.getElementById('imageContainer');
                const containerRect = container.getBoundingClientRect();
                const imgRect = editImage.getBoundingClientRect();
                
                // 스케일 계산 (실제 이미지 크기와 표시 크기의 비율)
                const scaleX = img.naturalWidth / imgRect.width;
                const scaleY = img.naturalHeight / imgRect.height;
                
                emojis.forEach(emojiData => {
                    // 이모지 위치를 실제 이미지 좌표로 변환
                    const emojiX = (emojiData.x - imgRect.left + containerRect.left) * scaleX;
                    const emojiY = (emojiData.y - imgRect.top + containerRect.top) * scaleY;
                    
                    // 이모지 크기 설정
                    const emojiSize = 40 * Math.min(scaleX, scaleY);
                    ctx.font = `${emojiSize}px Arial`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    
                    // 이모지 그리기
                    ctx.fillText(emojiData.emoji, emojiX, emojiY);
                });
            }
            
            // 최종 이미지 데이터 URL 생성
            const mergedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(mergedImageDataUrl);
        };
        
        img.onerror = () => {
            reject(new Error('이미지 로드에 실패했습니다'));
        };
        
        img.src = currentImage.dataUrl;
    });
}

// 디버그 정보 표시
function debugInfo() {
    const debugInfo = `
        <div style="text-align: left; font-family: monospace; font-size: 12px;">
            <p><strong>POKA 객체:</strong> ${window.POKA ? '존재함' : '없음'}</p>
            <p><strong>AppState:</strong> ${window.POKA?.AppState ? '존재함' : '없음'}</p>
            <p><strong>currentImage:</strong> ${currentImage ? '설정됨' : '없음'}</p>
            <p><strong>originalImage:</strong> ${originalImage ? '설정됨' : '없음'}</p>
            <p><strong>editImage.src:</strong> ${editImage.src ? '설정됨' : '없음'}</p>
            <p><strong>currentRotation:</strong> ${currentRotation}°</p>
            <p><strong>currentFilter:</strong> ${currentFilter}</p>
            <p><strong>isCropping:</strong> ${isCropping}</p>
            <p><strong>이모지 개수:</strong> ${emojis.length}</p>
            <p><strong>isDragging:</strong> ${isDragging}</p>
            <p><strong>hasDragged:</strong> ${hasDragged}</p>
            <p><strong>editImage.naturalWidth:</strong> ${editImage.naturalWidth || '로드 안됨'}</p>
            <p><strong>editImage.naturalHeight:</strong> ${editImage.naturalHeight || '로드 안됨'}</p>
            <br>
            <p><strong>포토카드 관련:</strong></p>
            <p><strong>selectedFrontImage:</strong> ${selectedFrontImage ? '선택됨' : '없음'}</p>
            <p><strong>selectedBackImage:</strong> ${selectedBackImage ? '선택됨' : '없음'}</p>
            <p><strong>uploadedImages 개수:</strong> ${uploadedImages.length}</p>
            <p><strong>imageSelectionSection 표시:</strong> ${imageSelectionSection.style.display}</p>
            <p><strong>editSection 표시:</strong> ${editSection.style.display}</p>
            <br>
            <p><strong>이모지 목록:</strong></p>
            <pre>${JSON.stringify(emojis, null, 2)}</pre>
            <br>
            <p><strong>AppState.currentImage:</strong></p>
            <pre>${JSON.stringify(window.POKA?.AppState?.currentImage, null, 2)}</pre>
            <br>
            <p><strong>AppState.currentPhotoCard:</strong></p>
            <pre>${JSON.stringify(window.POKA?.AppState?.getFromStorage('currentPhotoCard'), null, 2)}</pre>
            <br>
            <p><strong>업로드된 이미지:</strong></p>
            <pre>${JSON.stringify(uploadedImages, null, 2)}</pre>
        </div>
    `;
    
    POKA.Modal.show(debugInfo, {
        title: '디버그 정보',
        buttons: [
            {
                text: '이미지 선택 모드 강제 실행',
                class: 'btn-primary',
                onclick: () => {
                    showImageSelectionMode();
                    POKA.Toast.success('이미지 선택 모드가 강제로 실행되었습니다');
                }
            },
            {
                text: '업로드된 이미지 새로고침',
                class: 'btn-secondary',
                onclick: () => {
                    loadUploadedImages();
                    renderImageGrids();
                    POKA.Toast.success('업로드된 이미지가 새로고침되었습니다');
                }
            },
            {
                text: '닫기',
                class: 'btn-secondary'
            }
        ]
    });
}

// 이미지 다운로드
function downloadImage() {
    if (!currentImage) {
        POKA.Toast.error('다운로드할 이미지가 없습니다');
        return;
    }
    
    const link = document.createElement('a');
    link.href = currentImage.dataUrl;
    link.download = `poka_edited_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    POKA.Toast.success('다운로드가 시작되었습니다');
}

// 페이지 떠날 때 확인
window.addEventListener('beforeunload', (e) => {
    if (currentImage && JSON.stringify(currentImage) !== JSON.stringify(originalImage)) {
        e.preventDefault();
        e.returnValue = '편집 내용이 저장되지 않았습니다. 정말 나가시겠습니까?';
    }
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
    POKA.Toast.success('인터넷 연결이 복구되었습니다');
});

window.addEventListener('offline', () => {
    POKA.Toast.warning('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.');
}); 

// 이미지 선택 모드 표시
function showImageSelectionMode() {
    console.log('이미지 선택 모드 표시');
    
    // 섹션 표시/숨김
    imageSelectionSection.style.display = 'block';
    editSection.style.display = 'none';
    
    // 포토카드 편집 컨트롤 숨기기
    photoCardEditControls.style.display = 'none';
    
    // 선택 상태 초기화
    selectedFrontImage = null;
    selectedBackImage = null;
    
    // 이름 입력 필드 초기화
    if (photoCardNameInput) {
        photoCardNameInput.value = '';
        updateNameCounter();
    }
    
    // 업로드된 이미지 로드
    loadUploadedImages();
    
    // 이미지 그리드 렌더링
    renderImageGrids();
    
    // 버튼 상태 업데이트
    updateCreatePhotoCardButton();
    
    console.log('이미지 선택 모드 초기화 완료');
}

// 업로드된 이미지 로드
function loadUploadedImages() {
    const savedImages = POKA.AppState.getFromStorage('uploadedImages') || [];
    uploadedImages = savedImages;
    console.log('업로드된 이미지 로드:', uploadedImages.length);
    console.log('업로드된 이미지 데이터:', uploadedImages);
}

// 이미지 그리드 렌더링
function renderImageGrids() {
    console.log('이미지 그리드 렌더링 시작');
    console.log('업로드된 이미지 개수:', uploadedImages.length);
    
    // 앞면 이미지 그리드
    frontImageGrid.innerHTML = '';
    uploadedImages.forEach((image, index) => {
        const gridItem = createImageGridItem(image, index, 'front');
        frontImageGrid.appendChild(gridItem);
    });
    
    // 뒷면 이미지 그리드
    backImageGrid.innerHTML = '';
    uploadedImages.forEach((image, index) => {
        const gridItem = createImageGridItem(image, index, 'back');
        backImageGrid.appendChild(gridItem);
    });
    
    // 이미지가 없을 경우 안내 메시지
    if (uploadedImages.length === 0) {
        frontImageGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">업로드된 이미지가 없습니다</p>';
        backImageGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">업로드된 이미지가 없습니다</p>';
        
        // 업로드 페이지로 이동하는 버튼 추가
        const uploadButton = document.createElement('button');
        uploadButton.className = 'btn btn-primary';
        uploadButton.innerHTML = '<span class="btn-icon">📤</span>이미지 업로드하기';
        uploadButton.onclick = () => POKA.Navigation.navigateTo('upload.html');
        uploadButton.style.marginTop = '10px';
        
        frontImageGrid.appendChild(uploadButton);
    }
    
    console.log('이미지 그리드 렌더링 완료');
}

// 이미지 그리드 아이템 생성
function createImageGridItem(image, index, type) {
    console.log(`그리드 아이템 생성: ${type}, 인덱스: ${index}`, image);
    
    const item = document.createElement('div');
    item.className = 'image-grid-item';
    item.dataset.imageIndex = index;
    item.dataset.imageType = type;
    
    item.innerHTML = `
        <img src="${image.dataUrl}" alt="${image.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="image-fallback">🖼️</div>
    `;
    
    // 클릭 이벤트
    item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`이미지 선택됨: ${type}, 인덱스: ${index}`, image);
        selectImageForPhotoCard(image, type);
    });
    
    return item;
}

// 포토카드용 이미지 선택
function selectImageForPhotoCard(image, type) {
    console.log('이미지 선택:', type, image);
    
    if (type === 'front') {
        selectedFrontImage = image;
        // 앞면 이미지 그리드에서 선택 표시
        frontImageGrid.querySelectorAll('.image-grid-item').forEach(item => {
            item.classList.remove('selected');
        });
        // 클릭된 아이템 찾기
        const clickedItem = frontImageGrid.querySelector(`[data-image-index="${uploadedImages.indexOf(image)}"]`);
        if (clickedItem) {
            clickedItem.classList.add('selected');
        }
    } else {
        selectedBackImage = image;
        // 뒷면 이미지 그리드에서 선택 표시
        backImageGrid.querySelectorAll('.image-grid-item').forEach(item => {
            item.classList.remove('selected');
        });
        // 클릭된 아이템 찾기
        const clickedItem = backImageGrid.querySelector(`[data-image-index="${uploadedImages.indexOf(image)}"]`);
        if (clickedItem) {
            clickedItem.classList.add('selected');
        }
    }
    
    // 포토카드 만들기 버튼 활성화 확인
    updateCreatePhotoCardButton();
}

// 이미지 편집 상태 로드
function loadImageEditState(side) {
    console.log('이미지 편집 상태 로드:', side);
    
    let editState;
    
    if (side === 'front') {
        editState = frontImageEditState;
        currentImage = {
            id: currentPhotoCard.id + '_front',
            name: currentPhotoCard.name + ' (앞면)',
            dataUrl: currentPhotoCard.frontImage,
            createdAt: currentPhotoCard.createdAt
        };
    } else {
        editState = backImageEditState;
        currentImage = {
            id: currentPhotoCard.id + '_back',
            name: currentPhotoCard.name + ' (뒷면)',
            dataUrl: currentPhotoCard.backImage,
            createdAt: currentPhotoCard.createdAt
        };
    }
    
    console.log('로드할 이미지:', currentImage);
    
    // 편집 상태 적용
    if (editState) {
        currentRotation = editState.rotation;
        currentFlipHorizontal = editState.flipHorizontal;
        currentFlipVertical = editState.flipVertical;
        currentFilter = editState.filter;
        emojis = [...editState.emojis];
        console.log('기존 편집 상태 적용:', editState);
    } else {
        // 새로운 편집 상태 생성
        currentRotation = 0;
        currentFlipHorizontal = false;
        currentFlipVertical = false;
        currentFilter = 'none';
        emojis = [];
        console.log('새로운 편집 상태 생성');
    }
    
    // 이미지 표시
    console.log('이미지 src 설정:', currentImage.dataUrl);
    editImage.src = currentImage.dataUrl;
    editImage.style.display = 'block';
    imageFallback.style.display = 'none';
    
    // 이미지 로드 완료 대기
    editImage.onload = function() {
        console.log('포토카드 이미지 로드 완료:', side);
        console.log('이미지 크기:', editImage.naturalWidth, 'x', editImage.naturalHeight);
        editImage.style.display = 'block';
        imageFallback.style.display = 'none';
        
        // 편집 상태 초기화
        renderEmojis();
        
        // 필터 버튼 초기화
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 현재 필터 버튼 활성화
        if (currentFilter !== 'none') {
            const activeBtn = document.querySelector(`[onclick="applyFilter('${currentFilter}')"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        }
        
        // 회전 슬라이더 초기화
        initRotationSlider();
        
        // 편집 상태 적용 (회전, 반전 등)
        if (currentRotation !== 0 || currentFlipHorizontal || currentFlipVertical) {
            applyImageTransform();
        }
        
        POKA.Toast.success(`${side === 'front' ? '앞면' : '뒷면'} 이미지가 로드되었습니다`);
    };
    
    editImage.onerror = function() {
        console.error('포토카드 이미지 로드 실패:', side);
        console.error('실패한 이미지 src:', currentImage.dataUrl);
        editImage.style.display = 'none';
        imageFallback.style.display = 'flex';
        POKA.Toast.error('이미지 로드에 실패했습니다');
    };
    
    // 이미지가 이미 로드되어 있는 경우 (캐시된 경우)
    if (editImage.complete && editImage.naturalWidth > 0) {
        console.log('이미지가 이미 로드되어 있음:', side);
        editImage.onload();
    }
}

// 포토카드 편집 모드로 전환
function enterPhotoCardEditMode() {
    editMode = 'photoCard';
    
    // 포토카드 동시 편집 화면 표시
    document.getElementById('photoCardSimultaneousEdit').style.display = 'block';
    document.getElementById('singleImageEdit').style.display = 'none';
    
    // 포토카드 데이터 로드
    loadPhotoCardData();
    
    // 이미지 선택 이벤트 설정
    document.getElementById('frontImageEditContainer')?.addEventListener('click', function() {
        selectImageForEdit('front');
    });
    
    document.getElementById('backImageEditContainer')?.addEventListener('click', function() {
        selectImageForEdit('back');
    });
    
    // 키보드 단축키
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    savePhotoCard();
                    break;
                case 'z':
                    e.preventDefault();
                    // 실행 취소 기능 (필요시 구현)
                    break;
            }
        }
    });
}

// 포토카드 데이터 로드
function loadPhotoCardData() {
    console.log('포토카드 데이터 로드 시작');
    
    const photoCardData = JSON.parse(localStorage.getItem('currentPhotoCardData') || '{}');
    console.log('로드된 포토카드 데이터:', photoCardData);
    
    // 포토카드 이름 로드
    const photoCardName = localStorage.getItem('currentPhotoCardName') || '';
    const nameInput = document.getElementById('photoCardNameEditInput');
    const nameCounter = document.getElementById('nameCounterEdit');
    
    if (nameInput) {
        nameInput.value = photoCardName;
        nameCounter.textContent = photoCardName.length;
        
        // 이름 입력 이벤트 리스너 추가
        nameInput.addEventListener('input', function() {
            const length = this.value.length;
            nameCounter.textContent = length;
            localStorage.setItem('currentPhotoCardName', this.value);
        });
    }
    
    // 앞면 이미지 처리
    if (photoCardData.frontImage) {
        photoCardEditState.front.image = photoCardData.frontImage;
        const frontImage = document.getElementById('frontEditImage');
        const frontFallback = document.getElementById('frontImageFallback');
        
        frontImage.src = photoCardData.frontImage;
        frontImage.style.display = 'block';
        frontFallback.style.display = 'none';
        
        console.log('앞면 이미지 로드됨');
    } else {
        photoCardEditState.front.image = null;
        const frontImage = document.getElementById('frontEditImage');
        const frontFallback = document.getElementById('frontImageFallback');
        
        frontImage.style.display = 'none';
        frontFallback.style.display = 'flex';
        
        console.log('앞면 이미지 없음');
    }
    
    // 뒷면 이미지 처리
    if (photoCardData.backImage) {
        photoCardEditState.back.image = photoCardData.backImage;
        const backImage = document.getElementById('backEditImage');
        const backFallback = document.getElementById('backImageFallback');
        
        backImage.src = photoCardData.backImage;
        backImage.style.display = 'block';
        backFallback.style.display = 'none';
        
        console.log('뒷면 이미지 로드됨');
    } else {
        photoCardEditState.back.image = null;
        const backImage = document.getElementById('backEditImage');
        const backFallback = document.getElementById('backImageFallback');
        
        backImage.style.display = 'none';
        backFallback.style.display = 'flex';
        
        console.log('뒷면 이미지 없음');
    }
    
    // 이미지 클릭 이벤트 추가
    setupImageClickEvents();
    
    // 초기 선택 상태 설정
    updateImageSelectionState();
    
    console.log('포토카드 데이터 로드 완료');
}

// 이미지 클릭 이벤트 설정
function setupImageClickEvents() {
    const frontContainer = document.getElementById('frontImageEditContainer');
    const backContainer = document.getElementById('backImageEditContainer');
    
    frontContainer.onclick = function(e) {
        if (e.target === frontContainer || e.target.id === 'frontImageFallback') {
            selectImageForUpload('front');
        }
    };
    
    backContainer.onclick = function(e) {
        if (e.target === backContainer || e.target.id === 'backImageFallback') {
            selectImageForUpload('back');
        }
    };
}

// 이미지 업로드 선택
function selectImageForUpload(side) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                photoCardEditState[side].image = imageData;
                
                const imageElement = document.getElementById(side === 'front' ? 'frontEditImage' : 'backEditImage');
                const fallbackElement = document.getElementById(side === 'front' ? 'frontImageFallback' : 'backImageFallback');
                
                imageElement.src = imageData;
                imageElement.style.display = 'block';
                fallbackElement.style.display = 'none';
                
                // 편집 상태 초기화
                resetImageEdit(side);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// 이미지 편집 초기화
function resetImageEdit(side) {
    photoCardEditState[side] = {
        image: photoCardEditState[side].image,
        rotation: 0,
        flip: { horizontal: false, vertical: false },
        filter: 'none',
        emojis: []
    };
    
    applyImageEditState(side);
    clearEmojisEdit(side);
}

// 이미지 편집 상태 적용
function applyImageEditState(side) {
    const imageElement = document.getElementById(side === 'front' ? 'frontEditImage' : 'backEditImage');
    const state = photoCardEditState[side];
    
    // 회전 적용
    let transform = `rotate(${state.rotation}deg)`;
    
    // 뒤집기 적용
    if (state.flip.horizontal) {
        transform += ' scaleX(-1)';
    }
    if (state.flip.vertical) {
        transform += ' scaleY(-1)';
    }
    
    imageElement.style.transform = transform;
    
    // 필터 적용
    let filter = '';
    switch (state.filter) {
        case 'grayscale':
            filter = 'grayscale(100%)';
            break;
        case 'sepia':
            filter = 'sepia(100%)';
            break;
        case 'brightness':
            filter = 'brightness(150%)';
            break;
        default:
            filter = 'none';
    }
    imageElement.style.filter = filter;
}

// 이미지 회전
function rotateImageEdit(side, angle) {
    photoCardEditState[side].rotation += angle;
    applyImageEditState(side);
}

// 이미지 뒤집기
function flipImageEdit(side, direction) {
    if (direction === 'horizontal') {
        photoCardEditState[side].flip.horizontal = !photoCardEditState[side].flip.horizontal;
    } else if (direction === 'vertical') {
        photoCardEditState[side].flip.vertical = !photoCardEditState[side].flip.vertical;
    }
    applyImageEditState(side);
}

// 필터 적용
function applyFilterEdit(side, filter) {
    photoCardEditState[side].filter = filter;
    applyImageEditState(side);
    
    // 필터 버튼 활성화 상태 업데이트
    const container = document.getElementById(side === 'front' ? 'frontImageEditContainer' : 'backImageEditContainer');
    const filterButtons = container.parentElement.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === filter || (filter === 'none' && btn.textContent === '원본')) {
            btn.classList.add('active');
        }
    });
}

// 이모지 삭제 확인 모달 관련 변수
let emojiToDelete = null;
let emojiToDeleteSide = null;

// 이모지 추가
function addEmojiEdit(side, emoji) {
    if (!currentSelectedSide || currentSelectedSide !== side) {
        alert('먼저 편집할 이미지를 선택해주세요.');
        return;
    }
    
    const emojiLayer = document.getElementById(side === 'front' ? 'frontEmojiLayer' : 'backEmojiLayer');
    if (!emojiLayer) return;
    
    const emojiId = Date.now() + Math.random();
    const emojiElement = document.createElement('div');
    emojiElement.className = 'emoji';
    emojiElement.textContent = emoji;
    emojiElement.dataset.emojiId = emojiId;
    emojiElement.dataset.side = side;
    emojiElement.style.left = '50%';
    emojiElement.style.top = '50%';
    emojiElement.style.transform = 'translate(-50%, -50%)';
    
    // 이모지 더블클릭 이벤트 (삭제 확인)
    emojiElement.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        showDeleteConfirmModal(emojiElement, side);
    });
    
    // 드래그 기능 추가
    makeDraggable(emojiElement);
    
    emojiLayer.appendChild(emojiElement);
    
    // 상태에 이모지 데이터 추가
    const emojiData = {
        id: emojiId,
        emoji: emoji,
        x: 50, // 중앙 위치
        y: 50
    };
    
    if (!photoCardEditState[side].emojis) {
        photoCardEditState[side].emojis = [];
    }
    photoCardEditState[side].emojis.push(emojiData);
}

// 삭제 확인 모달 표시
function showDeleteConfirmModal(emojiElement, side) {
    emojiToDelete = emojiElement;
    emojiToDeleteSide = side;
    
    const modal = document.createElement('div');
    modal.className = 'delete-confirm-modal';
    modal.innerHTML = `
        <div class="delete-confirm-content">
            <h3>이모지 삭제</h3>
            <p>선택한 이모지를 삭제하시겠습니까?</p>
            <div class="delete-confirm-buttons">
                <button class="btn btn-cancel" onclick="closeDeleteConfirmModal()">취소</button>
                <button class="btn btn-delete" onclick="confirmDeleteEmoji()">삭제</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDeleteConfirmModal();
        }
    });
}

// 삭제 확인 모달 닫기
function closeDeleteConfirmModal() {
    const modal = document.querySelector('.delete-confirm-modal');
    if (modal) {
        modal.remove();
    }
    emojiToDelete = null;
    emojiToDeleteSide = null;
}

// 이모지 삭제 확인
function confirmDeleteEmoji() {
    if (emojiToDelete && emojiToDeleteSide) {
        const emojiId = emojiToDelete.dataset.emojiId;
        emojiToDelete.remove();
        
        // 상태에서도 제거
        if (photoCardEditState[emojiToDeleteSide].emojis) {
            const emojiIndex = photoCardEditState[emojiToDeleteSide].emojis.findIndex(emoji => emoji.id === emojiId);
            if (emojiIndex > -1) {
                photoCardEditState[emojiToDeleteSide].emojis.splice(emojiIndex, 1);
            }
        }
    }
    closeDeleteConfirmModal();
}

// 이모지 상태 가져오기
function getEmojiState(side) {
    const emojiLayer = document.getElementById(side === 'front' ? 'frontEmojiLayer' : 'backEmojiLayer');
    if (!emojiLayer) return [];
    
    const emojis = [];
    emojiLayer.querySelectorAll('.emoji').forEach(emoji => {
        const rect = emoji.getBoundingClientRect();
        const containerRect = emojiLayer.getBoundingClientRect();
        
        emojis.push({
            id: emoji.dataset.emojiId || Date.now() + Math.random(),
            emoji: emoji.textContent,
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top
        });
    });
    
    return emojis;
}

// 이미지 변환 상태 가져오기
function getImageTransform(side) {
    const image = document.getElementById(side === 'front' ? 'frontEditImage' : 'backEditImage');
    if (!image) return { rotation: 0, flipHorizontal: false, flipVertical: false };
    
    const transform = image.style.transform || '';
    const rotation = photoCardEditState[side]?.rotation || 0;
    const flipHorizontal = photoCardEditState[side]?.flip?.horizontal || false;
    const flipVertical = photoCardEditState[side]?.flip?.vertical || false;
    
    return { rotation, flipHorizontal, flipVertical };
}

// 이미지 필터 상태 가져오기
function getImageFilter(side) {
    return photoCardEditState[side]?.filter || 'none';
}

// 이모지 전체 삭제
function clearEmojisEdit(side) {
    if (!currentSelectedSide || currentSelectedSide !== side) {
        alert('먼저 편집할 이미지를 선택해주세요.');
        return;
    }
    
    const emojiLayer = document.getElementById(side === 'front' ? 'frontEmojiLayer' : 'backEmojiLayer');
    if (!emojiLayer) return;
    
    if (emojiLayer.children.length === 0) {
        alert('삭제할 이모지가 없습니다.');
        return;
    }
    
    if (confirm('모든 이모지를 삭제하시겠습니까?')) {
        emojiLayer.innerHTML = '';
        photoCardEditState[side].emojis = [];
    }
}

// 포토카드 저장
async function savePhotoCard() {
    console.log('포토카드 저장 시작');
    
    const nameInput = document.getElementById('photoCardNameEditInput');
    const photoCardName = nameInput ? nameInput.value.trim() : '';
    
    if (!photoCardName) {
        console.log('포토카드 이름이 없음');
        alert('포토카드 이름을 입력해주세요.');
        nameInput?.focus();
        return;
    }
    
    const frontImage = document.getElementById('frontEditImage').src;
    const backImage = document.getElementById('backEditImage').src;
    
    console.log('이미지 상태 확인:', {
        frontImage: frontImage ? frontImage.substring(0, 50) + '...' : '없음',
        backImage: backImage ? backImage.substring(0, 50) + '...' : '없음'
    });
    
    if (!frontImage || frontImage === 'data:,' || frontImage === '') {
        console.log('앞면 이미지 없음');
        alert('앞면 이미지를 선택해주세요.');
        return;
    }
    
    if (!backImage || backImage === 'data:,' || backImage === '') {
        console.log('뒷면 이미지 없음');
        alert('뒷면 이미지를 선택해주세요.');
        return;
    }
    
    try {
        console.log('이미지 캡처 시작');
        const frontCanvas = await captureImageWithEmojis('front');
        const backCanvas = await captureImageWithEmojis('back');
        
        console.log('캡처 완료, 포토카드 데이터 생성');
        
        // 캡처된 이미지 데이터 확인
        const frontImageData = frontCanvas.toDataURL();
        const backImageData = backCanvas.toDataURL();
        
        console.log('캡처된 이미지 데이터 확인:', {
            frontImageLength: frontImageData.length,
            backImageLength: backImageData.length,
            frontImageStart: frontImageData.substring(0, 50),
            backImageStart: backImageData.substring(0, 50),
            frontImageEnd: frontImageData.substring(frontImageData.length - 20),
            backImageEnd: backImageData.substring(backImageData.length - 20)
        });
        
        // 현재 편집 중인 포토카드가 있는지 확인
        const isEditing = currentPhotoCard && currentPhotoCard.id;
        const photoCardId = isEditing ? currentPhotoCard.id : Date.now().toString();
        
        const photoCardData = {
            name: photoCardName,
            frontImage: frontImageData,
            backImage: backImageData,
            frontEmojis: getEmojiState('front'),
            backEmojis: getEmojiState('back'),
            frontTransform: getImageTransform('front'),
            backTransform: getImageTransform('back'),
            frontFilter: getImageFilter('front'),
            backFilter: getImageFilter('back'),
            createdAt: isEditing ? currentPhotoCard.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            id: photoCardId,
            type: 'photoCard'
        };
        
        console.log('포토카드 데이터 생성 완료:', {
            name: photoCardData.name,
            id: photoCardData.id,
            createdAt: photoCardData.createdAt,
            isEditing: isEditing
        });
        
        // localStorage에 저장
        console.log('localStorage에 저장 시작');
        let photoCards = JSON.parse(localStorage.getItem('photoCards') || '[]');
        photoCards = photoCards.filter(card => card.id !== photoCardData.id);
        photoCards.push(photoCardData);
        localStorage.setItem('photoCards', JSON.stringify(photoCards));
        
        let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
        gallery = gallery.filter(card => card.id !== photoCardData.id);
        gallery.push(photoCardData);
        localStorage.setItem('gallery', JSON.stringify(gallery));
        
        console.log('localStorage 저장 완료:', {
            photoCardsCount: photoCards.length,
            galleryCount: gallery.length
        });
        
        // 편집 상태 초기화
        localStorage.removeItem('photoCardEditState');
        localStorage.removeItem('photoCardNameEdit');
        localStorage.removeItem('currentPhotoCard');
        
        console.log('저장 완료, 갤러리로 이동');
        alert('포토카드가 성공적으로 저장되었습니다!');
        
        // 갤러리로 이동 (강제 새로고침)
        setTimeout(() => {
            window.location.replace('gallery.html');
        }, 100);
        
    } catch (error) {
        console.error('포토카드 저장 중 오류:', error);
        alert('포토카드 저장 중 오류가 발생했습니다: ' + error.message);
    }
}

// 이미지와 이모지를 캡처
function captureImageWithEmojis(side) {
    return new Promise((resolve) => {
        const container = document.getElementById(side === 'front' ? 'frontImageEditContainer' : 'backImageEditContainer');
        const imageElement = document.getElementById(side === 'front' ? 'frontEditImage' : 'backEditImage');
        const emojiLayer = document.getElementById(side === 'front' ? 'frontEmojiLayer' : 'backEmojiLayer');
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 원본 이미지 크기로 캔버스 설정
        const img = new Image();
        img.onload = function() {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            // 배경을 흰색으로 설정
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 이미지가 없는 경우 빈 캔버스 반환
            if (!imageElement.src || imageElement.style.display === 'none') {
                resolve(canvas);
                return;
            }
            
            // 원본 이미지 그리기
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // 변환 적용
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            
            // 회전 적용
            const rotation = photoCardEditState[side].rotation * Math.PI / 180;
            ctx.rotate(rotation);
            
            // 뒤집기 적용
            const scaleX = photoCardEditState[side].flip.horizontal ? -1 : 1;
            const scaleY = photoCardEditState[side].flip.vertical ? -1 : 1;
            ctx.scale(scaleX, scaleY);
            
            // 필터 적용
            if (photoCardEditState[side].filter === 'grayscale') {
                ctx.filter = 'grayscale(100%)';
            } else if (photoCardEditState[side].filter === 'sepia') {
                ctx.filter = 'sepia(100%)';
            } else if (photoCardEditState[side].filter === 'brightness') {
                ctx.filter = 'brightness(150%)';
            }
            
            ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            ctx.restore();
            
            // 이모지 그리기 - 원본 이미지 비율에 맞게 위치 조정
            const emojis = emojiLayer.querySelectorAll('.emoji');
            emojis.forEach(emoji => {
                const rect = emoji.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // 컨테이너 대비 원본 이미지 비율 계산
                const containerWidth = container.offsetWidth;
                const containerHeight = container.offsetHeight;
                const scaleX = canvas.width / containerWidth;
                const scaleY = canvas.height / containerHeight;
                
                const x = (rect.left - containerRect.left) * scaleX;
                const y = (rect.top - containerRect.top) * scaleY;
                
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(emoji.textContent, x, y);
            });
            
            resolve(canvas);
        };
        
        img.onerror = function() {
            console.error('이미지 로드 실패:', imageElement.src);
            resolve(canvas);
        };
        
        img.src = imageElement.src;
    });
}

// 이미지 선택 함수
function selectImageForEdit(side) {
    console.log('이미지 선택:', side);
    currentSelectedSide = side;
    
    // 선택 상태 업데이트
    updateImageSelectionState();
}

// 이미지 선택 상태 업데이트
function updateImageSelectionState() {
    const frontPanel = document.getElementById('frontPanel');
    const backPanel = document.getElementById('backPanel');
    const frontContainer = document.getElementById('frontImageEditContainer');
    const backContainer = document.getElementById('backImageEditContainer');
    
    // 모든 패널에서 선택 상태 제거
    frontPanel.classList.remove('selected');
    backPanel.classList.remove('selected');
    frontContainer.classList.remove('selected');
    backContainer.classList.remove('selected');
    
    // 현재 선택된 면에 선택 상태 추가
    if (currentSelectedSide === 'front') {
        frontPanel.classList.add('selected');
        frontContainer.classList.add('selected');
    } else {
        backPanel.classList.add('selected');
        backContainer.classList.add('selected');
    }
    
    console.log('현재 선택된 면:', currentSelectedSide);
}

// 갤러리에서 업로드
function uploadFromGallery(side) {
    console.log('갤러리에서 업로드 시작:', side);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('선택된 파일:', file.name, file.size, file.type);
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                const imageElement = document.getElementById(side === 'front' ? 'frontEditImage' : 'backEditImage');
                
                if (imageElement) {
                    loadImageWithFallback(imageElement, imageData, side)
                        .then(() => {
                            photoCardEditState[side].image = imageData;
                            resetImageEdit(side);
                            selectImageForEdit(side);
                            POKA.Toast.success(`${side === 'front' ? '앞면' : '뒷면'} 이미지가 업로드되었습니다`);
                        })
                        .catch((error) => {
                            console.error('이미지 로드 중 오류:', error);
                            POKA.Toast.error('이미지 로드에 실패했습니다.');
                        });
                } else {
                    console.error('이미지 엘리먼트를 찾을 수 없습니다:', side);
                    POKA.Toast.error('이미지 엘리먼트를 찾을 수 없습니다.');
                }
            };
            
            reader.onerror = function() {
                console.error('파일 읽기 실패');
                POKA.Toast.error('파일을 읽을 수 없습니다.');
            };
            
            reader.readAsDataURL(file);
        } else {
            console.log('파일이 선택되지 않았습니다.');
        }
    };
    
    input.click();
}

// 카메라 촬영 함수 개선
function takePhoto(side) {
    console.log('카메라 촬영 시작:', side);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('촬영된 파일:', file.name, file.size, file.type);
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                const imageElement = document.getElementById(side === 'front' ? 'frontEditImage' : 'backEditImage');
                
                if (imageElement) {
                    loadImageWithFallback(imageElement, imageData, side)
                        .then(() => {
                            photoCardEditState[side].image = imageData;
                            resetImageEdit(side);
                            selectImageForEdit(side);
                            POKA.Toast.success(`${side === 'front' ? '앞면' : '뒷면'} 사진이 촬영되었습니다`);
                        })
                        .catch((error) => {
                            console.error('이미지 로드 중 오류:', error);
                            POKA.Toast.error('이미지 로드에 실패했습니다.');
                        });
                } else {
                    console.error('이미지 엘리먼트를 찾을 수 없습니다:', side);
                    POKA.Toast.error('이미지 엘리먼트를 찾을 수 없습니다.');
                }
            };
            
            reader.onerror = function() {
                console.error('파일 읽기 실패');
                POKA.Toast.error('파일을 읽을 수 없습니다.');
            };
            
            reader.readAsDataURL(file);
        } else {
            console.log('파일이 촬영되지 않았습니다.');
        }
    };
    
    input.click();
}

// 요소를 드래그 가능하게 만드는 함수
function makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    element.addEventListener('mousedown', dragStart);
    element.addEventListener('touchstart', dragStart);

    function dragStart(e) {
        e.preventDefault();
        
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === element) {
            isDragging = true;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, element);
            
            // 포토카드 편집 모드에서 이모지 위치 업데이트
            if (element.classList.contains('emoji')) {
                const side = element.dataset.side;
                const emojiId = element.dataset.emojiId;
                
                if (side && emojiId && photoCardEditState[side] && photoCardEditState[side].emojis) {
                    const emojiData = photoCardEditState[side].emojis.find(emoji => emoji.id === emojiId);
                    if (emojiData) {
                        emojiData.x = currentX;
                        emojiData.y = currentY;
                    }
                }
            }
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
}

// 현재 편집 상태 저장
function saveCurrentEditState() {
    if (!currentPhotoCard) return;
    
    const editState = {
        rotation: currentRotation,
        flipHorizontal: currentFlipHorizontal,
        flipVertical: currentFlipVertical,
        filter: currentFilter,
        emojis: [...emojis]
    };
    
    if (currentEditingSide === 'front') {
        frontImageEditState = editState;
        console.log('앞면 편집 상태 저장:', editState);
    } else {
        backImageEditState = editState;
        console.log('뒷면 편집 상태 저장:', editState);
    }
} 

// 포토카드 이름 입력 이벤트 처리
function setupPhotoCardNameEdit() {
    const nameInput = document.getElementById('photoCardNameEditInput');
    const nameCounter = document.getElementById('nameCounterEdit');
    
    if (nameInput && nameCounter) {
        nameInput.addEventListener('input', function() {
            const currentLength = this.value.length;
            nameCounter.textContent = currentLength;
            
            // 글자 수에 따른 카운터 색상 변경
            if (currentLength >= 45) {
                nameCounter.style.color = '#dc3545';
            } else if (currentLength >= 35) {
                nameCounter.style.color = '#ffc107';
            } else {
                nameCounter.style.color = '#667eea';
            }
            
            // 상태 저장
            saveCurrentEditState();
        });
        
        // 기존 이름 로드
        const savedName = localStorage.getItem('photoCardNameEdit');
        if (savedName) {
            nameInput.value = savedName;
            nameCounter.textContent = savedName.length;
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('편집 페이지 로드됨');
    
    // 포토카드 이름 입력 설정
    setupPhotoCardNameEdit();
    
    // 이미지 폴백 메시지 업데이트
    updateImageFallbackMessages();
    
    // POKA 객체 확인
    const checkPOKA = () => {
        if (typeof POKA === 'undefined') {
            console.error('POKA 객체가 로드되지 않았습니다');
            setTimeout(checkPOKA, 100);
            return;
        }
        
        console.log('POKA 객체 확인됨:', POKA);
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // 현재 이미지 또는 포토카드 로드
        loadCurrentImageOrPhotoCard();
    };
    
    checkPOKA();
});

// 이미지 폴백 메시지 업데이트
function updateImageFallbackMessages() {
    const frontFallback = document.getElementById('frontImageFallback');
    const backFallback = document.getElementById('backImageFallback');
    
    if (frontFallback) {
        frontFallback.innerHTML = `
            <div class="upload-options">
                <button class="upload-btn" onclick="event.stopPropagation(); uploadFromGallery('front')">
                    <span class="btn-icon">🖼️</span>
                    <span class="btn-text">갤러리에서 선택</span>
                </button>
                <button class="upload-btn" onclick="event.stopPropagation(); takePhoto('front')">
                    <span class="btn-icon">📷</span>
                    <span class="btn-text">카메라로 촬영</span>
                </button>
            </div>
        `;
    }
    
    if (backFallback) {
        backFallback.innerHTML = `
            <div class="upload-options">
                <button class="upload-btn" onclick="event.stopPropagation(); uploadFromGallery('back')">
                    <span class="btn-icon">🖼️</span>
                    <span class="btn-text">갤러리에서 선택</span>
                </button>
                <button class="upload-btn" onclick="event.stopPropagation(); takePhoto('back')">
                    <span class="btn-icon">📷</span>
                    <span class="btn-text">카메라로 촬영</span>
                </button>
            </div>
        `;
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 회전 슬라이더 이벤트
    const rotationSlider = document.getElementById('rotationSlider');
    if (rotationSlider) {
        rotationSlider.addEventListener('input', function() {
            setRotation(parseInt(this.value));
        });
    }
    
    // 이미지 컨테이너 클릭 이벤트 (이모지 추가)
    const imageContainer = document.getElementById('imageContainer');
    if (imageContainer) {
        imageContainer.addEventListener('click', function(e) {
            if (e.target === this || e.target === editImage) {
                // 이미지 클릭 시 이모지 추가 (중앙에)
                const rect = this.getBoundingClientRect();
                const x = (rect.width / 2) - 20;
                const y = (rect.height / 2) - 20;
                
                const emojiData = {
                    id: Date.now() + Math.random(),
                    emoji: '😊',
                    x: x,
                    y: y
                };
                
                emojis.push(emojiData);
                renderEmojis();
                
                // 포토카드 편집 모드에서 편집 상태 저장
                if (currentPhotoCard) {
                    saveCurrentEditState();
                }
                
                POKA.Toast.success('이모지가 추가되었습니다. 드래그하여 위치를 조정하세요.');
            }
        });
    }
}

// 현재 이미지 또는 포토카드 로드
function loadCurrentImageOrPhotoCard() {
    console.log('이미지 또는 포토카드 로드 시작');
    
    // 포토카드 편집 모드인지 확인 (localStorage에서 직접 확인)
    try {
        const currentPhotoCardData = localStorage.getItem('currentPhotoCard');
        if (currentPhotoCardData) {
            const currentPhotoCard = JSON.parse(currentPhotoCardData);
            console.log('포토카드 편집 모드:', currentPhotoCard);
            loadPhotoCardForEdit(currentPhotoCard);
            return;
        }
    } catch (error) {
        console.error('포토카드 데이터 파싱 오류:', error);
    }
    
    // AppState에서도 확인
    const currentPhotoCard = POKA.AppState.getFromStorage('currentPhotoCard');
    if (currentPhotoCard) {
        console.log('AppState에서 포토카드 편집 모드:', currentPhotoCard);
        loadPhotoCardForEdit(currentPhotoCard);
        return;
    }
    
    // 일반 이미지 편집 모드인지 확인
    const currentImage = POKA.AppState.getFromStorage('currentImage');
    if (currentImage) {
        console.log('일반 이미지 편집 모드:', currentImage);
        loadCurrentImage();
        return;
    }
    
    // 둘 다 없는 경우 포토카드 동시 편집 모드로 전환
    console.log('포토카드 동시 편집 모드로 전환');
    
    // 이미지 선택 섹션 숨기기
    const imageSelectionSection = document.getElementById('imageSelectionSection');
    if (imageSelectionSection) {
        imageSelectionSection.style.display = 'none';
    }
    
    // 편집 섹션 표시
    editSection.style.display = 'block';
    
    // 포토카드 동시 편집 모드 표시
    const photoCardSimultaneousEdit = document.getElementById('photoCardSimultaneousEdit');
    const singleImageEdit = document.getElementById('singleImageEdit');
    
    if (photoCardSimultaneousEdit) {
        photoCardSimultaneousEdit.style.display = 'block';
    }
    
    if (singleImageEdit) {
        singleImageEdit.style.display = 'none';
    }
    
    // 포토카드 데이터 로드
    loadPhotoCardData();
}

// 포토카드 동시 편집 모드 표시
function showPhotoCardCreationMode() {
    console.log('포토카드 동시 편집 모드 표시');
    
    // 이미지 선택 섹션 숨기기
    const imageSelectionSection = document.getElementById('imageSelectionSection');
    if (imageSelectionSection) {
        imageSelectionSection.style.display = 'none';
        console.log('이미지 선택 섹션 숨김');
    }
    
    // 편집 섹션 표시
    editSection.style.display = 'block';
    console.log('편집 섹션 표시됨');
    
    // 편집 모드 헤더 숨기기
    const editModeHeader = document.getElementById('editModeHeader');
    if (editModeHeader) {
        editModeHeader.style.display = 'none';
        console.log('편집 모드 헤더 숨김');
    }
    
    // 포토카드 동시 편집 모드 표시
    const photoCardSimultaneousEdit = document.getElementById('photoCardSimultaneousEdit');
    const singleImageEdit = document.getElementById('singleImageEdit');
    
    if (photoCardSimultaneousEdit) {
        photoCardSimultaneousEdit.style.display = 'block';
        console.log('포토카드 동시 편집 모드 표시됨');
    } else {
        console.error('photoCardSimultaneousEdit 요소를 찾을 수 없습니다');
    }
    
    if (singleImageEdit) {
        singleImageEdit.style.display = 'none';
        console.log('단일 이미지 편집 모드 숨김');
    } else {
        console.error('singleImageEdit 요소를 찾을 수 없습니다');
    }
    
    // 포토카드 데이터 로드
    loadPhotoCardData();
    
    console.log('포토카드 동시 편집 모드 초기화 완료');
} 

// 이미지 로딩 상태 개선
function loadImageWithFallback(imageElement, imageData, side) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = function() {
            imageElement.src = imageData;
            imageElement.style.display = 'block';
            const fallbackElement = document.getElementById(side === 'front' ? 'frontImageFallback' : 'backImageFallback');
            if (fallbackElement) {
                fallbackElement.style.display = 'none';
            }
            console.log(`${side} 이미지 로드 성공:`, imageData.substring(0, 50) + '...');
            resolve(true);
        };
        
        img.onerror = function() {
            console.error(`${side} 이미지 로드 실패:`, imageData.substring(0, 50) + '...');
            const fallbackElement = document.getElementById(side === 'front' ? 'frontImageFallback' : 'backImageFallback');
            if (fallbackElement) {
                fallbackElement.style.display = 'flex';
            }
            imageElement.style.display = 'none';
            reject(new Error('이미지 로드 실패'));
        };
        
        img.src = imageData;
    });
}

// 특정 면의 이모지 렌더링
function renderEmojisForSide(side) {
    const emojiLayer = document.getElementById(side === 'front' ? 'frontEmojiLayer' : 'backEmojiLayer');
    if (!emojiLayer) {
        console.error(`${side} 이모지 레이어를 찾을 수 없습니다`);
        return;
    }
    
    // 기존 이모지 제거
    emojiLayer.innerHTML = '';
    
    // 저장된 이모지들 렌더링
    const emojis = photoCardEditState[side].emojis || [];
    emojis.forEach(emojiData => {
        const emojiElement = document.createElement('div');
        emojiElement.className = 'emoji';
        emojiElement.textContent = emojiData.emoji;
        emojiElement.style.left = emojiData.x + 'px';
        emojiElement.style.top = emojiData.y + 'px';
        emojiElement.dataset.emojiId = emojiData.id;
        emojiElement.dataset.side = side;
        
        // 드래그 가능하게 만들기
        makeDraggable(emojiElement);
        
        // 삭제 이벤트 추가
        emojiElement.addEventListener('dblclick', function() {
            showDeleteConfirmModal(this, side);
        });
        
        emojiLayer.appendChild(emojiElement);
    });
    
    console.log(`${side} 면 이모지 렌더링 완료:`, emojis.length);
} 