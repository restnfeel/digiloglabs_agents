# Electron 앱 로그인 연동 인터페이스

## 개요

DigiLog Labs Agents 데스크톱 앱은 웹(digiloglabs.com) 로그인 후 JWT를 custom protocol로 수신해 로컬 keystore에 저장합니다.

## 인증 흐름

1. 사용자가 앱에서 "로그인" 클릭
2. `auth:open-login` IPC → 로그인 창(BrowserWindow) 팝업
3. 로그인 창 로드 URL: `https://digiloglabs.com/auth/signin?redirect=electron&callback=digiloglabs-agents://auth`
4. 사용자가 웹에서 로그인 (OAuth 또는 이메일/비밀번호)
5. 로그인 성공 → 웹이 `/auth/electron-redirect?callback=digiloglabs-agents://auth`로 이동
6. 해당 페이지가 `/api/auth/electron-token`에서 JWT 조회 후 JS로 `window.location.href = 'digiloglabs-agents://auth?token=JWT'` 호출
   - (302 리다이렉트는 Chromium에서 custom protocol 호출이 차단될 수 있어 JS 사용)
7. OS가 `digiloglabs-agents://` 프로토콜 핸들러로 URL 전달
8. Electron main에서 URL 수신 → 토큰 파싱 → keystore 저장 → renderer에 `auth:token-received` 전송
9. 메인 창에서 AGI 기능 사용

## Electron main.ts 구현 요구사항

### 1. 커스텀 프로토콜 등록

```typescript
if (!app.isDefaultProtocolClient('digiloglabs-agents')) {
  app.setAsDefaultProtocolClient('digiloglabs-agents');
}
```

### 2. 로그인 창 열기 (auth:open-login)

```typescript
ipcMain.handle('auth:open-login', () => {
  const loginWin = new BrowserWindow({
    width: 480,
    height: 680,
    modal: true,
    parent: mainWindow ?? undefined,
    webPreferences: { nodeIntegration: false },
  });
  loginWin.loadURL(
    'https://digiloglabs.com/auth/signin?redirect=electron&callback=digiloglabs-agents://auth'
  );
  // 토큰 수신 시 창 닫기용으로 loginWin 참조 보관
});
```

### 3. 프로토콜 콜백 수신

**macOS:**
```typescript
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleAuthCallback(url);
});
```

**Windows:**
```typescript
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_, argv) => {
    const url = argv.find(arg => arg.startsWith('digiloglabs-agents://'));
    if (url) handleAuthCallback(url);
  });
}
```

### 4. handleAuthCallback

```typescript
let loginWindow: BrowserWindow | null = null;

function handleAuthCallback(url: string) {
  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    if (token) {
      keystore.setDigilogToken(token);
      mainWindow?.webContents.send('auth:token-received', token);
      loginWindow?.close();
      loginWindow = null;
    }
  } catch {
    /* ignore */
  }
}
```

### 5. 기타 auth IPC

```typescript
ipcMain.handle('auth:get-token', () => keystore.getDigilogToken());
ipcMain.handle('auth:logout', () => keystore.clearDigilogToken());
```

## Preload / Renderer 연동

- `electronAPI.auth.openLoginWindow()`: 로그인 창 열기
- `electronAPI.auth.getToken()`: 저장된 JWT 조회
- `electronAPI.auth.logout()`: 로그아웃
- `electronAPI.onAuthTokenReceived(callback)`: 토큰 수신 시 콜백 (preload에서 ipcRenderer.on('auth:token-received') 포워딩)

## 웹 서버 측 구현 (digiloglabs)

- `/auth/electron-redirect`: 로그인 후 도착 페이지. `callback` 쿼리 필수. JS로 `/api/auth/electron-token` 호출 후 `window.location.href = callback?token=...` 수행
- `/api/auth/electron-token`: GET, 세션 있으면 JSON `{ token }` 반환
