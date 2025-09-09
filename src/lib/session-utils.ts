import { getSession, updateSession } from "./session";
import { FileData } from "@/types";

/**
 * Add file to session
 */
export function addFileToSession(
  sessionId: string,
  fileKey: "file1" | "file2",
  fileData: FileData
): boolean {
  const session = getSession(sessionId);

  if (!session) {
    return false;
  }

  const updates = {
    files: {
      ...session.files,
      [fileKey]: fileData,
    },
  };

  return updateSession(sessionId, updates);
}

/**
 * Check if session has both files uploaded
 */
export function hasBothFiles(sessionId: string): boolean {
  const session = getSession(sessionId);
  return !!(session?.files.file1 && session?.files.file2);
}

/**
 * Get remaining session time in minutes
 */
export function getRemainingTime(sessionId: string): number {
  const session = getSession(sessionId);

  if (!session) {
    return 0;
  }

  const now = new Date();
  const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
  const remainingMs = SESSION_TIMEOUT - timeSinceLastActivity;

  return Math.max(0, Math.floor(remainingMs / (60 * 1000))); // Return minutes
}

/**
 * Check if session needs warning (5 minutes remaining)
 */
export function needsExpirationWarning(sessionId: string): boolean {
  const remainingMinutes = getRemainingTime(sessionId);
  return remainingMinutes <= 5 && remainingMinutes > 0;
}

/**
 * Validate session and return error message if invalid
 */
export function validateSession(sessionId: string): {
  valid: boolean;
  error?: string;
} {
  if (!sessionId) {
    return { valid: false, error: "Session ID is required" };
  }

  const session = getSession(sessionId);

  if (!session) {
    return { valid: false, error: "Session not found or expired" };
  }

  return { valid: true };
}
