"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { getVietnameseTableStatus, handleErrorApi } from "@/lib/utils";
import { CreateTableBody, CreateTableBodyType } from "@/schemaValidations/table.schema";
import { TableStatus, TableStatusValues } from "@/constants/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddTableMutation } from "@/queries/useTable";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function AddTable() {
  const t = useTranslations("AddTable");
  const [open, setOpen] = useState(false);
  const addTableMutation = useAddTableMutation();
  const form = useForm({
    resolver: zodResolver(CreateTableBody),
    defaultValues: {
      number: 0,
      capacity: 2,
      status: TableStatus.Hidden,
    },
  } as const);

  const reset = () => {
    form.reset();
  };

  const onSubmit = async (values: CreateTableBodyType) => {
    if (addTableMutation.isPending) return;
    try {
      const result = await addTableMutation.mutateAsync(values);
      toast(result.payload.message);
      reset();
      setOpen(false);
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      });
    }
  };
  return (
    <Dialog
      onOpenChange={(value) => {
        if (!value) reset();
        setOpen(value);
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size='sm' className='h-7 gap-1'>
          <PlusCircle className='h-3.5 w-3.5' />
          <span className='sr-only sm:not-sr-only sm:whitespace-nowrap'>{t("addTable")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-screen overflow-auto sm:max-w-[600px]' onCloseAutoFocus={() => form.reset()}>
        <DialogHeader>
          <DialogTitle>{t("addTableTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='add-table-form'
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log("error", error);
            })}
            onReset={reset}
          >
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='number'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='name'>{t("tableNumber")}</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input
                          id='number'
                          type='number'
                          className='w-full'
                          {...field}
                          value={field.value?.toString()}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='capacity'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='price'>{t("capacity")}</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input
                          id='capacity'
                          className='w-full'
                          {...field}
                          type='number'
                          value={field.value?.toString() || ""}
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
                      <Label htmlFor='description'>{t("status")}</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectStatus")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TableStatusValues.map((status) => (
                              <SelectItem key={status} value={status}>
                                {getVietnameseTableStatus(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='add-table-form'>
            {t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
