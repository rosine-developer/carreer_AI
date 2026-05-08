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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-3 rounded-xl overflow-hidden"
      style={{
        background: "rgba(0, 212, 200, 0.04)",
        border: "1px solid rgba(0, 212, 200, 0.2)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(0, 212, 200, 0.1)" }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: "#00D4C8", boxShadow: "0 0 8px #00D4C8" }}
        />
        <span className="text-xs font-mono" style={{ color: "#00D4C8" }}>
          PROFILE INTAKE — STEP 1 OF 1
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Degree */}
        <div>
          <label
            className="block text-xs font-mono mb-2"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            DEGREE LEVEL
          </label>
          <div className="flex flex-wrap gap-2">
            {DEGREE_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDegree(d);
                  setErrors((e) => ({ ...e, degree: "" }));
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200"
                style={{
                  background:
                    degree === d ? "rgba(0, 212, 200, 0.2)" : "rgba(255,255,255,0.04)",
                  border:
                    degree === d
                      ? "1px solid rgba(0, 212, 200, 0.6)"
                      : "1px solid rgba(255,255,255,0.08)",
                  color: degree === d ? "#00D4C8" : "rgba(255,255,255,0.6)",
                }}
              >
                {d}
              </button>
            ))}
          </div>
          {errors.degree && (
            <p className="text-xs mt-1.5" style={{ color: "#F5A623" }}>
              {errors.degree}
            </p>
          )}
        </div>

        {/* Field of Study */}
        <div>
          <label
            className="block text-xs font-mono mb-2"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            FIELD OF STUDY
          </label>
          <input
            type="text"
            value={fieldOfStudy}
            onChange={(e) => {
              setFieldOfStudy(e.target.value);
              setErrors((err) => ({ ...err, fieldOfStudy: "" }));
            }}
            placeholder="e.g. Computer Science, Business Administration..."
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: errors.fieldOfStudy
                ? "1px solid rgba(245, 166, 35, 0.6)"
                : "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.85)",
              fontFamily: "Manrope, sans-serif",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "1px solid rgba(0, 212, 200, 0.5)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 212, 200, 0.06)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = errors.fieldOfStudy
                ? "1px solid rgba(245, 166, 35, 0.6)"
                : "1px solid rgba(255,255,255,0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {errors.fieldOfStudy && (
            <p className="text-xs mt-1.5" style={{ color: "#F5A623" }}>
              {errors.fieldOfStudy}
            </p>
          )}
        </div>

        {/* Interests */}
        <div>
          <label
            className="block text-xs font-mono mb-2"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            TOP 3 WORK INTERESTS{" "}
            <span style={{ color: "rgba(255,255,255,0.3)" }}>
              ({interests.length}/3 selected)
            </span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = interests.includes(interest);
              const disabled = !selected && interests.length >= 3;
              return (
                <button
                  key={interest}
                  onClick={() => {
                    if (!disabled) {
                      toggleInterest(interest);
                      setErrors((e) => ({ ...e, interests: "" }));
                    }
                  }}
                  disabled={disabled}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
                  style={{
                    background: selected
                      ? "rgba(245, 166, 35, 0.15)"
                      : "rgba(255,255,255,0.04)",
                    border: selected
                      ? "1px solid rgba(245, 166, 35, 0.5)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: selected
                      ? "#F5A623"
                      : disabled
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.6)",
                    fontFamily: "Manrope, sans-serif",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {interest}
                </button>
              );
            })}
          </div>

          {/* Custom interest input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomInterest()}
              placeholder="Add custom interest..."
              className="flex-1 px-3 py-2 rounded-lg text-xs outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "Manrope, sans-serif",
              }}
              disabled={interests.length >= 3}
            />
            <button
              onClick={addCustomInterest}
              disabled={interests.length >= 3 || !customInterest.trim()}
              className="px-3 py-2 rounded-lg transition-all"
              style={{
                background: "rgba(0, 212, 200, 0.1)",
                border: "1px solid rgba(0, 212, 200, 0.2)",
                color: "#00D4C8",
              }}
            >
              <Plus size={14} />
            </button>
          </div>

          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {interests.map((i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(245, 166, 35, 0.1)",
                    border: "1px solid rgba(245, 166, 35, 0.3)",
                    color: "#F5A623",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  {i}
                  <button
                    onClick={() =>
                      setInterests(interests.filter((x) => x !== i))
                    }
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {errors.interests && (
            <p className="text-xs mt-1.5" style={{ color: "#F5A623" }}>
              {errors.interests}
            </p>
          )}
        </div>

        {/* Submit */}
        <motion.button
          onClick={handleSubmit}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,200,0.2), rgba(0,212,200,0.1))",
            border: "1px solid rgba(0, 212, 200, 0.4)",
            color: "#00D4C8",
            fontFamily: "Manrope, sans-serif",
            boxShadow: "0 0 20px rgba(0, 212, 200, 0.1)",
          }}
        >
          Analyze My Profile
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}
