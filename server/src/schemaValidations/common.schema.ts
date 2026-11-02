import z from "zod";

export const MessageRes = z
  .object({
    message: z.string(),
  })
  .strict();

export type MessageResType = z.TypeOf<typeof MessageRes>;

// Slug del restaurante para rutas públicas, ej. ?restaurant=demo
export const RestaurantQuery = z.object({
  restaurant: z.string().trim().toLowerCase().min(1).optional(),
});
export type RestaurantQueryType = z.TypeOf<typeof RestaurantQuery>;
