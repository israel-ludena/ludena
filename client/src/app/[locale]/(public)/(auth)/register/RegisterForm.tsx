"use client";
import restaurantApiRequest from "@/apiRequests/restaurant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import envConfig from "@/config";
import { Link, useRouter } from "@/i18n/navigation";
import { handleErrorApi } from "@/lib/utils";
import {
  RegisterRestaurantBody,
  RegisterRestaurantBodyType,
  toSlug,
} from "@/schemaValidations/restaurant.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FieldName = keyof RegisterRestaurantBodyType;

export default function RegisterForm() {
  const t = useTranslations("Register");
  const errorT = useTranslations("ErrorMessage");
  const router = useRouter();
  // Mientras el usuario no edite la dirección a mano, se genera a partir del nombre
  const [slugTouched, setSlugTouched] = useState(false);
  const registerMutation = useMutation({ mutationFn: restaurantApiRequest.register });

  const form = useForm<RegisterRestaurantBodyType>({
    resolver: zodResolver(RegisterRestaurantBody),
    defaultValues: { restaurantName: "", slug: "", ownerName: "", email: "", password: "", phone: "", address: "" },
  });
  const slug = form.watch("slug");

  // Los mensajes del formulario son claves de traducción; los del servidor llegan ya en español
  const showError = (message?: string) => {
    if (!message) return null;
    return errorT.has(message as never) ? errorT(message as never) : message;
  };

  const onSubmit = async (data: RegisterRestaurantBodyType) => {
    if (registerMutation.isPending) return;
    try {
      const result = await registerMutation.mutateAsync({
        ...data,
        phone: data.phone || undefined,
        address: data.address || undefined,
      });
      toast(result.payload.message);
      router.push("/login");
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  const textField = (name: FieldName, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field, formState: { errors } }) => (
        <FormItem>
          <div className='grid gap-2'>
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} {...field} {...props} />
            <FormMessage>{showError(errors[name]?.message)}</FormMessage>
          </div>
        </FormItem>
      )}
    />
  );

  return (
    <Card className='mx-auto w-full max-w-md'>
      <CardHeader>
        <CardTitle className='text-2xl'>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className='grid gap-4' noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='restaurantName'
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className='grid gap-2'>
                    <Label htmlFor='restaurantName'>{t("restaurantName")}</Label>
                    <Input
                      id='restaurantName'
                      placeholder={t("restaurantNamePlaceholder")}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!slugTouched) form.setValue("slug", toSlug(e.target.value));
                      }}
                    />
                    <FormMessage>{showError(errors.restaurantName?.message)}</FormMessage>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='slug'
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className='grid gap-2'>
                    <Label htmlFor='slug'>{t("slug")}</Label>
                    <Input
                      id='slug'
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true);
                        field.onChange(toSlug(e.target.value));
                      }}
                    />
                    <p className='text-muted-foreground text-xs break-all'>
                      {t("slugHint")} {envConfig.NEXT_PUBLIC_URL}/es/r/{slug || "tu-restaurante"}
                    </p>
                    <FormMessage>{showError(errors.slug?.message)}</FormMessage>
                  </div>
                </FormItem>
              )}
            />
            {textField("ownerName", t("ownerName"))}
            {textField("email", t("email"), { type: "email", placeholder: "correo@turestaurante.ec" })}
            {textField("password", t("password"), { type: "password" })}
            {textField("phone", t("phone"), { type: "tel", placeholder: "09XXXXXXXX" })}
            {textField("address", t("address"))}
            <Button type='submit' className='w-full'>
              {registerMutation.isPending && <LoaderCircle className='mr-2 h-5 w-5 animate-spin' />}
              {t("submit")}
            </Button>
            <p className='text-muted-foreground text-center text-sm'>
              {t("haveAccount")}{" "}
              <Link href='/login' className='text-foreground underline'>
                {t("loginLink")}
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
