import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/config";

const TOKEN_COOKIE = "augustus_token";

/**
 * Proxies chat/ingest queries to FastAPI POST /
 * Expected body:
 *  - { query: string, url?: string, session_id?: string }
 * Returns backend JSON { answer, session_id, video_context? } as-is.
 */
export async function POST(req: Request) {
  console.log("=== AGENT QUERY REQUEST START ===");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  // Safely log headers - convert to plain object
  try {
    const headersObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    console.log("Request headers:", headersObj);
  } catch (headerErr) {
    console.log("Could not log headers:", headerErr);
  }
  
  try {
    // Safely parse request body
    let incoming;
    try {
      console.log("Attempting to parse request body...");
      incoming = await req.json();
      console.log("Request body parsed successfully:", { 
        hasQuery: !!incoming?.query, 
        hasUrl: !!incoming?.url, 
        hasSessionId: !!incoming?.session_id 
      });
    } catch (parseErr) {
      console.error("Failed to parse request body:", parseErr);
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }
    
    const { query, url, session_id } = incoming ?? {};

    if (!query || (typeof query !== "string")) {
      return NextResponse.json(
        { error: "Field `query` (string) is required." },
        { status: 400 }
      );
    }

    // Read JWT from httpOnly cookie (sent by browser to this route)
    // In a route handler, cookies are not directly on the Request object; we rely on the headers.
    // Next.js forwards cookies automatically; we must extract token manually if needed.
    const cookieHeader = req.headers.get("cookie") || "";
    const token = parseCookie(cookieHeader)[TOKEN_COOKIE];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing token." },
        { status: 401 }
      );
    }

    // Validate API_BASE is set and is a valid URL
    if (!API_BASE || API_BASE === "undefined") {
      console.error("API_BASE is not configured. Check NEXT_PUBLIC_API_BASE environment variable.");
      return NextResponse.json(
        { error: "Backend configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // Validate URL format
    try {
      new URL(API_BASE);
    } catch {
      console.error(`Invalid API_BASE URL format: ${API_BASE}`);
      return NextResponse.json(
        { error: "Backend URL configuration error. Invalid URL format." },
        { status: 500 }
      );
    }

    const backendUrl = `${API_BASE}/`;
    // Only include fields that are actually present (not undefined/null)
    // Backend expects optional fields to be omitted, not set to null/undefined
    const requestBody: { query: string; url?: string; session_id?: string } = { query };
    if (url) requestBody.url = url;
    if (session_id) requestBody.session_id = session_id;

    console.log(`Calling backend: ${backendUrl}`); // Debug log

    let res: Response;
    try {
      // Use redirect: "manual" to prevent automatic redirect following
      // This allows us to detect and handle redirects explicitly
      res = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        redirect: "manual", // Don't follow redirects automatically
      });

      // Check if backend returned a redirect (300-399 status codes)
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        console.error(`Backend returned redirect (${res.status}) to: ${location}`);
        return NextResponse.json(
          { error: `Backend returned unexpected redirect. This usually indicates a backend configuration error.` },
          { status: 502 }
        );
      }
    } catch (fetchErr) {
      // Handle fetch errors (network failures, connection refused, etc.)
      console.error("Fetch error:", fetchErr);
      const fetchError = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
      if (fetchError.message.includes("fetch failed") || fetchError.message.includes("ECONNREFUSED")) {
        return NextResponse.json(
          { error: `Cannot connect to backend server at ${API_BASE}. Please ensure the backend is running.` },
          { status: 502 }
        );
      }
      throw fetchErr; // Re-throw to be caught by outer catch
    }

    // Try to read backend payload; if not JSON, fallback to text
    let text: string;
    let payload: unknown;
    try {
      text = await res.text();
      // Handle empty responses
      if (!text.trim()) {
        console.error("Backend returned empty response");
        return NextResponse.json(
          { error: "Backend returned empty response. Please check backend logs." },
          { status: 502 }
        );
      }
      payload = safeJson(text);
      
      // Log the actual backend response for debugging
      console.log("=== BACKEND RESPONSE ===");
      console.log("Status:", res.status);
      console.log("Headers:", Object.fromEntries(res.headers.entries()));
      console.log("Payload:", JSON.stringify(payload, null, 2));
    } catch (readErr) {
      // Handle response reading errors
      console.error("Response reading error:", readErr);
      const readError = readErr instanceof Error ? readErr : new Error(String(readErr));
      return NextResponse.json(
        { error: `Failed to read response from backend: ${readError.message}` },
        { status: 502 }
      );
    }

    // Check if backend returned a JSON response with a redirect URL field
    // Some backends return { url: "..." } instead of proper JSON response
    if (payload && typeof payload === "object" && "url" in payload && typeof payload.url === "string") {
      const backendUrl = payload.url as string;
      console.error("Backend returned URL field in JSON response:", backendUrl);
      // If the URL looks like a redirect to our frontend, it's likely a backend misconfiguration
      if (backendUrl.includes("/app/videos/")) {
        return NextResponse.json(
          { 
            error: "Backend returned invalid response format. Expected JSON with answer/session_id, but got redirect URL instead.",
            details: process.env.NODE_ENV === "development" ? { backendResponse: payload } : undefined
          },
          { status: 502 }
        );
      }
    }

    if (!res.ok) {
      // Handle different error formats
      let errorMsg = "Agent query failed.";
      let errorDetails: Record<string, unknown> | undefined = undefined;
      
      if (payload && typeof payload === "object") {
        // Backend uses {"detail": "message"} format (FastAPI standard)
        if ("detail" in payload && typeof payload.detail === "string") {
          errorMsg = payload.detail;
        } 
        // If safeJson returned {raw: "text"} because response wasn't JSON
        else if ("raw" in payload && typeof payload.raw === "string") {
          errorMsg = payload.raw;
        }
        // If payload has an error field
        else if ("error" in payload && typeof payload.error === "string") {
          errorMsg = payload.error;
        }
        
        // For 500 errors, include full error details in development
        if (res.status === 500 && process.env.NODE_ENV === "development") {
          errorDetails = payload as Record<string, unknown>;
        }
      } else if (typeof payload === "string") {
        errorMsg = payload;
      }
      
      // Log backend error for debugging
      console.error(`Backend returned error (${res.status}):`, {
        status: res.status,
        statusText: res.statusText,
        payload,
        url: backendUrl,
      });
      
      // Build response object conditionally
      const responseBody: { error: string; details?: Record<string, unknown> } = {
        error: errorMsg,
      };
      
      if (errorDetails) {
        responseBody.details = errorDetails;
      }
      
      return NextResponse.json(responseBody, { status: res.status });
    }

    // Ensure we don't return {raw: ...} for successful responses
    if (payload && typeof payload === "object" && "raw" in payload && Object.keys(payload).length === 1) {
      return NextResponse.json(
        { error: "Invalid response format from backend." },
        { status: 502 }
      );
    }

    // Validate that backend response has expected fields (answer, session_id)
    // and filter out unexpected fields like "url" if present
    if (payload && typeof payload === "object") {
      const backendResponse = payload as Record<string, unknown>;
      
      // Check if backend returned required fields
      if (!("session_id" in backendResponse) || !("answer" in backendResponse)) {
        console.error("Backend response missing required fields. Response:", JSON.stringify(backendResponse, null, 2));
        return NextResponse.json(
          { 
            error: "Backend returned invalid response format. Expected { answer: string, session_id: string, ... }",
            details: process.env.NODE_ENV === "development" ? { backendResponse } : undefined
          },
          { status: 502 }
        );
      }

      // Remove any unexpected "url" field if present (backend might be misconfigured)
      // The backend should NOT return a redirect URL in the JSON response
      if ("url" in backendResponse) {
        console.warn("Backend returned unexpected 'url' field. Removing it from response. URL was:", backendResponse.url);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { url: _url, ...cleanResponse } = backendResponse;
        return NextResponse.json(cleanResponse, { status: 200 });
      }
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    // Enhanced error logging with full context
    // Note: Error objects cannot be JSON.stringify'd directly, so we extract safe properties
    const errorType = err?.constructor?.name || typeof err;
    const rawErrorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    const errorDetails = {
      errorType,
      errorMessage: rawErrorMessage,
      errorStack,
      apiBase: API_BASE,
      backendUrl: `${API_BASE}/`,
      timestamp: new Date().toISOString(),
    };
    
    console.error("=== AGENT QUERY ERROR ===");
    console.error(JSON.stringify(errorDetails, null, 2));
    console.error("Full error object:", err);
    
    // Provide more specific error messages
    let errorMessage = "Agent query failed. Please try again.";
    if (err instanceof Error) {
      if (err.message.includes("fetch failed") || err.message.includes("ECONNREFUSED")) {
        errorMessage = `Cannot connect to backend server at ${API_BASE}. Please ensure the backend is running.`;
      } else if (err.message.includes("Invalid URL")) {
        errorMessage = "Backend URL configuration error. Please check environment variables.";
      } else if (err.name === "URIError") {
        errorMessage = "Cookie parsing error. Please sign in again.";
      } else if (err.message.includes("body") || err.message.includes("already been consumed")) {
        errorMessage = "Request body error. This may indicate a middleware issue.";
      } else {
        errorMessage = `Agent query failed: ${err.message}`;
      }
    }
    
    // Include error details in response for debugging (only in development)
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(isDev && { 
          details: {
            type: errorDetails.errorType,
            message: errorDetails.errorMessage,
          }
        })
      },
      { status: 500 }
    );
  }
}

function parseCookie(header: string): Record<string, string> {
  return header.split(";").reduce((acc, part) => {
    const [k, ...v] = part.trim().split("=");
    if (!k) return acc;
    try {
      const decodedKey = decodeURIComponent(k);
      const decodedValue = decodeURIComponent(v.join("=") || "");
      acc[decodedKey] = decodedValue;
    } catch {
      // Skip malformed cookies instead of crashing
      console.warn(`Skipping malformed cookie: ${k.substring(0, 20)}...`);
    }
    return acc;
  }, {} as Record<string, string>);
}

function safeJson(maybeJson: string) {
  try {
    return JSON.parse(maybeJson);
  } catch {
    return { raw: maybeJson };
  }
}
