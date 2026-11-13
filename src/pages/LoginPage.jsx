import { useEffect, useState } from "react";

import {
  ChartNoAxesCombined,
  Package,
  Play,
  CalendarDays,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  LockKeyhole,
  Mail,
  User,
  Building2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { user, profile, login, register, loginWithGoogle, saveUserProfile } =
    useAuth();

  const [mode, setMode] = useState("login");

  const [fullName, setFullName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [googleSetup, setGoogleSetup] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const isGoogleUser = user?.providerData?.some(
      (provider) => provider.providerId === "google.com",
    );

    if (user && !profile && isGoogleUser) {
      setGoogleSetup(true);
    }
  }, [user, profile]);
  // Convert Firebase errors into readable messages
  const getErrorMessage = (err) => {
    const messages = {
      "auth/email-already-in-use":
        "This email already has an account. Please sign in instead.",

      "auth/invalid-email": "Please enter a valid email address.",

      "auth/weak-password": "Your password must contain at least 6 characters.",

      "auth/invalid-credential":
        "Incorrect email or password. Please try again.",

      "auth/user-not-found": "No account found with this email.",

      "auth/wrong-password": "Incorrect password. Please try again.",

      "auth/network-request-failed":
        "Network error. Please check your internet connection.",

      "auth/popup-closed-by-user": "Google sign-in was cancelled.",

      "auth/popup-blocked": "Your browser blocked the sign-in popup.",

      "auth/unauthorized-domain": "This domain is not authorized in Firebase.",
    };

    return messages[err.code] || "Something went wrong. Please try again.";
  };

  // Email login and registration
  const submit = async (event) => {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      if (mode === "register") {
        await register(
          email.trim(),
          password,
          fullName.trim(),
          workspaceName.trim(),
        );
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Google login and registration
  const handleGoogleLogin = async () => {
    setBusy(true);
    setError("");

    try {
      const result = await loginWithGoogle();

      if (result.needsWorkspaceSetup) {
        setGoogleSetup(true);
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Save workspace name for Google users
  const handleWorkspaceSetup = async (event) => {
    event.preventDefault();

    if (!workspaceName.trim()) {
      setError("Please enter your workspace name.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await saveUserProfile(workspaceName.trim());
    } catch (err) {
      console.error(err);
      setError("Unable to save your workspace. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Switch between login and registration
  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setPassword("");
    setFullName("");
    setWorkspaceName("");
    setGoogleSetup(false);
  };

  return (
    <div className="auth-page">
      {/* LEFT BRANDING SECTION */}
      <section className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <ChartNoAxesCombined size={22} />
            </div>

            <div>
              <strong>CreatorDesk</strong>
              <span>CREATOR WORKSPACE</span>
            </div>
          </div>

          <div className="auth-hero">
            <span className="auth-eyebrow">
              <Sparkles size={14} />
              YOUR CREATOR JOURNEY, ORGANIZED
            </span>

            <h1>
              Everything you need.
              <br />
              <span>One creative space.</span>
            </h1>

            <p>
              Manage your samples, track your content, monitor your progress and
              stay on top of your affiliate journey.
            </p>
          </div>

          <div className="auth-preview">
            <div className="preview-top">
              <div>
                <span className="preview-label">YOUR WORKSPACE</span>
                <h3>Overview</h3>
              </div>

              <div className="preview-status">
                <span />
                Active
              </div>
            </div>

            <div className="preview-metrics">
              <div className="preview-metric">
                <div className="preview-metric-icon purple">
                  <Package size={16} />
                </div>

                <span>Samples</span>
                <strong>12</strong>
                <small>Products tracked</small>
              </div>

              <div className="preview-metric">
                <div className="preview-metric-icon pink">
                  <Play size={16} />
                </div>

                <span>Content</span>
                <strong>28</strong>
                <small>Videos posted</small>
              </div>
            </div>

            <div className="preview-activity">
              <div className="preview-activity-heading">
                <strong>Recent activity</strong>
                <span>THIS WEEK</span>
              </div>

              <div className="preview-activity-item">
                <div className="preview-activity-icon">
                  <CheckCircle2 size={16} />
                </div>

                <div>
                  <strong>Content published</strong>
                  <span>Product review video</span>
                </div>

                <small>Done</small>
              </div>

              <div className="preview-activity-item">
                <div className="preview-activity-icon">
                  <CalendarDays size={16} />
                </div>

                <div>
                  <strong>Upcoming deadline</strong>
                  <span>Sample deliverable</span>
                </div>

                <small>Pending</small>
              </div>
            </div>
          </div>

          <div className="auth-visual-footer">
            <span>PLAN</span>
            <i />
            <span>CREATE</span>
            <i />
            <span>GROW</span>
          </div>
        </div>
      </section>

      {/* RIGHT FORM SECTION */}
      <section className="auth-form-section">
        <div className="auth-form-container">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <div className="auth-logo-icon">
              <ChartNoAxesCombined size={21} />
            </div>

            <strong>CreatorDesk</strong>
          </div>

          <div className="auth-form-heading">
            <span className="auth-welcome">
              {googleSetup
                ? "PERSONALIZE YOUR SPACE"
                : mode === "login"
                  ? "WELCOME BACK"
                  : "GET STARTED"}
            </span>

            <h2>
              {googleSetup
                ? "Name your workspace"
                : mode === "login"
                  ? "Sign in to your account"
                  : "Create your account"}
            </h2>

            <p>
              {googleSetup
                ? "Choose a name for your personal creator workspace."
                : mode === "login"
                  ? "Enter your details to access your workspace."
                  : "Set up your account and personalize your creator workspace."}
            </p>
          </div>

          {/* Google workspace setup */}
          {googleSetup ? (
            <form className="auth-form" onSubmit={handleWorkspaceSetup}>
              <label htmlFor="google-workspace">Workspace name</label>

              <div className="auth-input-wrapper">
                <Building2 size={17} />

                <input
                  id="google-workspace"
                  type="text"
                  placeholder="e.g. Iman's Studio"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  maxLength={40}
                  required
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="submit"
                className="auth-submit-button"
                disabled={busy}
              >
                {busy ? "Saving..." : "Create my workspace"}
                {!busy && <ArrowRight size={17} />}
              </button>
            </form>
          ) : (
            <>
              {/* Google button */}
              <button
                type="button"
                className="auth-google-button"
                onClick={handleGoogleLogin}
                disabled={busy}
              >
                <span className="auth-google-icon">G</span>
                Continue with Google
              </button>

              <div className="auth-divider">
                <span>OR CONTINUE WITH EMAIL</span>
              </div>

              {/* Email form */}
              <form className="auth-form" onSubmit={submit}>
                {mode === "register" && (
                  <>
                    <label htmlFor="auth-fullname">Full name</label>

                    <div className="auth-input-wrapper">
                      <User size={17} />

                      <input
                        id="auth-fullname"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                        maxLength={60}
                        required
                      />
                    </div>

                    <label htmlFor="auth-workspace">Workspace name</label>

                    <div className="auth-input-wrapper">
                      <Building2 size={17} />

                      <input
                        id="auth-workspace"
                        type="text"
                        placeholder="e.g. Iman's Studio"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        maxLength={40}
                        required
                      />
                    </div>
                  </>
                )}

                <label htmlFor="auth-email">Email address</label>

                <div className="auth-input-wrapper">
                  <Mail size={17} />

                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <label htmlFor="auth-password">Password</label>

                <div className="auth-input-wrapper">
                  <LockKeyhole size={17} />

                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button
                  type="submit"
                  className="auth-submit-button"
                  disabled={busy}
                >
                  {busy
                    ? "Please wait..."
                    : mode === "login"
                      ? "Sign in"
                      : "Create account"}

                  {!busy && <ArrowRight size={17} />}
                </button>
              </form>

              <div className="auth-switch">
                {mode === "login"
                  ? "Don't have an account yet?"
                  : "Already have an account?"}

                <button type="button" onClick={switchMode}>
                  {mode === "login" ? "Create account" : "Sign in"}
                </button>
              </div>
            </>
          )}

          <div className="auth-form-footer">
            <span>© 2026 CreatorDesk</span>
            <span>Made for creators.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
