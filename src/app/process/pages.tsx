"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnMapping } from "@/components/ColumnMapping";
import { MergeOptions } from "@/components/MergeOptions";
import { ArrowLeft, Play, AlertCircle } from "lucide-react";
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Session Error
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Configure Processing
              </h1>
              <p className="text-gray-600">
                Set up how to compare and merge your data
              </p>
            </div>
          </div>

          {/* Files Summary */}
          {sessionData && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Uploaded Files</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-success-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {sessionData.files.file1?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {sessionData.files.file1?.rowCount.toLocaleString()} rows
                      • {sessionData.files.file1?.columns.length} columns
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-success-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {sessionData.files.file2?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {sessionData.files.file2?.rowCount.toLocaleString()} rows
                      • {sessionData.files.file2?.columns.length} columns
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Steps */}
        <div className="space-y-8">
          {/* Step 1: Column Mapping */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <ColumnMapping
              file1Columns={sessionData?.files.file1?.columns || []}
              file2Columns={sessionData?.files.file2?.columns || []}
              file1Name={sessionData?.files.file1?.name || "File 1"}
              file2Name={sessionData?.files.file2?.name || "File 2"}
              onMappingChange={setColumnMapping}
              initialMapping={columnMapping || undefined}
            />
          </div>

          {/* Step 2: Merge Options */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <MergeOptions
              file1Columns={sessionData?.files.file1?.columns || []}
              file2Columns={sessionData?.files.file2?.columns || []}
              onOptionsChange={setMergeOptions}
              initialOptions={mergeOptions || undefined}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-error-500" />
              <p className="text-sm text-error-800">{error}</p>
            </div>
          </div>
        )}

        {/* Process Button */}
        <div className="mt-8 text-center">
          <Button
            size="lg"
            onClick={handleProcess}
            disabled={!canProcess || processing}
            loading={processing}
          >
            <Play className="h-5 w-5 mr-2" />
            {processing ? "Processing..." : "Process Data"}
          </Button>

          {canProcess && (
            <p className="text-sm text-gray-600 mt-2">
              Ready to process{" "}
              {sessionData?.files.file1?.rowCount +
                sessionData?.files.file2?.rowCount}{" "}
              total records
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
