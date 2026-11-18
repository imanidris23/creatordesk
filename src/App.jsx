import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useLocation,
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
  Sparkles,
  Settings,
} from "lucide-react";

import { useAuth } from "./context/AuthContext.jsx";
import {
  getUserRecords,
  saveUserRecord,
  deleteUserRecord,
} from "./services/firestoreService.js";

import { createNotification } from "./services/notificationService.js";
import NotificationBell from "./components/NotificationBell.jsx";

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
import AppearancePage from "./pages/SettingsPage.jsx";
import CollaboratorsPage from "./pages/CollaboratorsPage.jsx";
import AIAssistantPage from "./pages/AIAssistantPage.jsx";

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
  { name: "Settings", path: "/settings", icon: Settings },
  { name: "AI Assistant", path: "/ai", icon: Sparkles },
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

// Determine whether a content record is Posted or Scheduled
function getContentStatus(item, now = Date.now()) {
  // Existing records and manually published videos are Posted
  if (item.postingMethod !== "scheduled") {
    return "Posted";
  }

  // A scheduled record needs both a date and time
  if (!item.postingDate || !item.postingTime) {
    return "Scheduled";
  }

  // TikTok scheduling time is interpreted as Malaysia time (UTC+8)
  const scheduledTime = new Date(
    `${item.postingDate}T${item.postingTime}:00+08:00`,
  ).getTime();

  return scheduledTime <= now ? "Posted" : "Scheduled";
}

// Create an in-app notification without interrupting record saving
async function sendUserNotification(uid, notification) {
  try {
    await createNotification(uid, notification);
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// Protected application layout
function AppLayout() {
  const { user, profile, authLoading, firebaseReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Return to Dashboard when starting a new browser session
  useEffect(() => {
    const sessionStarted = sessionStorage.getItem(
      "creatordesk-session-started",
    );

    if (!sessionStarted) {
      sessionStorage.setItem("creatordesk-session-started", "true");

      if (location.pathname !== "/") {
        navigate("/", { replace: true });
      }
    }
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [samples, setSamples] = useState([]);
  const [content, setContent] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(5);

  const [dataLoading, setDataLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(Date.now());

  const [activeForm, setActiveForm] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Remember previous content statuses to detect scheduled videos becoming Posted
  const previousContentStatuses = useRef(null);

  // Refresh the current time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

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

  // Detect when a scheduled video becomes Posted
  useEffect(() => {
    if (dataLoading || !user?.uid) return;

    const currentStatuses = new Map(
      content.map((item) => [item.id, getContentStatus(item, currentTime)]),
    );

    // Set initial statuses without sending notifications for old records
    if (previousContentStatuses.current === null) {
      previousContentStatuses.current = currentStatuses;
      return;
    }

    content.forEach((item) => {
      const previousStatus = previousContentStatuses.current.get(item.id);
      const currentStatus = currentStatuses.get(item.id);

      if (previousStatus === "Scheduled" && currentStatus === "Posted") {
        sendUserNotification(user.uid, {
          title: "Scheduled video posted",
          message: `${item.title || item.product || "Your video"} is now marked as posted.`,
          type: "content_posted",
        });
      }
    });

    previousContentStatuses.current = currentStatuses;
  }, [content, currentTime, dataLoading, user?.uid]);

  // Reset status tracking when the signed-in user changes
  useEffect(() => {
    previousContentStatuses.current = null;
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

  // Count only videos that have actually reached their posting time
  const postedFor = (sampleId) => {
    return content.filter(
      (item) =>
        item.sampleId === sampleId &&
        getContentStatus(item, currentTime) === "Posted",
    ).length;
  };

  // Save sample
  const saveSample = async (formData) => {
    const isNewSample = !formData.id;

    const record = {
      ...formData,
      id: formData.id || uid(),
      platform: "TikTok",
      deadlineScope: formData.deadlineScope || "first",
    };

    try {
      await saveUserRecord(user.uid, "samples", record);

      setSamples((previous) =>
        isNewSample
          ? [...previous, record]
          : previous.map((item) => (item.id === record.id ? record : item)),
      );

      // Notify only when a new sample is added
      if (isNewSample) {
        await sendUserNotification(user.uid, {
          title: "New sample added",
          message: `${record.product || "A new product"} has been added to your sample tracker.`,
          type: "sample_added",
        });
      }

      setActiveForm(null);
    } catch (error) {
      console.error("Failed to save sample:", error);
      alert("Unable to save sample. Please try again.");
    }
  };

  // Delete sample
  const deleteSample = async (id) => {
    const sample = samples.find((item) => item.id === id);

    if (
      !window.confirm(
        "Delete this sample? Its linked content records will remain.",
      )
    )
      return;

    try {
      await deleteUserRecord(user.uid, "samples", id);

      setSamples((previous) => previous.filter((item) => item.id !== id));

      // Notify after successful deletion
      await sendUserNotification(user.uid, {
        title: "Sample deleted",
        message: `${sample?.product || "A sample"} has been removed from your sample tracker.`,
        type: "sample_deleted",
      });
    } catch (error) {
      console.error("Failed to delete sample:", error);
      alert("Unable to delete sample.");
    }
  };

  // Save content
  const saveContent = async (formData) => {
    let createdSample = null;

    const isNewContent = !formData.id;

    try {
      let sampleId = formData.sampleId || "";

      // Create a sample record when logging a new product
      if (formData.isNewProduct && !sampleId) {
        createdSample = {
          id: uid(),
          product: formData.product.trim(),
          brand: formData.brand.trim(),
          category: formData.category,
          platform: "TikTok",
          received: "",
          deadline: "",
          deliverables: 1,
          deadlineScope: "first",
        };

        await saveUserRecord(user.uid, "samples", createdSample);
        sampleId = createdSample.id;
      }

      // Prepare the content record
      const record = {
        ...formData,
        id: formData.id || uid(),
        sampleId,
        platform: "TikTok",
        postingMethod: formData.postingMethod || "manual",
        postingTime: formData.postingTime || "",
        fyp: formData.fyp === true || formData.fyp === "Yes" ? "Yes" : "No",
        url: formData.url?.trim() || "",
      };

      // Save content to Firestore
      await saveUserRecord(user.uid, "content", record);

      // Update local samples
      if (createdSample) {
        setSamples((previous) => [...previous, createdSample]);

        await sendUserNotification(user.uid, {
          title: "New sample added",
          message: `${createdSample.product} has been added to your sample tracker.`,
          type: "sample_added",
        });
      }

      // Update local content
      setContent((previous) =>
        isNewContent
          ? [...previous, record]
          : previous.map((item) => (item.id === record.id ? record : item)),
      );

      // Notify only when creating new content
      if (isNewContent) {
        const status = getContentStatus(record);

        await sendUserNotification(user.uid, {
          title: status === "Scheduled" ? "Video scheduled" : "Content logged",
          message:
            status === "Scheduled"
              ? `${record.title || record.product || "Your video"} has been scheduled successfully.`
              : `${record.title || record.product || "Your content"} has been logged successfully.`,
          type: status === "Scheduled" ? "content_scheduled" : "content_logged",
        });
      }

      setActiveForm(null);
    } catch (error) {
      console.error("Failed to save content:", error);

      // Roll back the sample if saving its content failed
      if (createdSample) {
        try {
          await deleteUserRecord(user.uid, "samples", createdSample.id);
        } catch (rollbackError) {
          console.error("Failed to remove incomplete sample:", rollbackError);
        }
      }

      alert("Unable to save content. Please try again.");
    }
  };

  // Toggle FYP status
  const toggleFyp = async (item) => {
    // Only allow FYP updates after the video is Posted
    if (getContentStatus(item, currentTime) !== "Posted") return;

    const reachedFyp = item.fyp === true || item.fyp === "Yes";

    const updatedRecord = {
      ...item,
      fyp: reachedFyp ? "No" : "Yes",
    };

    try {
      await saveUserRecord(user.uid, "content", updatedRecord);

      setContent((previous) =>
        previous.map((record) =>
          record.id === item.id ? updatedRecord : record,
        ),
      );
    } catch (error) {
      console.error("Failed to update FYP status:", error);
      alert("Unable to update FYP status. Please try again.");
    }
  };

  // Add TikTok video link to an existing content record
  const addContentLink = async (id, url) => {
    const trimmedUrl = url.trim();

    // Validate the URL
    try {
      const parsedUrl = new URL(trimmedUrl);

      const isTikTok =
        parsedUrl.protocol === "https:" &&
        (parsedUrl.hostname === "tiktok.com" ||
          parsedUrl.hostname.endsWith(".tiktok.com"));

      if (!isTikTok) {
        alert("Please enter a valid TikTok video link.");
        return;
      }
    } catch {
      alert("Please enter a valid URL.");
      return;
    }

    const existingRecord = content.find((item) => item.id === id);

    if (!existingRecord) {
      alert("Content record not found.");
      return;
    }

    const updatedRecord = {
      ...existingRecord,
      url: trimmedUrl,
    };

    try {
      await saveUserRecord(user.uid, "content", updatedRecord);

      setContent((previous) =>
        previous.map((item) => (item.id === id ? updatedRecord : item)),
      );

      // Notify only when a link is added for the first time
      if (!existingRecord.url) {
        await sendUserNotification(user.uid, {
          title: "TikTok link added",
          message: `Your TikTok link for ${existingRecord.title || existingRecord.product || "your content"} has been saved.`,
          type: "link_added",
        });
      }
    } catch (error) {
      console.error("Failed to save TikTok link:", error);
      alert("Unable to save TikTok link. Please try again.");
    }
  };

  // Delete content
  const deleteContent = async (id) => {
    const item = content.find((record) => record.id === id);

    if (!window.confirm("Delete this content record?")) return;

    try {
      await deleteUserRecord(user.uid, "content", id);

      setContent((previous) => previous.filter((item) => item.id !== id));

      // Notify after successful deletion
      await sendUserNotification(user.uid, {
        title: "Content deleted",
        message: `${item?.title || item?.product || "A content record"} has been removed from your content tracker.`,
        type: "content_deleted",
      });
    } catch (error) {
      console.error("Failed to delete content:", error);
      alert("Unable to delete content.");
    }
  };

  // Save withdrawal
  const saveWithdrawal = async (formData) => {
    const isNewWithdrawal = !formData.id;

    const record = {
      ...formData,
      id: formData.id || uid(),
      platform: "TikTok",
    };

    try {
      await saveUserRecord(user.uid, "withdrawals", record);

      setWithdrawals((previous) =>
        isNewWithdrawal
          ? [...previous, record]
          : previous.map((item) => (item.id === record.id ? record : item)),
      );

      // Notify only when a new withdrawal is recorded
      if (isNewWithdrawal) {
        await sendUserNotification(user.uid, {
          title: "Withdrawal recorded",
          message: "Your new withdrawal has been saved successfully.",
          type: "withdrawal_added",
        });
      }

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

  // Count today's videos only when they are Posted
  const todayPosts = content.filter(
    (item) =>
      item.postingDate === iso(new Date()) &&
      getContentStatus(item, currentTime) === "Posted",
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

          {/* Notification bell */}
          <NotificationBell uid={user.uid} />
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
                  onAddSample={() => openForm("sample")}
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
              path="/ai"
              element={<AIAssistantPage samples={samples} content={content} />}
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
                  onToggleFyp={toggleFyp}
                  onAddLink={addContentLink}
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
                <CollaboratorsPage samples={samples} content={content} />
              }
            />

            <Route path="/settings" element={<AppearancePage />} />

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
          samples={samples}
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
