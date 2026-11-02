"use client";
"use no memo";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
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
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createContext, useContext, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency, getVietnameseDishStatus, handleErrorApi } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { DishListResType } from "@/schemaValidations/dish.schema";
import EditDish from "@/app/[locale]/manage/dishes/EditDish";
import AddDish from "@/app/[locale]/manage/dishes/AddDish";
import AutoPagination from "@/components/AutoPagination";
import { useDeleteDishMutation, useDishListQuery } from "@/queries/useDish";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type DishItem = DishListResType["data"][0];

const DishTableContext = createContext<{
  setDishIdEdit: (value: number) => void;
  dishIdEdit: number | undefined;
  dishDelete: DishItem | null;
  setDishDelete: (value: DishItem | null) => void;
}>({
  setDishIdEdit: (_value: number) => {},
  dishIdEdit: undefined,
  dishDelete: null,
  setDishDelete: (_value: DishItem | null) => {},
});

function useDishColumns() {
  const t = useTranslations("DishTable");

  const columns: ColumnDef<DishItem>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "image",
      header: t("image"),
      cell: ({ row }) => (
        <div>
          <Avatar className='aspect-square h-[100px] w-[100px] rounded-md object-cover'>
            <AvatarImage src={row.getValue("image")} />
            <AvatarFallback className='rounded-none'>{row.original.name}</AvatarFallback>
          </Avatar>
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => <div className='capitalize'>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "price",
      header: t("price"),
      cell: ({ row }) => <div className='capitalize'>{formatCurrency(row.getValue("price"))}</div>,
    },
    {
      accessorKey: "description",
      header: t("dishDescription"),
      cell: ({ row }) => (
        <div dangerouslySetInnerHTML={{ __html: row.getValue("description") }} className='whitespace-pre-line' />
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => <div>{getVietnameseDishStatus(row.getValue("status"))}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: function Actions({ row }) {
        const { setDishIdEdit, setDishDelete } = useContext(DishTableContext);
        const openEditDish = () => {
          setDishIdEdit(row.original.id);
        };

        const openDeleteDish = () => {
          setDishDelete(row.original);
        };
        return (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <DotsHorizontalIcon className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openEditDish}>{t("edit")}</DropdownMenuItem>
              <DropdownMenuItem onClick={openDeleteDish}>{t("delete")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return columns;
}

function AlertDialogDeleteDish({
  dishDelete,
  setDishDelete,
}: {
  dishDelete: DishItem | null;
  setDishDelete: (value: DishItem | null) => void;
}) {
  const t = useTranslations("DishTable");
  const { mutateAsync } = useDeleteDishMutation();
  const deleteDish = async () => {
    if (!dishDelete) return;
    try {
      const result = await mutateAsync(dishDelete.id);
      toast(result.payload.message);
      setDishDelete(null);
    } catch (error) {
      handleErrorApi({
        error,
      });
    }
  };
  return (
    <AlertDialog
      open={Boolean(dishDelete)}
      onOpenChange={(value) => {
        if (!value) {
          setDishDelete(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDishTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDishDescription")}{" "}
            <span className='bg-foreground text-primary-foreground rounded px-1'>{dishDelete?.name}</span>{" "}
            {t("willBeDeletedPermanently")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteDish}>{t("continue")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const PAGE_SIZE = 10;
export default function DishTable() {
  const t = useTranslations("DishTable");
  const searchParam = useSearchParams();
  const page = searchParam.get("page") ? Number(searchParam.get("page")) : 1;
  const pageIndex = page - 1;
  const [dishIdEdit, setDishIdEdit] = useState<number | undefined>();
  const [dishDelete, setDishDelete] = useState<DishItem | null>(null);
  const dishListQuery = useDishListQuery();
  const data = dishListQuery.data?.payload.data ?? [];
  const columns = useDishColumns();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex,
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
      pageIndex,
      pageSize: PAGE_SIZE,
    });
  }, [table, pageIndex]);

  return (
    <DishTableContext.Provider value={{ dishIdEdit, setDishIdEdit, dishDelete, setDishDelete }}>
      <div className='w-full'>
        <EditDish id={dishIdEdit} setId={setDishIdEdit} />
        <AlertDialogDeleteDish dishDelete={dishDelete} setDishDelete={setDishDelete} />
        <div className='flex items-center py-4'>
          <Input
            placeholder={t("filterName")}
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className='max-w-sm'
          />
          <div className='ml-auto flex items-center gap-2'>
            <AddDish />
          </div>
        </div>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className='flex items-center justify-end space-x-2 py-4'>
          <div className='text-muted-foreground flex-1 py-4 text-xs'>
            {t("showing")} <strong>{table.getPaginationRowModel().rows.length}</strong> {t("of")}{" "}
            <strong>{data.length}</strong> {t("results")}
          </div>
          <div>
            <AutoPagination
              page={table.getState().pagination.pageIndex + 1}
              pageSize={table.getPageCount()}
              pathname='/manage/dishes'
            />
          </div>
        </div>
      </div>
    </DishTableContext.Provider>
  );
}
