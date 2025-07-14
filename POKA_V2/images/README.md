# POKA V2 이미지 파일 목록

## 디렉토리 구조
```
POKA_V2/
└── images/
    ├── icons/          # 아이콘 이미지들
    ├── backgrounds/    # 배경 이미지들
    ├── stickers/       # 스티커 이미지들
    └── samples/        # 샘플 이미지들
```

## 아이콘 이미지 (PNG 형식)

### 메인 페이지 (index.html)
- `welcome-icon.png` - 환영 섹션 아이콘 앞면 (192x320px)
- `welcome-icon-back.png` - 환영 섹션 아이콘 뒷면 (192x320px)
- `upload-icon.png` - 사진 업로드 기능 아이콘 (40x40px)
- `edit-icon.png` - 사진 편집 기능 아이콘 (40x40px)
- `print-icon.png` - 인화하기 기능 아이콘 (40x40px)
- `gallery-icon.png` - 갤러리 기능 아이콘 (40x40px)
- `start-icon.png` - 시작하기 버튼 아이콘 (24x24px)

### 네비게이션 아이콘
- `home-icon.png` - 홈 네비게이션 아이콘 (24x24px)
- `upload-nav-icon.png` - 업로드 네비게이션 아이콘 (24x24px)
- `gallery-nav-icon.png` - 갤러리 네비게이션 아이콘 (24x24px)
- `profile-icon.png` - 프로필 네비게이션 아이콘 (24x24px)

### 업로드 페이지 (upload.html)
- `camera-icon.png` - 카메라 아이콘 (32x32px)
- `gallery-icon.png` - 갤러리 아이콘 (32x32px)
- `drag-drop-icon.png` - 드래그 앤 드롭 아이콘 (48x48px)
- `edit-icon.png` - 편집 버튼 아이콘 (20x20px)
- `delete-icon.png` - 삭제 버튼 아이콘 (20x20px)

### 갤러리 페이지 (gallery.html)
- `search-icon.png` - 검색 아이콘 (20x20px)
- `filter-icon.png` - 필터 아이콘 (20x20px)
- `grid-icon.png` - 그리드 뷰 아이콘 (20x20px)
- `list-icon.png` - 리스트 뷰 아이콘 (20x20px)
- `favorite-icon.png` - 즐겨찾기 아이콘 (20x20px)
- `share-icon.png` - 공유 아이콘 (20x20px)
- `download-icon.png` - 다운로드 아이콘 (20x20px)

### 프로필 페이지 (profile.html)
- `settings-icon.png` - 설정 아이콘 (24x24px)
- `edit-icon.png` - 편집 아이콘 (20x20px)
- `export-icon.png` - 내보내기 아이콘 (20x20px)
- `import-icon.png` - 가져오기 아이콘 (20x20px)
- `dark-mode-icon.png` - 다크모드 아이콘 (20x20px)
- `notification-icon.png` - 알림 아이콘 (20x20px)
- `auto-save-icon.png` - 자동저장 아이콘 (20x20px)
- `pwa-icon.png` - PWA 설치 아이콘 (20x20px)
- `version-icon.png` - 버전 정보 아이콘 (20x20px)
- `website-icon.png` - 웹사이트 아이콘 (20x20px)
- `email-icon.png` - 이메일 아이콘 (20x20px)
- `trash-icon.png` - 삭제 아이콘 (20x20px)
- `reset-icon.png` - 초기화 아이콘 (20x20px)

## 스티커 이미지 (PNG 형식)

### 기본 스티커
- `heart.png` - 하트 스티커 (64x64px)
- `star.png` - 별 스티커 (64x64px)
- `smile.png` - 웃는 얼굴 스티커 (64x64px)
- `crown.png` - 왕관 스티커 (64x64px)
- `flower.png` - 꽃 스티커 (64x64px)
- `butterfly.png` - 나비 스티커 (64x64px)

### 테마별 스티커
- `birthday/` - 생일 테마 스티커들
- `christmas/` - 크리스마스 테마 스티커들
- `valentine/` - 발렌타인 테마 스티커들
- `halloween/` - 할로윈 테마 스티커들

## 배경 이미지 (PNG/JPG 형식)

### 기본 배경
- `gradient-bg.png` - 그라데이션 배경 (1920x1080px)
- `pattern-bg.png` - 패턴 배경 (1920x1080px)

### 테마별 배경
- `nature-bg.jpg` - 자연 배경 (1920x1080px)
- `city-bg.jpg` - 도시 배경 (1920x1080px)
- `abstract-bg.jpg` - 추상 배경 (1920x1080px)

## 샘플 이미지 (JPG 형식)

### 테스트용 이미지
- `sample-1.jpg` - 샘플 이미지 1 (800x600px)
- `sample-2.jpg` - 샘플 이미지 2 (800x600px)
- `sample-3.jpg` - 샘플 이미지 3 (800x600px)

## 3D 카드 이미지 요구사항

### 환영 카드 이미지
- **앞면 이미지**: `welcome-icon.png` (192x320px)
  - 포토카드 제작 서비스의 메인 컨셉을 나타내는 이미지
  - 밝고 친근한 색상과 디자인
  - 카드 앞면에 적합한 구성
  
- **뒷면 이미지**: `welcome-icon-back.png` (192x320px)
  - 앞면과 조화를 이루는 디자인
  - 서비스의 부가 기능이나 특징을 나타내는 이미지
  - 카드 뒷면에 적합한 구성

### 3D 효과
- **회전 애니메이션**: 12초 주기로 자연스러운 3D 회전 (뒷면까지 완전히 보임)
- **마우스 호버**: 마우스 위치에 따른 실시간 3D 회전 (최대 60도 Y축 회전)
- **클릭 효과**: 클릭 시 특별한 애니메이션과 사운드 효과
- **두께감**: 카드 측면과 그림자로 입체감 표현
- **이미지 겹침 방지**: backface-visibility와 z-index로 완벽한 분리
- **반응형**: 모바일과 데스크톱에서 모두 최적화된 표시

## 이미지 요구사항

### 아이콘 이미지
- **형식**: PNG (투명 배경)
- **크기**: 각 용도에 맞는 크기 (24x64px ~ 192x320px)
- **스타일**: 플랫 디자인, 일관된 스타일
- **색상**: 단색 또는 2-3색 조합

### 스티커 이미지
- **형식**: PNG (투명 배경)
- **크기**: 64x64px ~ 128x128px
- **스타일**: 귀엽고 친근한 디자인
- **색상**: 밝고 생동감 있는 색상

### 배경 이미지
- **형식**: PNG/JPG
- **크기**: 1920x1080px (16:9 비율)
- **스타일**: 미니멀하고 깔끔한 디자인
- **용도**: 앱 배경, 카드 배경 등

## 폴백 처리

모든 이미지는 로드 실패 시 이모지나 텍스트로 대체됩니다:
- 이미지 로드 실패 시 `onerror` 이벤트로 폴백 표시
- CSS에서 `.icon-fallback` 클래스로 스타일링
- 일관된 사용자 경험 제공

## 최적화 권장사항

1. **파일 크기**: 아이콘은 10KB 이하, 배경은 500KB 이하
2. **압축**: PNG 최적화, JPG 품질 80-85%
3. **반응형**: 다양한 화면 크기 고려
4. **접근성**: 적절한 alt 텍스트 제공 