import React, { useEffect, useRef, useState } from "react";

export default function FaceCapture({ capturedFrames, setCapturedFrames }) {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraActive]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !cameraActive) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    setCapturedFrames((prev) => [...prev, { id: Date.now(), dataUrl }]);
  };

  const handleDelete = (id) => {
    setCapturedFrames((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setCapturedFrames([]);
  };

  return (
    <div style={{ padding: "16px", color: "#fff", height: "100%", boxSizing: "border-box", overflowY: "auto" }}>
      <h2 style={{ marginTop: 0 }}>📷 Face Capture</h2>

      <div style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => setCameraActive((prev) => !prev)}
          className={cameraActive ? "source-btn active-selected" : "source-btn"}
        >
          {cameraActive ? "⏹ Stop Camera" : "▶ Start Camera"}
        </button>
        {cameraActive && (
          <button className="source-btn" onClick={handleCapture}>
            📸 Capture
          </button>
        )}
        {capturedFrames.length > 0 && (
          <button className="source-btn" onClick={handleClearAll}>
            🗑 Clear All
          </button>
        )}
      </div>

      <video
        ref={videoRef}
        style={{
          width: "100%",
          maxWidth: "480px",
          display: cameraActive ? "block" : "none",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
        muted
        playsInline
      />

      <div>
        <div style={{ color: "#aaa", marginBottom: "8px" }}>
          Captured frames: {capturedFrames.length}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {capturedFrames.map((frame) => (
            <div key={frame.id} style={{ position: "relative" }}>
              <img
                src={frame.dataUrl}
                style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                alt="captured"
              />
              <button
                onClick={() => handleDelete(frame.id)}
                className="draw-gallery-delete"
                style={{ position: "absolute", top: "2px", right: "2px", width: "20px", height: "20px", padding: "0", fontSize: "12px" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
