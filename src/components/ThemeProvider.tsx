"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved theme from localStorage
    const savedTheme = localStorage.getItem("webhotel_theme") as Theme | null;
    const initialTheme = savedTheme === "light" ? "light" : "dark";
    setThemeState(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("webhotel_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border ${
        theme === "dark"
          ? "bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-slate-700/80 hover:border-amber-400/50"
          : "bg-slate-100 hover:bg-slate-200 text-blue-600 border-slate-300 hover:border-blue-400"
      } ${className}`}
      title={theme === "dark" ? "เปลี่ยนเป็นธีมสว่าง (Light Mode)" : "เปลี่ยนเป็นธีมมืด (Dark Mode)"}
      aria-label="สลับธีม สว่าง/มืด"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-300 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
      )}
      <span className="text-xs font-semibold hidden sm:inline">
        {theme === "dark" ? "สว่าง" : "มืด"}
      </span>
    </button>
  );
}
