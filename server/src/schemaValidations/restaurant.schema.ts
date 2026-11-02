import z from "zod";

export const RestaurantSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  logo: z.string().nullable(),
  currency: z.string(),
  timezone: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const RestaurantRes = z.object({
  data: RestaurantSchema,
  message: z.string(),
});
export type RestaurantResType = z.TypeOf<typeof RestaurantRes>;

// Solo datos públicos: lo que ve un comensal sin iniciar sesión
export const PublicRestaurantRes = z.object({
  data: RestaurantSchema.pick({ id: true, name: true, slug: true, address: true, phone: true, logo: true, currency: true }),
  message: z.string(),
});
export type PublicRestaurantResType = z.TypeOf<typeof PublicRestaurantRes>;

export const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Solo letras minúsculas, números y guiones (ej. la-casa-del-ceviche)");

export const RestaurantSlugParams = z.object({ slug: SlugSchema });
export type RestaurantSlugParamsType = z.TypeOf<typeof RestaurantSlugParams>;

export const RegisterRestaurantBody = z
  .object({
    restaurantName: z.string().trim().min(2).max(120),
    slug: SlugSchema,
    ownerName: z.string().trim().min(2).max(256),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(256).optional(),
  })
  .strict();
export type RegisterRestaurantBodyType = z.TypeOf<typeof RegisterRestaurantBody>;

export const UpdateRestaurantBody = z
  .object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(30).nullable().optional(),
    address: z.string().trim().max(256).nullable().optional(),
    logo: z.string().url().nullable().optional(),
  })
  .strict();
export type UpdateRestaurantBodyType = z.TypeOf<typeof UpdateRestaurantBody>;
