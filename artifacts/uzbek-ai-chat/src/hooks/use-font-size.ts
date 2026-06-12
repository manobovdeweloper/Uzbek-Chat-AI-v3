import { useState, useEffect } from "react";

type FontSize = "sm" | "md" | "lg";
const KEY = "oz-font";
const SIZES: FontSize[] = ["sm", "md", "lg"];
const CSS: Record<FontSize, string> = {
  sm: "14px",
  md: "15.5px",
  lg: "17px",
};

function load(): FontSize {
  const v = localStorage.getItem(KEY);
  return (SIZES.includes(v as FontSize) ? v : "md") as FontSize;
}

export function useFontSize() {
  const [size, setSize] = useState<FontSize>(load);

  useEffect(() => {
    document.documentElement.style.setProperty("--chat-font-size", CSS[size]);
    localStorage.setItem(KEY, size);
  }, [size]);

  const increase = () => setSize((s) => SIZES[Math.min(SIZES.indexOf(s) + 1, SIZES.length - 1)]);
  const decrease = () => setSize((s) => SIZES[Math.max(SIZES.indexOf(s) - 1, 0)]);

  return { size, increase, decrease };
}
