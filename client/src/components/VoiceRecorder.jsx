import React, { useState, useRef } from "react";

export default function VoiceRecorder() {
    const [recognized, setRecognized] = useState([]);
    const recordingRef = useRef(false); // Prevent overlapping recordings

    const recordAndSend = async () => {
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
                    const res = await fetch("http://localhost:4000/audio/transcribe", {
                        method: "POST",
                        body: formData,
                    });
                    const data = await res.json();
                    setRecognized((prev) => [
                        { name: "Child A", text: data.text },
                        ...prev.slice(0, 4),
                    ]);
                } catch (err) {
                    console.error("❌ Fetch error:", err);
                } finally {
                    recordingRef.current = false;
                }
            };

            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), 4000); // Record 4s
        } catch (err) {
            console.error("❌ Microphone error:", err);
            recordingRef.current = false;
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
                onClick={recordAndSend}
                style={{
                    padding: "10px 20px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#0369a1",
                    color: "white",
                    cursor: "pointer",
                }}
            >
                🎙️ Say Something
            </button>

            <div style={{ marginTop: "16px" }}>
                {recognized.length === 0 ? (
                    <p style={{ color: "#6b7280" }}>No words yet</p>
                ) : (
                    recognized.map((r, idx) => (
                        <p key={idx}>
                            <strong>{r.name}:</strong> {r.text}
                        </p>
                    ))
                )}
            </div>
        </div>
    );
}
