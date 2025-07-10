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
const frontToggleBtn = document.getElementById('frontToggleBtn');
const backToggleBtn = document.getElementById('backToggleBtn');
const currentImageInfo = document.getElementById('currentImageInfo');

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

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('편집 페이지 로드됨');
    
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

// 이벤트 리스너 설정
function setupEventListeners() {
    // 회전 슬라이더 이벤트
    const rotationSlider = document.getElementById('rotationSlider');
    if (rotationSlider) {
        rotationSlider.addEventListener('input', function() {
            setRotation(parseInt(this.value));
        });
    }
    
    // 포토카드 이름 입력 이벤트
    if (photoCardNameInput) {
        photoCardNameInput.addEventListener('input', function() {
            updateNameCounter();
            updateCreatePhotoCardButton();
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
                
                POKA.Toast.success('이모지가 추가되었습니다. 드래그하여 위치를 조정하세요.');
            }
        });
    }

    // 포토카드 편집 모드에서 앞면/뒷면 토글 버튼 이벤트
    if (frontToggleBtn) {
        frontToggleBtn.addEventListener('click', switchToFrontImage);
    }
    if (backToggleBtn) {
        backToggleBtn.addEventListener('click', switchToBackImage);
    }
}

// 현재 이미지 또는 포토카드 로드
function loadCurrentImageOrPhotoCard() {
    console.log('이미지 또는 포토카드 로드 시작');
    
    // 포토카드 편집 모드인지 확인
    const currentPhotoCard = POKA.AppState.getFromStorage('currentPhotoCard');
    if (currentPhotoCard) {
        console.log('포토카드 편집 모드:', currentPhotoCard);
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
    
    // 둘 다 없는 경우 이미지 선택 모드로 전환
    console.log('이미지 선택 모드로 전환');
    
    // 업로드된 이미지가 있는지 확인
    const uploadedImages = POKA.AppState.getFromStorage('uploadedImages') || [];
    if (uploadedImages.length === 0) {
        console.log('업로드된 이미지가 없음, 업로드 페이지로 안내');
        POKA.Toast.warning('편집할 이미지가 없습니다. 먼저 이미지를 업로드해주세요.');
        setTimeout(() => {
            POKA.Navigation.navigateTo('upload.html');
        }, 2000);
        return;
    }
    
    showImageSelectionMode();
}

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

// 포토카드 만들기 버튼 상태 업데이트
function updateCreatePhotoCardButton() {
    const canCreate = selectedFrontImage && selectedBackImage;
    const hasName = photoCardNameInput && photoCardNameInput.value.trim().length > 0;
    
    createPhotoCardBtn.disabled = !canCreate || !hasName;
    
    if (canCreate && hasName) {
        createPhotoCardBtn.innerHTML = '<span class="btn-icon">🎴</span>포토카드 만들기';
    } else if (!canCreate) {
        createPhotoCardBtn.innerHTML = '<span class="btn-icon">⚠️</span>앞면과 뒷면 이미지를 선택하세요';
    } else if (!hasName) {
        createPhotoCardBtn.innerHTML = '<span class="btn-icon">⚠️</span>포토카드 이름을 입력하세요';
    }
}

// 포토카드 생성
function createPhotoCard() {
    if (!selectedFrontImage || !selectedBackImage) {
        POKA.Toast.warning('앞면과 뒷면 이미지를 모두 선택해주세요');
        return;
    }
    
    const photoCardName = photoCardNameInput.value.trim();
    if (!photoCardName) {
        POKA.Toast.warning('포토카드 이름을 입력해주세요');
        return;
    }
    
    console.log('포토카드 생성:', { 
        name: photoCardName,
        front: selectedFrontImage, 
        back: selectedBackImage 
    });
    
    // 포토카드 데이터 생성
    const photoCard = {
        id: Date.now() + Math.random(),
        name: photoCardName,
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

    // 토글 버튼 상태 초기화
    frontToggleBtn.classList.add('active');
    backToggleBtn.classList.remove('active');

    // 현재 이미지 정보 업데이트
    currentImageInfo.querySelector('.info-text').textContent = '현재 편집 중: 앞면';

    // 이미지 선택 섹션 숨기기
    imageSelectionSection.style.display = 'none';
    editSection.style.display = 'block';
    
    // 포토카드 편집 컨트롤 표시
    photoCardEditControls.style.display = 'block';
    
    // 앞면 이미지로 전환
    switchToFrontImage();
    
    // 편집 상태 초기화
    frontImageEditState = null; // 새로운 편집 시작
    backImageEditState = null;

    // 편집 상태 초기화
    currentRotation = 0;
    currentFlipHorizontal = false;
    currentFlipVertical = false;
    currentFilter = 'none';
    isCropping = false;
    emojis = photoCard.emojis || [];
    renderEmojis();
    
    // 필터 버튼 초기화
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 회전 슬라이더 초기화
    initRotationSlider();
    
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

// 앞면 이미지로 전환
function switchToFrontImage() {
    if (!currentPhotoCard) return;
    
    console.log('앞면 이미지로 전환');
    currentEditingSide = 'front';
    
    // 토글 버튼 상태 업데이트
    frontToggleBtn.classList.add('active');
    backToggleBtn.classList.remove('active');
    
    // 현재 이미지 정보 업데이트
    currentImageInfo.querySelector('.info-text').textContent = '현재 편집 중: 앞면';
    
    // 앞면 이미지 편집 상태 로드
    loadImageEditState('front');
    
    POKA.Toast.success('앞면 이미지 편집 모드로 전환되었습니다');
}

// 뒷면 이미지로 전환
function switchToBackImage() {
    if (!currentPhotoCard) return;
    
    console.log('뒷면 이미지로 전환');
    currentEditingSide = 'back';
    
    // 토글 버튼 상태 업데이트
    backToggleBtn.classList.add('active');
    frontToggleBtn.classList.remove('active');
    
    // 현재 이미지 정보 업데이트
    currentImageInfo.querySelector('.info-text').textContent = '현재 편집 중: 뒷면';
    
    // 뒷면 이미지 편집 상태 로드
    loadImageEditState('back');
    
    POKA.Toast.success('뒷면 이미지 편집 모드로 전환되었습니다');
}

// 이미지 편집 상태 로드
function loadImageEditState(side) {
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
    
    // 편집 상태 적용
    if (editState) {
        currentRotation = editState.rotation;
        currentFlipHorizontal = editState.flipHorizontal;
        currentFlipVertical = editState.flipVertical;
        currentFilter = editState.filter;
        emojis = [...editState.emojis];
    } else {
        // 새로운 편집 상태 생성
        currentRotation = 0;
        currentFlipHorizontal = false;
        currentFlipVertical = false;
        currentFilter = 'none';
        emojis = [];
    }
    
    // 이미지 표시
    editImage.src = currentImage.dataUrl;
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