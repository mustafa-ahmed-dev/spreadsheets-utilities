import { NextRequest, NextResponse } from "next/server";
import { getSession, deleteSession } from "@/lib/session";
import { getExportData } from "@/lib/result-processor";
import { exportToExcel, exportToCSV } from "@/lib/export";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, exportType, format } = body;

    // Validate request
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (
      !exportType ||
      !["duplicates", "unique_file1", "unique_file2", "merged", "all"].includes(
        exportType
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid export type" },
        { status: 400 }
      );
    }

    if (!format || !["excel", "csv"].includes(format)) {
      return NextResponse.json(
        { success: false, error: "Invalid format. Must be excel or csv" },
        { status: 400 }
      );
    }

    // Get session
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found or expired" },
        { status: 404 }
      );
    }

    // Validate session has results
    if (!session.results) {
      return NextResponse.json(
        {
          success: false,
          error: "No processing results found. Please process data first.",
        },
        { status: 400 }
      );
    }

    try {
      // Get export data
      const { data, fileName } = getExportData(session.results, exportType);

      if (!data || data.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `No data available for export type: ${exportType}`,
          },
          { status: 400 }
        );
      }

      // Generate file based on format
      let fileBuffer: Buffer;
      let mimeType: string;
      let fileExtension: string;

      if (format === "excel") {
        fileBuffer = await exportToExcel(data);
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileExtension = ".xlsx";
      } else {
        fileBuffer = exportToCSV(data);
        mimeType = "text/csv";
        fileExtension = ".csv";
      }

      const fullFileName = `${fileName}${fileExtension}`;

      // Set response headers for file download
      const headers = new Headers();
      headers.set("Content-Type", mimeType);
      headers.set(
        "Content-Disposition",
        `attachment; filename="${fullFileName}"`
      );
      headers.set("Content-Length", fileBuffer.length.toString());

      // Clean up session after successful download
      // Note: We delete the session immediately after download as per requirements
      deleteSession(sessionId);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (exportError) {
      console.error("Export error:", exportError);
      return NextResponse.json(
        {
          success: false,
          error: `Export failed: ${
            exportError instanceof Error
              ? exportError.message
              : "Unknown export error"
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during download" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found or expired" },
        { status: 404 }
      );
    }

    // Return download options based on available results
    const options = [];

    if (session.results) {
      if (session.results.duplicates.length > 0) {
        options.push({
          type: "duplicates",
          label: "Duplicate Records",
          count: session.results.stats.duplicateCount,
        });
      }

      if (session.results.uniqueInFile1.length > 0) {
        options.push({
          type: "unique_file1",
          label: "Unique in File 1",
          count: session.results.stats.uniqueFile1Count,
        });
      }

      if (session.results.uniqueInFile2.length > 0) {
        options.push({
          type: "unique_file2",
          label: "Unique in File 2",
          count: session.results.stats.uniqueFile2Count,
        });
      }

      if (session.results.merged.length > 0) {
        options.push({
          type: "merged",
          label: "Merged Records",
          count: session.results.stats.mergedCount,
        });
      }

      if (options.length > 1) {
        options.push({
          type: "all",
          label: "All Results",
          count:
            session.results.stats.duplicateCount +
            session.results.stats.uniqueFile1Count +
            session.results.stats.uniqueFile2Count,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      hasResults: !!session.results,
      exportOptions: options,
      formats: [
        {
          type: "excel",
          label: "Excel (.xlsx)",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        { type: "csv", label: "CSV (.csv)", mimeType: "text/csv" },
      ],
    });
  } catch (error) {
    console.error("Download options error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
