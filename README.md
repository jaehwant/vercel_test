# vercel_test — 한 장짜리 대시보드 두 편

Claude Code로 조사·설계·게시한 정적 페이지 두 편을 Vercel로 배포하기 위한 저장소.

## 페이지

- `/` — 랜딩 (두 대시보드 진입)
- `/k-taxonomy` — K-택소노미 대응 지형과 SK텔레콤의 위치
- `/skills` — 인기 Claude Skills와 그 스킬들이 이기는 이유

## 구성

정적 HTML/CSS만으로 이루어져 있으며 빌드 스텝이 없다. Google Fonts만 외부로 나가고 그 외 자산은 인라인.

`vercel.json`은 `cleanUrls: true` 로 두어 `.html` 확장자 없이 접근 가능하게 한다.

## 배포

Vercel 대시보드에서 이 저장소를 Import 하면 프레임워크 감지 없이 정적 배포로 잡힌다.

- Framework Preset: **Other**
- Build Command: 비움
- Output Directory: 비움 (프로젝트 루트)

CLI로 배포하려면 프로젝트 루트에서:

```bash
npx vercel --prod
```
