import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { JobCard, OpportunitySource } from "./types";
import { X, ExternalLink, Bookmark, BookmarkCheck, Building2 } from "lucide-react";
import { OPPORTUNITY_SOURCES } from "./data";

interface OpportunityDrawerProps {
  job: JobCard | null;
  isOpen: boolean;
  onClose: () => void;
}

const platformColors: Record<string, string> = {
  LinkedIn: "#0077B5",
  Indeed: "#003A9B",
  Wellfound: "#F76D02",
  Greenhouse: "#3CB371",
  Lever: "#2E4057",
};

export default function OpportunityDrawer({ job, isOpen, onClose }: OpportunityDrawerProps) {
  const [sources, setSources] = useState<OpportunitySource[]>(OPPORTUNITY_SOURCES);

  const toggleBookmark = (platform: string) => {
    setSources((prev) =>
      prev.map((s) =>
        s.platform === platform ? { ...s, bookmarked: !s.bookmarked } : s
      )
    );
  };

  return (
    <AnimatePresence>
      {isOpen && job && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm overflow-y-auto"
            style={{
              background: "#0E1117",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "-24px 0 80px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 px-5 py-4 flex items-center justify-between"
              style={{
                background: "#0E1117",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                zIndex: 10,
              }}
            >
              <div>
                <h2
                  className="text-base font-bold"
                  style={{ color: "rgba(255,255,255,0.9)", fontFamily: "Syne, sans-serif" }}
                >
                  Find Opportunity
                </h2>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Manrope, sans-serif" }}
                >
                  {job.title} at {job.company}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="p-2 rounded-lg transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Job Summary */}
            <div className="px-5 py-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(0, 212, 200, 0.04)",
                  border: "1px solid rgba(0, 212, 200, 0.12)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      background: "rgba(0, 212, 200, 0.1)",
                      border: "1px solid rgba(0, 212, 200, 0.2)",
                      color: "#00D4C8",
                      fontFamily: "Syne, sans-serif",
                    }}
                  >
                    {job.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: "rgba(255,255,255,0.85)", fontFamily: "Manrope, sans-serif" }}
                    >
                      {job.title}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Manrope, sans-serif" }}
                    >
                      {job.company} · {job.location}
                    </div>
                  </div>
                </div>
                <div
                  className="text-xs font-bold px-2 py-1 rounded-md inline-block"
                  style={{
                    background: "rgba(0, 212, 200, 0.1)",
                    color: "#00D4C8",
                    fontFamily: "Syne, sans-serif",
                  }}
                >
                  {job.matchScore}% MATCH
                </div>
              </div>
            </div>

            {/* Sources */}
            <div className="px-5 pb-6">
              <p
                className="text-xs font-mono mb-3"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                CURATED JOB BOARDS
              </p>
              <div className="space-y-3">
                {sources.map((source) => (
                  <motion.div
                    key={source.platform}
                    whileHover={{ scale: 1.01 }}
                    className="rounded-xl p-4 flex items-center gap-4"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    {/* Platform logo */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: `${platformColors[source.platform]}22`,
                        border: `1px solid ${platformColors[source.platform]}33`,
                        color: platformColors[source.platform] || "#fff",
                        fontFamily: "Syne, sans-serif",
                      }}
                    >
                      {source.logo}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-sm"
                        style={{
                          color: "rgba(255,255,255,0.8)",
                          fontFamily: "Manrope, sans-serif",
                        }}
                      >
                        {source.platform}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.3)", fontFamily: "Manrope, sans-serif" }}
                      >
                        {source.jobCount.toLocaleString()} listings
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleBookmark(source.platform)}
                        className="p-2 rounded-lg transition-colors"
                        style={{
                          color: source.bookmarked ? "#F5A623" : "rgba(255,255,255,0.25)",
                        }}
                      >
                        {source.bookmarked ? (
                          <BookmarkCheck size={15} />
                        ) : (
                          <Bookmark size={15} />
                        )}
                      </motion.button>
                      <motion.a
                        whileTap={{ scale: 0.95 }}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: "rgba(0, 212, 200, 0.1)",
                          border: "1px solid rgba(0, 212, 200, 0.2)",
                          color: "#00D4C8",
                          fontFamily: "Manrope, sans-serif",
                        }}
                      >
                        <ExternalLink size={11} />
                        Visit
                      </motion.a>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Company career page */}
              <div className="mt-4">
                <p
                  className="text-xs font-mono mb-3"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  DIRECT COMPANY PAGE
                </p>
                <motion.a
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  href={`https://careers.${job.company.toLowerCase().replace(/\s/g, "")}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{
                    background: "rgba(245, 166, 35, 0.05)",
                    border: "1px solid rgba(245, 166, 35, 0.15)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(245, 166, 35, 0.1)",
                      border: "1px solid rgba(245, 166, 35, 0.2)",
                    }}
                  >
                    <Building2 size={18} style={{ color: "#F5A623" }} />
                  </div>
                  <div className="flex-1">
                    <div
                      className="font-semibold text-sm"
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      {job.company} Careers
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.3)", fontFamily: "Manrope, sans-serif" }}
                    >
                      Apply directly at source
                    </div>
                  </div>
                  <ExternalLink size={14} style={{ color: "#F5A623", opacity: 0.6 }} />
                </motion.a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}






