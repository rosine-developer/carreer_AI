import { useState } from "react";
import { motion } from "framer-motion";
import { OnboardingData } from "./types";
import { ChevronRight, Plus, X } from "lucide-react";

interface OnboardingCardProps {
  onSubmit: (data: OnboardingData) => void;
}

const INTEREST_OPTIONS = [
  "Product Management",
  "Software Engineering",
  "Data Science",
  "UX Design",
  "Marketing",
  "Finance",
  "Research",
  "Operations",
  "Sales",
  "Entrepreneurship",
  "Consulting",
  "Healthcare",
];

const DEGREE_OPTIONS = [
  "Bachelor's",
  "Master's",
  "PhD",
  "Associate's",
  "Bootcamp / Self-taught",
  "Currently Enrolled",
];

export default function OnboardingCard({ onSubmit }: OnboardingCardProps) {
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else if (interests.length < 3) {
      setInterests([...interests, interest]);
    }
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !interests.includes(customInterest.trim()) && interests.length < 3) {
      setInterests([...interests, customInterest.trim()]);
      setCustomInterest("");
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!degree) newErrors.degree = "Please select your degree";
    if (!fieldOfStudy.trim()) newErrors.fieldOfStudy = "Please enter your field of study";
    if (interests.length === 0) newErrors.interests = "Please select at least one interest";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ degree, fieldOfStudy, interests });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mt-3 rounded-xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid #E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #F0F0F0", background: "#F8F8F8" }}>
        <span className="text-xs font-semibold" style={{ color: "#0095FF", letterSpacing: "0.05em" }}>
          PROFILE INTAKE — STEP 1 OF 1
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Degree */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "#111" }}>
            DEGREE LEVEL
          </label>
          <div className="flex flex-wrap gap-2">
            {DEGREE_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => { setDegree(d); setErrors((e) => ({ ...e, degree: "" })); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: degree === d ? "#0095FF" : "#F5F5F5",
                  border: degree === d ? "1px solid #0095FF" : "1px solid #E0E0E0",
                  color: degree === d ? "#FFFFFF" : "#333",
                }}
              >
                {d}
              </button>
            ))}
          </div>
          {errors.degree && <p className="text-xs mt-1.5" style={{ color: "#EF4444" }}>{errors.degree}</p>}
        </div>

        {/* Field of Study */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "#111" }}>
            FIELD OF STUDY
          </label>
          <input
            type="text"
            value={fieldOfStudy}
            onChange={(e) => { setFieldOfStudy(e.target.value); setErrors((err) => ({ ...err, fieldOfStudy: "" })); }}
            placeholder="e.g. Computer Science, Business Administration..."
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{
              background: "#FFFFFF",
              border: errors.fieldOfStudy ? "1px solid #EF4444" : "1px solid #D0D0D0",
              color: "#111",
              fontFamily: "Manrope, sans-serif",
            }}
            onFocus={(e) => { e.currentTarget.style.border = "2px solid #0095FF"; }}
            onBlur={(e) => { e.currentTarget.style.border = errors.fieldOfStudy ? "1px solid #EF4444" : "1px solid #D0D0D0"; }}
          />
          {errors.fieldOfStudy && <p className="text-xs mt-1.5" style={{ color: "#EF4444" }}>{errors.fieldOfStudy}</p>}
        </div>

        {/* Interests */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "#111" }}>
            TOP 3 WORK INTERESTS{" "}
            <span style={{ color: "#888" }}>({interests.length}/3 selected)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = interests.includes(interest);
              const disabled = !selected && interests.length >= 3;
              return (
                <button
                  key={interest}
                  onClick={() => { if (!disabled) { toggleInterest(interest); setErrors((e) => ({ ...e, interests: "" })); } }}
                  disabled={disabled}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: selected ? "#0095FF" : "#F5F5F5",
                    border: selected ? "1px solid #0095FF" : "1px solid #E0E0E0",
                    color: selected ? "#FFFFFF" : disabled ? "#BBB" : "#333",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {interest}
                </button>
              );
            })}
          </div>

          {/* Custom interest */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomInterest()}
              placeholder="Add custom interest..."
              className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
              style={{
                background: "#FFFFFF",
                border: "1px solid #D0D0D0",
                color: "#111",
                fontFamily: "Manrope, sans-serif",
              }}
              disabled={interests.length >= 3}
            />
            <button
              onClick={addCustomInterest}
              disabled={interests.length >= 3 || !customInterest.trim()}
              className="px-3 py-2 rounded-lg transition-all"
              style={{ background: "#0095FF", color: "#FFFFFF" }}
            >
              <Plus size={14} />
            </button>
          </div>

          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {interests.map((i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "#EBF5FF", border: "1px solid #C5E0FF", color: "#0095FF" }}
                >
                  {i}
                  <button onClick={() => setInterests(interests.filter((x) => x !== i))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {errors.interests && <p className="text-xs mt-1.5" style={{ color: "#EF4444" }}>{errors.interests}</p>}
        </div>

        {/* Submit */}
        <motion.button
          onClick={handleSubmit}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
          style={{ background: "#0095FF", color: "#FFFFFF" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#007ACC"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#0095FF"; }}
        >
          Analyze My Profile
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}



