"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface SessionTimerProps {
  sessionId: string;
  onSessionExpired?: () => void;
}

export function SessionTimer({
  sessionId,
  onSessionExpired,
}: SessionTimerProps) {
  const [remainingMinutes, setRemainingMinutes] = useState<number>(15);
  const [showWarning, setShowWarning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const checkSession = async () => {
      try {
        const response = await fetch(`/api/session?sessionId=${sessionId}`);
        const result = await response.json();

        if (result.success) {
          setRemainingMinutes(result.session.remainingMinutes);
          setShowWarning(result.session.needsExpirationWarning);
        } else {
          // Session expired or not found
          setRemainingMinutes(0);
          setShowWarning(true);
          onSessionExpired?.();
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    // Check immediately
    checkSession();

    // Check every minute
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [sessionId, onSessionExpired]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Re-show after 2 minutes if still in warning period
    setTimeout(() => {
      if (showWarning && remainingMinutes > 0) {
        setIsVisible(true);
      }
    }, 120000);
  };

  if (!isVisible || remainingMinutes <= 0 || !showWarning) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-warning-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-warning-900">
              Session Expiring Soon
            </h4>
            <p className="text-sm text-warning-700 mt-1">
              Your session will expire in {remainingMinutes} minute
              {remainingMinutes !== 1 ? "s" : ""}. Please complete your work or
              your data will be lost.
            </p>
            <div className="flex items-center space-x-2 mt-3">
              <Clock className="h-4 w-4 text-warning-600" />
              <span className="text-sm font-medium text-warning-900">
                {remainingMinutes}:{remainingMinutes === 1 ? "00" : "00"}{" "}
                remaining
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-warning-400 hover:text-warning-600 shrink-0"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
