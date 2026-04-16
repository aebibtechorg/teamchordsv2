import React from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      const s = localStorage.getItem("theme");
      if (s) return s === "dark";
      return typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  React.useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (e) {
      // ignore
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((v) => !v)}
      aria-label="Toggle theme"
      className="inline-flex items-center justify-center p-1 rounded hover:bg-muted/50"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

