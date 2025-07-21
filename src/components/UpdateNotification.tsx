import React, { useState, useEffect } from "react";
import "./UpdateNotification.css";

export const UpdateNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    const removeUpdateAvailableListener = window.electronAPI.onUpdateAvailable(
      () => {
        setMessage("A new version is available. Downloading...");
        setIsVisible(true);
        setIsDownloaded(false);
      }
    );

    const removeUpdateDownloadedListener =
      window.electronAPI.onUpdateDownloaded(() => {
        setMessage("Update downloaded. Restart to install.");
        setIsVisible(true);
        setIsDownloaded(true);
      });

    return () => {
      removeUpdateAvailableListener();
      removeUpdateDownloadedListener();
    };
  }, []);

  const handleRestart = () => {
    if (window.electronAPI) {
      window.electronAPI.restartApp();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="update-notification">
      <p className="update-message">{message}</p>
      {isDownloaded && (
        <button className="update-restart-btn" onClick={handleRestart}>
          Restart
        </button>
      )}
    </div>
  );
};
