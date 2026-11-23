# 서트방 미션 빙고 (2026.12)

GitHub Pages에 올리는 정적 사이트. 인증샷·승인 기록은 Supabase에 저장한다.

## 파일
- `index.html`, `style.css`, `app.js` — 사이트
- `config.js` — Supabase 주소와 키 (비어 있으면 미리보기 모드)
- `supabase.sql` — Supabase SQL Editor에서 한 번 실행하는 초기 설정
- `assets/` — 서트방 로고

## 여는 순서
1. Supabase 프로젝트를 만들고 SQL Editor에 `supabase.sql`을 붙여넣어 실행
2. Project URL과 anon(publishable) key를 `config.js`에 입력
3. GitHub 저장소에 올리고 Settings > Pages에서 main 브랜치를 배포
4. 사이트의 "운영진 확인 화면"에 처음 들어가 운영진 비밀번호를 정함 (10자 이상, 처음 한 번만 가능. 저장소에는 적지 않는다)

## 미션을 바꾸려면
`app.js` 맨 위 `CELLS` 목록을 고친다. 순서가 곧 칸 위치(왼쪽 위부터 가로로).
