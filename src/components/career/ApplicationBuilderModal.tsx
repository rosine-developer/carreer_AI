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
    const variations = ["I am excited to", "It is with great enthusiasm that I", "I am thrilled to"];
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
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 z-50 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E5E5",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              maxHeight: "calc(100vh - 64px)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: "1px solid #F0F0F0", background: "#FFFFFF" }}
            >
              <div>
                <h2 className="text-base font-bold" style={{ color: "#111", fontFamily: "Sora, sans-serif" }}>
                  Application Builder
                </h2>
                <p className="text-xs" style={{ color: "#888" }}>
                  {job.title} · {job.company}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRewrite}
                  disabled={rewriting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "#FFFFFF", border: "1px solid #E5E5E5", color: "#0095FF", opacity: rewriting ? 0.6 : 1 }}
                >
                  <RefreshCw size={12} className={rewriting ? "animate-spin" : ""} />
                  {rewriting ? "Rewriting..." : "AI Rewrite"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: copied ? "#F0FDF4" : "#FFFFFF",
                    border: copied ? "1px solid #BBF7D0" : "1px solid #E5E5E5",
                    color: copied ? "#16A34A" : "#555",
                  }}
                >
                  {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "#FFFFFF", border: "1px solid #E5E5E5", color: "#555" }}
                >
                  <Download size={12} />
                  Export
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleClose}
                  className="p-2 rounded-lg ml-1"
                  style={{ background: "#FFFFFF", border: "1px solid #E5E5E5", color: "#888" }}
                >
                  <X size={16} />
                </motion.button>
              </div>
            </div>

            {/* Split View */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left: Cover Letter Editor */}
              <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRight: "1px solid #F0F0F0" }}>
                <div className="px-5 py-3 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid #F0F0F0", background: "#FFFFFF" }}>
                  <Edit3 size={13} style={{ color: "#0095FF" }} />
                  <span className="text-xs font-semibold" style={{ color: "#0095FF" }}>
                    COVER LETTER — AI GENERATED
                  </span>
                  {rewriting && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 ml-auto" style={{ color: "#0095FF" }}>
                      <Sparkles size={11} className="animate-pulse" />
                      <span className="text-xs font-semibold" style={{ color: "#0095FF" }}>Rewriting...</span>
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
                      color: "#111",
                      fontFamily: "Sora, sans-serif",
                      fontSize: "0.85rem",
                      lineHeight: "1.75",
                      border: "none",
                    }}
                  />
                </div>
              </div>

              {/* Right: Job Description */}
              <div className="w-full md:w-80 lg:w-96 flex flex-col overflow-hidden shrink-0" style={{ background: "#FFFFFF" }}>
                <div className="px-5 py-3 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid #F0F0F0" }}>
                  <span className="text-xs font-semibold" style={{ color: "#0095FF" }}>TARGET ROLE</span>
                </div>
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {/* Job header */}
                  <div>
                    <h3 className="text-base font-bold" style={{ color: "#111", fontFamily: "Sora, sans-serif" }}>
                      {job.title}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: "#666" }}>
                      {job.company} · {job.location}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FFFFFF", border: "1px solid #E5E5E5", color: "#0095FF" }}>
                        {job.matchScore}% match
                      </span>
                      <span className="text-xs" style={{ color: "#888" }}>{job.salary}</span>
                    </div>
                  </div>

                  <div className="h-px" style={{ background: "#F0F0F0" }} />

                  {/* Description */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#888" }}>ROLE OVERVIEW</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#444" }}>{job.description}</p>
                  </div>

                  {/* Tags */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#888" }}>KEY SKILLS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-md" style={{ background: "#FFFFFF", border: "1px solid #E5E5E5", color: "#0095FF" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E5E5" }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#0095FF" }}>AI TIPS</p>
                    <ul className="space-y-2">
                      {["Mention specific company initiatives", "Quantify achievements with metrics", "Mirror keywords from the job description", "Keep to under 400 words"].map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-xs" style={{ color: "#444" }}>
                          <span style={{ color: "#0095FF", flexShrink: 0 }}>→</span>
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










