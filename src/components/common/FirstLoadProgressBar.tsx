"use client";

import { useEffect, useState } from "react";

export default function FirstLoadProgressBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Start progress simulation immediately upon component mount (first load)
    const interval = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => setVisible(false), 300); // Fade out shortly after reaching 100%
          return 100;
        }
        // Increment progress by a random amount to look realistic
        const increment = Math.random() * 30;
        return Math.min(oldProgress + increment, 100);
      });
    }, 80);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 h-[3px] bg-primary-600 z-[99999] transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        boxShadow: "0 0 10px #2563eb, 0 0 5px #2563eb",
      }}
    />
  );
}
