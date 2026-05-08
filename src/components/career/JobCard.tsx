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
  const matchColor = "rgba(255,255,255,0.7)";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      whileHover={{
        scale: 1.01,
        boxShadow: "0 4px 20px rgba(255,255,255,0.04)",
        y: -2,
      }}
      className="rounded-xl overflow-hidden cursor-default"
      style={{
        background: "#FFFFFF",
        border: "1px solid #EBEBEB",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-semibold truncate"
              style={{ color: "#111", fontFamily: "Manrope, sans-serif" }}
            >
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm" style={{ color: "#666", fontFamily: "Manrope, sans-serif" }}>
                {job.company}
              </span>
              {job.remote && (
                <span
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#EBF5FF", color: "#0095FF", border: "1px solid #C5E0FF" }}
                >
                  <Wifi size={9} />
                  Remote
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <div className="text-xl font-bold" style={{ color: "#FF8A00", fontFamily: "Syne, sans-serif", lineHeight: 1 }}>
              {job.matchScore}%
            </div>
            <span className="text-xs mt-0.5" style={{ color: "#BBB" }}>match</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} style={{ color: "#BBB" }} />
            <span className="text-xs" style={{ color: "#888" }}>{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign size={12} style={{ color: "#BBB" }} />
            <span className="text-xs" style={{ color: "#888" }}>{job.salary}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase size={12} style={{ color: "#BBB" }} />
            <span className="text-xs" style={{ color: "#888" }}>{job.type}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#888" }}>
          {job.description}
        </p>
      </div>

      <div className="px-4 pb-4 flex flex-wrap gap-1.5">
        {job.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-md"
            style={{ background: "#F5F5F5", border: "1px solid #E5E5E5", color: "#888" }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: "1px solid #F0F0F0" }}>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (job.applyUrl && job.applyUrl !== '#') {
                window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
              } else {
                onFindOpportunity(job);
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium"
            style={{ background: "#FF8A00", color: "#FFFFFF" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#E67A00"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#FF8A00"; }}
          >
            <ExternalLink size={12} />
            {job.applyUrl && job.applyUrl !== '#' ? 'Apply Now' : 'Find Opportunity'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onApply(job)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium"
            style={{ background: "#EBF5FF", color: "#0095FF", border: "1px solid #C5E0FF" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#D6ECFF"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#EBF5FF"; }}
          >
            <FileText size={12} />
            Help Me Apply
          </motion.button>
        </div>

        {(onBuildResume || onWriteCoverLetter) && (
          <div className="flex gap-2">
            {onBuildResume && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onBuildResume(job)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#F5F5F5", border: "1px solid #E5E5E5", color: "#555" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#EBEBEB"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#F5F5F5"; }}
              >
                <FileEdit size={11} />
                Build Resume
              </motion.button>
            )}
            {onWriteCoverLetter && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onWriteCoverLetter(job)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#F5F5F5", border: "1px solid #E5E5E5", color: "#555" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#EBEBEB"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#F5F5F5"; }}
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
