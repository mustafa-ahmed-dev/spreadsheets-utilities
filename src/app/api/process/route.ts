import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/session";
import { processDuplicates } from "@/lib/duplicate-checker";
import { validateResults } from "@/lib/result-processor";
import { ProcessingRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: ProcessingRequest = await request.json();
    const { sessionId, columnMapping, mergeOptions } = body;

    // Validate request
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (
      !columnMapping ||
      !columnMapping.file1Column ||
      !columnMapping.file2Column
    ) {
      return NextResponse.json(
        { success: false, error: "Column mapping is required" },
        { status: 400 }
      );
    }

    if (
      !mergeOptions ||
      !mergeOptions.operations ||
      mergeOptions.operations.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Merge options are required" },
        { status: 400 }
      );
    }

    // Get session
    console.log(`Process API: Getting session ${sessionId}`);
    const session = getSession(sessionId);
    if (!session) {
      console.log(`Process API: Session ${sessionId} not found or expired`);
      return NextResponse.json(
        { success: false, error: "Session not found or expired" },
        { status: 404 }
      );
    }
    console.log(`Process API: Session ${sessionId} found successfully`);

    // Validate session has both files
    if (!session.files.file1 || !session.files.file2) {
      return NextResponse.json(
        {
          success: false,
          error: "Both files must be uploaded before processing",
        },
        { status: 400 }
      );
    }

    // Validate column mapping against actual file columns
    if (!session.files.file1.columns.includes(columnMapping.file1Column)) {
      return NextResponse.json(
        {
          success: false,
          error: `Column '${
            columnMapping.file1Column
          }' not found in File 1. Available columns: ${session.files.file1.columns.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    if (!session.files.file2.columns.includes(columnMapping.file2Column)) {
      return NextResponse.json(
        {
          success: false,
          error: `Column '${
            columnMapping.file2Column
          }' not found in File 2. Available columns: ${session.files.file2.columns.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validate merge operations columns exist in the files
    // BUT skip validation for special operations like MERGE_ALL
    const allColumns = new Set([
      ...session.files.file1.columns,
      ...session.files.file2.columns,
    ]);

    for (const operation of mergeOptions.operations) {
      // Skip validation for special operations
      if (
        operation.operation === "MERGE_ALL" ||
        operation.column === "ALL_COLUMNS"
      ) {
        continue;
      }

      if (!allColumns.has(operation.column)) {
        return NextResponse.json(
          {
            success: false,
            error: `Column '${
              operation.column
            }' specified in merge operations not found in either file. Available columns: ${Array.from(
              allColumns
            ).join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    try {
      // Process duplicates
      const results = processDuplicates(
        session.files.file1,
        session.files.file2,
        columnMapping,
        mergeOptions
      );

      // Validate results
      const validation = validateResults(results);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: `Processing validation failed: ${validation.errors.join(
              ", "
            )}`,
          },
          { status: 500 }
        );
      }

      // Update session with results and processing options
      // Make sure to update the session's lastActivity to prevent deletion
      const sessionUpdated = updateSession(sessionId, {
        columnMapping,
        mergeOptions,
        results,
        lastActivity: new Date(), // Explicitly update activity timestamp
      });

      if (!sessionUpdated) {
        return NextResponse.json(
          { success: false, error: "Failed to save results to session" },
          { status: 500 }
        );
      }

      // Return processing results
      return NextResponse.json({
        success: true,
        results,
        message: `Processing complete. Found ${results.stats.duplicateCount} duplicates, ${results.stats.uniqueFile1Count} unique in File 1, and ${results.stats.uniqueFile2Count} unique in File 2.`,
      });
    } catch (processingError) {
      console.error("Duplicate processing error:", processingError);
      return NextResponse.json(
        {
          success: false,
          error: `Processing failed: ${
            processingError instanceof Error
              ? processingError.message
              : "Unknown processing error"
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Process API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during processing" },
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

    // Return current processing status
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      hasResults: !!session.results,
      columnMapping: session.columnMapping || null,
      mergeOptions: session.mergeOptions || null,
      results: session.results || null,
      canProcess: !!(session.files.file1 && session.files.file2),
    });
  } catch (error) {
    console.error("Process status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
