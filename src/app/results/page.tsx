"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { ProcessedData } from "@/types";

interface Column {
  key: string;
  title: string;
  sortable: boolean;
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ProcessedData | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "duplicates" | "unique_file1" | "unique_file2" | "merged"
  >("duplicates");
  const [downloadModal, setDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadResultsData = useCallback(async () => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/session?sessionId=${sessionId}`);
      const result = await response.json();

      if (result.success) {
        setSessionData(result.session);

        if (!result.session.hasResults) {
          setError(
            "No processing results found. Please process your data first."
          );
        } else {
          setResults(result.session.results);
        }
      } else {
        setError(result.error || "Failed to load results");
      }
    } catch (error) {
      console.error("Load results error:", error);
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadResultsData();
  }, [loadResultsData]);

  const handleDownload = async (
    exportType: string,
    format: "excel" | "csv"
  ) => {
    if (!sessionId) return;

    setDownloading(true);

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          exportType,
          format,
        }),
      });

      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Get filename from response headers
        const contentDisposition = response.headers.get("content-disposition");
        const filename =
          contentDisposition?.match(/filename="(.+)"/)?.[1] ||
          `export.${format}`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setDownloadModal(false);

        // Note: Session is automatically deleted after download as per API
        setTimeout(() => {
          alert("Download complete! Your session has been cleaned up.");
          window.location.href = "/";
        }, 1000);
      } else {
        const errorResult = await response.json();
        alert(`Download failed: ${errorResult.error}`);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const getTabData = () => {
    if (!results) return [];

    switch (activeTab) {
      case "duplicates":
        return results.duplicates;
      case "unique_file1":
        return results.uniqueInFile1;
      case "unique_file2":
        return results.uniqueInFile2;
      case "merged":
        return results.merged;
      default:
        return [];
    }
  };

  const getTabColumns = (): Column[] => {
    const data = getTabData();
    if (data.length === 0) return [];

    return Object.keys(data[0]).map((key) => ({
      key,
      title: key,
      sortable: true,
    }));
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "duplicates":
        return "Duplicate Records";
      case "unique_file1":
        return `Unique in ${sessionData?.files.file1?.name || "File 1"}`;
      case "unique_file2":
        return `Unique in ${sessionData?.files.file2?.name || "File 2"}`;
      case "merged":
        return "Merged Records";
      default:
        return "Results";
    }
  };

  const getTabCount = () => {
    if (!results) return 0;

    switch (activeTab) {
      case "duplicates":
        return results.stats.duplicateCount;
      case "unique_file1":
        return results.stats.uniqueFile1Count;
      case "unique_file2":
        return results.stats.uniqueFile2Count;
      case "merged":
        return results.stats.mergedCount;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Results Error
          </h2>
          <p className="text-error-600 mb-4">{error}</p>
          <Button onClick={() => (window.location.href = "/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No results available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() =>
                (window.location.href = `/process?sessionId=${sessionId}`)
              }
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Configuration
            </Button>

            <Button onClick={() => setDownloadModal(true)}>
              <Download className="h-4 w-4 mr-2" />
              Download Results
            </Button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Processing Results
                </h1>
                <p className="text-gray-600">
                  Processed on {new Date(results.processedAt).toLocaleString()}
                </p>
              </div>

              <div className="bg-success-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success-600" />
                  <span className="text-sm font-medium text-success-900">
                    Processing Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-primary-900">
                      Duplicates
                    </p>
                    <p className="text-2xl font-bold text-primary-900">
                      {results.stats.duplicateCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Unique File 1
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {results.stats.uniqueFile1Count.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Unique File 2
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {results.stats.uniqueFile2Count.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">
                      Merged
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {results.stats.mergedCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 py-3">
              {[
                {
                  key: "duplicates",
                  label: "Duplicates",
                  count: results.stats.duplicateCount,
                },
                {
                  key: "unique_file1",
                  label: sessionData?.files.file1?.name || "File 1",
                  count: results.stats.uniqueFile1Count,
                },
                {
                  key: "unique_file2",
                  label: sessionData?.files.file2?.name || "File 2",
                  count: results.stats.uniqueFile2Count,
                },
                {
                  key: "merged",
                  label: "Merged",
                  count: results.stats.mergedCount,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label} ({tab.count.toLocaleString()})
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {getTabTitle()}
              </h3>
              <p className="text-sm text-gray-600">
                {getTabCount().toLocaleString()} records
              </p>
            </div>

            <Table
              columns={getTabColumns()}
              data={getTabData()}
              searchable={true}
              sortable={true}
              pagination={true}
              pageSize={25}
              emptyMessage={`No ${activeTab} records found`}
            />
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <Modal
        isOpen={downloadModal}
        onClose={() => setDownloadModal(false)}
        title="Download Results"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            Choose which data to download and in what format
          </p>

          <div className="space-y-4">
            {[
              {
                type: "duplicates",
                label: "Duplicate Records",
                count: results.stats.duplicateCount,
              },
              {
                type: "unique_file1",
                label: `Unique in ${
                  sessionData?.files.file1?.name || "File 1"
                }`,
                count: results.stats.uniqueFile1Count,
              },
              {
                type: "unique_file2",
                label: `Unique in ${
                  sessionData?.files.file2?.name || "File 2"
                }`,
                count: results.stats.uniqueFile2Count,
              },
              {
                type: "merged",
                label: "Merged Records",
                count: results.stats.mergedCount,
              },
              {
                type: "all",
                label: "All Results Combined",
                count:
                  results.stats.duplicateCount +
                  results.stats.uniqueFile1Count +
                  results.stats.uniqueFile2Count,
              },
            ]
              .filter((item) => item.count > 0)
              .map((item) => (
                <div
                  key={item.type}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {item.label}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {item.count.toLocaleString()} records
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(item.type, "excel")}
                      disabled={downloading}
                    >
                      Excel (.xlsx)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(item.type, "csv")}
                      disabled={downloading}
                    >
                      CSV (.csv)
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setDownloadModal(false)}
            disabled={downloading}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
