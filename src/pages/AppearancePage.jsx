import { useTheme } from "../context/ThemeContext.jsx";
import { Check, RotateCcw, Sun, Moon, Palette } from "lucide-react";

const presets = [
  {
    id: "lavender",
    name: "Lavender",
    description: "Your original CreatorDesk look",
    colors: ["#8063bd", "#f8f7fb", "#ffffff"],
  },
  {
    id: "beige",
    name: "Warm Beige",
    description: "A soft and warm aesthetic",
    colors: ["#b58b68", "#f8f5f0", "#ffffff"],
  },
  {
    id: "sage",
    name: "Sage Green",
    description: "A calm and refreshing look",
    colors: ["#579681", "#eff6f3", "#ffffff"],
  },
];

export default function AppearancePage() {
  const { theme, updateTheme } = useTheme();

  const colors = theme.customColors || {
    purple: "#8063bd",
    canvas: "#f8f7fb",
    surface: "#ffffff",
  };

  const selectPreset = (preset) => {
    updateTheme({
      preset,
      customColors: null,
    });
  };

  const updateCustomColor = (key, value) => {
    updateTheme({
      preset: "custom",
      customColors: {
        ...colors,
        [key]: value,
      },
    });
  };

  const resetTheme = () => {
    updateTheme({
      mode: "light",
      preset: "lavender",
      customColors: null,
    });
  };

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">PERSONALIZATION</span>
          <h1>Appearance</h1>
          <p>Customize the look and feel of your CreatorDesk workspace.</p>
        </div>
      </div>

      <section className="panel theme-section">
        <div className="section-heading">
          <div>
            <h2>Display mode</h2>
            <p>Choose how your workspace appears.</p>
          </div>
        </div>

        <div className="theme-mode-options">
          <button
            className={`theme-mode-card ${theme.mode === "light" ? "selected" : ""}`}
            onClick={() => updateTheme({ mode: "light" })}
          >
            <Sun size={20} />
            <strong>Light mode</strong>
            <span>Bright and clean</span>
            {theme.mode === "light" && <Check size={17} />}
          </button>

          <button
            className={`theme-mode-card ${theme.mode === "dark" ? "selected" : ""}`}
            onClick={() => updateTheme({ mode: "dark" })}
          >
            <Moon size={20} />
            <strong>Dark mode</strong>
            <span>Easy on the eyes</span>
            {theme.mode === "dark" && <Check size={17} />}
          </button>
        </div>
      </section>

      <section className="panel theme-section">
        <div className="section-heading">
          <div>
            <h2>Preset themes</h2>
            <p>Select a colour palette for your workspace.</p>
          </div>
        </div>

        <div className="theme-preset-grid">
          {presets.map((preset) => (
            <button
              key={preset.id}
              className={`theme-preset-card ${theme.preset === preset.id ? "selected" : ""}`}
              onClick={() => selectPreset(preset.id)}
            >
              <div className="theme-preview">
                {preset.colors.map((color, index) => (
                  <span key={index} style={{ backgroundColor: color }} />
                ))}
              </div>

              <div className="theme-preset-info">
                <div>
                  <strong>{preset.name}</strong>
                  <p>{preset.description}</p>
                </div>

                {theme.preset === preset.id && <Check size={18} />}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="panel theme-section">
        <div className="section-heading">
          <div>
            <h2>Custom colours</h2>
            <p>Create your own colour combination.</p>
          </div>
          <Palette size={20} />
        </div>

        <div className="custom-color-grid">
          <label className="color-picker-row">
            <span>
              <strong>Accent colour</strong>
              <small>Buttons and highlights</small>
            </span>
            <input
              type="color"
              value={colors.purple}
              onChange={(e) => updateCustomColor("purple", e.target.value)}
            />
          </label>

          <label className="color-picker-row">
            <span>
              <strong>Background colour</strong>
              <small>Main workspace background</small>
            </span>
            <input
              type="color"
              value={colors.canvas}
              onChange={(e) => updateCustomColor("canvas", e.target.value)}
            />
          </label>

          <label className="color-picker-row">
            <span>
              <strong>Card colour</strong>
              <small>Panels and content cards</small>
            </span>
            <input
              type="color"
              value={colors.surface}
              onChange={(e) => updateCustomColor("surface", e.target.value)}
            />
          </label>
        </div>
      </section>

      <div className="theme-reset">
        <button className="secondary-button" onClick={resetTheme}>
          <RotateCcw size={16} />
          Reset to default
        </button>
      </div>
    </div>
  );
}
