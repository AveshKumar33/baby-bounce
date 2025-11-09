import React, { useMemo } from "react";
import { motion } from "framer-motion";
import useMicrophone from "../hooks/useMicrophone";

export default function Balloons() {
    const { level } = useMicrophone();
    const normalized = Math.min(1, level * 6);
    const height = normalized * 200;
    const balloons = useMemo(() => [1, 2, 3, 4, 5], []);

    return (
        <div className="flex flex-col items-center justify-end h-screen bg-sky-200 overflow-hidden relative">
            {/* Title */}
            <h1 className="absolute top-6 text-3xl font-bold text-sky-800">
                🎈 Baby Balloon Bounce
            </h1>

            {/* Balloons Row */}
            <div className="flex gap-10 items-end mb-32">
                {balloons.map((b, i) => (
                    <motion.div
                        key={b}
                        className="flex flex-col items-center"
                        animate={{
                            y: -height * (0.6 + (i % 3) * 0.3),
                            rotate: [0, 3, -3, 0],
                        }}
                        transition={{
                            y: { type: "spring", stiffness: 120, damping: 14 },
                            rotate: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                        }}
                    >
                        {/* Balloon */}
                        <div
                            className="w-20 h-28 rounded-full border-4 border-white shadow-lg"
                            style={{
                                background: `radial-gradient(circle at 30% 30%, hsl(${300 + i * 30
                                    }, 90%, 70%), hsl(${300 + i * 30}, 90%, 55%))`,
                            }}
                        />
                        {/* String */}
                        <div className="w-[2px] h-16 bg-gray-500 mt-1" />
                    </motion.div>
                ))}
            </div>

            {/* Voice Level */}
            <div className="absolute bottom-6 text-lg font-semibold text-sky-900 bg-white/70 backdrop-blur px-4 py-2 rounded-lg shadow">
                🎤 Voice Level: {normalized.toFixed(2)}
            </div>
        </div>
    );
}
