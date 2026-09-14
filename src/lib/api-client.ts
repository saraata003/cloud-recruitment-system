export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handle<T>(res: Response): Promise<T> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const message = (body && (body.error || body.message)) || res.statusText || "Request failed";
    throw new ApiError(message, res.status);
  }
  return body as T;
}

export const api = {
  get: <T,>(url: string) => fetch(url).then((r) => handle<T>(r)),
  post: <T,>(url: string, data?: unknown) =>
    fetch(url, {
      method: "POST",
      headers: data !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }).then((r) => handle<T>(r)),
  patch: <T,>(url: string, data?: unknown) =>
    fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data ?? {}),
    }).then((r) => handle<T>(r)),
  del: <T,>(url: string) => fetch(url, { method: "DELETE" }).then((r) => handle<T>(r)),
  postForm: <T,>(url: string, formData: FormData) => fetch(url, { method: "POST", body: formData }).then((r) => handle<T>(r)),
};
