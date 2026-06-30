import { useState, useCallback, useMemo, useRef } from "react";
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
import { ArrowRight, ArrowLeft, User, FileText, Zap, Rocket, X, PenLine, Upload, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [resumeInputMode, setResumeInputMode] = useState<"upload" | "paste">("paste");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setUploadProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string)?.split(",")[1];
        const { data, error } = await supabase.functions.invoke("extract-resume-text", {
          body: { fileName: file.name, fileType: file.type, fileData: base64 },
        });
        if (!error && data?.text) {
          setResumeText(data.text);
          toast.success("Resume text extracted successfully!");
        } else {
          toast.error("Could not extract text from this file. Try pasting your resume instead.");
        }
        setUploadProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to process file. Try pasting your resume instead.");
      setUploadProcessing(false);
    }
  };

  // Step 3 fields (Story 1.3: merged skills + master cover letter)
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [industryInput, setIndustryInput] = useState("");
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [extractedIndustries, setExtractedIndustries] = useState<string[]>([]);
  const [extractingSkills, setExtractingSkills] = useState(false);
  const [extractedFromText, setExtractedFromText] = useState<string>("");

  // Step 4 fields (Story 1.3: master cover letter)
  const [masterCoverLetter, setMasterCoverLetter] = useState("");
  const [coverLetterInputMode, setCoverLetterInputMode] = useState<"upload" | "paste">("paste");
  const [coverLetterFileName, setCoverLetterFileName] = useState("");
  const [coverLetterUploadProcessing, setCoverLetterUploadProcessing] = useState(false);
  const coverLetterFileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverLetterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverLetterFileName(file.name);
    setCoverLetterUploadProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string)?.split(",")[1];
        const { data, error } = await supabase.functions.invoke("extract-resume-text", {
          body: { fileName: file.name, fileType: file.type, fileData: base64 },
        });
        if (!error && data?.text) {
          setMasterCoverLetter(data.text);
          toast.success("Cover letter text extracted successfully!");
        } else {
          toast.error("Could not extract text from this file. Try pasting your cover letter instead.");
        }
        setCoverLetterUploadProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to process file. Try pasting your cover letter instead.");
      setCoverLetterUploadProcessing(false);
    }
  };

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

  const addCustomIndustry = () => {
    const trimmed = industryInput.trim();
    if (trimmed && !industries.includes(trimmed)) {
      setIndustries((prev) => [...prev, trimmed]);
      setIndustryInput("");
    }
  };

  const handleNext = useCallback(async () => {
    if (step === 2 && resumeText.trim().length >= 50 && resumeText !== extractedFromText) {
      setExtractingSkills(true);
      try {
        const { data, error } = await supabase.functions.invoke("extract-resume-skills", {
          body: { resumeText },
        });
        if (!error && data?.success && Array.isArray(data.skills)) {
          setExtractedSkills(data.skills);
          setExtractedFromText(resumeText);
          setSkills((prev) => Array.from(new Set([...prev, ...data.skills])));
          if (Array.isArray(data.industries) && data.industries.length > 0) {
            setExtractedIndustries(data.industries);
            setIndustries((prev) => Array.from(new Set([...prev, ...data.industries])));
          }
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

  const handleFirstTimeJobSeeker = async () => {
    if (!user) return;
    setLoading(true);
    const completedAt = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, first_name: firstName || null, last_name: lastName || null, years_experience: experience || null, onboarding_completed_at: completedAt },
        { onConflict: "id" }
      );
    setLoading(false);
    if (error) {
      toast.error("Failed to save profile: " + error.message);
      return;
    }
    queryClient.setQueryData(["profile_check", user.id], { onboarding_completed_at: completedAt });
    await queryClient.invalidateQueries({ queryKey: ["profile_check", user.id] });
    navigate("/build-my-resume");
  };

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
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Tabs value={resumeInputMode} onValueChange={(v) => setResumeInputMode(v as "upload" | "paste")}>
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1 gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Upload Resume
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="flex-1 gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Paste Resume Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-3 mt-3">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 gap-3 text-center">
                    {uploadedFileName ? (
                      <>
                        {uploadProcessing ? (
                          <Upload className="h-8 w-8 text-muted-foreground animate-pulse" />
                        ) : resumeText ? (
                          <CheckCircle2 className="h-8 w-8 text-primary" />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium text-foreground">{uploadedFileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {uploadProcessing ? "Extracting text…" : resumeText ? "Text extracted successfully" : "Could not extract text"}
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload your resume file</p>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadProcessing}
                      className="gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploadedFileName ? "Choose Different File" : "Choose File"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Supports PDF, DOC, and DOCX</p>
                  </div>
                </TabsContent>

                <TabsContent value="paste" className="space-y-3 mt-3">
                  <Textarea
                    placeholder="Paste your resume content here… We'll use this to personalize your generated materials."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={10}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Copy all text from your current resume and paste it here. This helps us tailor documents to your experience.
                  </p>
                </TabsContent>
              </Tabs>
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleFirstTimeJobSeeker}
                  disabled={loading}
                  className="text-sm text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
                >
                  Don't have a resume yet?
                </button>
              </div>
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
                {extractedIndustries.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    We pre-selected {extractedIndustries.length} {extractedIndustries.length === 1 ? "industry" : "industries"} extracted from your resume. Adjust as needed.
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {(extractedIndustries.length > 0 ? extractedIndustries : COMMON_INDUSTRIES).map((ind) => (
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
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add custom industry..."
                    value={industryInput}
                    onChange={(e) => setIndustryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomIndustry())}
                    className="text-sm"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addCustomIndustry}>Add</Button>
                </div>
                {industries.filter((ind) => !(extractedIndustries.length > 0 ? extractedIndustries : COMMON_INDUSTRIES).includes(ind)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {industries.filter((ind) => !(extractedIndustries.length > 0 ? extractedIndustries : COMMON_INDUSTRIES).includes(ind)).map((ind) => (
                      <Badge key={ind} variant="default" className="text-xs gap-1">
                        {ind} <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => toggleIndustry(ind)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Story 1.3: Step 4: Master Cover Letter */}
          {step === 4 && (
            <div className="space-y-3">
              <Label>Master Cover Letter <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <input
                ref={coverLetterFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleCoverLetterFileUpload}
              />
              <Tabs value={coverLetterInputMode} onValueChange={(v) => setCoverLetterInputMode(v as "upload" | "paste")}>
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1 gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Upload Cover Letter
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="flex-1 gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Paste Cover Letter
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-3 mt-3">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 gap-3 text-center">
                    {coverLetterFileName ? (
                      <>
                        {coverLetterUploadProcessing ? (
                          <Upload className="h-8 w-8 text-muted-foreground animate-pulse" />
                        ) : masterCoverLetter ? (
                          <CheckCircle2 className="h-8 w-8 text-primary" />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium text-foreground">{coverLetterFileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {coverLetterUploadProcessing ? "Extracting text…" : masterCoverLetter ? "Text extracted successfully" : "Could not extract text"}
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload your cover letter file</p>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => coverLetterFileInputRef.current?.click()}
                      disabled={coverLetterUploadProcessing}
                      className="gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {coverLetterFileName ? "Choose Different File" : "Choose File"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Supports PDF, DOC, and DOCX</p>
                  </div>
                </TabsContent>

                <TabsContent value="paste" className="space-y-3 mt-3">
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
                </TabsContent>
              </Tabs>
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
