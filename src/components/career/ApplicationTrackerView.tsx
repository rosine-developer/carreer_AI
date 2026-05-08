import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Filter,
  Calendar,
  Building2,
  Briefcase,
  StickyNote,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  X,
  Bell,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  applicationDate: Date;
  status: "applied" | "interview" | "rejected" | "accepted";
  followUpDate?: Date;
  notes: string;
  attachments: {
    resumeId?: string;
    coverLetterId?: string;
  };
}

type SortField = "date" | "company" | "status" | "jobTitle";
type SortOrder = "asc" | "desc";

const STATUS_COLORS = {
  applied: { bg: "rgba(0,149,255,0.12)", border: "rgba(0,149,255,0.3)", text: "#0095FF" },
  interview: { bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.3)", text: "#EAB308" },
  rejected: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", text: "#EF4444" },
  accepted: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", text: "#22C55E" },
};

const STATUS_LABELS = {
  applied: "Applied",
  interview: "Interview",
  rejected: "Rejected",
  accepted: "Accepted",
};

export default function ApplicationTrackerView() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<"all" | Application["status"]>("all");
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [showReminders, setShowReminders] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    applicationDate: new Date().toISOString().split("T")[0],
    status: "applied" as Application["status"],
    followUpDate: "",
    notes: "",
  });

  // Load applications from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("careermind:applications");
      if (saved) {
        const parsed = JSON.parse(saved);
        const withDates = parsed.map((app: any) => ({
          ...app,
          applicationDate: new Date(app.applicationDate),
          followUpDate: app.followUpDate ? new Date(app.followUpDate) : undefined,
        }));
        setApplications(withDates);
      }
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  }, []);

  // Save applications to localStorage
  const saveApplications = (apps: Application[]) => {
    try {
      localStorage.setItem("careermind:applications", JSON.stringify(apps));
      setApplications(apps);
    } catch (error) {
      console.error("Error saving applications:", error);
    }
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter((app) => filter === "all" || app.status === filter)
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = a.applicationDate.getTime() - b.applicationDate.getTime();
          break;
        case "company":
          comparison = a.companyName.localeCompare(b.companyName);
          break;
        case "jobTitle":
          comparison = a.jobTitle.localeCompare(b.jobTitle);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Open form for new application
  const handleNewApplication = () => {
    setEditingApp(null);
    setFormData({
      jobTitle: "",
      companyName: "",
      applicationDate: new Date().toISOString().split("T")[0],
      status: "applied",
      followUpDate: "",
      notes: "",
    });
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setFormData({
      jobTitle: app.jobTitle,
      companyName: app.companyName,
      applicationDate: app.applicationDate.toISOString().split("T")[0],
      status: app.status,
      followUpDate: app.followUpDate?.toISOString().split("T")[0] || "",
      notes: app.notes,
    });
    setIsFormOpen(true);
  };

  // Save application
  const handleSave = () => {
    if (!formData.jobTitle.trim() || !formData.companyName.trim()) {
      alert("Please fill in job title and company name");
      return;
    }

    const newApp: Application = {
      id: editingApp?.id || `app-${Date.now()}`,
      jobTitle: formData.jobTitle.trim(),
      companyName: formData.companyName.trim(),
      applicationDate: new Date(formData.applicationDate),
      status: formData.status,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate) : undefined,
      notes: formData.notes.trim(),
      attachments: editingApp?.attachments || {},
    };

    if (editingApp) {
      // Update existing
      saveApplications(applications.map((app) => (app.id === editingApp.id ? newApp : app)));
    } else {
      // Add new
      saveApplications([...applications, newApp]);
    }

    setIsFormOpen(false);
  };

  // Delete application
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this application?")) {
      saveApplications(applications.filter((app) => app.id !== id));
    }
  };

  // Update status
  const handleStatusUpdate = (id: string, status: Application["status"]) => {
    saveApplications(
      applications.map((app) => (app.id === id ? { ...app, status } : app))
    );
  };

  // Count by status
  const statusCounts = {
    all: applications.length,
    applied: applications.filter((a) => a.status === "applied").length,
    interview: applications.filter((a) => a.status === "interview").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
  };

  // Calculate statistics
  const stats = {
    total: applications.length,
    percentages: {
      applied: applications.length > 0 ? Math.round((statusCounts.applied / applications.length) * 100) : 0,
      interview: applications.length > 0 ? Math.round((statusCounts.interview / applications.length) * 100) : 0,
      rejected: applications.length > 0 ? Math.round((statusCounts.rejected / applications.length) * 100) : 0,
      accepted: applications.length > 0 ? Math.round((statusCounts.accepted / applications.length) * 100) : 0,
    },
    topCompanies: (() => {
      const companyCounts = applications.reduce((acc, app) => {
        acc[app.companyName] = (acc[app.companyName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(companyCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([company, count]) => ({ company, count }));
    })(),
    topRoles: (() => {
      const roleCounts = applications.reduce((acc, app) => {
        acc[app.jobTitle] = (acc[app.jobTitle] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(roleCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([role, count]) => ({ role, count }));
    })(),
    recentActivity: applications
      .sort((a, b) => b.applicationDate.getTime() - a.applicationDate.getTime())
      .slice(0, 5),
  };

  // Get pending reminders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const reminders = applications
    .filter((app) => app.followUpDate)
    .map((app) => {
      const followUpDate = new Date(app.followUpDate!);
      followUpDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...app, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const overdueReminders = reminders.filter((r) => r.daysUntil < 0);
  const upcomingReminders = reminders.filter((r) => r.daysUntil >= 0);

  // Mark reminder as complete (remove follow-up date)
  const handleCompleteReminder = (id: string) => {
    saveApplications(
      applications.map((app) =>
        app.id === id ? { ...app, followUpDate: undefined } : app
      )
    );
  };

  return (
    <div
      className="min-h-screen w-full overflow-auto"
      style={{
        background:
          "linear-gradient(135deg, #0f1419 0%, #1a2332 25%, #0d1b2a 50%, #1b263b 75%, #0a1929 100%)",
        fontFamily: "Manrope, sans-serif",
      }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                color: "rgba(255,255,255,0.95)",
                fontFamily: "Syne, sans-serif",
              }}
            >
              Application Tracker
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Manage and track your job applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-2 rounded-lg text-xs font-medium"
              style={{
                background: showStats ? "rgba(0,149,255,0.15)" : "rgba(255,255,255,0.05)",
                border: showStats ? "1px solid rgba(0,149,255,0.35)" : "1px solid rgba(255,255,255,0.1)",
                color: showStats ? "#0095FF" : "rgba(255,255,255,0.7)",
              }}
            >
              {showStats ? "Hide Stats" : "Show Stats"}
            </motion.button>
            <Button
              onClick={handleNewApplication}
              className="flex items-center gap-2"
              style={{
                background: "rgba(255,138,0,0.15)",
                border: "1px solid rgba(255,138,0,0.35)",
                color: "#FF8A00",
              }}
            >
              <Plus size={16} />
              New Application
            </Button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {showStats && applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Total Applications */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Total Applications
                </p>
                <p className="text-3xl font-bold" style={{ color: "rgba(255,255,255,0.95)", fontFamily: "Syne, sans-serif" }}>
                  {stats.total}
                </p>
              </div>

              {/* Applied */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(0,149,255,0.08)",
                  border: "1px solid rgba(0,149,255,0.2)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "#0095FF" }}>
                  Applied
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold" style={{ color: "#0095FF", fontFamily: "Syne, sans-serif" }}>
                    {statusCounts.applied}
                  </p>
                  <p className="text-sm" style={{ color: "rgba(0,149,255,0.7)" }}>
                    ({stats.percentages.applied}%)
                  </p>
                </div>
              </div>

              {/* Interview */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(234,179,8,0.08)",
                  border: "1px solid rgba(234,179,8,0.2)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "#EAB308" }}>
                  Interview
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold" style={{ color: "#EAB308", fontFamily: "Syne, sans-serif" }}>
                    {statusCounts.interview}
                  </p>
                  <p className="text-sm" style={{ color: "rgba(234,179,8,0.7)" }}>
                    ({stats.percentages.interview}%)
                  </p>
                </div>
              </div>

              {/* Accepted */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "#22C55E" }}>
                  Accepted
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold" style={{ color: "#22C55E", fontFamily: "Syne, sans-serif" }}>
                    {statusCounts.accepted}
                  </p>
                  <p className="text-sm" style={{ color: "rgba(34,197,94,0.7)" }}>
                    ({stats.percentages.accepted}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Top Companies and Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Companies */}
              {stats.topCompanies.length > 0 && (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
                    Top Companies
                  </h3>
                  <div className="space-y-2">
                    {stats.topCompanies.map(({ company, count }) => (
                      <div key={company} className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                          {company}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: "rgba(255,138,0,0.12)",
                            color: "#FF8A00",
                          }}
                        >
                          {count} {count === 1 ? "app" : "apps"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Roles */}
              {stats.topRoles.length > 0 && (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
                    Top Roles
                  </h3>
                  <div className="space-y-2">
                    {stats.topRoles.map(({ role, count }) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="text-sm truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                          {role}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: "rgba(168,85,247,0.12)",
                            color: "#A855F7",
                          }}
                        >
                          {count} {count === 1 ? "app" : "apps"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Follow-up Reminders */}
        {showReminders && reminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div
              className="p-4 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell size={16} style={{ color: "#EAB308" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                    Follow-up Reminders
                  </h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(234,179,8,0.12)",
                      color: "#EAB308",
                    }}
                  >
                    {reminders.length}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowReminders(false)}
                  className="p-1 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  <X size={14} />
                </motion.button>
              </div>

              <div className="space-y-2">
                {/* Overdue reminders */}
                {overdueReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#EF4444" }}>
                        {reminder.jobTitle} at {reminder.companyName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(239,68,68,0.7)" }}>
                        Overdue by {Math.abs(reminder.daysUntil)} {Math.abs(reminder.daysUntil) === 1 ? "day" : "days"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(reminder)}
                        className="p-2 rounded-lg text-xs"
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#EF4444",
                        }}
                      >
                        Reschedule
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCompleteReminder(reminder.id)}
                        className="p-2 rounded-lg"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          border: "1px solid rgba(34,197,94,0.3)",
                          color: "#22C55E",
                        }}
                      >
                        <Check size={14} />
                      </motion.button>
                    </div>
                  </div>
                ))}

                {/* Upcoming reminders */}
                {upcomingReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      background: "rgba(234,179,8,0.08)",
                      border: "1px solid rgba(234,179,8,0.2)",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#EAB308" }}>
                        {reminder.jobTitle} at {reminder.companyName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(234,179,8,0.7)" }}>
                        {reminder.daysUntil === 0
                          ? "Today"
                          : `In ${reminder.daysUntil} ${reminder.daysUntil === 1 ? "day" : "days"}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(reminder)}
                        className="p-2 rounded-lg text-xs"
                        style={{
                          background: "rgba(234,179,8,0.12)",
                          border: "1px solid rgba(234,179,8,0.3)",
                          color: "#EAB308",
                        }}
                      >
                        Reschedule
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCompleteReminder(reminder.id)}
                        className="p-2 rounded-lg"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          border: "1px solid rgba(34,197,94,0.3)",
                          color: "#22C55E",
                        }}
                      >
                        <Check size={14} />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "applied", "interview", "rejected", "accepted"] as const).map((status) => (
            <motion.button
              key={status}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(status)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background:
                  filter === status
                    ? status === "all"
                      ? "rgba(255,138,0,0.15)"
                      : STATUS_COLORS[status].bg
                    : "rgba(255,255,255,0.03)",
                border:
                  filter === status
                    ? status === "all"
                      ? "1px solid rgba(255,138,0,0.35)"
                      : `1px solid ${STATUS_COLORS[status].border}`
                    : "1px solid rgba(255,255,255,0.08)",
                color:
                  filter === status
                    ? status === "all"
                      ? "#FF8A00"
                      : STATUS_COLORS[status].text
                    : "rgba(255,255,255,0.5)",
              }}
            >
              {status === "all" ? "All" : STATUS_LABELS[status]} ({statusCounts[status]})
            </motion.button>
          ))}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden md:block">
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-12 gap-4 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <button
                onClick={() => handleSort("jobTitle")}
                className="col-span-3 flex items-center gap-2 text-left text-xs font-semibold"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Job Title
                {sortBy === "jobTitle" &&
                  (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </button>
              <button
                onClick={() => handleSort("company")}
                className="col-span-2 flex items-center gap-2 text-left text-xs font-semibold"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Company
                {sortBy === "company" &&
                  (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </button>
              <button
                onClick={() => handleSort("date")}
                className="col-span-2 flex items-center gap-2 text-left text-xs font-semibold"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Date Applied
                {sortBy === "date" &&
                  (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </button>
              <button
                onClick={() => handleSort("status")}
                className="col-span-2 flex items-center gap-2 text-left text-xs font-semibold"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Status
                {sortBy === "status" &&
                  (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </button>
              <div className="col-span-3 text-xs font-semibold text-right" style={{ color: "rgba(255,255,255,0.7)" }}>
                Actions
              </div>
            </div>

            {/* Table body */}
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {filteredApplications.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    No applications found. Click "New Application" to get started.
                  </p>
                </div>
              ) : (
                filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="col-span-3">
                      <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                        {app.jobTitle}
                      </p>
                      {app.notes && (
                        <p className="text-xs mt-1 line-clamp-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {app.notes}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center">
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {app.companyName}
                      </p>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {app.applicationDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusUpdate(app.id, e.target.value as Application["status"])}
                        className="px-3 py-1 rounded-lg text-xs font-medium outline-none cursor-pointer"
                        style={{
                          background: STATUS_COLORS[app.status].bg,
                          border: `1px solid ${STATUS_COLORS[app.status].border}`,
                          color: STATUS_COLORS[app.status].text,
                        }}
                      >
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="rejected">Rejected</option>
                        <option value="accepted">Accepted</option>
                      </select>
                    </div>
                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(app)}
                        className="p-2 rounded-lg transition-colors"
                        style={{
                          background: "rgba(0,149,255,0.12)",
                          border: "1px solid rgba(0,149,255,0.3)",
                          color: "#0095FF",
                        }}
                      >
                        <Edit size={14} />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(app.id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#EF4444",
                        }}
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Card view */}
        <div className="md:hidden space-y-3">
          {filteredApplications.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                No applications found. Click "New Application" to get started.
              </p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                        {app.jobTitle}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {app.companyName}
                      </p>
                    </div>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value as Application["status"])}
                      className="px-3 py-1 rounded-lg text-xs font-medium outline-none"
                      style={{
                        background: STATUS_COLORS[app.status].bg,
                        border: `1px solid ${STATUS_COLORS[app.status].border}`,
                        color: STATUS_COLORS[app.status].text,
                      }}
                    >
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                      <option value="rejected">Rejected</option>
                      <option value="accepted">Accepted</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {app.applicationDate.toLocaleDateString()}
                      </span>
                    </div>
                    {app.followUpDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} style={{ color: "#EAB308" }} />
                        <span className="text-xs" style={{ color: "#EAB308" }}>
                          Follow-up: {app.followUpDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {app.notes && expandedMobile === app.id && (
                    <p className="text-xs mb-3 p-3 rounded-lg" style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.03)" }}>
                      {app.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    {app.notes && (
                      <button
                        onClick={() => setExpandedMobile(expandedMobile === app.id ? null : app.id)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        {expandedMobile === app.id ? "Hide Notes" : "Show Notes"}
                      </button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(app)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium"
                      style={{
                        background: "rgba(0,149,255,0.12)",
                        border: "1px solid rgba(0,149,255,0.3)",
                        color: "#0095FF",
                      }}
                    >
                      Edit
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(app.id)}
                      className="p-2 rounded-lg"
                      style={{
                        background: "rgba(239,68,68,0.12)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#EF4444",
                      }}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Application Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          className="max-w-lg"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.1)",
            color: "#1F2937",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#1F2937", fontFamily: "Syne, sans-serif" }}>
              {editingApp ? "Edit Application" : "New Application"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="jobTitle" className="text-sm" style={{ color: "#374151" }}>
                Job Title *
              </Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="e.g., Software Engineer Intern"
                className="mt-1"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#1F2937",
                }}
              />
            </div>

            <div>
              <Label htmlFor="companyName" className="text-sm" style={{ color: "#374151" }}>
                Company Name *
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g., Tech Corp"
                className="mt-1"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#1F2937",
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicationDate" className="text-sm" style={{ color: "#374151" }}>
                  Application Date
                </Label>
                <Input
                  id="applicationDate"
                  type="date"
                  value={formData.applicationDate}
                  onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                  className="mt-1"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.1)",
                    color: "#1F2937",
                    colorScheme: "light",
                  }}
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-sm" style={{ color: "#374151" }}>
                  Status
                </Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Application["status"] })}
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.1)",
                    color: "#1F2937",
                  }}
                >
                  <option value="applied" style={{ background: "#FFFFFF", color: "#1F2937" }}>Applied</option>
                  <option value="interview" style={{ background: "#FFFFFF", color: "#1F2937" }}>Interview</option>
                  <option value="rejected" style={{ background: "#FFFFFF", color: "#1F2937" }}>Rejected</option>
                  <option value="accepted" style={{ background: "#FFFFFF", color: "#1F2937" }}>Accepted</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="followUpDate" className="text-sm" style={{ color: "#374151" }}>
                Follow-up Date (Optional)
              </Label>
              <Input
                id="followUpDate"
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="mt-1"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#1F2937",
                  colorScheme: "light",
                }}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm" style={{ color: "#374151" }}>
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this application..."
                rows={4}
                className="mt-1"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#1F2937",
                }}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setIsFormOpen(false)}
                className="flex-1"
                style={{
                  background: "#F3F4F6",
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#374151",
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                style={{
                  background: "#FF8A00",
                  border: "1px solid #FF8A00",
                  color: "#FFFFFF",
                }}
              >
                {editingApp ? "Save Changes" : "Add Application"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
