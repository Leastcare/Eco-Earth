"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  "The glaciers are speaking.",
  "The rivers remember.",
  "The lakes are listening.",
  "Are you?",
];

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Check if user has seen splash this session
    if (sessionStorage.getItem("echoearth:splash")) {
      onDone();
      return;
    }

    let i = 0;
    const advance = () => {
      i++;
      if (i < LINES.length) {
        setLineIndex(i);
        setTimeout(advance, i === LINES.length - 1 ? 1400 : 1100);
      } else {
        setTimeout(() => {
          setDone(true);
          setTimeout(() => {
            sessionStorage.setItem("echoearth:splash", "1");
            onDone();
          }, 700);
        }, 1000);
      }
    };
    setTimeout(advance, 1100);
  }, [onDone]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#1a2416] text-[#e8e0d0]"
        >
          {/* Paper texture overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(rgba(200,190,160,.3) 0.5px, transparent 0.7px)",
              backgroundSize: "12px 12px",
            }} />

          {/* Botanical SVG — top left */}
          <svg viewBox="0 0 210 250" className="absolute left-8 top-8 w-32 opacity-20 text-[#6e7c5c]"
            fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <path d="M104 243C106 167 105 83 111 4" />
            <path d="M108 178C71 158 42 125 23 82M108 148C145 125 169 91 182 46M106 117C72 101 48 72 39 42M109 91C137 75 153 52 159 28" />
            <path d="M75 157c-27-2-46-16-52-37 24 2 42 14 52 37ZM146 126c27-4 44-20 49-42-25 4-40 18-49 42Z" />
          </svg>

          {/* Botanical SVG — bottom right */}
          <svg viewBox="0 0 210 250" className="absolute bottom-8 right-8 w-28 rotate-180 opacity-15 text-[#6e7c5c]"
            fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <path d="M104 243C106 167 105 83 111 4" />
            <path d="M108 178C71 158 42 125 23 82M108 148C145 125 169 91 182 46" />
            <path d="M102 207c-29-5-54-24-65-55 31 8 53 26 65 55ZM110 202c28-8 50-29 58-58-29 10-48 30-58 58Z" />
          </svg>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16 text-center"
          >
            <p className="font-display text-4xl font-semibold tracking-tight text-[#c8bfa0]">
              EchoEarth
            </p>
          </motion.div>

          {/* Animated lines */}
          <div className="relative h-20 w-full max-w-md text-center px-8">
            <AnimatePresence mode="wait">
              <motion.p
                key={lineIndex}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className={`font-display leading-tight text-[#e8e0d0] ${
                  lineIndex === LINES.length - 1
                    ? "text-3xl font-medium text-[#c15a2e]"
                    : "text-2xl font-light"
                }`}
              >
                {LINES[lineIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Subtle waveform line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="mt-16 flex h-8 items-center gap-[3px] origin-center"
          >
            {[4,8,6,14,22,18,10,28,36,22,12,18,30,14,8,10,6,8,4].map((h, i) => (
              <motion.span key={i}
                className="inline-block w-[3px] rounded-full bg-[#6e7c5c]/60"
                style={{ height: `${h}px` }}
                animate={{ scaleY: [1, 1.6, 0.8, 1.4, 1] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.07,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            onClick={() => {
              setDone(true);
              setTimeout(() => {
                sessionStorage.setItem("echoearth:splash", "1");
                onDone();
              }, 700);
            }}
            className="absolute bottom-8 right-8 font-ui text-xs text-[#e8e0d0]/30 transition hover:text-[#e8e0d0]/60"
          >
            Skip ↗
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
