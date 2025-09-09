import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getSession,
  deleteSession,
  getSessionStats,
} from "@/lib/session";
import { getRemainingTime, needsExpirationWarning } from "@/lib/session-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      // Create new session
      const session = createSession();

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        createdAt: session.createdAt,
        message: "Session created successfully",
      });
    } else if (action === "delete") {
      const { sessionId } = body;

      if (!sessionId) {
        return NextResponse.json(
          { success: false, error: "Session ID is required for deletion" },
          { status: 400 }
        );
      }

      const deleted = deleteSession(sessionId);

      if (deleted) {
        return NextResponse.json({
          success: true,
          message: "Session deleted successfully",
        });
      } else {
        return NextResponse.json(
          { success: false, error: "Session not found" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "create" or "delete"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Session POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const action = searchParams.get("action");

    if (action === "stats") {
      // Return session statistics (for debugging/monitoring)
      const stats = getSessionStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

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

    // Get session status and timing information
    const remainingMinutes = getRemainingTime(sessionId);
    const needsWarning = needsExpirationWarning(sessionId);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        remainingMinutes,
        needsExpirationWarning: needsWarning,
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
      },
    });
  } catch (error) {
    console.error("Session GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    const deleted = deleteSession(sessionId);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: "Session deleted successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Session DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
