"use client";

import React, { useEffect, useRef } from "react";

export default function Home() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    const startRecording = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
      scriptNodeRef.current = scriptNode;

      scriptNode.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer.getChannelData(0);

        const buffer = new ArrayBuffer(inputBuffer.length * 2);
        const output = new DataView(buffer);
        for (let i = 0; i < inputBuffer.length; i++) {
          let s = Math.max(-1, Math.min(1, inputBuffer[i]));
          s = s < 0 ? s * 0x8000 : s * 0x7fff;
          output.setInt16(i * 2, s, true);
        }

        const uint8View = new Uint8Array(buffer);
        console.log(uint8View);
      };

      source.connect(scriptNode);
      scriptNode.connect(audioContext.destination);
    };

    startRecording();

    return () => {
      scriptNodeRef.current?.disconnect();
      audioContextRef.current?.close();
    };
  }, []);

  return <div>녹음중... 마이크 사용 권한을 허용하세요.</div>;
}
