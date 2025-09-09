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
      console.log(`Loading results for session: ${sessionId}`);

      // Use the process API which returns the actual results data
      const response = await fetch(`/api/process?sessionId=${sessionId}`);
      const result = await response.json();

      console.log("Process API response:", result);

      if (result.success) {
        // Also load session data for file names
        try {
          const sessionResponse = await fetch(
            `/api/session?sessionId=${sessionId}`
          );
          const sessionResult = await sessionResponse.json();
          if (sessionResult.success) {
            setSessionData(sessionResult.session);
          }
        } catch (sessionError) {
          console.error("Failed to load session metadata:", sessionError);
          // Continue anyway, just won't have file names
        }

        if (!result.hasResults || !result.results) {
          setError(
            "No processing results found. Please process your data first."
          );
        } else {
          console.log("Setting results:", result.results);
          setResults(result.results);
        }
      } else {
        console.error("Process API error:", result.error);
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
        return results.duplicates || [];
      case "unique_file1":
        return results.uniqueInFile1 || [];
      case "unique_file2":
        return results.uniqueInFile2 || [];
      case "merged":
        return results.merged || [];
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
        return `Unique in ${sessionData?.files?.file1?.name || "File 1"}`;
      case "unique_file2":
        return `Unique in ${sessionData?.files?.file2?.name || "File 2"}`;
      case "merged":
        return "Merged Records";
      default:
        return "Results";
    }
  };

  const getTabCount = () => {
    if (!results || !results.stats) return 0;

    switch (activeTab) {
      case "duplicates":
        return results.stats.duplicateCount || 0;
      case "unique_file1":
        return results.stats.uniqueFile1Count || 0;
      case "unique_file2":
        return results.stats.uniqueFile2Count || 0;
      case "merged":
        return results.stats.mergedCount || 0;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Results Error
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex space-x-3 justify-center">
            <Button
              onClick={() =>
                (window.location.href = `/process?sessionId=${sessionId}`)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Process
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Results Available
          </h2>
          <p className="text-gray-600 mb-4">
            Your data hasn't been processed yet.
          </p>
          <Button
            onClick={() =>
              (window.location.href = `/process?sessionId=${sessionId}`)
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Process Page
          </Button>
        </div>
      </div>
    );
  }

  console.log("Rendering results:", results);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() =>
                (window.location.href = `/process?sessionId=${sessionId}`)
              }
              className="border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Configuration
            </Button>

            <Button
              onClick={() => setDownloadModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Results
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Processing Results
                </h1>
                <p className="text-gray-600">
                  Processed on {new Date(results.processedAt).toLocaleString()}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Processing Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {results.stats.duplicateCount.toLocaleString()}
                </div>
                <div className="text-sm text-blue-800">Duplicates Found</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {results.stats.uniqueFile1Count.toLocaleString()}
                </div>
                <div className="text-sm text-purple-800">Unique in File 1</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {results.stats.uniqueFile2Count.toLocaleString()}
                </div>
                <div className="text-sm text-orange-800">Unique in File 2</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {results.stats.mergedCount.toLocaleString()}
                </div>
                <div className="text-sm text-green-800">Merged Records</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                {
                  key: "duplicates",
                  label: "Duplicates",
                  count: results.stats.duplicateCount,
                },
                {
                  key: "unique_file1",
                  label: "Unique File 1",
                  count: results.stats.uniqueFile1Count,
                },
                {
                  key: "unique_file2",
                  label: "Unique File 2",
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
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {tab.count.toLocaleString()}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Table Content */}
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {getTabTitle()}
              </h2>
              <span className="text-sm text-gray-600">
                {getTabCount().toLocaleString()} records
              </span>
            </div>

            {getTabData().length > 0 ? (
              <Table
                columns={getTabColumns()}
                data={getTabData()}
                sortable
                searchable
                pagination
                pageSize={50}
                className="border border-gray-200"
              />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No records in this category</p>
              </div>
            )}
          </div>
        </div>

        {/* Download Modal */}
        <Modal
          isOpen={downloadModal}
          onClose={() => setDownloadModal(false)}
          title="Download Results"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Choose what data to download and in which format:
            </p>

            <div className="space-y-3">
              {[
                {
                  type: "duplicates",
                  label: "Duplicate Records",
                  count: results.stats.duplicateCount,
                },
                {
                  type: "unique_file1",
                  label: "Unique in File 1",
                  count: results.stats.uniqueFile1Count,
                },
                {
                  type: "unique_file2",
                  label: "Unique in File 2",
                  count: results.stats.uniqueFile2Count,
                },
                {
                  type: "merged",
                  label: "Merged Records",
                  count: results.stats.mergedCount,
                },
              ]
                .filter((item) => item.count > 0)
                .map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
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
                        className="border-gray-300 hover:bg-gray-50 text-gray-700"
                      >
                        Excel (.xlsx)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item.type, "csv")}
                        disabled={downloading}
                        className="border-gray-300 hover:bg-gray-50 text-gray-700"
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
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
}
