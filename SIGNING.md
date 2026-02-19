# Windows 코드 서명 (SmartScreen 경고 제거)

서명하지 않은 앱은 Windows SmartScreen에서 "의심스러운 앱" 또는 "알 수 없는 게시자"로 표시됩니다.  
코드 서명 인증서로 서명하면 이 경고를 제거할 수 있습니다.

## 1. 인증서 발급

| 유형                         | 비용(연)    | SmartScreen                        | 비고                                       |
| ---------------------------- | ----------- | ---------------------------------- | ------------------------------------------ |
| **Standard**                 | 약 $70~200  | 설치 수 증가에 따라 경고 점점 감소 | .pfx 파일로 내보내기 가능, CI/CD 연동 용이 |
| **EV (Extended Validation)** | 약 $300~500 | **즉시** 신뢰                      | USB 동글에 바인딩, CI에서 사용 까다로움    |

발급처 예: [Certum](https://certum.eu), [Sectigo](https://sectigo.com), [DigiCert](https://www.digicert.com)

## 2. 환경 변수 설정

인증서(.pfx) 파일과 비밀번호를 다음 환경 변수로 설정합니다.

```bash
# Windows (PowerShell)
$env:CSC_LINK = "C:\path\to\your-certificate.pfx"
$env:CSC_KEY_PASSWORD = "인증서_비밀번호"

# 또는 .env.local (git에 올리지 않음)
CSC_LINK=C:\path\to\your-certificate.pfx
CSC_KEY_PASSWORD=인증서_비밀번호
```

## 3. 서명 포함 빌드

```bash
npm run dist:win
```

`CSC_LINK`와 `CSC_KEY_PASSWORD`가 설정되어 있으면 빌드 시 자동으로 서명됩니다.

## 4. CI/CD에서 사용

인증서를 base64로 인코딩해 비밀 저장소에 넣고, 빌드 시 환경 변수로 주입합니다.

```bash
# 인증서를 base64로 인코딩 (GitHub Secrets 등에 저장)
CSC_LINK=<base64-encoded-pfx>
CSC_KEY_PASSWORD=<password>
```

## 5. 인증서가 없을 때

환경 변수를 설정하지 않으면 서명 없이 빌드됩니다.  
이 경우 SmartScreen 경고가 계속 표시되며, 사용자는 "추가 정보" → "실행"을 눌러 실행해야 합니다.
