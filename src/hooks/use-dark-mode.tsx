import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("careermind_theme");
    if (stored) return stored === "dark";
    return false; // default to light mode
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("careermind_theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark(v => !v);

  return { isDark, toggle };
}
