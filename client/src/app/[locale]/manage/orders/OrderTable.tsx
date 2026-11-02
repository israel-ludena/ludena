"use client";
"use no memo";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GetOrdersResType, PayGuestOrdersResType, UpdateOrderResType } from "@/schemaValidations/order.schema";
import AddOrder from "@/app/[locale]/manage/orders/AddOrder";
import EditOrder from "@/app/[locale]/manage/orders/EditOrder";
import { createContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AutoPagination from "@/components/AutoPagination";
import { getVietnameseOrderStatus, handleErrorApi } from "@/lib/utils";
import { OrderStatusValues } from "@/constants/type";
import OrderStatics from "@/app/[locale]/manage/orders/OrderStatics";
import useOrderTableColumns from "@/app/[locale]/manage/orders/orderTableColumns";
import { useOrderService } from "@/app/[locale]/manage/orders/useOrderService";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { endOfDay, format, startOfDay } from "date-fns";
import { useGetOrderListQuery, useUpdateOrderMutation } from "@/queries/useOrder";
import { useTableListQuery } from "@/queries/useTable";
import TableSkeleton from "@/app/[locale]/manage/orders/TableSkeleton";
import { toast } from "sonner";
import { GuestCreateOrdersResType } from "@/schemaValidations/guest.schema";
import { useAppStore } from "@/components/AppProvider";
import { useTranslations } from "next-intl";

export const OrderTableContext = createContext({
  setOrderIdEdit: (_value: number | undefined) => {},
  orderIdEdit: undefined as number | undefined,
  changeStatus: (_payload: {
    orderId: number;
    dishId: number;
    status: (typeof OrderStatusValues)[number];
    quantity: number;
  }) => {},
  orderObjectByGuestId: {} as OrderObjectByGuestID,
});

export type StatusCountObject = Record<(typeof OrderStatusValues)[number], number>;
export type Statics = {
  status: StatusCountObject;
  table: Record<number, Record<number, StatusCountObject>>;
};
export type OrderObjectByGuestID = Record<number, GetOrdersResType["data"]>;
export type ServingGuestByTableNumber = Record<number, OrderObjectByGuestID>;

const PAGE_SIZE = 10;
const initFromDate = startOfDay(new Date());
const initToDate = endOfDay(new Date());
export default function OrderTable() {
  const t = useTranslations("OrderTable");
  const orderTableColumns = useOrderTableColumns();
  const socket = useAppStore((state) => state.socket);
  const searchParam = useSearchParams();
  const [openStatusFilter, setOpenStatusFilter] = useState(false);
  const [fromDate, setFromDate] = useState(initFromDate);
  const [toDate, setToDate] = useState(initToDate);
  const page = searchParam.get("page") ? Number(searchParam.get("page")) : 1;
  const pageIndex = page - 1;
  const [orderIdEdit, setOrderIdEdit] = useState<number | undefined>();
  const oderListQuery = useGetOrderListQuery({
    fromDate,
    toDate,
  });
  const refetchOrderList = oderListQuery.refetch;
  const orderList = oderListQuery.data?.payload.data ?? [];
  const tableListQuery = useTableListQuery();
  const tableList = tableListQuery.data?.payload.data ?? [];
  const tableListSortedByNumber = tableList.sort((a, b) => a.number - b.number);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex,
    pageSize: PAGE_SIZE,
  });
  const updateOrderMutation = useUpdateOrderMutation();

  const { statics, orderObjectByGuestId, servingGuestByTableNumber } = useOrderService(orderList);

  const changeStatus = async (body: {
    orderId: number;
    dishId: number;
    status: (typeof OrderStatusValues)[number];
    quantity: number;
  }) => {
    try {
      await updateOrderMutation.mutateAsync(body);
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const table = useReactTable({
    data: orderList,
    columns: orderTableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  useEffect(() => {
    table.setPagination({
      pageIndex,
      pageSize: PAGE_SIZE,
    });
  }, [table, pageIndex]);

  const resetDateFilter = () => {
    setFromDate(initFromDate);
    setToDate(initToDate);
  };

  useEffect(() => {
    if (socket?.connected) {
      onConnect();
    }

    function onConnect() {
      console.log("Connected to server with ID:", socket?.id);
    }

    function onDisconnect() {
      console.log("Disconnected from server");
    }

    function refetch() {
      const now = new Date();
      if (now >= fromDate && now <= toDate) {
        refetchOrderList();
      }
    }

    function onUpdateOrder(data: UpdateOrderResType["data"]) {
      console.log("Order updated:", data);
      const {
        dishSnapshot: { name },
        quantity,
      } = data;
      toast(
        t("orderUpdated", {
          dishName: name,
          quantity: quantity,
          status: getVietnameseOrderStatus(data.status),
        })
      );
      refetch();
    }

    function onNewOrder(data: GuestCreateOrdersResType["data"]) {
      const { guest } = data[0];
      toast(
        t("newOrderPlaced", {
          guestName: guest?.name || "",
          tableNumber: guest?.tableNumber || 0,
          orderCount: data.length,
        })
      );
      refetch();
    }

    function onPayment(data: PayGuestOrdersResType["data"]) {
      const { guest } = data[0];
      toast(
        t("paymentSuccessful", {
          guestName: guest?.name || "",
          tableNumber: guest?.tableNumber || 0,
          orderCount: data.length,
        })
      );
      refetch();
    }

    socket?.on("update-order", onUpdateOrder);
    socket?.on("new-order", onNewOrder);
    socket?.on("payment", onPayment);

    socket?.on("connect", onConnect);
    socket?.on("disconnect", onDisconnect);

    return () => {
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
      socket?.off("update-order", onUpdateOrder);
      socket?.off("new-order", onNewOrder);
      socket?.off("payment", onPayment);
    };
  }, [refetchOrderList, fromDate, toDate, socket, t]);

  return (
    <OrderTableContext.Provider
      value={{
        orderIdEdit,
        setOrderIdEdit,
        changeStatus,
        orderObjectByGuestId,
      }}
    >
      <div className='w-full'>
        <EditOrder id={orderIdEdit} setId={setOrderIdEdit} onSubmitSuccess={() => {}} />
        <div className='flex items-center'>
          <div className='flex flex-wrap gap-2'>
            <div className='flex items-center'>
              <span className='mr-2'>{t("from")}</span>
              <Input
                type='datetime-local'
                placeholder={t("fromDate")}
                className='text-sm'
                value={format(fromDate, "yyyy-MM-dd HH:mm").replace(" ", "T")}
                onChange={(event) => setFromDate(new Date(event.target.value))}
              />
            </div>
            <div className='flex items-center'>
              <span className='mr-2'>{t("to")}</span>
              <Input
                type='datetime-local'
                placeholder={t("toDate")}
                value={format(toDate, "yyyy-MM-dd HH:mm").replace(" ", "T")}
                onChange={(event) => setToDate(new Date(event.target.value))}
              />
            </div>
            <Button className='' variant={"outline"} onClick={resetDateFilter}>
              {t("reset")}
            </Button>
          </div>
          <div className='ml-auto'>
            <AddOrder />
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-4 py-4'>
          <Input
            placeholder={t("guestName")}
            value={(table.getColumn("guestName")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("guestName")?.setFilterValue(event.target.value)}
            className='max-w-[100px]'
          />
          <Input
            placeholder={t("tableNumber")}
            value={(table.getColumn("tableNumber")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("tableNumber")?.setFilterValue(event.target.value)}
            className='max-w-[80px]'
          />
          <Popover open={openStatusFilter} onOpenChange={setOpenStatusFilter}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={openStatusFilter}
                className='w-[150px] justify-between text-sm'
              >
                {table.getColumn("status")?.getFilterValue()
                  ? getVietnameseOrderStatus(
                      table.getColumn("status")?.getFilterValue() as (typeof OrderStatusValues)[number]
                    )
                  : t("status")}
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[200px] p-0'>
              <Command>
                <CommandGroup>
                  <CommandList>
                    {OrderStatusValues.map((status) => (
                      <CommandItem
                        key={status}
                        value={status}
                        onSelect={(currentValue) => {
                          table
                            .getColumn("status")
                            ?.setFilterValue(
                              currentValue === table.getColumn("status")?.getFilterValue() ? "" : currentValue
                            );
                          setOpenStatusFilter(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            table.getColumn("status")?.getFilterValue() === status ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {getVietnameseOrderStatus(status)}
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <OrderStatics
          statics={statics}
          tableList={tableListSortedByNumber}
          servingGuestByTableNumber={servingGuestByTableNumber}
        />
        {oderListQuery.isPending && <TableSkeleton />}
        {!oderListQuery.isPending && (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={orderTableColumns.length} className='h-24 text-center'>
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <div className='flex items-center justify-end space-x-2 py-4'>
          <div className='text-muted-foreground flex-1 py-4 text-xs'>
            {t("showing")} <strong>{table.getPaginationRowModel().rows.length}</strong> {t("of")}{" "}
            <strong>{orderList.length}</strong> {t("results")}
          </div>
          <div>
            <AutoPagination
              page={table.getState().pagination.pageIndex + 1}
              pageSize={table.getPageCount()}
              pathname='/manage/orders'
            />
          </div>
        </div>
      </div>
    </OrderTableContext.Provider>
  );
}
