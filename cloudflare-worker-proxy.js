// Cloudflare Workers를 사용한 Claude API 프록시 서버
// 파일명: cloudflare-worker-proxy.js
// 배포 방법: Cloudflare Dashboard > Workers & Pages > Create application > Create Worker

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // CORS 헤더 설정
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, X-API-Key, X-Anthropic-Version, X-Target-URL",
    "Access-Control-Max-Age": "86400",
  };

  // OPTIONS 요청 처리 (preflight)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // POST 요청만 허용
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // 요청 본문 파싱
    const requestBody = await request.json();

    // Claude API로 요청 전달
    const claudeResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": request.headers.get("X-API-Key"),
          "anthropic-version":
            request.headers.get("X-Anthropic-Version") || "2023-06-01",
        },
        body: JSON.stringify(requestBody),
      }
    );

    // Claude API 응답을 클라이언트에게 전달
    const responseBody = await claudeResponse.text();

    return new Response(responseBody, {
      status: claudeResponse.status,
      statusText: claudeResponse.statusText,
      headers: {
        ...corsHeaders,
        "Content-Type":
          claudeResponse.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);

    return new Response(
      JSON.stringify({
        error: "Proxy server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}
