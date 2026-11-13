import { useEffect, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useNavigate,
  Navigate,
} from "react-router";

import {
  LayoutDashboard,
  Package,
  Play,
  ChartNoAxesCombined,
  CalendarDays,
  Wallet,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Home,
  UsersRound,
} from "lucide-react";

import { useAuth } from "./context/AuthContext.jsx";
import {
  getUserRecords,
  saveUserRecord,
  deleteUserRecord,
} from "./services/firestoreService.js";

// Components
import AccountPanel from "./components/AccountPanel.jsx";

// Pages
import Dashboard from "./pages/Dashboard.jsx";
import SamplesPage from "./pages/SamplesPage.jsx";
import ContentPage from "./pages/ContentPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import WithdrawalsPage from "./pages/WithdrawalsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AppearancePage from "./pages/AppearancePage.jsx";

// Forms
import SampleForm from "./forms/SampleForm.jsx";
import ContentForm from "./forms/ContentForm.jsx";
import WithdrawalForm from "./forms/WithdrawalForm.jsx";

// Helpers
import { uid, iso, download } from "./utils/helpers.js";

// Sidebar navigation
const sidebarNavigation = [
  { name: "Home", path: "/", icon: Home },
  { name: "Samples", path: "/samples", icon: Package },
  { name: "Content", path: "/content", icon: Play },
  { name: "Collaborators", path: "/collaborators", icon: UsersRound },
  { name: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
  { name: "Calendar", path: "/calendar", icon: CalendarDays },
  { name: "Withdrawals", path: "/withdrawals", icon: Wallet },
  { name: "Appearance", path: "/appearance", icon: Palette },
];

// Mobile bottom navigation
const bottomNavigation = [
  { name: "Home", path: "/", icon: Home },
  { name: "Samples", path: "/samples", icon: Package },
  { name: "Content", path: "/content", icon: Play },
];

// Authentication loading screen
function AuthLoading() {
  return (
    <div className="login-page">
      <div className="login-card">
        <h2>CreatorDesk</h2>
        <p>Checking your account...</p>
      </div>
    </div>
  );
}

// Protected application layout
function AppLayout() {
  const { user, profile, authLoading, firebaseReady } = useAuth();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [samples, setSamples] = useState([]);
  const [content, setContent] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(5);

  const [dataLoading, setDataLoading] = useState(true);

  const [activeForm, setActiveForm] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load the user's data from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    let isActive = true;

    async function loadData() {
      setDataLoading(true);

      try {
        const [savedSamples, savedContent, savedWithdrawals, settings] =
          await Promise.all([
            getUserRecords(user.uid, "samples"),
            getUserRecords(user.uid, "content"),
            getUserRecords(user.uid, "withdrawals"),
            getUserRecords(user.uid, "settings"),
          ]);

        if (!isActive) return;

        setSamples(savedSamples);
        setContent(savedContent);
        setWithdrawals(savedWithdrawals);

        const preferences = settings.find((item) => item.id === "preferences");

        setDailyGoal(preferences?.dailyGoal ?? 5);
      } catch (error) {
        console.error("Failed to load Firestore data:", error);
        alert(
          "Unable to load your workspace data. Please refresh and try again.",
        );
      } finally {
        if (isActive) {
          setDataLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isActive = false;
    };
  }, [user?.uid]);

  // Wait for Firebase authentication
  if (authLoading) {
    return <AuthLoading />;
  }

  // Firebase must be configured before authentication can work
  if (!firebaseReady) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Firebase not configured</h2>
          <p>Please configure Firebase before using CreatorDesk.</p>
        </div>
      </div>
    );
  }

  // Protect all application pages
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (dataLoading) {
    return <AuthLoading />;
  }

  // Count content linked to a sample
  const postedFor = (sampleId) => {
    return content.filter((item) => item.sampleId === sampleId).length;
  };

  // Save sample
  const saveSample = async (formData) => {
    const record = {
      ...formData,
      id: formData.id || uid(),
      platform: "TikTok",
      deadlineScope: formData.deadlineScope || "first",
    };

    try {
      await saveUserRecord(user.uid, "samples", record);

      setSamples((previous) =>
        formData.id
          ? previous.map((item) => (item.id === record.id ? record : item))
          : [...previous, record],
      );

      setActiveForm(null);
    } catch (error) {
      console.error("Failed to save sample:", error);
      alert("Unable to save sample. Please try again.");
    }
  };

  // Delete sample
  const deleteSample = async (id) => {
    if (
      !window.confirm(
        "Delete this sample? Its linked content records will remain.",
      )
    )
      return;

    try {
      await deleteUserRecord(user.uid, "samples", id);

      setSamples((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete sample:", error);
      alert("Unable to delete sample.");
    }
  };

  // Save content
  const saveContent = async (formData) => {
    let sampleId = formData.sampleId;

    try {
      if (formData.isNewProduct) {
        const newSample = {
          id: uid(),
          product: formData.product,
          brand: formData.brand,
          category: formData.category || "Other",
          platform: "TikTok",
          received: formData.postingDate,
          deadline: formData.postingDate,
          deliverables: 1,
          deadlineScope: "first",
        };

        await saveUserRecord(user.uid, "samples", newSample);

        setSamples((previous) => [...previous, newSample]);
        sampleId = newSample.id;
      }

      const linkedSample = samples.find((item) => item.id === sampleId);

      const record = {
        ...formData,
        id: formData.id || uid(),
        sampleId,
        product: formData.product || linkedSample?.product || "",
        brand: formData.brand || linkedSample?.brand || "",
        platform: "TikTok",
        fyp: formData.fyp === true || formData.fyp === "Yes" ? "Yes" : "No",
      };

      await saveUserRecord(user.uid, "content", record);

      setContent((previous) =>
        formData.id
          ? previous.map((item) => (item.id === record.id ? record : item))
          : [...previous, record],
      );

      setActiveForm(null);
    } catch (error) {
      console.error("Failed to save content:", error);
      alert("Unable to save content. Please try again.");
    }
  };

  // Delete content
  const deleteContent = async (id) => {
    if (!window.confirm("Delete this content record?")) return;

    try {
      await deleteUserRecord(user.uid, "content", id);

      setContent((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete content:", error);
      alert("Unable to delete content.");
    }
  };

  // Save withdrawal
  const saveWithdrawal = async (formData) => {
    const record = {
      ...formData,
      id: formData.id || uid(),
      platform: "TikTok",
    };

    try {
      await saveUserRecord(user.uid, "withdrawals", record);

      setWithdrawals((previous) =>
        formData.id
          ? previous.map((item) => (item.id === record.id ? record : item))
          : [...previous, record],
      );

      setActiveForm(null);
    } catch (error) {
      console.error("Failed to save withdrawal:", error);
      alert("Unable to save withdrawal.");
    }
  };

  // Delete withdrawal
  const deleteWithdrawal = async (id) => {
    if (!window.confirm("Delete this withdrawal record?")) return;

    try {
      await deleteUserRecord(user.uid, "withdrawals", id);

      setWithdrawals((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete withdrawal:", error);
      alert("Unable to delete withdrawal.");
    }
  };

  // Save daily goal
  const updateDailyGoal = async (value) => {
    const nextGoal = typeof value === "function" ? value(dailyGoal) : value;

    try {
      await saveUserRecord(user.uid, "settings", {
        id: "preferences",
        dailyGoal: nextGoal,
      });

      setDailyGoal(nextGoal);
    } catch (error) {
      console.error("Failed to save daily goal:", error);
      alert("Unable to save daily goal.");
    }
  };

  // Export samples
  const exportSamples = () => {
    const headers = [
      "Product",
      "Brand",
      "Category",
      "Received",
      "Deadline",
      "Deadline Scope",
      "Deliverables",
      "Posted",
    ];

    const rows = samples.map((sample) => [
      sample.product,
      sample.brand,
      sample.category,
      sample.received,
      sample.deadline,
      sample.deadlineScope || "first",
      sample.deliverables,
      postedFor(sample.id),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    download(
      new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      }),
      "affiliate-samples.csv",
    );
  };

  // Dashboard totals
  const totals = {
    samples: samples.length,
    videos: content.length,
    views: content.reduce((sum, item) => sum + Number(item.views || 0), 0),
    commission: content.reduce(
      (sum, item) => sum + Number(item.commission || 0),
      0,
    ),
  };

  // Upcoming and overdue samples
  const urgent = samples
    .filter((sample) => {
      const posted = postedFor(sample.id);
      const deliverables = Number(sample.deliverables || 1);

      // Existing samples default to First delivery only
      const deadlineScope = sample.deadlineScope || "first";

      // Check whether the deadline still applies
      const deadlineStillApplies =
        deadlineScope === "all" ? posted < deliverables : posted === 0;

      if (!deadlineStillApplies || !sample.deadline) {
        return false;
      }

      const remaining =
        (new Date(`${sample.deadline}T12:00:00`) -
          new Date(`${iso(new Date())}T12:00:00`)) /
        86400000;

      return remaining <= 7;
    })
    .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))
    .slice(0, 5);

  // Today's posts
  const todayPosts = content.filter(
    (item) => item.postingDate === iso(new Date()),
  ).length;

  // Open forms
  const openForm = (type, value = "new") => {
    setActiveForm({ type, value });
  };

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <ChartNoAxesCombined size={21} />
          </div>

          <div>
            <strong>CreatorDesk</strong>
            <span>Affiliate Manager</span>
          </div>

          <button
            className="icon-button mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace">
          <div className="avatar">
            {profile?.workspaceName?.trim().slice(0, 2).toUpperCase() || "CD"}
          </div>

          <div>
            <strong>{profile?.workspaceName || "My Workspace"}</strong>
            <span>TikTok Affiliate</span>
          </div>
        </div>

        <nav>
          <div className="nav-label">Manage</div>

          {sidebarNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="storage-note">
            <span>●</span>
            Your workspace is ready
          </div>

          <AccountPanel />
        </div>
      </aside>

      {/* Main content */}
      <main>
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <button
            className="icon-button desktop-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>

          <div className="breadcrumbs">
            <span>CreatorDesk</span>
            <ChevronRight size={14} />
            <strong>Workspace</strong>
          </div>
        </header>

        <div className="page-wrap">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  totals={totals}
                  urgent={urgent}
                  samples={samples}
                  content={content}
                  postedFor={todayPosts}
                  go={(page) => navigate(`/${page}`)}
                  onLog={() => openForm("content")}
                />
              }
            />

            <Route
              path="/samples"
              element={
                <SamplesPage
                  samples={samples}
                  postedFor={postedFor}
                  onAdd={() => openForm("sample")}
                  onEdit={(sample) => openForm("sample", sample)}
                  onDelete={deleteSample}
                  onExport={exportSamples}
                />
              }
            />

            <Route
              path="/content"
              element={
                <ContentPage
                  content={content}
                  samples={samples}
                  onAdd={() => openForm("content")}
                  onEdit={(item) => openForm("content", item)}
                  onDelete={deleteContent}
                />
              }
            />

            <Route
              path="/analytics"
              element={<AnalyticsPage samples={samples} content={content} />}
            />

            <Route
              path="/calendar"
              element={
                <CalendarPage
                  content={content}
                  samples={samples}
                  dailyGoal={dailyGoal}
                  setDailyGoal={updateDailyGoal}
                  onAdd={() => openForm("content")}
                />
              }
            />

            <Route
              path="/withdrawals"
              element={
                <WithdrawalsPage
                  withdrawals={withdrawals}
                  onAdd={() => openForm("withdrawal")}
                  onEdit={(item) => openForm("withdrawal", item)}
                  onDelete={deleteWithdrawal}
                />
              }
            />

            <Route
              path="/collaborators"
              element={
                <div className="page-title">
                  <div>
                    <h1>Collaborators</h1>
                    <p>Manage your brand partnerships and deliverables.</p>
                  </div>
                </div>
              }
            />

            <Route path="/appearance" element={<AppearancePage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className={`mobile-bottom-nav ${sidebarOpen ? "nav-disabled" : ""}`}
        aria-hidden={sidebarOpen}
      >
        {bottomNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              tabIndex={sidebarOpen ? -1 : 0}
            >
              <Icon size={21} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Forms */}
      {activeForm?.type === "sample" && (
        <SampleForm
          value={activeForm.value}
          onClose={() => setActiveForm(null)}
          onSave={saveSample}
        />
      )}

      {activeForm?.type === "content" && (
        <ContentForm
          value={activeForm.value}
          samples={samples}
          onClose={() => setActiveForm(null)}
          onSave={saveContent}
        />
      )}

      {activeForm?.type === "withdrawal" && (
        <WithdrawalForm
          value={activeForm.value}
          onClose={() => setActiveForm(null)}
          onSave={saveWithdrawal}
        />
      )}
    </div>
  );
}

// Main application router
export default function App() {
  const { user, profile, authLoading, profileLoading, firebaseReady } =
    useAuth();

  if (authLoading || (user && profileLoading)) {
    return <AuthLoading />;
  }

  if (!firebaseReady) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Firebase not configured</h2>
          <p>Please configure Firebase before using CreatorDesk.</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user && profile ? <Navigate to="/" replace /> : <LoginPage />
          }
        />

        <Route
          path="/*"
          element={
            user && profile ? <AppLayout /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
