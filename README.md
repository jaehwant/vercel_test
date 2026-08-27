# vercel_test — 한 장짜리 대시보드 두 편 + 의견 DB

Claude Code로 조사·설계·게시한 정적 페이지 두 편을 Vercel로 배포하고, 방문자가 페이지별로 의견을 남길 수 있는 코멘트 기능을 붙인 저장소.

## 페이지

- `/` — 랜딩 (두 대시보드 진입)
- `/k-taxonomy` — K-택소노미 대응 지형과 SK텔레콤의 위치
- `/skills` — 인기 Claude Skills와 그 스킬들이 이기는 이유

각 대시보드 하단에 **의견(코멘트) 섹션**이 있다. 페이지별로 스레드가 분리된다.

## 코멘트 저장소 · 두 가지 모드

### 로컬 모드 (기본 · 설정 불필요)
`assets/config.js`가 비어 있으면 자동으로 `localStorage` 모드로 동작한다.
- 의견은 각 방문자의 브라우저에만 저장된다
- 다른 사람에게 공유되지 않는다
- 페이지 상단 배너에 "로컬 모드"로 표시된다

### 공유 모드 (Supabase 연결)
아래 5분짜리 절차로 붙이면 방문자 전원이 서로의 의견을 볼 수 있다.

**1) Supabase 프로젝트 생성**
[supabase.com](https://supabase.com) → New Project (무료 티어로 충분)

**2) 스키마 적용**
Project → SQL Editor 에서 [`supabase/schema.sql`](supabase/schema.sql) 전체를 복사·실행. `comments` 테이블과 RLS 정책이 생성된다.

**3) 키 확인**
Project Settings → API 페이지에서
- `Project URL` → `supabaseUrl`
- `anon public` 키 → `supabaseAnonKey`

anon 키는 공개돼도 안전하다 (RLS로 삽입 조건이 강제된다).

**4) 설정 파일에 입력**
[`assets/config.js`](assets/config.js) 두 값을 채우고 커밋 & push:

```js
window.__COMMENTS_CONFIG__ = {
  supabaseUrl: "https://<프로젝트>.supabase.co",
  supabaseAnonKey: "eyJhbGciOi..."
};
```

Vercel이 자동 재배포한 뒤 페이지 상단 배너가 **공유 모드**로 바뀐다.

## 구성

정적 HTML/CSS/JS만으로 이루어져 있으며 빌드 스텝이 없다.
- Google Fonts, esm.sh(Supabase JS SDK CDN)만 외부로 나가고 나머지는 인라인
- `vercel.json`은 `cleanUrls: true` 로 확장자 없이 접근 가능하게 한다

```
vercel_test/
├─ index.html            ← 랜딩
├─ k-taxonomy.html       ← /k-taxonomy
├─ skills.html           ← /skills
├─ assets/
│   ├─ config.js         ← Supabase 키 (편집 대상)
│   ├─ comments.css      ← 코멘트 스타일 (팔레트 변수 상속)
│   └─ comments.js       ← 클라우드/로컬 백엔드 스위칭
├─ supabase/
│   └─ schema.sql        ← 테이블 + RLS
├─ vercel.json
└─ README.md
```

## 배포

Vercel 대시보드에서 이 저장소를 Import 하면 프레임워크 감지 없이 정적 배포로 잡힌다.

- Framework Preset: **Other**
- Build Command: 비움
- Output Directory: 비움 (프로젝트 루트)

CLI로 배포하려면 프로젝트 루트에서:

```bash
npx vercel --prod
```
