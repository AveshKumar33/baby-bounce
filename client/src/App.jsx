import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useMicrophone from "./hooks/useMicrophone";

export default function App() {
  const { level } = useMicrophone(); // real-time RMS
  const [recognized, setRecognized] = useState([]);
  const [serverLevel, setServerLevel] = useState(0);
  const recordingRef = useRef(false);

  const balloons = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const normalizedLevel = Math.min(1, level * 5);
  const smoothedHeight = 100 + normalizedLevel * 200 + serverLevel * 50;

  async function recordAndSend() {
    if (recordingRef.current) return;
    recordingRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], "speech.webm", { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", file);

        try {
          // 1️⃣ Transcribe
          const resTranscribe = await fetch("http://localhost:4000/audio/transcribe", {
            method: "POST",
            body: formData,
          });
          const dataTranscribe = await resTranscribe.json();
          if (dataTranscribe.text) {
            setRecognized((prev) => [
              { name: "Child A", text: dataTranscribe.text },
              ...prev.slice(0, 7),
            ]);
          }

          // 2️⃣ Analyze
          const resAnalyze = await fetch("http://localhost:4000/audio/analyze", {
            method: "POST",
            body: formData,
          });
          const dataAnalyze = await resAnalyze.json();
          if (dataAnalyze.volume) setServerLevel(dataAnalyze.volume / 5000);
        } catch (err) {
          console.error("API Error:", err);
        } finally {
          recordingRef.current = false;
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 4000); // record 4s
    } catch (err) {
      console.error("Microphone error:", err);
      recordingRef.current = false;
    }
  }

  // Auto-record every 6s
  useEffect(() => {
    const interval = setInterval(recordAndSend, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        background: "linear-gradient(to top, #a7f3d0 0%, #60a5fa 70%)",
      }}
    >
      {/* Balloons */}
      <div style={{ display: "flex", gap: "30px", alignItems: "flex-end", marginBottom: "100px" }}>
        {balloons.map((b, i) => (
          <motion.div
            key={b}
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            animate={{
              y: [-10, -smoothedHeight * (0.5 + (i % 4) * 0.15), -10],
              rotate: [0, 3, -3, 0],
            }}
            transition={{
              y: { repeat: Infinity, repeatType: "mirror", duration: 2 + i * 0.2, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 4 + i * 0.2, ease: "easeInOut" },
            }}
          >
            <div
              style={{
                width: "50px",
                height: "70px",
                borderRadius: "50%",
                border: "3px solid white",
                background: `radial-gradient(circle at 30% 30%, hsl(${200 + i * 30}, 80%, 65%), hsl(${200 + i * 30}, 80%, 45%))`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            />
            <div
              style={{
                width: "2px",
                height: "50px",
                background: "rgba(0,0,0,0.6)",
                marginTop: "4px",
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Recognized Words */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          width: "300px",
          padding: "16px",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          maxHeight: "320px",
          overflowY: "auto",
        }}
      >
        <h3 style={{ marginBottom: "8px", color: "#fbbf24" }}>🗣️ What Kids Said</h3>
        <AnimatePresence>
          {recognized.length === 0 ? (
            <p style={{ color: "#d1d5db" }}>Listening...</p>
          ) : (
            recognized.map((r, idx) => (
              <motion.p
                key={idx}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ margin: "4px 0", wordBreak: "break-word" }}
              >
                <strong>{r.name}:</strong> {r.text}
              </motion.p>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Voice Level */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          width: "200px",
          height: "20px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        <motion.div
          style={{
            height: "100%",
            background: "#f59e0b",
            borderRadius: "12px",
          }}
          animate={{ width: `${Math.min(1, serverLevel + normalizedLevel) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
