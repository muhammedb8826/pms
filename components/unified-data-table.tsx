"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export interface UnifiedDataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  loading?: boolean
  emptyMessage?: string
  tabs?: Array<{
    value: string
    label: string
    badge?: number
  }>
  defaultTab?: string
  onTabChange?: (value: string) => void
  renderDetails?: (item: TData) => React.ReactNode
  detailsTitle?: (item: TData) => string
  detailsDescription?: (item: TData) => string
  pageIndex?: number
  pageSize?: number
  pageCount?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  headerActions?: React.ReactNode
}

export function UnifiedDataTable<TData extends { id: string | number }>({
  data,
  columns,
  loading = false,
  emptyMessage = "No results.",
  tabs,
  defaultTab,
  onTabChange,
  renderDetails,
  detailsTitle,
  detailsDescription,
  pageIndex = 0,
  pageSize = 10,
  pageCount,
  onPageChange,
  onPageSizeChange,
  enableRowSelection = false,
  enableColumnVisibility = true,
  headerActions,
}: UnifiedDataTableProps<TData>) {
  const isMobile = useIsMobile()
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedItem, setSelectedItem] = React.useState<TData | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [currentTab, setCurrentTab] = React.useState(defaultTab || tabs?.[0]?.value || "")

  const table = useReactTable({
    data,
    columns: React.useMemo(() => columns, [columns]),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    getRowId: (row) => String(row.id),
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPagination = updater({ pageIndex, pageSize })
        if (onPageChange && newPagination.pageIndex !== pageIndex) {
          onPageChange(newPagination.pageIndex)
        }
        if (onPageSizeChange && newPagination.pageSize !== pageSize) {
          onPageSizeChange(newPagination.pageSize)
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: pageCount !== undefined,
    pageCount,
  })

  const handleViewDetails = (item: TData) => {
    setSelectedItem(item)
    setDetailsOpen(true)
  }

  const handleTabChange = (value: string) => {
    setCurrentTab(value)
    onTabChange?.(value)
  }


  const visibleColumns = enableColumnVisibility
    ? table.getAllColumns().filter((column) => {
        // Check if column can be hidden and has an accessorKey or id
        return column.getCanHide() && (column.id || 'accessorKey' in column.columnDef)
      })
    : []

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        {tabs && tabs.length > 0 ? (
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="ml-1 rounded-full bg-muted-foreground/30 px-1 text-xs">
                    {tab.badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {enableColumnVisibility && visibleColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {visibleColumns.map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {headerActions}
        </div>
      </div>
      {tabs?.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (renderDetails) {
                          handleViewDetails(row.original)
                        }
                      }}
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
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {(onPageChange || onPageSizeChange) && (
            <div className="flex items-center justify-between px-4">
              <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                {enableRowSelection &&
                  `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected.`}
              </div>
              <div className="flex w-full items-center gap-8 lg:w-fit">
                {onPageSizeChange && (
                  <div className="hidden items-center gap-2 lg:flex">
                    <Label htmlFor="rows-per-page" className="text-sm font-medium">
                      Rows per page
                    </Label>
                    <Select
                      value={`${pageSize}`}
                      onValueChange={(value) => {
                        onPageSizeChange(Number(value))
                      }}
                    >
                      <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 30, 40, 50].map((size) => (
                          <SelectItem key={size} value={`${size}`}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {pageCount !== undefined && (
                  <div className="flex w-fit items-center justify-center text-sm font-medium">
                    Page {pageIndex + 1} of {pageCount}
                  </div>
                )}
                {onPageChange && (
                  <div className="ml-auto flex items-center gap-2 lg:ml-0">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => onPageChange(0)}
                      disabled={pageIndex === 0}
                    >
                      <span className="sr-only">Go to first page</span>
                      <IconChevronsLeft />
                    </Button>
                    <Button
                      variant="outline"
                      className="size-8"
                      size="icon"
                      onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
                      disabled={pageIndex === 0}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <IconChevronLeft />
                    </Button>
                    <Button
                      variant="outline"
                      className="size-8"
                      size="icon"
                      onClick={() => onPageChange(Math.min((pageCount || 1) - 1, pageIndex + 1))}
                      disabled={pageIndex >= (pageCount || 1) - 1}
                    >
                      <span className="sr-only">Go to next page</span>
                      <IconChevronRight />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden size-8 lg:flex"
                      size="icon"
                      onClick={() => onPageChange((pageCount || 1) - 1)}
                      disabled={pageIndex >= (pageCount || 1) - 1}
                    >
                      <span className="sr-only">Go to last page</span>
                      <IconChevronsRight />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      ))}
      {renderDetails && selectedItem && (
        <Drawer
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          direction={isMobile ? "bottom" : "right"}
        >
          <DrawerContent className="max-h-[95vh] sm:max-w-lg">
            <DrawerHeader>
              <DrawerTitle>
                {detailsTitle ? detailsTitle(selectedItem) : "Details"}
              </DrawerTitle>
              {detailsDescription && (
                <DrawerDescription>
                  {detailsDescription(selectedItem)}
                </DrawerDescription>
              )}
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-4">
              {renderDetails(selectedItem)}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </Tabs>
  )
}

