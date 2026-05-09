import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, User, FileText, Zap, Rocket, X, PenLine } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const EXPERIENCE_OPTIONS = ["0-1", "2-4", "5-9", "10-14", "15+"];
const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "AWS", "Docker",
  "Project Management", "Data Analysis", "Marketing", "Sales", "Design", "Leadership",
  "Communication", "Problem Solving", "Excel", "Agile", "Machine Learning", "DevOps",
];
const COMMON_INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "Manufacturing",
  "Retail", "Consulting", "Government", "Nonprofit", "Energy", "Media",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const [step, setStepRaw] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const setStep = useCallback((s: number | ((prev: number) => number)) => {
    setStepRaw((prev) => {
      const next = typeof s === "function" ? (s as (p: number) => number)(prev) : s;
      setMaxStep((m) => Math.max(m, next));
      return next;
    });
  }, []);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [experience, setExperience] = useState("");

  // Step 2 fields
  const [resumeText, setResumeText] = useState("");

  // Step 3 fields (Story 1.3: merged skills + master cover letter)
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [extractingSkills, setExtractingSkills] = useState(false);
  const [extractedFromText, setExtractedFromText] = useState<string>("");

  // Step 4 fields (Story 1.3: master cover letter)
  const [masterCoverLetter, setMasterCoverLetter] = useState("");

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const toggleSkill = (skill: string) => {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  };

  const addCustomSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setSkillInput("");
    }
  };

  const toggleIndustry = (ind: string) => {
    setIndustries((prev) => prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]);
  };

  const handleNext = useCallback(async () => {
    if (step === 2 && resumeText.trim().length >= 50 && resumeText !== extractedFromText) {
      setExtractingSkills(true);
      try {
        const { data, error } = await supabase.functions.invoke("extract-resume-skills", {
          body: { resumeText },
        });
        if (!error && data?.success && Array.isArray(data.skills)) {
          const extracted: string[] = data.skills;
          setExtractedSkills(extracted);
          setExtractedFromText(resumeText);
          setSkills((prev) => Array.from(new Set([...prev, ...extracted])));
        }
      } catch (e) {
        console.error("Skill extraction failed:", e);
      } finally {
        setExtractingSkills(false);
      }
    }
    setStep((s) => s + 1);
  }, [step, resumeText, extractedFromText]);

  const handleComplete = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const completedAt = new Date().toISOString();
    const profilePayload = {
      id: user.id,
      first_name: firstName || null,
      last_name: lastName || null,
      years_experience: experience || null,
      resume_text: resumeText || null,
      key_skills: skills.length > 0 ? skills : null,
      target_industries: industries.length > 0 ? industries : null,
      master_cover_letter: masterCoverLetter || null,
      onboarding_completed_at: completedAt,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });
    setLoading(false);
    if (error) {
      toast.error("Failed to save profile: " + error.message);
    } else {
      toast.success("Welcome aboard! Your profile is set up.");
      queryClient.setQueryData(["profile_check", user.id], { onboarding_completed_at: completedAt });
      await queryClient.invalidateQueries({ queryKey: ["profile_check", user.id] });
      navigate("/applications");
    }
  }, [user, firstName, lastName, experience, resumeText, skills, industries, masterCoverLetter, navigate, queryClient]);

  const handleSkip = async () => {
    if (!user) return;
    const completedAt = new Date().toISOString();
    await supabase
      .from("profiles")
      .upsert({ id: user.id, onboarding_completed_at: completedAt }, { onConflict: "id" });
    queryClient.setQueryData(["profile_check", user.id], { onboarding_completed_at: completedAt });
    await queryClient.invalidateQueries({ queryKey: ["profile_check", user.id] });
    navigate("/applications");
  };

  const stepIcons = [
    <User className="h-4 w-4" />,
    <FileText className="h-4 w-4" />,
    <Zap className="h-4 w-4" />,
    <PenLine className="h-4 w-4" />,
    <Rocket className="h-4 w-4" />,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg border-border relative">
        {(import.meta.env.DEV || /lovableproject\.com$|lovable\.app$/.test(window.location.hostname)) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="absolute top-3 right-3 text-xs text-muted-foreground hover:text-foreground"
          >
            Sign out (dev)
          </Button>
        )}
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <BrandLogo iconSize="2em" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">Set Up Your Profile</CardTitle>
          <CardDescription>Step {step} of {totalSteps}</CardDescription>
          <div className="flex items-center justify-center pt-1">
            {[1, 2, 3, 4, 5].map((s, idx) => {
              const isNavigable = s <= maxStep;
              return (
              <div key={s} className="flex items-center">
                <button
                  type="button"
                  onClick={() => isNavigable && setStep(s)}
                  disabled={!isNavigable}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s <= maxStep
                      ? "bg-primary/20 text-primary hover:bg-primary/30"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  } ${isNavigable ? "cursor-pointer" : ""}`}
                  aria-current={s === step ? "step" : undefined}
                  aria-label={`Go to step ${s}`}
                >
                  {stepIcons[s - 1]}
                </button>
                {idx < 4 && (
                  <div
                    className={`h-0.5 w-6 mx-1 transition-colors ${
                      s < maxStep ? "bg-primary/40" : "bg-muted"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-1.5" />
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Step 1: Name & Experience */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Years of Experience</Label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o} years</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Resume */}
          {step === 2 && (
            <div className="space-y-3">
              <Label>Paste Your Resume Text</Label>
              <Textarea
                placeholder="Paste your resume content here... We'll use this to personalize your generated materials."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Copy all text from your current resume and paste it here. This helps us tailor documents to your experience.
              </p>
            </div>
          )}

          {/* Step 3: Skills & Industries */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Key Skills</Label>
                {extractedSkills.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    We pre-selected {extractedSkills.length} skills extracted from your resume. Adjust as needed.
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {(extractedSkills.length > 0 ? extractedSkills : COMMON_SKILLS).map((s) => (
                    <Badge
                      key={s}
                      variant={skills.includes(s) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleSkill(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add custom skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                    className="text-sm"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addCustomSkill}>Add</Button>
                </div>
                {skills.filter((s) => !(extractedSkills.length > 0 ? extractedSkills : COMMON_SKILLS).includes(s)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {skills.filter((s) => !(extractedSkills.length > 0 ? extractedSkills : COMMON_SKILLS).includes(s)).map((s) => (
                      <Badge key={s} variant="default" className="text-xs gap-1">
                        {s} <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => toggleSkill(s)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Target Industries</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_INDUSTRIES.map((ind) => (
                    <Badge
                      key={ind}
                      variant={industries.includes(ind) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleIndustry(ind)}
                    >
                      {ind}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Story 1.3: Step 4: Master Cover Letter */}
          {step === 4 && (
            <div className="space-y-3">
              <Label>Master Cover Letter <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                placeholder="Paste your best cover letter here. We'll use this as a style reference when generating tailored cover letters for each application."
                value={masterCoverLetter}
                onChange={(e) => setMasterCoverLetter(e.target.value)}
                rows={10}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This is your "gold standard" cover letter. We'll match its tone, structure, and voice when creating new ones.
              </p>
            </div>
          )}

          {/* Step 5: Ready */}
          {step === 5 && (
            <div className="text-center space-y-4 py-4">
              <Rocket className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold text-foreground">You're all set!</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Your profile is ready. Start by creating your first job application.
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {step > 1 ? (
                <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                  Skip for now
                </Button>
              )}
            </div>
            <div>
              {step < totalSteps ? (
                <Button size="sm" onClick={handleNext} disabled={extractingSkills} className="gap-1">
                  {extractingSkills ? "Extracting…" : step === 4 && !masterCoverLetter ? "Skip" : "Next"} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleComplete} disabled={loading} className="gap-1">
                  <Rocket className="h-3.5 w-3.5" /> Get Started
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
