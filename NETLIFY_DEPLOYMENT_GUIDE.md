# Netlify 프록시 서버 배포 가이드

## 🚀 배포 단계

### 1. Netlify 계정 설정
1. [Netlify](https://netlify.com/)에 로그인 또는 계정 생성
2. 대시보드에서 "New site from Git" 클릭

### 2. GitHub 저장소 연결
1. GitHub 계정 연결
2. `claude-plugin` 저장소 선택
3. 브랜치 선택 (보통 `main` 또는 `master`)

### 3. 빌드 설정
- **Build command**: 비워두기 (Functions만 사용)
- **Publish directory**: 비워두기 (Functions만 사용)
- **Functions directory**: `netlify/functions`

### 4. 환경 변수 설정
Netlify 대시보드 > Site settings > Environment variables에서 다음 설정:

```
ANTHROPIC_API_VERSION=2023-06-01
PROXY_TIMEOUT=30000
PROXY_MEMORY_LIMIT=1024
ALLOWED_ORIGINS=*
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

### 5. 배포 확인
- 배포가 완료되면 `https://your-site-name.netlify.app` URL 제공
- Functions URL: `https://your-site-name.netlify.app/.netlify/functions/claude-proxy`

## 🔧 프록시 사용 방법

### 플러그인에서 프록시 설정
1. **프록시 방법**: "사용자 정의 프록시" 선택
2. **프록시 URL**: `https://your-site-name.netlify.app/.netlify/functions/claude-proxy`
3. **설정 저장** 후 **연결 테스트**

### API 호출 예시
```javascript
const response = await fetch('https://your-site-name.netlify.app/.netlify/functions/claude-proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your_anthropic_api_key',
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: 'Hello, Claude!'
      }
    ]
  })
});
```

## 📁 파일 구조
```
claude-plugin/
├── netlify/
│   └── functions/
│       └── claude-proxy.js    # 프록시 함수
├── netlify.toml               # Netlify 설정
├── NETLIFY_DEPLOYMENT_GUIDE.md # 이 파일
└── ... (기타 파일들)
```

## 🔍 문제 해결

### 배포 실패 시
1. **Functions 디렉토리 확인**: `netlify/functions/` 경로가 정확한지 확인
2. **Node.js 버전**: `netlify.toml`에서 Node.js 18 이상 설정
3. **문법 오류**: JavaScript 파일에 문법 오류가 없는지 확인

### 프록시 연결 실패 시
1. **URL 확인**: Functions URL이 정확한지 확인
2. **CORS 설정**: 브라우저 개발자 도구에서 CORS 오류 확인
3. **함수 로그**: Netlify Functions 로그에서 오류 확인

### 성능 최적화
1. **콜드 스타트**: 첫 요청 시 지연이 있을 수 있음
2. **메모리 설정**: `netlify.toml`에서 메모리 제한 조정
3. **타임아웃**: 긴 응답을 위한 타임아웃 설정

## 🔒 보안 고려사항

### API 키 보호
- 클라이언트에서 API 키를 직접 전송하지 않음
- 프록시 서버에서 API 키 검증
- 요청 제한 및 속도 제한 구현

### CORS 정책
- 필요한 도메인만 허용
- 적절한 헤더 설정
- preflight 요청 처리

## 📊 모니터링

### Netlify 대시보드
- Functions 실행 통계
- 에러 로그 및 성능 메트릭
- 사용량 및 제한 확인

### 로깅
- 요청/응답 로그
- 에러 추적
- 성능 모니터링

## 🔄 업데이트

### 코드 변경 시
1. GitHub에 변경사항 푸시
2. Netlify 자동 배포 트리거
3. 배포 완료 후 테스트

### 환경 변수 변경 시
1. Netlify 대시보드에서 환경 변수 수정
2. 사이트 재배포 트리거
3. 변경사항 적용 확인

## 💡 추가 팁

### 개발 환경
- 로컬에서 `netlify dev` 명령어로 테스트
- 환경 변수 로컬 설정
- Functions 디버깅

### 프로덕션 환경
- 자동 배포 설정
- 백업 및 복구 전략
- 성능 모니터링

---

**배포 완료 후**: 플러그인에서 프록시 URL을 설정하고 연결 테스트를 진행하세요!
