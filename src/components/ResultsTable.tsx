import React from "react";
import { Table } from "./ui/table";
import { Button } from "./ui/button";
import { Download, Eye } from "lucide-react";
import { ProcessedData } from "@/types";

interface ResultsTableProps {
  results: ProcessedData;
  sessionData: any;
  onDownload: (type: string, format: "excel" | "csv") => void;
  onViewDetails: (type: string) => void;
}

export function ResultsTable({
  results,
  sessionData,
  onDownload,
  onViewDetails,
}: ResultsTableProps) {
  const resultTypes = [
    {
      key: "duplicates",
      title: "Duplicate Records",
      description: "Records found in both files",
      data: results.duplicates,
      count: results.stats.duplicateCount,
      color: "bg-primary-50 border-primary-200 text-primary-900",
    },
    {
      key: "unique_file1",
      title: `Unique in ${sessionData?.files.file1?.name || "File 1"}`,
      description: "Records only in first file",
      data: results.uniqueInFile1,
      count: results.stats.uniqueFile1Count,
      color: "bg-blue-50 border-blue-200 text-blue-900",
    },
    {
      key: "unique_file2",
      title: `Unique in ${sessionData?.files.file2?.name || "File 2"}`,
      description: "Records only in second file",
      data: results.uniqueInFile2,
      count: results.stats.uniqueFile2Count,
      color: "bg-green-50 border-green-200 text-green-900",
    },
    {
      key: "merged",
      title: "Merged Records",
      description: "Duplicates merged with your operations",
      data: results.merged,
      count: results.stats.mergedCount,
      color: "bg-orange-50 border-orange-200 text-orange-900",
    },
  ];

  const getColumns = (data: Record<string, any>[]) => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).map((key) => ({
      key,
      title: key,
      sortable: true,
    }));
  };

  return (
    <div className="space-y-6">
      {resultTypes.map((type) => (
        <div key={type.key} className={`border rounded-lg ${type.color}`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{type.title}</h3>
                <p className="text-sm opacity-75">{type.description}</p>
                <p className="text-sm font-medium mt-1">
                  {type.count.toLocaleString()} records
                </p>
              </div>

              {type.count > 0 && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(type.key)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onDownload(type.key, "excel")}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDownload(type.key, "csv")}
                  >
                    CSV
                  </Button>
                </div>
              )}
            </div>
          </div>

          {type.count > 0 ? (
            <div className="p-4">
              <Table
                columns={getColumns(type.data)}
                data={type.data.slice(0, 10)} // Show first 10 rows
                searchable={false}
                sortable={false}
                pagination={false}
                emptyMessage={`No ${type.key} records`}
              />
              {type.data.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(type.key)}
                  >
                    View all {type.count.toLocaleString()} records
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No {type.title.toLowerCase()} found</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
