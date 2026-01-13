"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useGetAllStockMovementsQuery,
  useGetAllProductsQuery,
} from "@/features/product/api/productApi";
import { BinCardEntry, Product } from "@/features/product/types";
import { getResponseData } from "@/lib/utils/api-response";
import { DashboardDataTable } from "@/components/dashboard-data-table";

import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BinCardPage() {
  const [selectedEntry, setSelectedEntry] = useState<BinCardEntry | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [productId, setProductId] = useState<string>("");
  const [transactionType, setTransactionType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: response, isLoading } = useGetAllStockMovementsQuery({
    page,
    limit: pageSize,
    search,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: allProductsResponse } = useGetAllProductsQuery();

  // Get all products for filter dropdown
  const allProducts = useMemo(() => {
    const data = allProductsResponse as
      | Product[]
      | { success: boolean; data: Product[] }
      | undefined;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data))
      return data.data;
    return [];
  }, [allProductsResponse]);

  // Filter and sort movements client-side
  const rawMovements = useMemo(() => {
    const movements = getResponseData<BinCardEntry[]>(response) ?? [];

    let filtered = [...movements]; // Create a copy to avoid mutating the original array

    // Filter by product
    if (productId) {
      filtered = filtered.filter((m) => m.product?.id === productId);
    }

    // Filter by transaction type
    if (transactionType === "in") {
      filtered = filtered.filter((m) => m.quantityIn > 0);
    } else if (transactionType === "out") {
      filtered = filtered.filter((m) => m.quantityOut > 0);
    }

    // Apply sorting (create a new sorted array)
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortBy === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (sortBy === "documentNo") {
        aValue = a.documentNo || "";
        bValue = b.documentNo || "";
      } else if (sortBy === "product") {
        aValue = a.product?.name || "";
        bValue = b.product?.name || "";
      } else {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === "asc"
          ? aValue > bValue
            ? 1
            : -1
          : aValue < bValue
          ? 1
          : -1;
      }
    });

    return sorted;
  }, [response, productId, transactionType, sortBy, sortOrder]);

  const total = rawMovements.length;
  const pageCount = Math.ceil(total / pageSize) || 1;

  // Apply pagination to filtered results
  const paginatedMovements = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return rawMovements.slice(start, end);
  }, [rawMovements, page, pageSize]);

  const renderDetails = useCallback((entry: BinCardEntry) => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Document No</div>
            <div className="font-medium text-foreground">
              {entry.documentNo}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Date of Entry</div>
            <div className="text-foreground">
              {entry.createdAt
                ? format(new Date(entry.createdAt), "dd MMM yyyy HH:mm")
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">From / To</div>
            <div className="font-medium text-foreground">
              {entry.entityName || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              Transaction Type
            </div>
            <Badge variant={entry.quantityIn > 0 ? "default" : "secondary"}>
              {entry.quantityIn > 0
                ? "Stock In / Purchase"
                : "Stock Out / Sale"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
            Affected Item Details
          </span>
          <div className="rounded-lg border bg-background p-3 text-sm">
            <div className="flex justify-between border-b pb-2 mb-2">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-medium">{entry.product?.name}</span>
            </div>
            <div className="flex justify-between border-b pb-2 mb-2">
              <span className="text-muted-foreground">Batch Number:</span>
              <span className="font-medium text-primary">
                {entry.batch?.batchNumber || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Price:</span>
              <span className="font-medium">{entry.unitPrice}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
            Inventory Impact
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border p-2">
              <div className="text-[10px] text-muted-foreground uppercase">
                Change
              </div>
              <div
                className={`text-lg font-bold ${
                  entry.quantityIn > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {entry.quantityIn > 0
                  ? `+${entry.quantityIn}`
                  : `-${entry.quantityOut}`}
              </div>
            </div>
            <div className="rounded-lg border p-2 bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase">
                Resulting Bal
              </div>
              <div className="text-lg font-bold">{entry.balance}</div>
            </div>
            <div className="rounded-lg border p-2">
              <div className="text-[10px] text-muted-foreground uppercase">
                Loss/Adj
              </div>
              <div className="text-lg font-bold text-orange-600">
                {entry.lossAdjustment || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Remarks / Notes</div>
          <div className="rounded-lg border border-dashed p-4 text-sm text-foreground italic">
            {entry.remark || "No additional remarks provided."}
          </div>
        </div>
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<BinCardEntry>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "createdAt",
        cell: ({ row }) =>
          format(new Date(row.original.createdAt), "dd/MM/yy HH:mm"),
      },
      {
        header: "Product",
        accessorFn: (row) => row.product?.name ?? "N/A",
      },
      {
        header: "Doc No",
        accessorKey: "documentNo",
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedEntry(row.original)}
            className="font-medium text-primary hover:underline"
          >
            {row.original.documentNo}
          </button>
        ),
      },
      {
        header: "In",
        accessorKey: "quantityIn",
        cell: ({ row }) => (
          <span className="text-green-600 font-medium">
            {row.original.quantityIn > 0 ? `+${row.original.quantityIn}` : "-"}
          </span>
        ),
      },
      {
        header: "Out",
        accessorKey: "quantityOut",
        cell: ({ row }) => (
          <span className="text-red-600 font-medium">
            {row.original.quantityOut > 0
              ? `-${row.original.quantityOut}`
              : "-"}
          </span>
        ),
      },
      {
        header: "Balance",
        accessorKey: "balance",
        cell: ({ row }) => (
          <span className="font-bold">{row.original.balance}</span>
        ),
      },
      {
        header: "Entity",
        accessorKey: "entityName",
      },
    ],
    [setSelectedEntry]
  );

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Bin Card</h1>
            <p className="text-sm text-muted-foreground">
              Detailed Inventory Movement Ledger
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total movements: {total}
            </p>
          </div>
        </div>

        <DashboardDataTable
          columns={columns}
          data={paginatedMovements}
          loading={isLoading}
          pageIndex={page - 1}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={(index: number) => {
            const nextPage = Math.min(Math.max(index + 1, 1), pageCount);
            setPage(nextPage);
          }}
          onPageSizeChange={(size: number) => {
            setPageSize(size);
            setPage(1);
          }}
          emptyMessage="No stock movements recorded yet."
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(entry) => entry.documentNo}
          detailsDescription={(entry) => entry.product?.name ?? "N/A"}
          renderDetailsFooter={(entry, onClose) => (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  setSelectedEntry(null);
                }, 0);
              }}
            >
              Close
            </Button>
          )}
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search movements..."
                className="w-full min-w-0 sm:w-56"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
                            <Input
                type="date"
                placeholder="Start Date"
                className="w-full min-w-0 sm:w-40"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                placeholder="End Date"
                className="w-full min-w-0 sm:w-40"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={productId || "__all__"}
                onValueChange={(value) => {
                  setProductId(value === "__all__" ? "" : value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Products</SelectItem>
                  {allProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={transactionType || "__all__"}
                onValueChange={(value) => {
                  setTransactionType(value === "__all__" ? "" : value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Types</SelectItem>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                </SelectContent>
              </Select>
              {/* <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value || "createdAt");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="documentNo">Document No</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select> */}
              {/* <Select
                value={sortOrder}
                onValueChange={(value) => {
                  setSortOrder((value || "desc") as "asc" | "desc");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select> */}
            </div>
          }
        />
      </div>

      {/* Sheet moved outside of DataTable props for cleaner syntax */}
      <Sheet open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
            <SheetDescription>
              Full audit log for entry {selectedEntry?.documentNo}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedEntry && renderDetails(selectedEntry)}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
