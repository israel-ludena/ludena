import http from "@/lib/http";
import { RegisterRestaurantBodyType, RestaurantResType } from "@/schemaValidations/restaurant.schema";

const restaurantApiRequest = {
  register: (body: RegisterRestaurantBodyType) => http.post<RestaurantResType>("restaurants/register", body),
  getBySlug: (slug: string) => http.get<RestaurantResType>(`restaurants/${encodeURIComponent(slug)}`),
  me: () => http.get<RestaurantResType>("restaurants/me"),
};

export default restaurantApiRequest;
