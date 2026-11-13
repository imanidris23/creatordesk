import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const defaultTheme = {
  mode: "light",
  preset: "lavender",
  customColors: null,
};

const presetColors = {
  lavender: {
    ink: "#29263a",
    muted: "#918da2",
    line: "#eeebf3",
    purple: "#8063bd",
    purpleDark: "#6d50a9",
    surface: "#ffffff",
    canvas: "#f8f7fb",
  },
  beige: {
    ink: "#42352d",
    muted: "#97877a",
    line: "#eee5da",
    purple: "#b58b68",
    purpleDark: "#96704f",
    surface: "#ffffff",
    canvas: "#f8f5f0",
  },
  sage: {
    ink: "#263c34",
    muted: "#788e83",
    line: "#e0ebe4",
    purple: "#579681",
    purpleDark: "#407762",
    surface: "#ffffff",
    canvas: "#eff6f3",
  },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("creatordesk-theme");
      return saved ? { ...defaultTheme, ...JSON.parse(saved) } : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  useEffect(() => {
    localStorage.setItem("creatordesk-theme", JSON.stringify(theme));

    const root = document.documentElement;

    root.dataset.theme = theme.preset;
    root.classList.toggle("dark", theme.mode === "dark");

    const colors =
      theme.preset === "custom"
        ? { ...presetColors.lavender, ...theme.customColors }
        : presetColors[theme.preset] || presetColors.lavender;

    Object.entries(colors).forEach(([key, value]) => {
      const variable = {
        ink: "--ink",
        muted: "--muted",
        line: "--line",
        purple: "--purple",
        purpleDark: "--purple-dark",
        surface: "--surface",
        canvas: "--canvas",
      }[key];

      if (variable) {
        root.style.setProperty(variable, value);
      }
    });
  }, [theme]);

  const updateTheme = (updates) => {
    setTheme((previous) => ({
      ...previous,
      ...updates,
    }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
