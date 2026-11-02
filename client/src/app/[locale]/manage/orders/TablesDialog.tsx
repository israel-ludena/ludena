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
import { cn, getVietnameseTableStatus, simpleMatchText } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { TableListResType } from "@/schemaValidations/table.schema";
import { TableStatus } from "@/constants/type";
import { useTableListQuery } from "@/queries/useTable";
import { useTranslations } from "next-intl";

type TableItem = TableListResType["data"][0];

const useTableColumns = (): ColumnDef<TableItem>[] => {
  const t = useTranslations("TablesDialog");

  return [
    {
      accessorKey: "number",
      header: t("tableNumber"),
      cell: ({ row }) => <div className='capitalize'>{row.getValue("number")}</div>,
      filterFn: (row, columnId, filterValue: string) => {
        if (filterValue === undefined) return true;
        return simpleMatchText(String(row.original.number), String(filterValue));
      },
    },
    {
      accessorKey: "capacity",
      header: t("capacity"),
      cell: ({ row }) => <div className='capitalize'>{row.getValue("capacity")}</div>,
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => <div>{getVietnameseTableStatus(row.getValue("status"))}</div>,
    },
  ];
};

const PAGE_SIZE = 10;

export function TablesDialog({ onChoose }: { onChoose: (table: TableItem) => void }) {
  const t = useTranslations("TablesDialog");
  const tOrderTable = useTranslations("OrderTable");
  const columns = useTableColumns();
  const [open, setOpen] = useState(false);
  const tableListQuery = useTableListQuery();
  const data = tableListQuery.data?.payload.data ?? [];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
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

  const choose = (table: TableItem) => {
    onChoose(table);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>{t("selectTable")}</Button>
      </DialogTrigger>
      <DialogContent className='max-h-full overflow-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>{t("selectTable")}</DialogTitle>
        </DialogHeader>
        <div>
          <div className='w-full'>
            <div className='flex items-center py-4'>
              <Input
                placeholder={t("filterTableNumber")}
                value={(table.getColumn("number")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("number")?.setFilterValue(event.target.value)}
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
                          if (
                            row.original.status === TableStatus.Available ||
                            row.original.status === TableStatus.Reserved
                          ) {
                            choose(row.original);
                          }
                        }}
                        className={cn({
                          "cursor-pointer":
                            row.original.status === TableStatus.Available ||
                            row.original.status === TableStatus.Reserved,
                          "cursor-not-allowed": row.original.status === TableStatus.Hidden,
                        })}
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
                  pathname='/manage/Tables'
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
