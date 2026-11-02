import z from "zod";

export const RestaurantSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  currency: z.string(),
});
export type RestaurantType = z.TypeOf<typeof RestaurantSchema>;

export const RestaurantRes = z.object({
  data: RestaurantSchema,
  message: z.string(),
});
export type RestaurantResType = z.TypeOf<typeof RestaurantRes>;

export const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "slugInvalid")
  .max(60, "slugInvalid")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slugInvalid");

export const RegisterRestaurantBody = z
  .object({
    restaurantName: z.string().trim().min(2, "required").max(120),
    slug: SlugSchema,
    ownerName: z.string().trim().min(2, "required").max(256),
    email: z.string().email("invalidEmail"),
    password: z.string().min(6, "minmaxPassword").max(100, "minmaxPassword"),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(256).optional(),
  })
  .strict();
export type RegisterRestaurantBodyType = z.TypeOf<typeof RegisterRestaurantBody>;

/** Convierte "La Casa del Ceviche" en "la-casa-del-ceviche". */
export const toSlug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
