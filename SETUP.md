# digiloglabs_agents GitHub 푸시 가이드

이 저장소를 https://github.com/restnfeel/digiloglabs_agents 에 푸시하는 방법:

```bash
cd d:\workspace\ws_digiloglabs\digiloglabs_agents

# 의존성 설치
npm install

# 초기 커밋 (이미 .git이 있으면 생략)
git init
git add .
git commit -m "feat: DigiLog Labs Agents Electron 데스크톱 앱 초기화"

# GitHub 원격 추가 및 푸시
git remote add origin https://github.com/restnfeel/digiloglabs_agents.git
git branch -M main
git push -u origin main
```

## 릴리즈 트리거

`v*` 태그를 푸시하면 GitHub Actions가 자동으로 빌드·릴리즈를 생성합니다:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 아이콘

`resources/icon.png` (256x256 PNG)가 없으면 기본 아이콘이 사용됩니다.
digiloglabs 프로젝트의 `public/images/logo.png`를 복사해 사용할 수 있습니다.
