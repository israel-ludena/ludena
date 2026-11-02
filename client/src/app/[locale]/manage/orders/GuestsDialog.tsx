"use no memo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AutoPagination from "@/components/AutoPagination";
import { useEffect, useState } from "react";
import {
  ColumnDef,
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
import { formatDateTimeToLocaleString, simpleMatchText } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { GetListGuestsResType } from "@/schemaValidations/account.schema";
import { endOfDay, format, startOfDay } from "date-fns";
import { useGetGuestListQuery } from "@/queries/useAccount";
import { useTranslations } from "next-intl";

type GuestItem = GetListGuestsResType["data"][0];

const useGuestColumns = (): ColumnDef<GuestItem>[] => {
  const t = useTranslations("GuestsDialog");

  return [
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <div className='capitalize'>
          {row.getValue("name")} | (#{row.original.id})
        </div>
      ),
      filterFn: (row, columnId, filterValue: string) => {
        if (filterValue === undefined) return true;
        return simpleMatchText(row.original.name + String(row.original.id), String(filterValue));
      },
    },
    {
      accessorKey: "tableNumber",
      header: t("tableNumber"),
      cell: ({ row }) => <div className='capitalize'>{row.getValue("tableNumber")}</div>,
      filterFn: (row, columnId, filterValue: string) => {
        if (filterValue === undefined) return true;
        return simpleMatchText(String(row.original.tableNumber), String(filterValue));
      },
    },
    {
      accessorKey: "createdAt",
      header: () => <div>{t("created")}</div>,
      cell: ({ row }) => (
        <div className='flex items-center space-x-4 text-sm'>
          {formatDateTimeToLocaleString(row.getValue("createdAt"))}
        </div>
      ),
    },
  ];
};

const PAGE_SIZE = 10;
const initFromDate = startOfDay(new Date());
const initToDate = endOfDay(new Date());

export default function GuestsDialog({ onChoose }: { onChoose: (guest: GuestItem) => void }) {
  const t = useTranslations("GuestsDialog");
  const tOrderTable = useTranslations("OrderTable");
  const columns = useGuestColumns();
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState(initFromDate);
  const [toDate, setToDate] = useState(initToDate);
  const guestListQuery = useGetGuestListQuery({
    fromDate,
    toDate,
  });
  const data = guestListQuery.data?.payload.data ?? [];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0, // Gía trị mặc định ban đầu, không có ý nghĩa khi data được fetch bất đồng bộ
    pageSize: PAGE_SIZE, //default page size
  });

  const table = useReactTable({
    data,
    columns,
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
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    });
  }, [table]);

  const choose = (guest: GuestItem) => {
    onChoose(guest);
    setOpen(false);
  };

  const resetDateFilter = () => {
    setFromDate(initFromDate);
    setToDate(initToDate);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>{t("selectCustomer")}</Button>
      </DialogTrigger>
      <DialogContent className='max-h-full overflow-auto sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle>{t("selectCustomer")}</DialogTitle>
        </DialogHeader>
        <div>
          <div className='w-full'>
            <div className='flex flex-wrap gap-2'>
              <div className='flex items-center'>
                <span className='mr-2'>{tOrderTable("from")}</span>
                <Input
                  type='datetime-local'
                  placeholder={tOrderTable("fromDate")}
                  className='text-sm'
                  value={format(fromDate, "yyyy-MM-dd HH:mm").replace(" ", "T")}
                  onChange={(event) => setFromDate(new Date(event.target.value))}
                />
              </div>
              <div className='flex items-center'>
                <span className='mr-2'>{tOrderTable("to")}</span>
                <Input
                  type='datetime-local'
                  placeholder={tOrderTable("toDate")}
                  value={format(toDate, "yyyy-MM-dd HH:mm").replace(" ", "T")}
                  onChange={(event) => setToDate(new Date(event.target.value))}
                />
              </div>
              <Button className='' variant={"outline"} onClick={resetDateFilter}>
                {tOrderTable("reset")}
              </Button>
            </div>
            <div className='flex items-center gap-2 py-4'>
              <Input
                placeholder={t("search")}
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                className='w-[170px]'
              />
              <Input
                placeholder={tOrderTable("tableNumber")}
                value={(table.getColumn("tableNumber")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("tableNumber")?.setFilterValue(event.target.value)}
                className='w-[80px]'
              />
            </div>
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
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        onClick={() => {
                          choose(row.original);
                        }}
                        className='cursor-pointer'
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className='h-24 text-center'>
                        {tOrderTable("noResults")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className='flex items-center justify-end space-x-2 py-4'>
              <div className='text-muted-foreground flex-1 py-4 text-xs'>
                {tOrderTable("showing")} <strong>{table.getPaginationRowModel().rows.length}</strong>{" "}
                {tOrderTable("of")} <strong>{data.length}</strong> {tOrderTable("results")}
              </div>
              <div>
                <AutoPagination
                  page={table.getState().pagination.pageIndex + 1}
                  pageSize={table.getPageCount()}
                  pathname='/manage/Guests'
                  isLink={false}
                  onClick={(pageNumber) =>
                    table.setPagination({
                      pageIndex: pageNumber - 1,
                      pageSize: PAGE_SIZE,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
