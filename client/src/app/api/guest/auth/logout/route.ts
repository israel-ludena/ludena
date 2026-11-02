import guestApiRequest from "@/apiRequests/guest";
import { cookies } from "next/headers";

export async function POST(_request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  if (!accessToken || !refreshToken) {
    return Response.json(
      {
        message: "No se recibió el access token o el refresh token",
      },
      {
        status: 200,
      }
    );
  }
  try {
    const result = await guestApiRequest.serverLogout({
      accessToken,
      refreshToken,
    });
    return Response.json(result.payload);
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        message: "Error al llamar a la API del servidor",
      },
      {
        status: 200,
      }
    );
  }
}
