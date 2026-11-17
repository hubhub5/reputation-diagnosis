# 평판진단 ATN (시연 버전)

```
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ 정적 파일
npm run px         # 픽셀아트 GIF 다시 생성 (Python + Pillow)
npm run lint:tone  # 문구 톤 검사
```

- 저장은 `src/lib/api.js`의 mock(localStorage)이다. 백엔드를 붙일 때 이 파일만 바꾼다.
- 문항·역할·관점 전환 문장: `src/data/test.js` / 채점: `src/lib/score.js`
- 관리자: `#/admin`, 데모 비밀번호 `atn2026`
