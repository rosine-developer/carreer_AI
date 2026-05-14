import { motion } from "framer-motion";
import { Message } from "./types";
import OnboardingCard from "./OnboardingCard";
import JobCard from "./JobCard";
import { OnboardingData, JobCard as JobCardType } from "./types";

function stripEmojis(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}]/gu, '').replace(/\s{2,}/g, ' ').trim();
}

function renderMarkdown(text: string): string {
  const clean = stripEmojis(text);
  return clean
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#111">$1</strong>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

interface ChatMessageProps {
  message: Message;
  onOnboardingSubmit?: (data: OnboardingData) => void;
  onFindOpportunity?: (job: JobCardType) => void;
  onApply?: (job: JobCardType) => void;
  onBuildResume?: (job: JobCardType) => void;
  onWriteCoverLetter?: (job: JobCardType) => void;
}

export default function ChatMessage({
  message,
  onOnboardingSubmit,
  onFindOpportunity,
  onApply,
  onBuildResume,
  onWriteCoverLetter,
}: ChatMessageProps) {
  const isAI = message.role === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex ${isAI ? "justify-start" : "justify-end"} mb-4`}
    >
      <div className={`${isAI ? "max-w-[85%]" : "max-w-[75%]"} w-full`}>
        {isAI ? (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "#FFFFFF", border: "1px solid #FFFFFF" }}
          >
            {/* AI label */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-medium" style={{ color: "#0095FF", fontFamily: "Sora, sans-serif" }}>
                CareerMind
              </span>
            </div>

            <div
              className="text-sm leading-relaxed"
              style={{ color: "#111", fontFamily: "Sora, sans-serif", fontSize: "0.875rem", fontWeight: 500, lineHeight: "1.7" }}
              dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(message.content)}</p>` }}
            />

            {message.isOnboarding && onOnboardingSubmit && (
              <OnboardingCard onSubmit={onOnboardingSubmit} />
            )}

            {message.jobCards && message.jobCards.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                {message.jobCards.map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    delay={i * 0.06}
                    onFindOpportunity={onFindOpportunity || (() => {})}
                    onApply={onApply || (() => {})}
                    onBuildResume={onBuildResume}
                    onWriteCoverLetter={onWriteCoverLetter}
                  />
                ))}
              </div>
            )}

            <div className="mt-2 flex justify-end">
              <span className="text-xs" style={{ color: "#BBB" }}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "#0095FF", border: "none" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#FFFFFF", fontFamily: "Sora, sans-serif", fontWeight: 500 }}>
              {message.content}
            </p>
            <div className="mt-2 flex justify-end">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}














