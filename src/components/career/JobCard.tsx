import { motion } from "framer-motion";
import { JobCard as JobCardType } from "./types";
import { MapPin, DollarSign, Briefcase, ExternalLink, FileText, Wifi, FileEdit, Mail } from "lucide-react";

interface JobCardProps {
  job: JobCardType;
  onFindOpportunity: (job: JobCardType) => void;
  onApply: (job: JobCardType) => void;
  onBuildResume?: (job: JobCardType) => void;
  onWriteCoverLetter?: (job: JobCardType) => void;
  delay?: number;
}

export default function JobCard({
  job,
  onFindOpportunity,
  onApply,
  onBuildResume,
  onWriteCoverLetter,
  delay = 0,
}: JobCardProps) {
  const isDark = document.documentElement.classList.contains('dark');
  const bg = isDark ? "#1a1f2e" : "#FFFFFF";
  const border = isDark ? "#2a2f3e" : "#E5E5E5";
  const textPrimary = isDark ? "#f0f0f0" : "#111";
  const textSecondary = isDark ? "#b0b8cc" : "#666";
  const textMuted = isDark ? "#7a8499" : "#888";
  const iconColor = isDark ? "#555" : "#BBB";
  const btnSecBg = isDark ? "#1e2433" : "#FFFFFF";
  const btnSecColor = isDark ? "#b0b8cc" : "#555";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="rounded-xl overflow-hidden cursor-default"
      style={{ background: bg, border: `1px solid ${border}`, transition: "box-shadow 0.2s ease, transform 0.2s ease" }}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold truncate" style={{ color: textPrimary, fontFamily: "Sora, sans-serif" }}>
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm" style={{ color: textSecondary, fontFamily: "Sora, sans-serif" }}>
                {job.company}
              </span>
              {job.remote && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: bg, color: "#0095FF", border: `1px solid ${border}` }}>
                  <Wifi size={9} />
                  Remote
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} style={{ color: iconColor }} />
            <span className="text-xs" style={{ color: textMuted }}>{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign size={12} style={{ color: iconColor }} />
            <span className="text-xs" style={{ color: textMuted }}>{job.salary}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase size={12} style={{ color: iconColor }} />
            <span className="text-xs" style={{ color: textMuted }}>{job.type}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: textMuted }}>
          {job.description}
        </p>
      </div>

      <div className="px-4 pb-4 flex flex-wrap gap-1.5">
        {job.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-md" style={{ background: bg, border: `1px solid ${border}`, color: textMuted }}>
            {tag}
          </span>
        ))}
      </div>

      <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${border}` }}>
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (job.applyUrl && job.applyUrl !== '#') {
                window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
              } else {
                onFindOpportunity(job);
              }
            }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
            style={{ background: "#0095FF", color: "#FFFFFF" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#007ACC"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#0095FF"; }}
          >
            <ExternalLink size={12} />
            {job.applyUrl && job.applyUrl !== '#' ? 'Apply Now' : 'Find Opportunity'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onApply(job)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
            style={{ background: btnSecBg, color: "#0095FF", border: `1px solid ${border}` }}
          >
            <FileText size={12} />
            Help Me Apply
          </motion.button>
        </div>

        {(onBuildResume || onWriteCoverLetter) && (
          <div className="grid grid-cols-2 gap-2">
            {onBuildResume && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onBuildResume(job)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
                style={{ background: btnSecBg, border: `1px solid ${border}`, color: btnSecColor }}
              >
                <FileEdit size={11} />
                Build Resume
              </motion.button>
            )}
            {onWriteCoverLetter && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onWriteCoverLetter(job)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
                style={{ background: btnSecBg, border: `1px solid ${border}`, color: btnSecColor }}
              >
                <Mail size={11} />
                Cover Letter
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
