import { v4 as uuidv4 } from "uuid";
import { UserSession } from "@/types";

// In-memory session storage
const sessions = new Map<string, UserSession>();

// Session timeout: 15 minutes in milliseconds
const SESSION_TIMEOUT = 15 * 60 * 1000;

// Store cleanup timeouts to prevent premature deletion
const cleanupTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Create a new user session
 */
export function createSession(): UserSession {
  const sessionId = uuidv4();
  const now = new Date();

  const session: UserSession = {
    id: sessionId,
    files: {},
    createdAt: now,
    lastActivity: now,
  };

  sessions.set(sessionId, session);

  // Schedule cleanup for this session
  scheduleSessionCleanup(sessionId);

  console.log(`Session ${sessionId} created`);
  return session;
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): UserSession | null {
  const session = sessions.get(sessionId);

  if (!session) {
    console.log(`Session ${sessionId} not found`);
    return null;
  }

  // Check if session has expired
  const now = new Date();
  const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

  if (timeSinceLastActivity > SESSION_TIMEOUT) {
    console.log(
      `Session ${sessionId} expired (${Math.round(
        timeSinceLastActivity / 1000
      )}s since last activity)`
    );
    deleteSession(sessionId);
    return null;
  }

  // Update last activity and reschedule cleanup
  session.lastActivity = now;
  sessions.set(sessionId, session);

  // Reschedule cleanup with new activity timestamp
  scheduleSessionCleanup(sessionId);

  return session;
}

/**
 * Update session data
 */
export function updateSession(
  sessionId: string,
  updates: Partial<UserSession>
): boolean {
  const session = sessions.get(sessionId); // Use direct get to avoid premature deletion

  if (!session) {
    console.log(`Cannot update session ${sessionId} - not found`);
    return false;
  }

  const now = new Date();
  const updatedSession = {
    ...session,
    ...updates,
    id: sessionId, // Ensure ID doesn't change
    lastActivity: updates.lastActivity || now, // Use provided lastActivity or current time
  };

  sessions.set(sessionId, updatedSession);

  // Reschedule cleanup with new activity timestamp
  scheduleSessionCleanup(sessionId);

  console.log(`Session ${sessionId} updated`);
  return true;
}

/**
 * Delete session and cleanup resources
 */
export function deleteSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);

  if (session) {
    // Cancel scheduled cleanup
    const timeout = cleanupTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      cleanupTimeouts.delete(sessionId);
    }

    // TODO: Add file cleanup logic here when we implement file storage
    // cleanupSessionFiles(session);

    sessions.delete(sessionId);
    console.log(`Session ${sessionId} deleted`);
    return true;
  }

  console.log(`Cannot delete session ${sessionId} - not found`);
  return false;
}

/**
 * Schedule automatic session cleanup with better timeout management
 */
function scheduleSessionCleanup(sessionId: string): void {
  // Cancel existing timeout if any
  const existingTimeout = cleanupTimeouts.get(sessionId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    console.log(`Cancelled existing cleanup timeout for session ${sessionId}`);
  }

  // Schedule new cleanup
  const timeout = setTimeout(() => {
    const session = sessions.get(sessionId);
    if (session) {
      const now = new Date();
      const timeSinceLastActivity =
        now.getTime() - session.lastActivity.getTime();

      // Only delete if still expired (user might have been active)
      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        console.log(
          `Auto-deleting expired session ${sessionId} after ${Math.round(
            timeSinceLastActivity / 1000
          )}s (timeout: ${SESSION_TIMEOUT / 1000}s)`
        );
        deleteSession(sessionId);
      } else {
        // Session was active recently, reschedule cleanup
        console.log(
          `Session ${sessionId} was recently active (${Math.round(
            timeSinceLastActivity / 1000
          )}s ago), rescheduling cleanup`
        );
        scheduleSessionCleanup(sessionId);
      }
    }

    // Remove from cleanup timeouts map
    cleanupTimeouts.delete(sessionId);
  }, SESSION_TIMEOUT);

  cleanupTimeouts.set(sessionId, timeout);
  console.log(
    `Scheduled cleanup for session ${sessionId} in ${SESSION_TIMEOUT / 1000}s`
  );
}

/**
 * Cleanup all expired sessions (can be called periodically)
 */
export function cleanupExpiredSessions(): number {
  const now = new Date();
  let cleanedCount = 0;

  for (const [sessionId, session] of sessions.entries()) {
    const timeSinceLastActivity =
      now.getTime() - session.lastActivity.getTime();

    if (timeSinceLastActivity > SESSION_TIMEOUT) {
      deleteSession(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired sessions`);
  }
  return cleanedCount;
}

/**
 * Get session statistics (for monitoring)
 */
export function getSessionStats() {
  return {
    totalSessions: sessions.size,
    totalCleanupTimeouts: cleanupTimeouts.size,
    sessions: Array.from(sessions.values()).map((session) => {
      const now = new Date();
      const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
      const remainingTime = SESSION_TIMEOUT - timeSinceActivity;

      return {
        id: session.id,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        timeSinceActivity: Math.round(timeSinceActivity / 1000), // seconds
        remainingTime: Math.max(0, Math.round(remainingTime / 1000)), // seconds
        hasFile1: !!session.files.file1,
        hasFile2: !!session.files.file2,
        hasResults: !!session.results,
      };
    }),
  };
}

/**
 * Periodic cleanup - run every 5 minutes
 * But be more conservative to avoid race conditions
 */
setInterval(() => {
  try {
    cleanupExpiredSessions();
  } catch (error) {
    console.error("Error during periodic session cleanup:", error);
  }
}, 5 * 60 * 1000); // 5 minutes

// Add graceful shutdown cleanup
process.on("SIGINT", () => {
  console.log("Cleaning up sessions before shutdown...");

  // Clear all timeouts
  for (const timeout of cleanupTimeouts.values()) {
    clearTimeout(timeout);
  }
  cleanupTimeouts.clear();

  // Clear all sessions
  sessions.clear();

  console.log("Session cleanup complete");
});

process.on("SIGTERM", () => {
  console.log("Cleaning up sessions before termination...");

  // Clear all timeouts
  for (const timeout of cleanupTimeouts.values()) {
    clearTimeout(timeout);
  }
  cleanupTimeouts.clear();

  // Clear all sessions
  sessions.clear();

  console.log("Session cleanup complete");
});
