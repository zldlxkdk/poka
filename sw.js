// POKA V2 - Service Worker

const CACHE_NAME = 'poka-v2-cache-v1.0.0';
const STATIC_CACHE = 'poka-v2-static-v1.0.0';
const DYNAMIC_CACHE = 'poka-v2-dynamic-v1.0.0';

// 캐시할 정적 파일들
const STATIC_FILES = [
    '/',
    '/index.html',
    '/upload.html',
    '/gallery.html',
    '/profile.html',
    '/css/common.css',
    '/css/index.css',
    '/css/upload.css',
    '/css/gallery.css',
    '/css/profile.css',
    '/js/common.js',
    '/js/index.js',
    '/js/upload.js',
    '/js/gallery.js',
    '/js/profile.js',
    '/manifest.json'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
    console.log('POKA V2 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Error caching static files:', error);
            })
    );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
    console.log('POKA V2 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// 페치 이벤트 (네트워크 요청 가로채기)
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // POKA V2 도메인의 요청만 처리
    if (url.origin !== self.location.origin) {
        return;
    }
    
    // HTML 파일 요청
    if (request.destination === 'document') {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(request)
                        .then((fetchResponse) => {
                            // 동적 캐시에 저장
                            return caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, fetchResponse.clone());
                                    return fetchResponse;
                                });
                        });
                })
                .catch(() => {
                    // 오프라인일 때 기본 페이지 반환
                    return caches.match('/index.html');
                })
        );
        return;
    }
    
    // CSS, JS 파일 요청
    if (request.destination === 'script' || request.destination === 'style') {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(request)
                        .then((fetchResponse) => {
                            // 동적 캐시에 저장
                            return caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, fetchResponse.clone());
                                    return fetchResponse;
                                });
                        });
                })
                .catch(() => {
                    // 오프라인일 때 빈 응답 반환
                    return new Response('', {
                        status: 404,
                        statusText: 'Not Found'
                    });
                })
        );
        return;
    }
    
    // 이미지 요청
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(request)
                        .then((fetchResponse) => {
                            // 동적 캐시에 저장
                            return caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, fetchResponse.clone());
                                    return fetchResponse;
                                });
                        });
                })
                .catch(() => {
                    // 오프라인일 때 기본 이미지 반환
                    return caches.match('/images/offline-image.png');
                })
        );
        return;
    }
    
    // 기타 요청은 네트워크 우선
    event.respondWith(
        fetch(request)
            .then((response) => {
                // 성공한 요청을 동적 캐시에 저장
                if (response.status === 200) {
                    return caches.open(DYNAMIC_CACHE)
                        .then((cache) => {
                            cache.put(request, response.clone());
                            return response;
                        });
                }
                return response;
            })
            .catch(() => {
                // 네트워크 실패 시 캐시에서 찾기
                return caches.match(request);
            })
    );
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // 백그라운드에서 동기화 작업 수행
            syncData()
        );
    }
});

// 푸시 알림
self.addEventListener('push', (event) => {
    console.log('Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'POKA V2에서 새로운 알림이 있습니다',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '확인하기',
                icon: '/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: '닫기',
                icon: '/icons/icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('POKA V2', options)
    );
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// 메시지 처리
self.addEventListener('message', (event) => {
    console.log('Message received in service worker:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_NAME,
            timestamp: Date.now()
        });
    }
});

// 데이터 동기화 함수
async function syncData() {
    try {
        // IndexedDB에서 동기화할 데이터 가져오기
        const syncData = await getSyncData();
        
        if (syncData.length > 0) {
            // 서버에 데이터 전송
            await sendDataToServer(syncData);
            
            // 동기화 완료 후 로컬 데이터 정리
            await clearSyncData();
            
            console.log('Background sync completed');
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// 동기화할 데이터 가져오기
async function getSyncData() {
    // IndexedDB에서 동기화 대기 중인 데이터 가져오기
    // 실제 구현에서는 IndexedDB 사용
    return [];
}

// 서버에 데이터 전송
async function sendDataToServer(data) {
    // 실제 구현에서는 서버 API 호출
    console.log('Sending data to server:', data);
}

// 동기화 데이터 정리
async function clearSyncData() {
    // 동기화 완료된 데이터 정리
    console.log('Clearing sync data');
}

// 캐시 정리 함수
async function cleanOldCaches() {
    const cacheNames = await caches.keys();
    const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE];
    
    for (const cacheName of cacheNames) {
        if (!currentCaches.includes(cacheName)) {
            await caches.delete(cacheName);
            console.log('Deleted old cache:', cacheName);
        }
    }
}

// 주기적 캐시 정리 (7일마다)
setInterval(() => {
    cleanOldCaches();
}, 7 * 24 * 60 * 60 * 1000);

console.log('POKA V2 Service Worker loaded'); 