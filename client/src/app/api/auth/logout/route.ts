import authApiRequest from "@/apiRequests/auth";
import { cookies } from "next/headers";

export async function POST(_request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  if (!accessToken || !refreshToken) {
    return Response.json({ message: "No access token or refresh token found" }, { status: 200 });
  }
  try {
    const result = await authApiRequest.serverLogout({
      accessToken,
      refreshToken,
    });
    return Response.json(result.payload);
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ message: "An unexpected error occurred during login." }, { status: 200 });
  }
}
