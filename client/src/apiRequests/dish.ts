import http from "@/lib/http";
import { CreateDishBodyType, DishListResType, DishResType, UpdateDishBodyType } from "@/schemaValidations/dish.schema";

const dishApiRequest = {
  // `restaurant` = slug del restaurante; sin él, el servidor usa el restaurante de la sesión
  list: (restaurant?: string) =>
    http.get<DishListResType>(restaurant ? `dishes?restaurant=${encodeURIComponent(restaurant)}` : "dishes", {
      next: { tags: ["dishes-collection"] },
    }),
  add: (body: CreateDishBodyType) => http.post<DishResType>("dishes", body),
  getDish: (id: number) => http.get<DishResType>(`dishes/${id}`),
  updateDish: (id: number, body: UpdateDishBodyType) => http.put<DishResType>(`dishes/${id}`, body),
  deleteDish: (id: number) => http.delete<DishResType>(`dishes/${id}`),
};

export default dishApiRequest;
