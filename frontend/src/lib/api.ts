const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("zevora_token");
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("zevora_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("zevora_session_id", sid);
  }
  return sid;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
  withSession?: boolean;
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, withSession = false, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (withSession) {
    finalHeaders["x-session-id"] = getSessionId();
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await res.json()
    : null;

  if (!res.ok) {
    const errCode = data?.error?.code || "UNKNOWN_ERROR";
    const errMsg = data?.error?.message || "Something went wrong";
    throw new ApiError(res.status, errCode, errMsg);
  }

  return data as T;
}

export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type");
  const data = contentType?.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.code || "UNKNOWN_ERROR",
      data?.error?.message || "Upload failed",
    );
  }

  return data as T;
}

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function imageUrl(url: string): string {
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

export { API_URL };
