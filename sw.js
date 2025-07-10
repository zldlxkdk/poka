// POKA V2 - Service Worker

const CACHE_NAME = 'poka-v2-cache-v1.0.0';
const STATIC_CACHE = 'poka-v2-static-v1.0.0';
const DYNAMIC_CACHE = 'poka-v2-dynamic-v1.0.0';

// ĳ���� ���� ���ϵ�
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

// ��ġ �̺�Ʈ
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

// Ȱ��ȭ �̺�Ʈ
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

// ��ġ �̺�Ʈ (��Ʈ��ũ ��û ����ä��)
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // POKA V2 �������� ��û�� ó��
    if (url.origin !== self.location.origin) {
        return;
    }
    
    // HTML ���� ��û
    if (request.destination === 'document') {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(request)
                        .then((fetchResponse) => {
                            // ���� ĳ�ÿ� ����
                            return caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, fetchResponse.clone());
                                    return fetchResponse;
                                });
                        });
                })
                .catch(() => {
                    // ���������� �� �⺻ ������ ��ȯ
                    return caches.match('/index.html');
                })
        );
        return;
    }
    
    // CSS, JS ���� ��û
    if (request.destination === 'script' || request.destination === 'style') {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(request)
                        .then((fetchResponse) => {
                            // ���� ĳ�ÿ� ����
                            return caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, fetchResponse.clone());
                                    return fetchResponse;
                                });
                        });
                })
                .catch(() => {
                    // ���������� �� �� ���� ��ȯ
                    return new Response('', {
                        status: 404,
                        statusText: 'Not Found'
                    });
                })
        );
        return;
    }
    
    // �̹��� ��û
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(request)
                        .then((fetchResponse) => {
                            // ���� ĳ�ÿ� ����
                            return caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, fetchResponse.clone());
                                    return fetchResponse;
                                });
                        });
                })
                .catch(() => {
                    // ���������� �� �⺻ �̹��� ��ȯ
                    return caches.match('/images/offline-image.png');
                })
        );
        return;
    }
    
    // ��Ÿ ��û�� ��Ʈ��ũ �켱
    event.respondWith(
        fetch(request)
            .then((response) => {
                // ������ ��û�� ���� ĳ�ÿ� ����
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
                // ��Ʈ��ũ ���� �� ĳ�ÿ��� ã��
                return caches.match(request);
            })
    );
});

// ��׶��� ����ȭ
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // ��׶��忡�� ����ȭ �۾� ����
            syncData()
        );
    }
});

// Ǫ�� �˸�
self.addEventListener('push', (event) => {
    console.log('Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'POKA V2���� ���ο� �˸��� �ֽ��ϴ�',
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
                title: 'Ȯ���ϱ�',
                icon: '/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: '�ݱ�',
                icon: '/icons/icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('POKA V2', options)
    );
});

// �˸� Ŭ��
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// �޽��� ó��
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

// ������ ����ȭ �Լ�
async function syncData() {
    try {
        // IndexedDB���� ����ȭ�� ������ ��������
        const syncData = await getSyncData();
        
        if (syncData.length > 0) {
            // ������ ������ ����
            await sendDataToServer(syncData);
            
            // ����ȭ �Ϸ� �� ���� ������ ����
            await clearSyncData();
            
            console.log('Background sync completed');
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// ����ȭ�� ������ ��������
async function getSyncData() {
    // IndexedDB���� ����ȭ ��� ���� ������ ��������
    // ���� ���������� IndexedDB ���
    return [];
}

// ������ ������ ����
async function sendDataToServer(data) {
    // ���� ���������� ���� API ȣ��
    console.log('Sending data to server:', data);
}

// ����ȭ ������ ����
async function clearSyncData() {
    // ����ȭ �Ϸ�� ������ ����
    console.log('Clearing sync data');
}

// ĳ�� ���� �Լ�
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

// �ֱ��� ĳ�� ���� (7�ϸ���)
setInterval(() => {
    cleanOldCaches();
}, 7 * 24 * 60 * 60 * 1000);

console.log('POKA V2 Service Worker loaded'); 