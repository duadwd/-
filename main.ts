import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.220.0/http/file_server.ts";

// 环境变量配置
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_BASE_URL = Deno.env.get("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com";
const OPENAI_BASE_URL = Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com";
const DEFAULT_GEMINI_MODEL = Deno.env.get("DEFAULT_GEMINI_MODEL") || "gemini-1.5-flash";
const DEFAULT_OPENAI_MODEL = Deno.env.get("DEFAULT_OPENAI_MODEL") || "gpt-4o-mini";
const PORT = parseInt(Deno.env.get("PORT") || "8000");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle API requests
async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 配置端点
  if (pathname === "/api/config") {
    return new Response(JSON.stringify({
      defaultGeminiModel: DEFAULT_GEMINI_MODEL,
      defaultOpenAIModel: DEFAULT_OPENAI_MODEL,
      geminiBaseUrl: GEMINI_BASE_URL,
      openaiBaseUrl: OPENAI_BASE_URL,
      hasGeminiKey: !!GEMINI_API_KEY
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Gemini API proxy
  if (pathname.startsWith("/api/gemini/")) {
    const geminiPath = pathname.replace("/api/gemini/", "");
    // 使用代理地址或默认地址
    const proxyUrl = req.headers.get("x-gemini-proxy") || GEMINI_BASE_URL;
    const geminiUrl = `${proxyUrl}/${geminiPath}`;
    
    try {
      const headers = new Headers(req.headers);
      headers.delete("host");
      headers.delete("connection");
      headers.delete("x-gemini-proxy");
      
      // Add API key if not provided
      if (!headers.get("x-goog-api-key") && GEMINI_API_KEY) {
        headers.set("x-goog-api-key", GEMINI_API_KEY);
      }

      const response = await fetch(geminiUrl, {
        method: req.method,
        headers: headers,
        body: req.method !== "GET" ? await req.text() : undefined,
      });

      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      // 检查是否是流式响应
      const isStream = geminiUrl.includes("streamGenerateContent");
      
      if (isStream && response.body) {
        // 对于流式响应，直接传递响应体
        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        });
      } else {
        // 对于非流式响应，读取完整内容
        return new Response(await response.text(), {
          status: response.status,
          headers: responseHeaders,
        });
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      return new Response(JSON.stringify({ error: "API request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // OpenAI-compatible API proxy
  if (pathname.startsWith("/api/openai/")) {
    const openaiPath = pathname.replace("/api/openai/", "");
    const apiBase = req.headers.get("x-api-base") || OPENAI_BASE_URL;
    const openaiUrl = `${apiBase}/${openaiPath}`;
    
    try {
      const headers = new Headers(req.headers);
      headers.delete("host");
      headers.delete("connection");
      headers.delete("x-api-base");
      
      // Forward authorization header
      const auth = headers.get("authorization");
      if (!auth) {
        return new Response(JSON.stringify({ error: "Authorization required" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch(openaiUrl, {
        method: req.method,
        headers: headers,
        body: req.method !== "GET" ? await req.text() : undefined,
      });

      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      // 检查是否是流式响应
      const contentType = response.headers.get("content-type");
      const isStream = contentType?.includes("text/event-stream") ||
                      (req.method === "POST" && openaiPath.includes("chat/completions"));
      
      if (isStream && response.body) {
        // 对于流式响应，设置正确的 Content-Type
        responseHeaders.set("Content-Type", "text/event-stream");
        responseHeaders.set("Cache-Control", "no-cache");
        responseHeaders.set("Connection", "keep-alive");
        
        // 直接传递响应体
        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        });
      } else {
        // 对于非流式响应，读取完整内容
        return new Response(await response.text(), {
          status: response.status,
          headers: responseHeaders,
        });
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      return new Response(JSON.stringify({ error: "API request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Not Found", { status: 404 });
}

// Main request handler
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // API routes
  if (pathname.startsWith("/api/")) {
    return handleApiRequest(req);
  }

  // Serve static files
  try {
    if (pathname === "/") {
      return await serveFile(req, "./index.html");
    }
    
    const filePath = `.${pathname}`;
    return await serveFile(req, filePath);
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

console.log(`Server running on http://localhost:${PORT}`);
await serve(handler, { port: PORT });