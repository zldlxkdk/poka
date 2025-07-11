// POKA V2 - 지도 페이지 JavaScript

// 전역 변수
let map = null;
let currentPosition = null;
let kioskMarkers = [];
let selectedKiosk = null;
let userMarker = null;

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
        operatingHours: "서비스 중단",
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

// DOM 요소들
const mapContainer = document.getElementById('map');
const kioskListContainer = document.getElementById('kioskList');
const currentAddressElement = document.getElementById('currentAddress');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const kioskPopup = document.getElementById('kioskPopup');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('POKA V2 Map page loaded');
    
    // 지도 라이브러리 로드 확인
    setTimeout(() => {
        console.log('지도 라이브러리 로드 확인:', {
            leaflet: typeof L !== 'undefined',
            kakao: typeof kakao !== 'undefined'
        });
        
        // 위치 정보 요청
        requestLocation();
        
        // 키오스크 목록 렌더링
        renderKioskList();
        
        // 이벤트 리스너 설정
        setupEventListeners();
    }, 100);
});

// 위치 정보 요청
function requestLocation() {
    if (navigator.geolocation) {
        loadingState.style.display = 'block';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // 주소 변환
                getAddressFromCoords(currentPosition);
                
                // 지도 초기화
                initMap();
                
                // 거리 계산 및 정렬
                calculateDistances();
                
                loadingState.style.display = 'none';
            },
            (error) => {
                console.error('위치 정보 오류:', error);
                
                // 기본 위치로 설정 (서울 중심)
                currentPosition = {
                    lat: 37.5665,
                    lng: 126.9780
                };
                
                currentAddressElement.textContent = '위치 정보를 가져올 수 없습니다';
                initMap();
                loadingState.style.display = 'none';
            }
        );
    } else {
        console.error('위치 정보 지원 안됨');
        currentAddressElement.textContent = '위치 정보를 지원하지 않습니다';
        
        // 기본 위치로 설정
        currentPosition = {
            lat: 37.5665,
            lng: 126.9780
        };
        
        initMap();
    }
}

// 좌표를 주소로 변환
function getAddressFromCoords(coords) {
    // 실제 환경에서는 역지오코딩 API를 사용
    // 간단한 좌표 기반 추정 (실제 서비스에서는 정확한 API 사용 필요)
    
    if (coords.lat >= 37.4 && coords.lat <= 37.7 && coords.lng >= 126.8 && coords.lng <= 127.2) {
        // 서울 지역 대략적 판단
        if (coords.lat >= 37.5 && coords.lng >= 127.0) {
            currentAddressElement.textContent = '서울시 강남구 일대';
        } else if (coords.lat >= 37.5 && coords.lng < 127.0) {
            currentAddressElement.textContent = '서울시 마포구 일대';
        } else {
            currentAddressElement.textContent = '서울시 영등포구 일대';
        }
    } else {
        currentAddressElement.textContent = '현재 위치';
    }
}

// 지도 초기화
function initMap() {
    try {
        console.log('지도 초기화 시작...');
        console.log('Leaflet 사용 가능:', typeof L !== 'undefined');
        console.log('카카오맵 사용 가능:', typeof kakao !== 'undefined');
        
        // Leaflet 지도 초기화 (무료 오픈소스)
        if (typeof L !== 'undefined') {
            console.log('Leaflet 지도 생성 중...');
            
            // 지도 컨테이너 초기화
            mapContainer.innerHTML = '';
            
            // Leaflet 지도 생성
            map = L.map('map').setView([currentPosition.lat, currentPosition.lng], 13);
            
            // OpenStreetMap 타일 레이어 추가
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // 사용자 위치 마커 추가
            addUserMarker();
            
            // 키오스크 마커 추가
            addKioskMarkers();
            
            console.log('Leaflet 지도 로드 완료');
        } else if (typeof kakao !== 'undefined' && kakao.maps) {
            console.log('카카오맵 생성 중...');
            
            // 카카오 맵 API 백업
            const mapOption = {
                center: new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng),
                level: 3
            };
            
            map = new kakao.maps.Map(mapContainer, mapOption);
            addUserMarkerKakao();
            addKioskMarkersKakao();
            
            console.log('카카오맵 로드 완료');
        } else {
            console.log('지도 라이브러리 없음, 대체 표시');
            // 지도 라이브러리가 없을 때 대체 표시
            mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; flex-direction: column; gap: 10px;"><div>지도를 불러올 수 없습니다</div><div style="font-size: 0.8rem;">키오스크 목록은 아래에서 확인하세요</div></div>';
        }
    } catch (error) {
        console.error('지도 초기화 오류:', error);
        mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; flex-direction: column; gap: 10px;"><div>지도 로딩 중 오류가 발생했습니다</div><div style="font-size: 0.8rem;">키오스크 목록은 아래에서 확인하세요</div></div>';
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
    
    // 거리순으로 정렬
    kioskData.sort((a, b) => a.distance - b.distance);
    
    // 목록 다시 렌더링
    renderKioskList();
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
    if (kioskData.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    kioskListContainer.innerHTML = '';
    
    kioskData.forEach(kiosk => {
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
        offline: '서비스 중단',
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
                            ${kiosk.status === 'online' ? '운영중' : kiosk.status === 'maintenance' ? '점검중' : '서비스 중단'}
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
    requestLocation();
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

// 정렬 옵션 표시
function showSortOptions() {
    const options = ['거리순', '이름순', '상태순'];
    const selectedOption = prompt('정렬 방식을 선택하세요:\n' + options.join('\n'));
    
    if (selectedOption) {
        switch (selectedOption) {
            case '거리순':
                kioskData.sort((a, b) => a.distance - b.distance);
                break;
            case '이름순':
                kioskData.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case '상태순':
                kioskData.sort((a, b) => {
                    const statusOrder = { online: 0, maintenance: 1, offline: 2 };
                    return statusOrder[a.status] - statusOrder[b.status];
                });
                break;
        }
        renderKioskList();
    }
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