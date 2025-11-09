import { useEffect, useRef, useState } from "react";

export default function useMicrophone() {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    let rafId = 0;
    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        const loop = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          setLevel(rms);
          rafId = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        console.error("microphone error", err);
      }
    }
    setup();
    return () => {
      cancelAnimationFrame(rafId);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return { level };
}
