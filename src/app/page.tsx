"use client";

import React, { useState, useEffect } from "react";
import { FileUploadMain } from "@/components/FileUpload";

export default function HomePage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create a new session when the page loads
    createNewSession();
  }, []);

  const createNewSession = async () => {
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "create" }),
      });

      const result = await response.json();

      if (result.success) {
        setSessionId(result.sessionId);
      } else {
        console.error("Failed to create session:", result.error);
        alert("Failed to initialize session. Please refresh the page.");
      }
    } catch (error) {
      console.error("Session creation error:", error);
      alert("Failed to initialize session. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionUpdate = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing session...</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">Failed to create session</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FileUploadMain
        sessionId={sessionId}
        onSessionUpdate={handleSessionUpdate}
      />
    </div>
  );
}
