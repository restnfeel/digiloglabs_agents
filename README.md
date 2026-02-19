# DigiLog Labs Agents Desktop

Electron 데스크톱 앱. UI는 DigiLog Labs 서버(`https://digiloglabs.com/agi`)에서 실시간 로드됩니다.

## GitHub Actions 자동 빌드·배포

`v*` 태그를 푸시하면 GitHub Actions가 자동으로 Windows/macOS/Linux 빌드를 실행하고 릴리즈를 생성합니다.

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 요구 사항

- Node 18+
- npm 또는 yarn

## 실행

```bash
npm run build:electron   # 또는 npx tsc -p electron
npm run dev             # Electron 앱 실행
```

## 빌드(패키징)

```bash
npm run build           # electron-builder로 패키징
npm run dist:mac        # macOS
npm run dist:win        # Windows
npm run dist:linux      # Linux
```

## 코드 서명 (SmartScreen 경고 제거)

Windows에서 "의심스러운 앱" 경고를 없애려면 코드 서명 인증서가 필요합니다.  
[SIGNING.md](./SIGNING.md)에서 인증서 발급 및 빌드 시 서명 방법을 안내합니다.

## 리소스

- `resources/icon.png`: 트레이·앱 아이콘. 없으면 기본 아이콘 사용. 프로젝트 루트 `public/images/logo.png` 복사 권장.
- `fallback/index.html`: 오프라인 시 표시되는 페이지.

## 구현된 Step (work_2)

- Step 1: Electron 셋업, 하이브리드 URL 로딩, 트레이, fallback
- Step 2: keystore (keytar + electron-store)
- Step 3: localfs (파일/폴더 선택·읽기)
- Step 4: DigiLog Labs 로그인 (커스텀 프로토콜, OAuth 창)
- Step 5: OpenRouter API (메인 repo `lib/api-openrouter.ts`, `lib/openrouter-models.ts`)
- Step 6: 설정 화면 (`/agi/settings`), useElectronAuth (메인 repo)
- Step 7: electron-updater, electron-builder 설정
