import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useMicrophone from "../hooks/useMicrophone";

export default function Balloons() {
    const { level } = useMicrophone();
    const [recognized, setRecognized] = useState([]);
    const [serverLevel, setServerLevel] = useState(0);
    const recordingRef = useRef(false);

    const balloons = useMemo(() => Array.from({ length: 6 }, (_, i) => i + 1), []);

    // Smooth the local microphone level for smoother animation
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
                    // Send to /transcribe
                    const res = await fetch("http://localhost:4000/audio/transcribe", {
                        method: "POST",
                        body: formData,
                    });
                    const data = await res.json();
                    if (data.text) {
                        setRecognized((prev) => [
                            { name: "Child A", text: data.text },
                            ...prev.slice(0, 4),
                        ]);
                    }

                    // Optionally send to /analyze for server volume
                    const res2 = await fetch("http://localhost:4000/audio/analyze", {
                        method: "POST",
                        body: formData,
                    });
                    const data2 = await res2.json();
                    if (data2.volume) setServerLevel(data2.volume);
                } catch (err) {
                    console.error("❌ API Error:", err);
                } finally {
                    recordingRef.current = false;
                }
            };

            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), 4000); // 4 seconds
        } catch (err) {
            console.error("❌ Microphone error:", err);
            recordingRef.current = false;
        }
    }

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
                background: "linear-gradient(to top, #a7f3d0 0%, #dbeafe 70%)",
            }}
        >
            {/* Floating Balloons */}
            <div
                style={{
                    display: "flex",
                    gap: "40px",
                    alignItems: "flex-end",
                    marginBottom: "100px",
                }}
            >
                {balloons.map((b, i) => (
                    <motion.div
                        key={b}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            cursor: "pointer",
                        }}
                        animate={{
                            y: [-10, -smoothedHeight * (0.6 + (i % 3) * 0.2), -10],
                            rotate: [0, 3, -3, 0],
                        }}
                        transition={{
                            y: { repeat: Infinity, repeatType: "mirror", duration: 2, ease: "easeInOut" },
                            rotate: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                        }}
                    >
                        <div
                            style={{
                                width: "60px",
                                height: "90px",
                                borderRadius: "50%",
                                border: "3px solid white",
                                background: `radial-gradient(circle at 30% 30%, hsl(${200 + i * 50}, 80%, 70%), hsl(${200 + i * 50}, 80%, 55%))`,
                                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                            }}
                        />
                        <div
                            style={{
                                width: "2px",
                                height: "50px",
                                background: "rgba(107,114,128,0.8)",
                                marginTop: "4px",
                            }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Recognized Text */}
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    width: "260px",
                    padding: "16px",
                    background: "rgba(255,255,255,0.85)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                }}
            >
                <h3 style={{ marginBottom: "8px", color: "#0369a1" }}>🗣️ What Kids Said</h3>
                <AnimatePresence>
                    {recognized.length === 0 ? (
                        <p style={{ color: "#6b7280" }}>Listening...</p>
                    ) : (
                        recognized.map((r, idx) => (
                            <motion.p
                                key={idx}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{ margin: "4px 0" }}
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
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    color: "#0369a1",
                    background: "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(6px)",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                }}
            >
                🎤 Voice Level: {normalizedLevel.toFixed(2)}
            </div>
        </div>
    );
}
