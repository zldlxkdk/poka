// POKA V2 - 지도 페이지 JavaScript

// 키오스크 데이터 (임시 데이터)
const kioskData = [
    {
        id: 1,
        name: "강남역 포카 키오스크",
        address: "서울시 강남구 강남대로 464",
        lat: 37.498095,
        lng: 127.027610,
        status: "online",
        distance: 0.2,
        operatingHours: "07:00 - 23:00",
        lastUpdate: "2024-01-15 15:30:00"
    },
    {
        id: 2,
        name: "홍대입구역 포카 키오스크",
        address: "서울시 마포구 양화로 160",
        lat: 37.557527,
        lng: 126.925320,
        status: "online",
        distance: 0.5,
        operatingHours: "24시간 운영",
        lastUpdate: "2024-01-15 15:25:00"
    },
    {
        id: 3,
        name: "신촌역 포카 키오스크",
        address: "서울시 서대문구 신촌로 77",
        lat: 37.555946,
        lng: 126.936893,
        status: "maintenance",
        distance: 1.2,
        operatingHours: "점검중",
        lastUpdate: "2024-01-15 10:00:00"
    },
    {
        id: 4,
        name: "건국대입구역 포카 키오스크",
        address: "서울시 광진구 아차산로 272",
        lat: 37.540700,
        lng: 127.070200,
        status: "offline",
        distance: 2.1,
        operatingHours: "중단",
        lastUpdate: "2024-01-15 09:15:00"
    },
    {
        id: 5,
        name: "이태원역 포카 키오스크",
        address: "서울시 용산구 이태원로 177",
        lat: 37.534280,
        lng: 126.994750,
        status: "online",
        distance: 3.5,
        operatingHours: "08:00 - 22:00",
        lastUpdate: "2024-01-15 16:00:00"
    }
];

// 전역 변수
let map = null;
let currentPosition = null;
let kioskMarkers = [];
let selectedKiosk = null;
let userMarker = null;
let filteredKioskData = [...kioskData]; // 필터링된 키오스크 데이터

// DOM 요소들
const mapContainer = document.getElementById('map');
const kioskListContainer = document.getElementById('kioskList');
const kioskListLoading = document.getElementById('kioskListLoading');
const currentAddressElement = document.getElementById('currentAddress');
const locationDetailElement = document.getElementById('locationDetail');
const sortSelectElement = document.getElementById('sortSelect');
const filterSelectElement = document.getElementById('filterSelect');
const loadingState = document.getElementById('loadingState');
const kioskInfoLoading = document.getElementById('kioskInfoLoading');
const emptyState = document.getElementById('emptyState');
const kioskPopup = document.getElementById('kioskPopup');

// 키오스크 목록 로딩 상태 관리
function showKioskListLoading() {
    console.log('키오스크 목록 로딩 상태 표시');
    kioskListLoading.style.display = 'block';
    kioskListContainer.style.display = 'none';
    emptyState.style.display = 'none';
}

function hideKioskListLoading() {
    console.log('키오스크 목록 로딩 상태 숨김');
    kioskListLoading.style.display = 'none';
    kioskListContainer.style.display = 'block';
}

// 키오스크 정보 로딩 상태 관리
function showKioskInfoLoading() {
    console.log('키오스크 정보 로딩 상태 표시');
    kioskInfoLoading.style.display = 'block';
}

function hideKioskInfoLoading() {
    console.log('키오스크 정보 로딩 상태 숨김');
    kioskInfoLoading.style.display = 'none';
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('POKA V2 Map page loaded');
    
    // 기본 위치 설정
    currentPosition = {
        lat: 37.5665,
        lng: 126.9780
    };
    
    // 기본 주소 설정
    currentAddressElement.textContent = '위치 정보를 가져오는 중...';
    locationDetailElement.textContent = '세부 주소를 불러오는 중...';
    
    // 키오스크 목록 로딩 상태 표시
    showKioskListLoading();
    
    // 지도 라이브러리 로드 확인
    checkMapLibrary();
    
    // 위치 정보 즉시 요청 (권한 팝업 표시)
    requestLocation();
});

// 지도 라이브러리 확인 및 초기화
function checkMapLibrary() {
    console.log('지도 라이브러리 확인 중...');
    console.log('Leaflet 사용 가능:', typeof L !== 'undefined');
    
    // Leaflet 라이브러리가 로드될 때까지 대기
    if (typeof L === 'undefined') {
        console.log('Leaflet 라이브러리 로드 대기 중...');
        setTimeout(checkMapLibrary, 100);
        return;
    }
    
    console.log('지도 라이브러리 로드 완료, 초기화 시작');
    
    // 지도 초기화
    initMap();
    
    // 키오스크 정보 처리
    setTimeout(() => {
        console.log('키오스크 정보 처리 시작');
        
        // 거리 계산 및 정렬
        calculateDistances();
        
        // 기본 정렬 (거리순)
        sortSelectElement.value = 'distance';
        filteredKioskData.sort((a, b) => a.distance - b.distance);
        
        // 키오스크 목록 렌더링
        hideKioskListLoading();
        renderKioskList();
        
        console.log('키오스크 정보 처리 완료');
    }, 500);
    
    // 이벤트 리스너 설정
    setupEventListeners();
}

// 위치 정보 요청
function requestLocation() {
    console.log('위치 정보 요청 시작');
    console.log('navigator.geolocation 지원 여부:', !!navigator.geolocation);
    
    if (navigator.geolocation) {
        console.log('위치 권한 요청 시작...');
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('위치 정보 성공:', position);
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // 주소 변환
                getAddressFromCoords(currentPosition);
                
                // 지도가 로드된 후 중심 이동
                if (map && typeof L !== 'undefined') {
                    map.setView([currentPosition.lat, currentPosition.lng], 13);
                    
                    // 기존 마커 제거
                    if (userMarker && map.hasLayer(userMarker)) {
                        map.removeLayer(userMarker);
                    }
                    kioskMarkers.forEach(marker => {
                        if (marker && map.hasLayer(marker)) {
                            map.removeLayer(marker);
                        }
                    });
                    kioskMarkers = [];
                    
                    // 사용자 마커 추가
                    addUserMarker();
                    
                    // 키오스크 마커 다시 추가
                    addKioskMarkers();
                    
                    // 거리 재계산
                    calculateDistances();
                    filteredKioskData.sort((a, b) => a.distance - b.distance);
                    renderKioskList();
                }
                
                console.log('위치 정보 업데이트 완료');
            },
            (error) => {
                console.error('위치 정보 오류:', error);
                console.error('오류 코드:', error.code);
                console.error('오류 메시지:', error.message);
                
                // 기본 위치로 설정
                currentPosition = {
                    lat: 37.5665,
                    lng: 126.9780
                };
                
                // 기본 주소 설정
                currentAddressElement.textContent = '서울시 강남구';
                locationDetailElement.textContent = '강남대로 464, 강남역 인근';
                
                console.log('기본 위치로 설정됨');
            },
            options
        );
    } else {
        console.error('위치 정보 지원 안됨');
        currentAddressElement.textContent = '서울시 강남구';
        locationDetailElement.textContent = '강남대로 464, 강남역 인근';
    }
}

// 좌표를 주소로 변환
function getAddressFromCoords(coords) {
    console.log('주소 변환 시작:', coords);
    
    // 실제 환경에서는 역지오코딩 API를 사용
    // 간단한 좌표 기반 추정 (실제 서비스에서는 정확한 API 사용 필요)
    
    let address = '';
    let detailAddress = '';
    
    if (coords.lat >= 37.4 && coords.lat <= 37.7 && coords.lng >= 126.8 && coords.lng <= 127.2) {
        // 서울 지역 대략적 판단
        if (coords.lat >= 37.5 && coords.lng >= 127.0) {
            address = '서울시 강남구';
            detailAddress = '강남대로 464, 강남역 인근';
        } else if (coords.lat >= 37.5 && coords.lng < 127.0) {
            address = '서울시 마포구';
            detailAddress = '양화로 160, 홍대입구역 인근';
        } else if (coords.lat >= 37.4 && coords.lat < 37.5) {
            address = '서울시 영등포구';
            detailAddress = '영등포로 150, 영등포역 인근';
        } else {
            address = '서울시 서대문구';
            detailAddress = '신촌로 77, 신촌역 인근';
        }
    } else if (coords.lat >= 37.4 && coords.lat <= 37.6 && coords.lng >= 127.0 && coords.lng <= 127.2) {
        // 서울 동부 지역
        if (coords.lat >= 37.5) {
            address = '서울시 광진구';
            detailAddress = '아차산로 272, 건국대입구역 인근';
        } else {
            address = '서울시 성동구';
            detailAddress = '왕십리로, 왕십리역 인근';
        }
    } else if (coords.lat >= 37.5 && coords.lat <= 37.6 && coords.lng >= 126.9 && coords.lng <= 127.0) {
        // 서울 중부 지역
        address = '서울시 용산구';
        detailAddress = '이태원로 177, 이태원역 인근';
    } else if (coords.lat >= 35.0 && coords.lat <= 38.0 && coords.lng >= 126.0 && coords.lng <= 130.0) {
        // 한국 내 다른 지역들
        if (coords.lat >= 37.0 && coords.lat < 37.4) {
            address = '경기도';
            detailAddress = '수원시, 성남시, 고양시 등';
        } else if (coords.lat >= 35.0 && coords.lat < 37.0) {
            address = '부산시';
            detailAddress = '해운대구, 동래구, 부산진구 등';
        } else {
            address = '대한민국';
            detailAddress = '기타 지역';
        }
    } else {
        // 해외 또는 알 수 없는 지역
        address = '현재 위치';
        detailAddress = '위치 정보를 확인할 수 없습니다';
    }
    
    // 주소 업데이트
    currentAddressElement.textContent = address;
    locationDetailElement.textContent = detailAddress;
    
    console.log('주소 변환 완료:', { address, detailAddress });
}

// 지도 초기화
function initMap() {
    try {
        console.log('지도 초기화 시작...');
        console.log('현재 위치:', currentPosition);
        
        // 기존 지도가 있으면 제거
        if (map) {
            if (typeof L !== 'undefined') {
                map.remove();
            }
            map = null;
        }
        
        // 마커 배열 초기화
        kioskMarkers = [];
        userMarker = null;
        
        // 지도 컨테이너 초기화
        if (mapContainer) {
            mapContainer.innerHTML = '';
        }
        
        // Leaflet 지도 초기화
        if (typeof L !== 'undefined') {
            console.log('Leaflet 지도 생성 중...');
            
            // Leaflet 지도 생성
            map = L.map('map').setView([currentPosition.lat, currentPosition.lng], 13);
            console.log('Leaflet 지도 객체 생성됨:', map);
            
            // OpenStreetMap 타일 레이어 추가
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            console.log('타일 레이어 추가됨');
            
            // 사용자 위치 마커 추가
            addUserMarker();
            
            // 키오스크 마커 추가
            addKioskMarkers();
            
            console.log('Leaflet 지도 로드 완료');
            
        } else {
            console.log('Leaflet 라이브러리 없음, 대체 표시');
            showMapFallback();
        }
    } catch (error) {
        console.error('지도 초기화 오류:', error);
        showMapFallback();
    }
}

// 지도 대체 표시
function showMapFallback() {
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; flex-direction: column; gap: 10px; background: #f8f9fa; border-radius: 12px;">
                <div style="font-size: 1.2rem; font-weight: bold;">🗺️</div>
                <div>지도를 불러올 수 없습니다</div>
                <div style="font-size: 0.8rem; text-align: center;">키오스크 목록은 아래에서 확인하세요</div>
            </div>
        `;
    }
}

// 사용자 위치 마커 추가 (Leaflet)
function addUserMarker() {
    if (!map || typeof L === 'undefined') return;
    
    // 사용자 위치 마커 추가
    userMarker = L.marker([currentPosition.lat, currentPosition.lng])
        .addTo(map)
        .bindPopup('📍 현재 위치')
        .openPopup();
    
    // 사용자 위치 원형 표시
    L.circle([currentPosition.lat, currentPosition.lng], {
        color: '#00d4ff',
        fillColor: '#00d4ff',
        fillOpacity: 0.2,
        radius: 500
    }).addTo(map);
}

// 사용자 위치 마커 추가 (카카오맵 백업)
function addUserMarkerKakao() {
    if (!map || typeof kakao === 'undefined') return;
    
    const userPosition = new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng);
    
    userMarker = new kakao.maps.Marker({
        position: userPosition,
        map: map,
        title: '현재 위치'
    });
    
    // 사용자 위치 정보창
    const userInfoWindow = new kakao.maps.InfoWindow({
        content: '<div style="padding: 10px; text-align: center; font-size: 12px; color: #333;">현재 위치</div>'
    });
    
    kakao.maps.event.addListener(userMarker, 'click', function() {
        userInfoWindow.open(map, userMarker);
    });
}

// 키오스크 마커 추가 (Leaflet)
function addKioskMarkers() {
    if (!map || typeof L === 'undefined') return;
    
    kioskData.forEach(kiosk => {
        // 상태에 따른 마커 색상 설정
        let markerColor = '#22c55e'; // 기본 온라인 (초록색)
        let statusIcon = '🟢';
        
        if (kiosk.status === 'maintenance') {
            markerColor = '#fb923c'; // 점검 (주황색)
            statusIcon = '🟡';
        } else if (kiosk.status === 'offline') {
            markerColor = '#ef4444'; // 오프라인 (빨간색)
            statusIcon = '🔴';
        }
        
        // 커스텀 마커 아이콘 생성
        const customIcon = L.divIcon({
            html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
        });
        
        const marker = L.marker([kiosk.lat, kiosk.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(`
                <div style="text-align: center; padding: 5px;">
                    <strong>${kiosk.name}</strong><br>
                    <small>${kiosk.address}</small><br>
                    ${statusIcon} ${kiosk.status === 'online' ? '운영중' : kiosk.status === 'maintenance' ? '점검중' : '서비스 중단'}<br>
                    <button onclick="showKioskPopupById(${kiosk.id})" style="margin-top: 5px; padding: 5px 10px; background: #00d4ff; color: white; border: none; border-radius: 4px; cursor: pointer;">상세보기</button>
                </div>
            `);
        
        kioskMarkers.push(marker);
    });
}

// 키오스크 마커 추가 (카카오맵 백업)
function addKioskMarkersKakao() {
    if (!map || typeof kakao === 'undefined') return;
    
    kioskData.forEach(kiosk => {
        const position = new kakao.maps.LatLng(kiosk.lat, kiosk.lng);
        
        // 상태에 따른 마커 이미지 설정
        let markerImage = null;
        if (kiosk.status === 'online') {
            // 온라인 마커 (초록색)
            markerImage = createMarkerImage('#22c55e');
        } else if (kiosk.status === 'maintenance') {
            // 점검 마커 (주황색)
            markerImage = createMarkerImage('#fb923c');
        } else {
            // 오프라인 마커 (빨간색)
            markerImage = createMarkerImage('#ef4444');
        }
        
        const marker = new kakao.maps.Marker({
            position: position,
            map: map,
            title: kiosk.name,
            image: markerImage
        });
        
        // 마커 클릭 이벤트
        kakao.maps.event.addListener(marker, 'click', function() {
            showKioskPopup(kiosk);
        });
        
        kioskMarkers.push(marker);
    });
}

// 마커 이미지 생성
function createMarkerImage(color) {
    const imageSrc = `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='${encodeURIComponent(color)}' d='M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z'/%3E%3C/svg%3E`;
    
    return new kakao.maps.MarkerImage(
        imageSrc,
        new kakao.maps.Size(32, 32),
        { offset: new kakao.maps.Point(16, 32) }
    );
}

// 거리 계산 및 정렬
function calculateDistances() {
    if (!currentPosition) return;
    
    kioskData.forEach(kiosk => {
        kiosk.distance = calculateDistance(
            currentPosition.lat,
            currentPosition.lng,
            kiosk.lat,
            kiosk.lng
        );
    });
    
    // 필터링된 데이터 업데이트
    filteredKioskData = [...kioskData];
    
    // 거리순으로 정렬
    filteredKioskData.sort((a, b) => a.distance - b.distance);
}

// 두 좌표 사이의 거리 계산 (km)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// 키오스크 목록 렌더링
function renderKioskList() {
    if (filteredKioskData.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    kioskListContainer.innerHTML = '';
    
    filteredKioskData.forEach(kiosk => {
        const kioskElement = createKioskListItem(kiosk);
        kioskListContainer.appendChild(kioskElement);
    });
}

// 키오스크 목록 아이템 생성
function createKioskListItem(kiosk) {
    const item = document.createElement('div');
    item.className = 'kiosk-item';
    item.onclick = () => {
        // 지도 이동 애니메이션
        moveToKiosk(kiosk);
        // 팝업 표시
        setTimeout(() => showKioskPopup(kiosk), 300);
    };
    
    const statusClass = kiosk.status;
    const statusText = {
        online: '운영중',
        offline: '중단',
        maintenance: '점검중'
    }[kiosk.status];
    
    item.innerHTML = `
        <div class="kiosk-item-header">
            <div class="kiosk-info">
                <div class="kiosk-name">${kiosk.name}</div>
                <div class="kiosk-address">${kiosk.address}</div>
            </div>
        </div>
        <div class="kiosk-meta">
            <div class="kiosk-distance">${kiosk.distance.toFixed(1)}km</div>
            <div class="kiosk-status ${statusClass}">
                <div class="status-indicator"></div>
                ${statusText}
            </div>
        </div>
    `;
    
    return item;
}

// ID로 키오스크 팝업 표시
function showKioskPopupById(kioskId) {
    const kiosk = kioskData.find(k => k.id === kioskId);
    if (kiosk) {
        // 마커 클릭 시에는 즉시 팝업 표시 (지도 이동은 하지 않음)
        showKioskPopup(kiosk);
    }
}

// 전역 함수로 등록 (HTML에서 호출 가능)
window.showKioskPopupById = showKioskPopupById;
window.closeKioskPopup = closeKioskPopup;
window.getDirections = getDirections;
window.refreshLocation = refreshLocation;
window.toggleMapType = toggleMapType;
window.showSortOptions = showSortOptions;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.centerOnUser = centerOnUser;
window.moveToKiosk = moveToKiosk;
window.handleSortChange = handleSortChange;
window.handleFilterChange = handleFilterChange;

// 키오스크 상세 정보 팝업 표시
function showKioskPopup(kiosk) {
    // 문자열로 전달된 경우 JSON 파싱
    if (typeof kiosk === 'string') {
        try {
            kiosk = JSON.parse(kiosk);
        } catch (e) {
            console.error('키오스크 데이터 파싱 오류:', e);
            return;
        }
    }
    
    selectedKiosk = kiosk;
    
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
        <div class="kiosk-detail">
            <div class="kiosk-detail-header">
                <div class="kiosk-detail-name">${kiosk.name}</div>
                <div class="kiosk-detail-address">${kiosk.address}</div>
            </div>
            <div class="kiosk-detail-info">
                <div class="info-item">
                    <div class="info-icon">📍</div>
                    <div class="info-content">
                        <div class="info-label">거리</div>
                        <div class="info-value">${kiosk.distance.toFixed(1)}km</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">⏰</div>
                    <div class="info-content">
                        <div class="info-label">운영시간</div>
                        <div class="info-value">${kiosk.operatingHours}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">🔄</div>
                    <div class="info-content">
                        <div class="info-label">상태</div>
                        <div class="info-value kiosk-status ${kiosk.status}">
                            <div class="status-indicator"></div>
                            ${kiosk.status === 'online' ? '운영중' : kiosk.status === 'maintenance' ? '점검중' : '중단'}
                        </div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">📅</div>
                    <div class="info-content">
                        <div class="info-label">마지막 업데이트</div>
                        <div class="info-value">${kiosk.lastUpdate}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    kioskPopup.style.display = 'flex';
}

// 키오스크 팝업 닫기
function closeKioskPopup() {
    kioskPopup.style.display = 'none';
    selectedKiosk = null;
}

// 길찾기 기능
function getDirections() {
    if (!selectedKiosk) return;
    
    // 카카오맵 앱이나 웹에서 길찾기 열기
    const url = `https://map.kakao.com/link/to/${selectedKiosk.name},${selectedKiosk.lat},${selectedKiosk.lng}`;
    window.open(url, '_blank');
}

// 지도 확대
function zoomIn() {
    if (map) {
        if (typeof L !== 'undefined') {
            map.zoomIn();
        } else if (typeof kakao !== 'undefined') {
            const level = map.getLevel();
            map.setLevel(level - 1);
        }
    }
}

// 지도 축소
function zoomOut() {
    if (map) {
        if (typeof L !== 'undefined') {
            map.zoomOut();
        } else if (typeof kakao !== 'undefined') {
            const level = map.getLevel();
            map.setLevel(level + 1);
        }
    }
}

// 내 위치로 이동
function centerOnUser() {
    if (map && currentPosition) {
        if (typeof L !== 'undefined') {
            map.setView([currentPosition.lat, currentPosition.lng], 13);
        } else if (typeof kakao !== 'undefined') {
            const userPosition = new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng);
            map.setCenter(userPosition);
        }
    }
}

// 키오스크 위치로 지도 이동 (부드러운 애니메이션)
function moveToKiosk(kiosk) {
    if (!map) return;
    
    if (typeof L !== 'undefined') {
        // Leaflet의 부드러운 이동 애니메이션
        map.flyTo([kiosk.lat, kiosk.lng], 15, {
            animate: true,
            duration: 0.5 // 0.5초 애니메이션
        });
    } else if (typeof kakao !== 'undefined') {
        // 카카오맵 이동
        const kioskPosition = new kakao.maps.LatLng(kiosk.lat, kiosk.lng);
        map.panTo(kioskPosition);
        map.setLevel(3);
    }
}

// 위치 새로고침
function refreshLocation() {
    console.log('위치 새로고침 시작');
    
    // 새로고침 버튼 애니메이션 시작
    const refreshBtn = document.querySelector('.header-btn');
    if (refreshBtn) {
        refreshBtn.classList.add('refreshing');
    }
    
    // 키오스크 목록 로딩 상태 표시
    showKioskListLoading();
    
    // 기존 마커 제거
    if (map && typeof L !== 'undefined') {
        kioskMarkers.forEach(marker => {
            if (marker && map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        });
        kioskMarkers = [];
        
        if (userMarker && map.hasLayer(userMarker)) {
            map.removeLayer(userMarker);
            userMarker = null;
        }
    }
    
    // 위치 정보 다시 요청
    requestLocation();
    
    // 키오스크 목록 업데이트
    setTimeout(() => {
        // 거리 재계산
        calculateDistances();
        
        // 현재 정렬 유지
        const currentSort = sortSelectElement.value;
        if (currentSort === 'distance') {
            filteredKioskData.sort((a, b) => a.distance - b.distance);
        } else if (currentSort === 'name') {
            filteredKioskData.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        // 키오스크 목록 렌더링
        hideKioskListLoading();
        renderKioskList();
        
        console.log('키오스크 목록 새로고침 완료');
    }, 1000);
    
    // 새로고침 버튼 애니메이션 중지
    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.classList.remove('refreshing');
        }
    }, 2000);
}

// 지도 타입 변경
function toggleMapType() {
    if (map) {
        if (typeof L !== 'undefined') {
            // Leaflet에서는 타일 레이어 변경
            if (typeof POKA !== 'undefined' && POKA.Toast) {
                POKA.Toast.info('지도 타입 변경 기능은 준비 중입니다', 2000);
            } else {
                console.log('지도 타입 변경 기능은 준비 중입니다');
            }
        } else if (typeof kakao !== 'undefined') {
            const mapTypeId = map.getMapTypeId();
            if (mapTypeId === kakao.maps.MapTypeId.ROADMAP) {
                map.setMapTypeId(kakao.maps.MapTypeId.SATELLITE);
            } else {
                map.setMapTypeId(kakao.maps.MapTypeId.ROADMAP);
            }
        }
    }
}

// 정렬 변경 처리
function handleSortChange() {
    const sortType = sortSelectElement.value;
    console.log('정렬 변경:', sortType);
    
    // 키오스크 목록 로딩 상태 표시
    showKioskListLoading();
    
    // 정렬 적용
    if (sortType === 'distance') {
        filteredKioskData.sort((a, b) => a.distance - b.distance);
    } else if (sortType === 'name') {
        filteredKioskData.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // 목록 다시 렌더링
    setTimeout(() => {
        hideKioskListLoading();
        renderKioskList();
    }, 300);
}

// 필터 변경 처리
function handleFilterChange() {
    const filterType = filterSelectElement.value;
    console.log('필터 변경:', filterType);
    
    // 키오스크 목록 로딩 상태 표시
    showKioskListLoading();
    
    // 필터 적용
    if (filterType === 'all') {
        filteredKioskData = [...kioskData];
    } else {
        filteredKioskData = kioskData.filter(kiosk => kiosk.status === filterType);
    }
    
    // 현재 정렬 유지하면서 다시 정렬
    const currentSort = sortSelectElement.value;
    if (currentSort === 'distance') {
        filteredKioskData.sort((a, b) => a.distance - b.distance);
    } else if (currentSort === 'name') {
        filteredKioskData.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // 목록 다시 렌더링
    setTimeout(() => {
        hideKioskListLoading();
        renderKioskList();
    }, 300);
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 팝업 배경 클릭 시 닫기
    kioskPopup.addEventListener('click', (e) => {
        if (e.target === kioskPopup) {
            closeKioskPopup();
        }
    });
    
    // ESC 키로 팝업 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && kioskPopup.style.display === 'flex') {
            closeKioskPopup();
        }
    });
} 