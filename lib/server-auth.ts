import { parseAccessToken } from "@/lib/auth";

export function getBearerToken(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

export function getAuthenticatedUserId(request: Request) {
  return parseAccessToken(getBearerToken(request));
}
