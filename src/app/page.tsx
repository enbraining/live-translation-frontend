"use client";

import React, { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function Home() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const [audioData, setAudioData] = useState<number[]>([]);

  useEffect(() => {
    const startRecording = async () => {
      if (navigator.mediaDevices === undefined) {
        alert("연결된 마이크를 찾을 수 없습니다.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/process.js");

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, "audio-processor");
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event) => {
        const newData = Array.from(event.data) as number[];
        setAudioData(newData);

        fetch("/proto", {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: event.data.buffer,
        });
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
    };

    startRecording();

    return () => {
      workletNodeRef.current?.disconnect();
      audioContextRef.current?.close();
    };
  }, []);

  const data = {
    labels: audioData.map((_, i) => i),
    datasets: [
      {
        label: "Audio PCM Data",
        data: audioData,
        borderColor: "rgba(75,192,192,1)",
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  return (
    <div>
      <div>녹음중... 마이크 사용 권한을 허용하세요.</div>
      <div style={{ width: "100%", height: "100%" }}>
        <Line
          data={data}
          options={{
            animation: false,
            responsive: true,
            scales: {
              x: { max: 8096, ticks: { stepSize: 160 } },
              y: { min: -512, max: 512, ticks: { stepSize: 16384 } },
            },
          }}
        />
      </div>
    </div>
  );
}
