import { useState } from "react";
import { Cloud, CloudOff, LogIn, LogOut, UserPlus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AccountPanel({ syncStatus }) {
  const {
    user,
    firebaseReady,
    authLoading,
    login,
    register,
    logout,
    loginWithGoogle,
  } = useAuth();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Email login and registration
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (mode === "register") {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      setOpen(false);
      setPassword("");
    } catch (err) {
      const messages = {
        "auth/email-already-in-use":
          "This email already has an account. Try logging in.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Use a password with at least 6 characters.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/network-request-failed":
          "Network error. Check your internet connection.",
      };

      setError(
        messages[err.code] ||
          err.message ||
          "Unable to sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    setBusy(true);
    setError("");

    try {
      await loginWithGoogle();
      setOpen(false);
    } catch (err) {
      const messages = {
        "auth/popup-closed-by-user": "Google sign-in was cancelled.",
        "auth/popup-blocked": "Your browser blocked the Google sign-in popup.",
        "auth/unauthorized-domain":
          "This domain is not authorized in Firebase.",
        "auth/network-request-failed": "Check your internet connection.",
      };

      setError(messages[err.code] || err.message || "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  // Logout with confirmation
  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out of CreatorDesk?",
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      await logout();
    } catch (err) {
      setError("Unable to log out. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Firebase not configured
  if (!firebaseReady) {
    return (
      <div className="account-status account-offline">
        <CloudOff size={15} />
        <span>Firebase not configured</span>
      </div>
    );
  }

  // Checking authentication status
  if (authLoading) {
    return (
      <div className="account-status">
        <Cloud size={15} />
        <span>Checking account…</span>
      </div>
    );
  }

  return (
    <>
      {/* Account button */}
      <button
        className="account-status account-button"
        onClick={() => (user ? handleLogout() : setOpen(true))}
        disabled={busy}
        title={user ? "Sign out" : "Sign in to sync your data"}
      >
        {user ? <Cloud size={15} /> : <LogIn size={15} />}

        <span>
          {user
            ? syncStatus === "synced"
              ? "Cloud synced"
              : syncStatus === "syncing"
                ? "Syncing…"
                : "Signed in"
            : "Sign in to sync"}
        </span>

        {user && <small>{user.email}</small>}

        {user && <LogOut size={14} />}
      </button>

      {/* Login and registration modal */}
      {open && (
        <div
          className="modal-backdrop account-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <section className="modal-card account-modal">
            <div className="modal-head">
              <div>
                <h2>
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h2>

                <p>Sign in to back up and sync your CreatorDesk data.</p>
              </div>

              <button className="icon-button" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Google login */}
            <button
              type="button"
              className="google-button"
              onClick={handleGoogleLogin}
              disabled={busy}
            >
              <span className="google-mark">G</span>
              Continue with Google
            </button>

            <div className="account-divider">
              <span>OR CONTINUE WITH EMAIL</span>
            </div>

            {/* Email form */}
            <form className="account-form" onSubmit={submit}>
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength="6"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </label>

              {error && <p className="account-error">{error}</p>}

              <button className="primary-button" disabled={busy}>
                {mode === "login" ? (
                  <LogIn size={16} />
                ) : (
                  <UserPlus size={16} />
                )}

                {busy
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            {/* Switch login/register */}
            <p className="account-switch">
              {mode === "login"
                ? "New to CreatorDesk?"
                : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                }}
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </section>
        </div>
      )}
    </>
  );
}
