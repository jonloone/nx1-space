'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { 
  ChevronUp, ChevronDown, ChevronsUpDown, 
  Search, Filter, Download, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TelemetryRecord {
  id: string;
  timestamp: Date;
  stationId: string;
  stationName: string;
  metric: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical' | 'info';
  category: string;
  description?: string;
  threshold?: { min: number; max: number };
}

interface TelemetryTableProps {
  data: TelemetryRecord[];
  onRefresh?: () => void;
  onExport?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  pageSize?: number;
}

const statusIcons = {
  normal: <CheckCircle className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  critical: <XCircle className="h-4 w-4 text-red-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

const statusColors = {
  normal: 'text-green-500 bg-green-500/10',
  warning: 'text-yellow-500 bg-yellow-500/10',
  critical: 'text-red-500 bg-red-500/10',
  info: 'text-blue-500 bg-blue-500/10',
};

export const TelemetryTable: React.FC<TelemetryTableProps> = ({
  data,
  onRefresh,
  onExport,
  autoRefresh = false,
  refreshInterval = 5000,
  showFilters = true,
  showPagination = true,
  pageSize = 10,
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = React.useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [onRefresh]);

  // Auto-refresh
  React.useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(() => {
        handleRefresh();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, onRefresh, handleRefresh]);

  const columns = useMemo<ColumnDef<TelemetryRecord>[]>(
    () => [
      {
        accessorKey: 'status',
        header: '',
        size: 40,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            {statusIcons[row.original.status]}
          </div>
        ),
      },
      {
        accessorKey: 'timestamp',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Timestamp
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronsUpDown className="h-3 w-3 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono">
            {row.original.timestamp.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'stationName',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Station
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronsUpDown className="h-3 w-3 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.stationName}</div>
            <div className="text-xs text-white/50">{row.original.stationId}</div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="px-2 py-1 text-xs rounded-full bg-white/10">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: 'metric',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Metric
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronsUpDown className="h-3 w-3 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.metric}</div>
            {row.original.description && (
              <div className="text-xs text-white/50">{row.original.description}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'value',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Value
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronsUpDown className="h-3 w-3 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const { value, unit, threshold, status } = row.original;
          const isOutOfRange = threshold && (value < threshold.min || value > threshold.max);
          
          return (
            <div className="flex items-center gap-2">
              <span className={cn(
                'font-mono font-bold',
                isOutOfRange && 'text-red-400'
              )}>
                {value.toFixed(2)}
              </span>
              <span className="text-xs text-white/50">{unit}</span>
              {threshold && (
                <div className="flex items-center gap-1 text-xs text-white/30">
                  <span>[{threshold.min}</span>
                  <span>-</span>
                  <span>{threshold.max}]</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              className="p-1 rounded hover:bg-white/10 transition-colors"
              onClick={() => console.log('View details:', row.original)}
            >
              <Info className="h-3 w-3" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      {showFilters && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search telemetry..."
                className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>
            
            <select
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-white/30"
              onChange={(e) => {
                if (e.target.value) {
                  setColumnFilters([
                    { id: 'category', value: e.target.value },
                  ]);
                } else {
                  setColumnFilters([]);
                }
              }}
            >
              <option value="">All Categories</option>
              <option value="Signal">Signal</option>
              <option value="Network">Network</option>
              <option value="Environmental">Environmental</option>
              <option value="Operational">Operational</option>
            </select>

            <select
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-white/30"
              onChange={(e) => {
                if (e.target.value) {
                  setColumnFilters([
                    { id: 'status', value: e.target.value },
                  ]);
                } else {
                  setColumnFilters([]);
                }
              }}
            >
              <option value="">All Status</option>
              <option value="normal">Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                disabled={isRefreshing}
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  isRefreshing && "animate-spin"
                )} />
              </button>
            )}
            
            {onExport && (
              <button
                onClick={onExport}
                className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-white/10">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-2 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-white/5 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-2 py-3 text-sm text-white/80"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-white/50">
            Showing {table.getRowModel().rows.length} of {data.length} records
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: table.getPageCount() }, (_, i) => i + 1)
                .slice(
                  Math.max(0, table.getState().pagination.pageIndex - 2),
                  Math.min(table.getPageCount(), table.getState().pagination.pageIndex + 3)
                )
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => table.setPageIndex(page - 1)}
                    className={cn(
                      "w-8 h-8 rounded-md text-sm transition-colors",
                      table.getState().pagination.pageIndex === page - 1
                        ? "bg-white/20 text-white"
                        : "bg-white/5 hover:bg-white/10 text-white/70"
                    )}
                  >
                    {page}
                  </button>
                ))}
            </div>
            
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};