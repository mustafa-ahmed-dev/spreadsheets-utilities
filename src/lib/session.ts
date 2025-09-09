import { v4 as uuidv4 } from "uuid";
import { UserSession } from "@/types";

// In-memory session storage
const sessions = new Map<string, UserSession>();

// Session timeout: 15 minutes in milliseconds
const SESSION_TIMEOUT = 15 * 60 * 1000;

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

  return session;
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): UserSession | null {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  // Check if session has expired
  const now = new Date();
  const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

  if (timeSinceLastActivity > SESSION_TIMEOUT) {
    deleteSession(sessionId);
    return null;
  }

  // Update last activity
  session.lastActivity = now;
  sessions.set(sessionId, session);

  return session;
}

/**
 * Update session data
 */
export function updateSession(
  sessionId: string,
  updates: Partial<UserSession>
): boolean {
  const session = getSession(sessionId);

  if (!session) {
    return false;
  }

  const updatedSession = {
    ...session,
    ...updates,
    id: sessionId, // Ensure ID doesn't change
    lastActivity: new Date(),
  };

  sessions.set(sessionId, updatedSession);
  return true;
}

/**
 * Delete session and cleanup resources
 */
export function deleteSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);

  if (session) {
    // TODO: Add file cleanup logic here when we implement file storage
    // cleanupSessionFiles(session);

    sessions.delete(sessionId);
    console.log(`Session ${sessionId} deleted`);
    return true;
  }

  return false;
}

/**
 * Schedule automatic session cleanup
 */
function scheduleSessionCleanup(sessionId: string): void {
  setTimeout(() => {
    const session = sessions.get(sessionId);
    if (session) {
      const now = new Date();
      const timeSinceLastActivity =
        now.getTime() - session.lastActivity.getTime();

      // Only delete if still expired (user might have been active)
      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        deleteSession(sessionId);
      }
    }
  }, SESSION_TIMEOUT);
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

  console.log(`Cleaned up ${cleanedCount} expired sessions`);
  return cleanedCount;
}

/**
 * Get session statistics (for monitoring)
 */
export function getSessionStats() {
  return {
    totalSessions: sessions.size,
    sessions: Array.from(sessions.values()).map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      hasFile1: !!session.files.file1,
      hasFile2: !!session.files.file2,
      hasResults: !!session.results,
    })),
  };
}

/**
 * Periodic cleanup - run every 5 minutes
 */
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
