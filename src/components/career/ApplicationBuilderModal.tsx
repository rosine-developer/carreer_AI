import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { JobCard, OnboardingData } from "./types";
import { X, Copy, Download, RefreshCw, CheckCheck, Edit3, Sparkles } from "lucide-react";
import { generateCoverLetter } from "./data";

interface ApplicationBuilderModalProps {
  job: JobCard | null;
  isOpen: boolean;
  onClose: () => void;
  onboardingData?: OnboardingData | null;
}

export default function ApplicationBuilderModal({
  job,
  isOpen,
  onClose,
  onboardingData,
}: ApplicationBuilderModalProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize cover letter when job changes
  const initCoverLetter = (currentJob: JobCard) => {
    setCoverLetter(generateCoverLetter(currentJob, onboardingData));
  };

  if (job && isOpen && !coverLetter) {
    initCoverLetter(job);
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRewrite = async () => {
    if (!job) return;
    setRewriting(true);
    await new Promise((r) => setTimeout(r, 1200));
    // Slightly vary the cover letter
    const variations = [
      "I am excited to",
      "It is with great enthusiasm that I",
      "I am thrilled to",
    ];
    const variation = variations[Math.floor(Math.random() * variations.length)];
    setCoverLetter((prev) => prev.replace("I am writing to express my strong interest", variation));
    setRewriting(false);
  };

  const handleExport = () => {
    if (!job) return;
    const blob = new Blob([coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${job.company.toLowerCase()}-${job.title.toLowerCase().replace(/\s/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setCoverLetter("");
    onClose();
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
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 z-50 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "#0E1117",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              maxHeight: "calc(100vh - 64px)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <div>
                  <h2
                    className="text-base font-bold"
                    style={{ color: "rgba(255,255,255,0.9)", fontFamily: "Syne, sans-serif" }}
                  >
                    Application Builder
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Manrope, sans-serif" }}
                  >
                    {job.title} · {job.company}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRewrite}
                  disabled={rewriting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: "rgba(245, 166, 35, 0.08)",
                    border: "1px solid rgba(245, 166, 35, 0.2)",
                    color: "#F5A623",
                    fontFamily: "Manrope, sans-serif",
                    opacity: rewriting ? 0.6 : 1,
                  }}
                >
                  <RefreshCw size={12} className={rewriting ? "animate-spin" : ""} />
                  {rewriting ? "Rewriting..." : "AI Rewrite"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: copied ? "rgba(0, 212, 200, 0.15)" : "rgba(255,255,255,0.05)",
                    border: copied
                      ? "1px solid rgba(0, 212, 200, 0.3)"
                      : "1px solid rgba(255,255,255,0.1)",
                    color: copied ? "#00D4C8" : "rgba(255,255,255,0.6)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  <Download size={12} />
                  Export
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleClose}
                  className="p-2 rounded-lg ml-2 transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  <X size={16} />
                </motion.button>
              </div>
            </div>

            {/* Split View */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left: Cover Letter Editor */}
              <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
                <div
                  className="px-5 py-3 flex items-center gap-2 shrink-0"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <Edit3 size={13} style={{ color: "#00D4C8" }} />
                  <span
                    className="text-xs font-mono"
                    style={{ color: "#00D4C8" }}
                  >
                    COVER LETTER — AI GENERATED
                  </span>
                  {rewriting && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1.5 ml-auto"
                      style={{ color: "#F5A623" }}
                    >
                      <Sparkles size={11} className="animate-pulse" />
                      <span className="text-xs font-mono" style={{ color: "#F5A623" }}>
                        Rewriting...
                      </span>
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 p-5 overflow-y-auto">
                  <textarea
                    ref={textAreaRef}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full h-full min-h-[400px] resize-none outline-none"
                    style={{
                      background: "transparent",
                      color: "rgba(255,255,255,0.75)",
                      fontFamily: "IBM Plex Mono, monospace",
                      fontSize: "0.78rem",
                      lineHeight: "1.75",
                      border: "none",
                    }}
                  />
                </div>
              </div>

              {/* Right: Job Description */}
              <div className="w-full md:w-80 lg:w-96 flex flex-col overflow-hidden shrink-0">
                <div
                  className="px-5 py-3 flex items-center gap-2 shrink-0"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#F5A623" }}
                  />
                  <span
                    className="text-xs font-mono"
                    style={{ color: "#F5A623" }}
                  >
                    TARGET ROLE
                  </span>
                </div>
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {/* Job header */}
                  <div>
                    <h3
                      className="text-base font-bold"
                      style={{ color: "rgba(255,255,255,0.9)", fontFamily: "Syne, sans-serif" }}
                    >
                      {job.title}
                    </h3>
                    <p
                      className="text-sm mt-1"
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      {job.company} · {job.location}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(0,212,200,0.08)",
                          border: "1px solid rgba(0,212,200,0.2)",
                          color: "#00D4C8",
                          fontFamily: "Manrope, sans-serif",
                        }}
                      >
                        {job.matchScore}% match
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.3)", fontFamily: "Manrope, sans-serif" }}
                      >
                        {job.salary}
                      </span>
                    </div>
                  </div>

                  <div
                    className="h-px"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  />

                  {/* Description */}
                  <div>
                    <p
                      className="text-xs font-mono mb-2"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      ROLE OVERVIEW
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      {job.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div>
                    <p
                      className="text-xs font-mono mb-2"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      KEY SKILLS
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 rounded-md"
                          style={{
                            background: "rgba(245, 166, 35, 0.08)",
                            border: "1px solid rgba(245, 166, 35, 0.18)",
                            color: "#F5A623",
                            fontFamily: "Manrope, sans-serif",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "rgba(0, 212, 200, 0.04)",
                      border: "1px solid rgba(0, 212, 200, 0.1)",
                    }}
                  >
                    <p
                      className="text-xs font-mono mb-2"
                      style={{ color: "#00D4C8" }}
                    >
                      AI TIPS
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Mention specific company initiatives",
                        "Quantify achievements with metrics",
                        "Mirror keywords from the job description",
                        "Keep to under 400 words",
                      ].map((tip) => (
                        <li
                          key={tip}
                          className="flex items-start gap-2 text-xs"
                          style={{
                            color: "rgba(255,255,255,0.45)",
                            fontFamily: "Manrope, sans-serif",
                          }}
                        >
                          <span style={{ color: "#00D4C8", flexShrink: 0 }}>→</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


