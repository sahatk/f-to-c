// Netlify Functions를 사용한 Claude API 프록시 서버
// 파일명: netlify/functions/claude-proxy.js
// 배포 방법: netlify/functions/ 폴더에 파일을 생성하고 Netlify에 배포

exports.handler = async function (event, context) {
  // 디버깅 로그 추가
  console.log("프록시 함수 호출됨:", {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body
  });

  // CORS 헤더 설정 (Figma 플러그인 환경에 최적화)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  };

  // OPTIONS 요청 처리 (preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  // POST 요청만 허용
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // 요청 본문 파싱
    let requestBody = {};
    try {
      requestBody = JSON.parse(event.body || "{}");
    } catch (parseError) {
      console.log("요청 본문 파싱 실패, 빈 객체 사용:", parseError);
    }

    // 테스트 요청 처리
    if (requestBody.test === true) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: "프록시 서버가 정상 작동합니다",
          timestamp: new Date().toISOString(),
          test: true
        }),
      };
    }

    // API 키 추출
    const apiKey = event.headers["x-api-key"] || event.headers["X-API-Key"];
    if (!apiKey) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: "API key is required" }),
      };
    }

    // Claude API로 요청 전달
    const claudeResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version":
            event.headers["x-anthropic-version"] || "2023-06-01",
        },
        body: JSON.stringify(requestBody),
      }
    );

    // Claude API 응답을 클라이언트에게 전달
    const responseBody = await claudeResponse.text();

    return {
      statusCode: claudeResponse.status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          claudeResponse.headers.get("Content-Type") || "application/json",
      },
      body: responseBody,
    };
  } catch (error) {
    console.error("Proxy error:", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Proxy server error",
        message: error.message,
      }),
    };
  }
};
