# 🚨 CORS 오류 해결 가이드

## 📊 문제 분석

현재 발생하고 있는 CORS 오류:
```
Access to fetch at 'https://f-to-c.netlify.app/.netlify/functions/claude-proxy' from origin 'null' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔍 원인

1. **❌ 잘못된 프록시 URL**: `https://f-to-c.netlify.app`는 예시 URL
2. **❌ CORS 설정 불완전**: preflight 요청 처리 개선 필요
3. **❌ 헤더 설정 부족**: 일부 필요한 헤더가 누락

## ✅ 해결 방법

### 1단계: Netlify 앱 배포

#### A. 새로운 Netlify 앱 생성
```bash
# 1. Netlify CLI 설치 (없는 경우)
npm install -g netlify-cli

# 2. Netlify에 로그인
netlify login

# 3. 새 사이트 생성 및 배포
netlify init
```

#### B. GitHub 연동 배포 (권장)
1. GitHub에 저장소 생성
2. 코드 푸시:
   ```bash
   git add .
   git commit -m "Add Claude proxy server"
   git push origin main
   ```
3. [Netlify 대시보드](https://app.netlify.com)에서 "New site from Git" 선택
4. GitHub 저장소 연결
5. 빌드 설정:
   - Build command: `echo "Functions deployment"`
   - Publish directory: `.`
   - Functions directory: `netlify/functions`

### 2단계: 배포된 URL 확인

배포 완료 후 Netlify에서 제공하는 실제 URL을 확인:
- 예: `https://your-app-name-123456.netlify.app`
- 또는 커스텀 도메인 설정

### 3단계: UI에서 프록시 URL 업데이트

Figma 플러그인 UI에서:
1. "프록시 서버 설정" 섹션으로 이동
2. "Netlify Functions" 선택
3. **실제 배포된 URL**로 변경:
   ```
   https://YOUR-ACTUAL-NETLIFY-URL.netlify.app/.netlify/functions/claude-proxy
   ```
4. "프록시 설정 저장" 클릭
5. "프록시 연결 테스트" 클릭하여 확인

## 🔧 개선된 CORS 설정

이미 다음 사항들이 수정되었습니다:

### 프록시 서버 (`netlify/functions/claude-proxy.js`)
- ✅ 모든 HTTP 메서드 허용: GET, POST, OPTIONS, PUT, DELETE
- ✅ 필요한 헤더 명시적 허용
- ✅ Credentials 설정 수정 (false로 변경)
- ✅ Vary 헤더 추가

### Netlify 설정 (`netlify.toml`)
- ✅ 함수별 CORS 헤더 설정
- ✅ preflight 요청 최적화
- ✅ 타임아웃 및 메모리 설정

## 🧪 테스트 방법

### 1. 브라우저 개발자 도구에서 확인
```javascript
// 콘솔에서 직접 테스트
fetch('https://YOUR-NETLIFY-URL.netlify.app/.netlify/functions/claude-proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ test: true })
})
.then(response => response.text())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

### 2. Figma 플러그인에서 테스트
1. "프록시 연결 테스트" 버튼 클릭
2. 성공 메시지 확인: "프록시 연결 성공 - 테스트 응답 확인됨"

## 🚨 여전히 오류가 발생하는 경우

### 방법 1: 대체 프록시 서비스 사용
```javascript
// CORS Anywhere (개발용)
https://cors-anywhere.herokuapp.com/https://api.anthropic.com/v1/messages

// Cloudflare Workers (추천)
https://claude-proxy.your-domain.workers.dev/
```

### 방법 2: 로컬 개발 서버 사용
```bash
# 로컬에서 Netlify Functions 실행
netlify dev
# 로컬 URL: http://localhost:8888/.netlify/functions/claude-proxy
```

### 방법 3: Vercel Functions으로 마이그레이션
```bash
# Vercel 배포
npm install -g vercel
vercel init
vercel --prod
```

## 📝 최종 체크리스트

- [ ] Netlify에 프로젝트 배포 완료
- [ ] 실제 배포된 URL 확인
- [ ] Figma 플러그인에서 올바른 URL 설정
- [ ] 프록시 연결 테스트 성공
- [ ] Claude API 키 설정 및 테스트
- [ ] 실제 프롬프트 실행 테스트

## 🔗 관련 파일

- `netlify/functions/claude-proxy.js` - 프록시 서버 로직
- `netlify.toml` - Netlify 설정
- `ui.html` - 플러그인 UI (프록시 설정 부분)
- `code.js` - 플러그인 백엔드 로직

## 💡 추가 팁

1. **환경 변수 사용**: API 키를 Netlify Environment Variables에 저장
2. **로그 확인**: Netlify Functions 로그에서 오류 상세 확인
3. **캐시 클리어**: 브라우저 캐시를 클리어하고 다시 테스트
4. **네트워크 탭**: 개발자 도구 Network 탭에서 실제 요청/응답 확인

---

**중요**: `https://f-to-c.netlify.app`는 예시 URL입니다. 반드시 실제 배포된 Netlify 앱의 URL로 변경해주세요!
