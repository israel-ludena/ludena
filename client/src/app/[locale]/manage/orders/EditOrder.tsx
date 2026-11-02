"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UpdateOrderBody, UpdateOrderBodyType } from "@/schemaValidations/order.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getVietnameseOrderStatus, handleErrorApi } from "@/lib/utils";
import { OrderStatus, OrderStatusValues } from "@/constants/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DishesDialog } from "@/app/[locale]/manage/orders/DishesDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useMemo, useState } from "react";
import { DishListResType } from "@/schemaValidations/dish.schema";
import { useGetOrderDetailQuery, useUpdateOrderMutation } from "@/queries/useOrder";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function EditOrder({
  id,
  setId,
  onSubmitSuccess,
}: {
  id?: number | undefined;
  setId: (value: number | undefined) => void;
  onSubmitSuccess?: () => void;
}) {
  const t = useTranslations("EditOrder");
  const [selectedDish, setSelectedDish] = useState<DishListResType["data"][0] | null>(null);
  const updateOrderMutation = useUpdateOrderMutation();
  const { data } = useGetOrderDetailQuery({ id: id as number, enabled: Boolean(id) });
  const form = useForm<UpdateOrderBodyType>({
    resolver: zodResolver(UpdateOrderBody),
    defaultValues: {
      status: OrderStatus.Pending,
      dishId: 0,
      quantity: 1,
    },
  });

  // Derive selectedDish from data instead of storing in state during effect
  const dishSnapshot = useMemo(() => {
    return data?.payload.data.dishSnapshot ?? selectedDish;
  }, [data, selectedDish]);

  // Update form when data changes
  useEffect(() => {
    if (data) {
      const {
        status,
        dishSnapshot: { dishId },
        quantity,
      } = data.payload.data;
      form.reset({
        status,
        dishId: dishId ?? 0,
        quantity,
      });
    }
  }, [data, form]);

  const onSubmit = async (values: UpdateOrderBodyType) => {
    if (updateOrderMutation.isPending) return;
    try {
      const body: UpdateOrderBodyType & { orderId: number } = {
        ...values,
        orderId: id as number,
      };
      const result = await updateOrderMutation.mutateAsync(body);
      toast(result.payload.message);
      reset();
      onSubmitSuccess?.();
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      });
    }
  };

  const reset = () => {
    setId(undefined);
  };

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) {
          reset();
        }
      }}
    >
      <DialogContent className='max-h-screen overflow-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>{t("updateOrder")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='edit-order-form'
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log("Form submit error:", error);
            })}
          >
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='dishId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-4 items-center justify-items-start gap-4'>
                    <FormLabel>{t("dish")}</FormLabel>
                    <div className='col-span-2 flex items-center space-x-4'>
                      <Avatar className='aspect-square h-[50px] w-[50px] rounded-md object-cover'>
                        <AvatarImage src={dishSnapshot?.image} />
                        <AvatarFallback className='rounded-none'>{dishSnapshot?.name}</AvatarFallback>
                      </Avatar>
                      <div>{dishSnapshot?.name}</div>
                    </div>

                    <DishesDialog
                      onChoose={(dish) => {
                        field.onChange(dish.id);
                        setSelectedDish(dish);
                      }}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='quantity'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='quantity'>{t("quantity")}</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input
                          id='quantity'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          className='w-16 text-center'
                          {...field}
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numberValue = Number(value);
                            if (isNaN(numberValue)) {
                              return;
                            }
                            field.onChange(numberValue);
                          }}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <FormLabel>{t("status")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl className='col-span-3'>
                          <SelectTrigger className='w-[200px]'>
                            <SelectValue placeholder={t("status")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OrderStatusValues.map((status) => (
                            <SelectItem key={status} value={status}>
                              {getVietnameseOrderStatus(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='edit-order-form'>
            {t("update")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
