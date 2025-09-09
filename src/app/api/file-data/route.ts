import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const fileKey = searchParams.get("fileKey") as "file1" | "file2";

    console.log("File Data API - sessionId:", sessionId, "fileKey:", fileKey);

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!fileKey || !["file1", "file2"].includes(fileKey)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid file key (file1 or file2) is required",
        },
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

    console.log("File Data API - Session found, checking files...");

    const file = session.files[fileKey];
    if (!file) {
      console.log("File Data API - File not found:", fileKey);
      return NextResponse.json(
        { success: false, error: `${fileKey} not found in session` },
        { status: 404 }
      );
    }

    console.log("File Data API - File found:", {
      name: file.originalName,
      rowCount: file.rowCount,
      hasData: !!file.data,
      dataLength: file.data ? file.data.length : 0,
    });

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        name: file.name,
        originalName: file.originalName,
        data: file.data,
        columns: file.columns,
        rowCount: file.rowCount,
        type: file.type,
        uploadedAt: file.uploadedAt,
      },
    });
  } catch (error) {
    console.error("File Data API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
