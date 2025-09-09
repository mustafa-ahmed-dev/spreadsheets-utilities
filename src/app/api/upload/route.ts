import { NextRequest, NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/session";
import { addFileToSession } from "@/lib/session-utils";
import {
  processExcelFile,
  processCSVFile,
  validateFile,
  detectFileType,
  extractPreviewData,
} from "@/lib/file-processor";
import { validateFileData, sanitizeFileData } from "@/lib/data-validator";

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;
    const fileKey = formData.get("fileKey") as "file1" | "file2";

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!fileKey || !["file1", "file2"].includes(fileKey)) {
      return NextResponse.json(
        { success: false, error: "Invalid file key. Must be file1 or file2" },
        { status: 400 }
      );
    }

    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { success: false, error: fileValidation.error },
        { status: 400 }
      );
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = getSession(sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Session not found or expired" },
          { status: 404 }
        );
      }
    } else {
      session = createSession();
    }

    // Process file based on type
    const fileType = detectFileType(file);
    let fileData;

    try {
      if (fileType === "excel") {
        fileData = await processExcelFile(file, file.name);
      } else {
        fileData = await processCSVFile(file, file.name);
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: `File processing failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 400 }
      );
    }

    // Validate processed data
    const dataValidation = validateFileData(fileData);
    if (!dataValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `File validation failed: ${dataValidation.errors.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitizedFileData = sanitizeFileData(fileData);

    // Add file to session
    const success = addFileToSession(session.id, fileKey, sanitizedFileData);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to save file to session" },
        { status: 500 }
      );
    }

    // Extract preview data
    const preview = extractPreviewData(sanitizedFileData, 15);

    // Return success response
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      fileKey,
      fileName: sanitizedFileData.originalName,
      rowCount: sanitizedFileData.rowCount,
      columns: sanitizedFileData.columns,
      preview,
      message: `File uploaded successfully. ${sanitizedFileData.rowCount} rows processed.`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during file upload",
      },
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

    // Return current upload status
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      files: {
        file1: session.files.file1
          ? {
              name: session.files.file1.originalName,
              rowCount: session.files.file1.rowCount,
              columns: session.files.file1.columns,
            }
          : null,
        file2: session.files.file2
          ? {
              name: session.files.file2.originalName,
              rowCount: session.files.file2.rowCount,
              columns: session.files.file2.columns,
            }
          : null,
      },
      hasColumnMapping: !!session.columnMapping,
      hasMergeOptions: !!session.mergeOptions,
      hasResults: !!session.results,
    });
  } catch (error) {
    console.error("Upload status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
