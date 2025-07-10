// POKA V2 - 업로드 페이지 JavaScript

// 전역 변수
let uploadedImages = [];
let isUploading = false;
let isFileInputProcessing = false; // 파일 입력 처리 중 플래그 추가

// DOM 요소들
const uploadArea = document.getElementById('uploadArea');
const dragDropOverlay = document.getElementById('dragDropOverlay');
const fileInput = document.getElementById('fileInput');
const cameraInput = document.getElementById('cameraInput');
const previewSection = document.getElementById('previewSection');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');

document.addEventListener('DOMContentLoaded', () => {
    console.log('POKA V2 Upload page loaded');
    
    // 드래그 앤 드롭 이벤트 설정
    setupDragAndDrop();
    
    // 파일 입력 이벤트 설정
    setupFileInputs();
    
    // 기존 이미지 복원
    restoreUploadedImages();
});

// 드래그 앤 드롭 설정
function setupDragAndDrop() {
    // 드래그 오버 이벤트
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
        dragDropOverlay.classList.add('show');
    });
    
    // 드래그 리브 이벤트
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (!uploadArea.contains(e.relatedTarget)) {
            uploadArea.classList.remove('dragover');
            dragDropOverlay.classList.remove('show');
        }
    });
    
    // 드롭 이벤트
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        dragDropOverlay.classList.remove('show');
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
            handleFiles(imageFiles);
        } else {
            POKA.Toast.error('이미지 파일만 업로드할 수 있습니다');
        }
    });
    
    // 클릭으로 파일 선택 - 중복 이벤트 방지를 위해 제거
    // uploadArea.addEventListener('click', (e) => {
    //     if (e.target === uploadArea || e.target.closest('.upload-placeholder')) {
    //         fileInput.click();
    //     }
    // });
}

// 파일 입력 설정
function setupFileInputs() {
    fileInput.addEventListener('change', (e) => {
        if (isFileInputProcessing) return; // 중복 처리 방지
        
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            isFileInputProcessing = true;
            handleFiles(files).finally(() => {
                // 파일 처리 완료 후 초기화 - 더 안전한 방법
                setTimeout(() => {
                    try {
                        fileInput.value = '';
                    } catch (error) {
                        console.warn('파일 입력 초기화 중 오류:', error);
                    }
                    isFileInputProcessing = false;
                }, 200);
            });
        } else {
            // 파일이 선택되지 않은 경우에도 플래그 초기화
            setTimeout(() => {
                isFileInputProcessing = false;
            }, 100);
        }
    });
    
    cameraInput.addEventListener('change', (e) => {
        if (isFileInputProcessing) return; // 중복 처리 방지
        
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            isFileInputProcessing = true;
            handleFiles(files).finally(() => {
                // 파일 처리 완료 후 초기화 - 더 안전한 방법
                setTimeout(() => {
                    try {
                        cameraInput.value = '';
                    } catch (error) {
                        console.warn('카메라 입력 초기화 중 오류:', error);
                    }
                    isFileInputProcessing = false;
                }, 200);
            });
        } else {
            // 파일이 선택되지 않은 경우에도 플래그 초기화
            setTimeout(() => {
                isFileInputProcessing = false;
            }, 100);
        }
    });
}

// 갤러리 열기
function openGallery() {
    if (isFileInputProcessing) {
        POKA.Toast.warning('파일 처리 중입니다. 잠시 기다려주세요.');
        return;
    }
    
    // 모바일에서 더 안정적인 파일 선택을 위한 지연
    setTimeout(() => {
        try {
            fileInput.click();
        } catch (error) {
            console.error('파일 선택 오류:', error);
            POKA.Toast.error('파일 선택에 실패했습니다. 다시 시도해주세요.');
            isFileInputProcessing = false;
        }
    }, 100);
}

// 카메라 열기
function openCamera() {
    if (isFileInputProcessing) {
        POKA.Toast.warning('파일 처리 중입니다. 잠시 기다려주세요.');
        return;
    }
    
    if (POKA.DeviceInfo.isMobile()) {
        // 모바일에서 더 안정적인 카메라 선택을 위한 지연
        setTimeout(() => {
            try {
                cameraInput.click();
            } catch (error) {
                console.error('카메라 선택 오류:', error);
                POKA.Toast.error('카메라 선택에 실패했습니다. 다시 시도해주세요.');
                isFileInputProcessing = false;
            }
        }, 100);
    } else {
        POKA.Toast.warning('카메라는 모바일 기기에서만 사용할 수 있습니다');
    }
}

// 파일 처리
async function handleFiles(files) {
    if (isUploading) {
        POKA.Toast.warning('업로드 중입니다. 잠시 기다려주세요.');
        return;
    }
    
    console.log('파일 처리 시작:', files.length, '개 파일');
    
    isUploading = true;
    uploadArea.classList.add('loading');
    
    try {
        const validFiles = files.filter(file => {
            // 파일 크기 검증 (10MB)
            if (file.size > 10 * 1024 * 1024) {
                POKA.Toast.error(`${file.name}은 10MB를 초과합니다`);
                return false;
            }
            
            // 파일 형식 검증
            if (!file.type.startsWith('image/')) {
                POKA.Toast.error(`${file.name}은 지원하지 않는 형식입니다`);
                return false;
            }
            
            return true;
        });
        
        console.log('유효한 파일:', validFiles.length, '개');
        
        if (validFiles.length === 0) {
            return;
        }
        
        // 이미지 처리 및 압축
        const processedImages = [];
        for (const file of validFiles) {
            try {
                console.log('이미지 처리 중:', file.name);
                const processedImage = await processImage(file);
                processedImages.push({
                    id: Date.now() + Math.random(),
                    file: file,
                    dataUrl: processedImage,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString()
                });
                console.log('이미지 처리 완료:', file.name);
            } catch (error) {
                console.error('Image processing error:', error);
                POKA.Toast.error(`${file.name} 처리 중 오류가 발생했습니다`);
            }
        }
        
        // 업로드된 이미지 배열에 추가
        uploadedImages.push(...processedImages);
        
        // 미리보기 업데이트
        updateImagePreview();
        
        // 성공 메시지
        if (processedImages.length > 0) {
            POKA.Toast.success(`${processedImages.length}개의 이미지가 업로드되었습니다`);
            // 업로드된 이미지 저장
            saveUploadedImages();
        }
        
    } catch (error) {
        console.error('File handling error:', error);
        POKA.Toast.error('파일 처리 중 오류가 발생했습니다');
    } finally {
        isUploading = false;
        uploadArea.classList.remove('loading');
        
        // 오류 발생 시에도 파일 입력 처리 플래그 초기화
        setTimeout(() => {
            isFileInputProcessing = false;
        }, 100);
    }
}

// 이미지 처리
async function processImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const img = new Image();
                img.onload = () => {
                    // 최소 크기 검증 (300x300)
                    if (img.width < 300 || img.height < 300) {
                        reject(new Error('이미지 크기가 너무 작습니다 (최소 300x300px)'));
                        return;
                    }
                    
                    // 이미지 압축
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 비율 유지하면서 크기 조정 (최대 1024px)
                    const maxSize = 1024;
                    let { width, height } = img;
                    
                    if (width > maxSize || height > maxSize) {
                        const ratio = Math.min(maxSize / width, maxSize / height);
                        width *= ratio;
                        height *= ratio;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 이미지 그리기
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 압축된 이미지 반환
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(compressedDataUrl);
                };
                
                img.onerror = () => {
                    reject(new Error('이미지 로드에 실패했습니다'));
                };
                
                img.src = e.target.result;
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('파일 읽기에 실패했습니다'));
        };
        
        reader.readAsDataURL(file);
    });
}

// 이미지 미리보기 업데이트
function updateImagePreview() {
    if (uploadedImages.length === 0) {
        previewSection.style.display = 'none';
        return;
    }
    
    previewSection.style.display = 'block';
    imagePreviewContainer.innerHTML = '';
    
    uploadedImages.forEach((image, index) => {
        const previewItem = createImagePreviewItem(image, index);
        imagePreviewContainer.appendChild(previewItem);
    });
    
    // 스크롤 애니메이션
    setTimeout(() => {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// 이미지 미리보기 아이템 생성
function createImagePreviewItem(image, index) {
    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.dataset.imageId = image.id;
    
    item.innerHTML = `
        <img src="${image.dataUrl}" alt="${image.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="image-fallback">
            🖼️
        </div>
        <div class="image-preview-overlay">
            <div class="image-preview-actions">
                <button class="image-preview-btn edit" onclick="editImage(${index})" title="편집">
                    ✏️
                </button>
                <button class="image-preview-btn delete" onclick="deleteImage(${index})" title="삭제">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    return item;
}

// 이미지 편집
function editImage(index) {
    if (index >= 0 && index < uploadedImages.length) {
        const image = uploadedImages[index];
        console.log('편집할 이미지 설정:', image);
        
        // AppState에 저장
        POKA.AppState.currentImage = image;
        console.log('AppState.currentImage 설정 후:', POKA.AppState.currentImage);
        
        // URL 파라미터로도 전달 (백업용)
        const imageData = encodeURIComponent(JSON.stringify(image));
        const editUrl = `edit.html?image=${imageData}`;
        
        console.log('편집 URL:', editUrl);
        POKA.Navigation.navigateTo(editUrl);
    }
}

// 이미지 삭제
function deleteImage(index) {
    if (index >= 0 && index < uploadedImages.length) {
        const image = uploadedImages[index];
        
        POKA.Modal.show(
            `<p>정말로 "${image.name}"을 삭제하시겠습니까?</p>`,
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
                            uploadedImages.splice(index, 1);
                            updateImagePreview();
                            saveUploadedImages();
                            POKA.Toast.success('이미지가 삭제되었습니다');
                        }
                    }
                ]
            }
        );
    }
}

// 모든 이미지 삭제
function clearAllImages() {
    if (uploadedImages.length === 0) {
        return;
    }
    
    POKA.Modal.show(
        `<p>업로드된 모든 이미지를 삭제하시겠습니까?</p>`,
        {
            title: '모든 이미지 삭제',
            buttons: [
                {
                    text: '취소',
                    class: 'btn-secondary'
                },
                {
                    text: '삭제',
                    class: 'btn-primary',
                    onClick: () => {
                        uploadedImages = [];
                        updateImagePreview();
                        saveUploadedImages();
                        POKA.Toast.success('모든 이미지가 삭제되었습니다');
                    }
                }
            ]
        }
    );
}

// 편집 페이지로 이동
function proceedToEdit() {
    if (uploadedImages.length === 0) {
        POKA.Toast.warning('업로드된 이미지가 없습니다');
        return;
    }
    
    // 첫 번째 이미지를 현재 이미지로 설정
    const image = uploadedImages[0];
    POKA.AppState.currentImage = image;
    
    // URL 파라미터로도 전달 (백업용)
    const imageData = encodeURIComponent(JSON.stringify(image));
    const editUrl = `edit.html?image=${imageData}`;
    
    console.log('편집 페이지로 이동:', editUrl);
    POKA.Navigation.navigateTo(editUrl);
}

// 업로드된 이미지 저장
function saveUploadedImages() {
    POKA.AppState.saveToStorage('uploadedImages', uploadedImages);
}

// 업로드된 이미지 복원
function restoreUploadedImages() {
    const savedImages = POKA.AppState.getFromStorage('uploadedImages');
    if (savedImages && Array.isArray(savedImages)) {
        uploadedImages = savedImages;
        updateImagePreview();
    }
}

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'Delete':
        case 'Backspace':
            if (uploadedImages.length > 0) {
                deleteImage(uploadedImages.length - 1);
            }
            break;
        case 'Enter':
            if (uploadedImages.length > 0) {
                proceedToEdit();
            }
            break;
    }
});

// 페이지 떠날 때 저장
window.addEventListener('beforeunload', () => {
    saveUploadedImages();
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
    POKA.Toast.success('인터넷 연결이 복구되었습니다');
});

window.addEventListener('offline', () => {
    POKA.Toast.warning('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.');
});

// 파일 크기 포맷팅
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 이미지 정보 표시
function showImageInfo(image) {
    const info = `
        <div style="text-align: left;">
            <p><strong>파일명:</strong> ${image.name}</p>
            <p><strong>크기:</strong> ${formatFileSize(image.size)}</p>
            <p><strong>형식:</strong> ${image.type}</p>
            <p><strong>업로드:</strong> ${new Date(image.uploadedAt).toLocaleString()}</p>
        </div>
    `;
    
    POKA.Modal.show(info, {
        title: '이미지 정보',
        buttons: [
            {
                text: '닫기',
                class: 'btn-primary'
            }
        ]
    });
} 