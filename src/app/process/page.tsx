"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnMapping } from "@/components/ColumnMapping";
import { MergeOptions } from "@/components/MergeOptions";
import {
  ArrowLeft,
  Play,
  AlertCircle,
  CheckCircle,
  FileText,
  Settings,
} from "lucide-react";
import {
  ColumnMapping as ColumnMappingType,
  MergeOptions as MergeOptionsType,
  ProcessingResponse,
} from "@/types";

export default function ProcessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingType | null>(
    null
  );
  const [mergeOptions, setMergeOptions] = useState<MergeOptionsType | null>(
    null
  );
  const [error, setError] = useState("");

  const loadSessionData = useCallback(async () => {
    try {
      const response = await fetch(`/api/session?sessionId=${sessionId}`);
      const result = await response.json();

      if (result.success) {
        setSessionData(result.session);

        // Check if both files are uploaded
        if (!result.session.files.file1 || !result.session.files.file2) {
          setError("Both files must be uploaded before processing");
        }

        // Load existing configuration if available
        if (result.session.columnMapping) {
          setColumnMapping(result.session.columnMapping);
        }
        if (result.session.mergeOptions) {
          setMergeOptions(result.session.mergeOptions);
        }
      } else {
        setError(result.error || "Failed to load session data");
      }
    } catch (error) {
      console.error("Load session error:", error);
      setError("Failed to load session data");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    loadSessionData();
  }, [loadSessionData, sessionId]);

  const handleProcess = async () => {
    if (!columnMapping || !mergeOptions || !sessionId) {
      setError("Please complete column mapping and merge options");
      return;
    }

    if (mergeOptions.operations.length === 0) {
      setError("Please add at least one merge operation");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          columnMapping,
          mergeOptions,
        }),
      });

      const result: ProcessingResponse = await response.json();

      if (result.success) {
        // Redirect to results page
        window.location.href = `/results?sessionId=${sessionId}`;
      } else {
        setError(result.error || "Processing failed");
      }
    } catch (error) {
      console.error("Processing error:", error);
      setError("Processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const canProcess =
    columnMapping && mergeOptions && mergeOptions.operations.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Session Error
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Configure Processing
              </h1>
              <p className="text-gray-600 mt-1">
                Set up how to compare and merge your data
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 font-medium">
                  Files Uploaded
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <span className="text-gray-700 font-medium">
                  Configure Settings
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-gray-400" />
                <span className="text-gray-500">Process Data</span>
              </div>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: "66%" }}
              ></div>
            </div>
          </div>

          {/* Files Summary */}
          {sessionData && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Uploaded Files
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {sessionData.files.file1?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {sessionData.files.file1?.rowCount.toLocaleString()}{" "}
                        rows • {sessionData.files.file1?.columns.length} columns
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {sessionData.files.file2?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {sessionData.files.file2?.rowCount.toLocaleString()}{" "}
                        rows • {sessionData.files.file2?.columns.length} columns
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Steps */}
        <div className="space-y-6">
          {/* Step 1: Column Mapping */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                  1
                </span>
                Column Mapping
              </h2>
              <p className="text-gray-600 ml-9">
                Choose which columns to compare for finding duplicates
              </p>
            </div>
            <div className="ml-9">
              <ColumnMapping
                file1Columns={sessionData?.files.file1?.columns || []}
                file2Columns={sessionData?.files.file2?.columns || []}
                file1Name={sessionData?.files.file1?.name || "File 1"}
                file2Name={sessionData?.files.file2?.name || "File 2"}
                onMappingChange={setColumnMapping}
                initialMapping={columnMapping || undefined}
              />
            </div>
          </div>

          {/* Step 2: Merge Options */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                  2
                </span>
                Merge Options
              </h2>
              <p className="text-gray-600 ml-9">
                Configure how duplicate records should be merged
              </p>
            </div>
            <div className="ml-9">
              <MergeOptions
                file1Columns={sessionData?.files.file1?.columns || []}
                file2Columns={sessionData?.files.file2?.columns || []}
                onOptionsChange={setMergeOptions}
                initialOptions={mergeOptions || undefined}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-900 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Process Button */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleProcess}
              disabled={!canProcess || processing}
              className={`px-8 py-3 text-lg font-semibold ${
                canProcess && !processing
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-3" />
                  Process Data
                </>
              )}
            </Button>

            {canProcess && !processing && (
              <div className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700">Ready to process:</p>
                <p>
                  {(sessionData?.files.file1?.rowCount || 0) +
                    (sessionData?.files.file2?.rowCount || 0)}{" "}
                  total records
                </p>
                <p className="text-xs mt-1">
                  This will compare records and identify duplicates based on
                  your settings
                </p>
              </div>
            )}

            {!canProcess && !processing && (
              <div className="mt-4 text-sm text-gray-500 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="font-medium text-yellow-800">Setup Required:</p>
                <ul className="text-xs mt-1 space-y-1">
                  {!columnMapping && <li>• Complete column mapping</li>}
                  {(!mergeOptions || mergeOptions.operations.length === 0) && (
                    <li>• Add merge operations</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
