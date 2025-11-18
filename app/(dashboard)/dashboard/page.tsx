"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLoader,
} from "@tabler/icons-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardDataTable } from "@/components/dashboard-data-table"
import { SectionCards } from "@/components/section-cards"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  useDashboardStats,
  useSalesChart,
  useDashboardTableData,
} from "@/features/dashboard/hooks/useDashboard"
import type { ChartConfig as DashboardChartConfig, ChartDataPoint, TableDataItem } from "@/features/dashboard/types"

export default function Page() {
  const [timeRange, setTimeRange] = React.useState<"7d" | "30d" | "90d">("90d");

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  // Fetch sales chart data
  const {
    data: salesChartData,
    isLoading: salesChartLoading,
  } = useSalesChart(timeRange);

  // Fetch table data
  const {
    data: tableData,
    isLoading: tableLoading,
  } = useDashboardTableData(1, 10);

  // Build chart config from API response or use default
  const chartConfig: DashboardChartConfig = React.useMemo(() => {
    if (salesChartData?.config) {
      return salesChartData.config;
    }
    // Default config based on common data keys
    if (salesChartData?.chartData && salesChartData.chartData.length > 0) {
      const keys = Object.keys(salesChartData.chartData[0]).filter(
        (key) => key !== "date"
      );
      const config: DashboardChartConfig = {};
      keys.forEach((key, index) => {
        config[key] = {
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
          color: index === 0 ? "hsl(var(--primary))" : "hsl(var(--chart-2))",
        };
      });
      return config;
    }
    return {};
  }, [salesChartData]);

  // Convert table data to the format expected by DashboardDataTable
  const tableDataFormatted = React.useMemo(() => {
    if (!tableData?.items) return [];
    const seenIds = new Set<number>();
    
    return tableData.items.map((item, index) => {
      // Convert id to number, ensuring uniqueness
      let numericId: number;
      if (typeof item.id === 'number') {
        numericId = item.id;
      } else if (typeof item.id === 'string') {
        const parsed = Number(item.id);
        numericId = !isNaN(parsed) && isFinite(parsed) ? parsed : index + 1000000;
      } else {
        numericId = index + 1000000;
      }
      
      // Ensure uniqueness by appending index if duplicate
      if (seenIds.has(numericId)) {
        numericId = numericId * 1000 + index;
      }
      seenIds.add(numericId);
      
      return {
        id: numericId,
        header: item.header,
        type: item.type,
        status: item.status,
        target: item.target,
        limit: item.limit,
        reviewer: item.reviewer,
        chartData: item.chartData,
      };
    });
  }, [tableData]);

  // Column definitions for dashboard table
  const columns: ColumnDef<TableDataItem & { id: number; chartData?: ChartDataPoint[] }>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "header",
      header: "Header",
      cell: ({ row }) => (
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {row.original.header}
        </Button>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: "Section Type",
      cell: ({ row }) => (
        <div className="w-32">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.type}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.status === "Done" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          ) : (
            <IconLoader />
          )}
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "target",
      header: () => <div className="w-full text-right">Target</div>,
      cell: ({ row }) => (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
              loading: `Saving ${row.original.header}`,
              success: "Done",
              error: "Error",
            })
          }}
        >
          <Label htmlFor={`${row.original.id}-target`} className="sr-only">
            Target
          </Label>
          <Input
            className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
            defaultValue={row.original.target}
            id={`${row.original.id}-target`}
          />
        </form>
      ),
    },
    {
      accessorKey: "limit",
      header: () => <div className="w-full text-right">Limit</div>,
      cell: ({ row }) => (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
              loading: `Saving ${row.original.header}`,
              success: "Done",
              error: "Error",
            })
          }}
        >
          <Label htmlFor={`${row.original.id}-limit`} className="sr-only">
            Limit
          </Label>
          <Input
            className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
            defaultValue={row.original.limit}
            id={`${row.original.id}-limit`}
          />
        </form>
      ),
    },
    {
      accessorKey: "reviewer",
      header: "Reviewer",
      cell: ({ row }) => {
        const isAssigned = row.original.reviewer !== "Assign reviewer"

        if (isAssigned) {
          return row.original.reviewer
        }

        return (
          <>
            <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
              Reviewer
            </Label>
            <Select>
              <SelectTrigger
                className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
                size="sm"
                id={`${row.original.id}-reviewer`}
              >
                <SelectValue placeholder="Assign reviewer" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                <SelectItem value="Jamik Tashpulatov">
                  Jamik Tashpulatov
                </SelectItem>
              </SelectContent>
            </Select>
          </>
        )
      },
    },
    {
      id: "actions",
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Make a copy</DropdownMenuItem>
            <DropdownMenuItem>Favorite</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  // Build chart config for details drawer
  const detailsChartConfig: ChartConfig = React.useMemo(() => {
    if (!tableDataFormatted.length) return {};
    const firstItem = tableDataFormatted[0];
    if (firstItem.chartData && firstItem.chartData.length > 0) {
      const keys = Object.keys(firstItem.chartData[0]).filter(key => key !== "date");
      const config: ChartConfig = {};
      keys.forEach((key, index) => {
        config[key] = {
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
          color: index === 0 ? "hsl(var(--primary))" : "hsl(var(--chart-2))",
        };
      });
      return config;
    }
    return {};
  }, [tableDataFormatted]);

  // Render details for table items
  const renderDetails = React.useCallback((item: TableDataItem & { id: number; chartData?: ChartDataPoint[] }) => {
    const itemChartData = item.chartData || [];
    const dataKeys = itemChartData.length > 0 
      ? Object.keys(itemChartData[0]).filter(key => key !== "date")
      : [];

    return (
      <div className="flex flex-col gap-4 text-sm">
        {itemChartData.length > 0 && (
          <>
            <ChartContainer config={detailsChartConfig}>
              <AreaChart
                accessibilityLayer
                data={itemChartData}
                margin={{
                  left: 0,
                  right: 10,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  hide
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                {dataKeys.map((key, index) => (
                  <Area
                    key={key}
                    dataKey={key}
                    type="natural"
                    fill={`var(--color-${key})`}
                    fillOpacity={index === 0 ? 0.6 : 0.4}
                    stroke={`var(--color-${key})`}
                    stackId="a"
                  />
                ))}
              </AreaChart>
            </ChartContainer>
            <Separator />
          </>
        )}
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="header">Header</Label>
            <Input id="header" defaultValue={item.header} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="type">Type</Label>
              <Select defaultValue={item.type}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Table of Contents">Table of Contents</SelectItem>
                  <SelectItem value="Executive Summary">Executive Summary</SelectItem>
                  <SelectItem value="Technical Approach">Technical Approach</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Capabilities">Capabilities</SelectItem>
                  <SelectItem value="Focus Documents">Focus Documents</SelectItem>
                  <SelectItem value="Narrative">Narrative</SelectItem>
                  <SelectItem value="Cover Page">Cover Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={item.status}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="target">Target</Label>
              <Input id="target" defaultValue={item.target} />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="limit">Limit</Label>
              <Input id="limit" defaultValue={item.limit} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="reviewer">Reviewer</Label>
            <Select defaultValue={item.reviewer}>
              <SelectTrigger id="reviewer" className="w-full">
                <SelectValue placeholder="Select a reviewer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                <SelectItem value="Jamik Tashpulatov">Jamik Tashpulatov</SelectItem>
                <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </div>
    );
  }, [detailsChartConfig]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards stats={stats} loading={statsLoading} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive
              title="Sales vs Purchases"
              description="Sales and purchases over time"
              chartData={salesChartData?.chartData}
              chartConfig={chartConfig}
              loading={salesChartLoading}
              onTimeRangeChange={setTimeRange}
            />
          </div>
          <DashboardDataTable
            data={tableDataFormatted}
            columns={columns}
            loading={tableLoading}
            emptyMessage="No results."
            enableRowSelection={true}
            enableColumnVisibility={true}
            enableDragAndDrop={true}
            pageIndex={0}
            pageSize={10}
            pageCount={tableData ? Math.ceil(tableData.total / 10) : undefined}
            onPageChange={() => {
              // Handle page change if needed
            }}
            onPageSizeChange={() => {
              // Handle page size change if needed
            }}
            renderDetails={renderDetails}
            detailsTitle={(item) => item.header}
            detailsDescription={() => "Showing details for this item"}
          />
        </div>
      </div>
    </div>
  )
}
