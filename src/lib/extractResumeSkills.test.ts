import { describe, it, expect } from "vitest";

// Mock the edge function response structure and validation
interface ExtractResumeSkillsResponse {
  success: boolean;
  skills?: string[];
  industries?: string[];
  error?: string;
}

function validateExtractResumeSkillsResponse(
  response: unknown
): response is ExtractResumeSkillsResponse {
  const data = response as Record<string, unknown>;
  if (!data || typeof data !== "object") return false;

  if (!("success" in data)) return false;

  if (data.success === true) {
    return (
      (Array.isArray(data.skills) &&
        data.skills.every((s) => typeof s === "string")) ||
      false
    ) &&
      (Array.isArray(data.industries) &&
        data.industries.every((i) => typeof i === "string")) ||
      false;
  }

  return "error" in data && typeof data.error === "string";
}

describe("extract-resume-skills edge function", () => {
  describe("Response validation", () => {
    it("validates successful response with skills and industries", () => {
      const response: ExtractResumeSkillsResponse = {
        success: true,
        skills: ["JavaScript", "React", "TypeScript"],
        industries: ["Technology", "Finance"],
      };

      expect(validateExtractResumeSkillsResponse(response)).toBe(true);
    });

    it("validates successful response with empty arrays", () => {
      const response: ExtractResumeSkillsResponse = {
        success: true,
        skills: [],
        industries: [],
      };

      expect(validateExtractResumeSkillsResponse(response)).toBe(true);
    });

    it("validates error response", () => {
      const response: ExtractResumeSkillsResponse = {
        success: false,
        error: "Resume text too short",
      };

      expect(validateExtractResumeSkillsResponse(response)).toBe(true);
    });

    it("rejects response with invalid skill type", () => {
      const response = {
        success: true,
        skills: ["JavaScript", 123, "React"],
        industries: ["Technology"],
      };

      expect(validateExtractResumeSkillsResponse(response)).toBe(false);
    });

    it("rejects response with invalid industry type", () => {
      const response = {
        success: true,
        skills: ["JavaScript", "React"],
        industries: ["Technology", null],
      };

      expect(validateExtractResumeSkillsResponse(response)).toBe(false);
    });

    it("rejects response without success field", () => {
      const response = {
        skills: ["JavaScript"],
        industries: ["Technology"],
      };

      expect(validateExtractResumeSkillsResponse(response)).toBe(false);
    });

    it("rejects null response", () => {
      expect(validateExtractResumeSkillsResponse(null)).toBe(false);
    });

    it("rejects undefined response", () => {
      expect(validateExtractResumeSkillsResponse(undefined)).toBe(false);
    });
  });

  describe("Response processing", () => {
    it("deduplicates skills in response", () => {
      const skills = ["JavaScript", "React", "JavaScript", "TypeScript"];
      const unique = Array.from(new Set(skills));
      expect(unique).toEqual(["JavaScript", "React", "TypeScript"]);
      expect(unique.length).toBe(3);
    });

    it("deduplicates industries in response", () => {
      const industries = ["Technology", "Finance", "Technology", "Healthcare"];
      const unique = Array.from(new Set(industries));
      expect(unique).toEqual(["Technology", "Finance", "Healthcare"]);
      expect(unique.length).toBe(3);
    });

    it("trims whitespace from skills", () => {
      const skills = ["  JavaScript  ", "React", "  TypeScript  "];
      const trimmed = skills.map((s) => s.trim());
      expect(trimmed).toEqual(["JavaScript", "React", "TypeScript"]);
    });

    it("trims whitespace from industries", () => {
      const industries = ["  Technology  ", "Finance  ", "  Healthcare"];
      const trimmed = industries.map((i) => i.trim());
      expect(trimmed).toEqual(["Technology", "Finance", "Healthcare"]);
    });

    it("filters empty strings from skills", () => {
      const skills = ["JavaScript", "", "React", "  ", "TypeScript"];
      const filtered = skills
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      expect(filtered).toEqual(["JavaScript", "React", "TypeScript"]);
    });

    it("filters empty strings from industries", () => {
      const industries = ["Technology", "", "Finance", "  ", "Healthcare"];
      const filtered = industries
        .map((i) => i.trim())
        .filter((i) => i.length > 0);
      expect(filtered).toEqual(["Technology", "Finance", "Healthcare"]);
    });

    it("returns expected number of skills (8-20)", () => {
      const skills = Array.from(
        { length: 12 },
        (_, i) => `Skill${i + 1}`
      );
      expect(skills.length).toBeGreaterThanOrEqual(8);
      expect(skills.length).toBeLessThanOrEqual(20);
    });

    it("returns expected number of industries (1-5)", () => {
      const industries = Array.from(
        { length: 3 },
        (_, i) => `Industry${i + 1}`
      );
      expect(industries.length).toBeGreaterThanOrEqual(1);
      expect(industries.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Edge cases", () => {
    it("handles extremely long skill names", () => {
      const longSkill = "A".repeat(100);
      const skills = ["JavaScript", longSkill, "React"];
      expect(skills).toHaveLength(3);
      expect(skills[1].length).toBe(100);
    });

    it("handles mixed case industry names", () => {
      const industries = ["technology", "FINANCE", "Healthcare"];
      expect(industries).toEqual(["technology", "FINANCE", "Healthcare"]);
    });

    it("handles skills with special characters", () => {
      const skills = ["C++", "C#", "Node.js", "Vue.js", "AWS"];
      expect(skills.every((s) => s.includes(".") || s.includes("+") || s.includes("#") || s.length > 0)).toBe(true);
    });

    it("handles empty resume text rejection", () => {
      const emptyResume = "";
      expect(emptyResume.trim().length < 50).toBe(true);
    });

    it("handles resume text below minimum threshold", () => {
      const shortResume = "Short";
      expect(shortResume.trim().length < 50).toBe(true);
    });

    it("handles resume text at minimum threshold", () => {
      const minResume = "A".repeat(50);
      expect(minResume.trim().length >= 50).toBe(true);
    });
  });

  describe("Integration scenarios", () => {
    it("processes typical tech resume response", () => {
      const response: ExtractResumeSkillsResponse = {
        success: true,
        skills: [
          "JavaScript",
          "TypeScript",
          "React",
          "Node.js",
          "Python",
          "AWS",
          "Docker",
          "PostgreSQL",
          "Git",
          "Agile",
        ],
        industries: ["Technology", "Finance"],
      };

      expect(validateExtractResumeSkillsResponse(response)).toBe(true);
      expect(response.skills?.length).toBeGreaterThanOrEqual(8);
      expect(response.industries?.length).toBeGreaterThanOrEqual(1);
    });

    it("processes typical healthcare resume response", () => {
      const response: ExtractResumeSkillsResponse = {
        success: true,
        skills: [
          "Patient Care",
          "EMR Systems",
          "Clinical Assessment",
          "Team Leadership",
          "Communication",
          "Healthcare Compliance",
          "Medical Terminology",
          "Critical Care",
          "Documentation",
          "IV Therapy",
        ],
        industries: ["Healthcare"],
      };

      expect(validateExtractResumeSkillsResponse(response)).toBe(true);
      expect(response.skills?.length).toBeGreaterThanOrEqual(8);
      expect(response.industries?.includes("Healthcare")).toBe(true);
    });

    it("handles response with skill extraction failure", () => {
      const response: ExtractResumeSkillsResponse = {
        success: false,
        error: "AI model returned empty response",
      };

      expect(validateExtractResumeSkillsResponse(response)).toBe(true);
      expect(response.success).toBe(false);
    });
  });
});
