import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PreferenceTag } from "./types";
import { Plus, X, Sparkles } from "lucide-react";

interface PreferenceTagTrainerProps {
  tags: PreferenceTag[];
  onAddTag: (tag: PreferenceTag) => void;
  onRemoveTag: (id: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
}

const TAG_CATEGORIES = [
  { label: "Remote Work", category: "positive" as const },
  { label: "Leadership", category: "positive" as const },
  { label: "Creative", category: "positive" as const },
  { label: "High Growth", category: "positive" as const },
  { label: "Technical", category: "positive" as const },
  { label: "No Micromanagement", category: "positive" as const },
  { label: "Outdoors", category: "positive" as const },
  { label: "Flexible Hours", category: "positive" as const },
  { label: "Mentorship", category: "positive" as const },
  { label: "Travel Required", category: "neutral" as const },
  { label: "Startups", category: "positive" as const },
  { label: "Big Tech", category: "neutral" as const },
];

export default function PreferenceTagTrainer({
  tags,
  onAddTag,
  onRemoveTag,
  onUpdateWeight,
}: PreferenceTagTrainerProps) {
  const [customTag, setCustomTag] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addCustomTag = () => {
    if (!customTag.trim()) return;
    onAddTag({
      id: `tag-${Date.now()}`,
      label: customTag.trim(),
      weight: 1,
      category: "positive",
    });
    setCustomTag("");
  };

  const addSuggestedTag = (suggestion: (typeof TAG_CATEGORIES)[0]) => {
    if (tags.some((t) => t.label === suggestion.label)) return;
    onAddTag({
      id: `tag-${Date.now()}`,
      label: suggestion.label,
      weight: 1,
      category: suggestion.category,
    });
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: "#F5A623" }} />
          <span
            className="text-xs font-mono"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            PREFERENCE TRAINER
          </span>
        </div>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="text-xs transition-colors"
          style={{
            color: showSuggestions ? "#00D4C8" : "rgba(255,255,255,0.3)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          {showSuggestions ? "Hide suggestions" : "Browse tags"}
        </button>
      </div>

      {/* Existing tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <AnimatePresence>
            {tags.map((tag) => (
              <motion.div
                key={tag.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 rounded-full text-xs group"
                style={{
                  padding: "4px 10px 4px 12px",
                  background:
                    tag.category === "positive"
                      ? "rgba(0, 212, 200, 0.1)"
                      : tag.category === "negative"
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(255,255,255,0.06)",
                  border:
                    tag.category === "positive"
                      ? "1px solid rgba(0, 212, 200, 0.25)"
                      : tag.category === "negative"
                      ? "1px solid rgba(239, 68, 68, 0.25)"
                      : "1px solid rgba(255,255,255,0.1)",
                  color:
                    tag.category === "positive"
                      ? "#00D4C8"
                      : tag.category === "negative"
                      ? "#EF4444"
                      : "rgba(255,255,255,0.6)",
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                {/* Weight dots */}
                <span className="flex gap-0.5">
                  {[1, 2, 3].map((w) => (
                    <button
                      key={w}
                      onClick={() => onUpdateWeight(tag.id, w)}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{
                        background:
                          w <= tag.weight
                            ? tag.category === "positive"
                              ? "#00D4C8"
                              : "#F5A623"
                            : "rgba(255,255,255,0.15)",
                      }}
                    />
                  ))}
                </span>
                <span>{tag.label}</span>
                <button
                  onClick={() => onRemoveTag(tag.id)}
                  className="opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TAG_CATEGORIES.filter((s) => !tags.some((t) => t.label === s.label)).map(
                (suggestion) => (
                  <button
                    key={suggestion.label}
                    onClick={() => addSuggestedTag(suggestion)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px dashed rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    <Plus size={9} />
                    {suggestion.label}
                  </button>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom tag input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
          placeholder="Type a preference and press Enter..."
          className="flex-1 px-3 py-2 rounded-lg text-xs outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.65)",
            fontFamily: "Manrope, sans-serif",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "1px solid rgba(245, 166, 35, 0.3)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
          }}
        />
        <button
          onClick={addCustomTag}
          disabled={!customTag.trim()}
          className="px-3 rounded-lg text-xs transition-all"
          style={{
            background: "rgba(245, 166, 35, 0.1)",
            border: "1px solid rgba(245, 166, 35, 0.2)",
            color: "#F5A623",
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
