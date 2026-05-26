import { useState, useEffect, useRef, useCallback } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Globe,
  Link,
  FileText,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import GenerationProgressBar, { type PipelineStage } from "@/components/GenerationProgressBar";
import { backgroundGenerator } from "@/lib/backgroundGenerator";
import { Checkbox } from "@/components/ui/checkbox";
import { GenerationAdGate } from "@/components/ads/GenerationAdGate";

type Step = "input" | "analyzing";

const NewApplication = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Inputs
  const [jobUrl, setJobUrl] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [manualJobDescription, setManualJobDescription] = useState("");
  const [useManualInput, setUseManualInput] = useState(false);

  // State
  const [step, setStep] = useState<Step>("input");
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("reviewing-job");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [pipelineError, setPipelineError] = useState<string | undefined>();

  // Ad-gate: shown once job reaches the Resume stage.
  // Progress bar is frozen at "resume" until the ad completes.
  const [adGateVisible, setAdGateVisible] = useState(false);
  const adGateShownRef = useRef(false);   // have we ever shown the gate?
  const adCompletedRef = useRef(false);   // has the ad been dismissed?
  const jobReadyIdRef = useRef<string | null>(null); // appId when job finished

  // Generation selections
  const [genResume, setGenResume] = useState(true);
  const [genCoverLetter, setGenCoverLetter] = useState(true);
  const [genJdAnalysis, setGenJdAnalysis] = useState(false);
  const [genMaterials, setGenMaterials] = useState(false);
  const [genDashboard, setGenDashboard] = useState(false);

  const isValidUrl = (str: string) => {
    try {
      const u = new URL(str.startsWith('http') ? str : `https://${str}`);
      return !!u.hostname.includes('.');
    } catch { return false; }
  };

  // Called by GenerationAdGate when the user skips or the ad plays to end.
  const handleAdComplete = useCallback(() => {
    adCompletedRef.current = true;
    setAdGateVisible(false);
    if (jobReadyIdRef.current) {
      // Job already finished while ad was playing — navigate now.
      setPipelineStage("complete");
      navigate(`/applications/${jobReadyIdRef.current}`);
    }
    // If job isn't done yet, the subscriber below will navigate when it finishes.
  }, [navigate]);

  // Subscribe to background job updates for navigation
  useEffect(() => {
    if (!applicationId) return;
    const unsub = backgroundGenerator.subscribe(() => {
      const job = backgroundGenerator.getJob(applicationId);
      if (!job) return;

      // Map background job status to pipeline stages
      const statusToStage: Record<string, PipelineStage> = {
        "pending": "reviewing-job",
        "reviewing-job": "reviewing-job",
        "branding": "branding",
        "analyzing": "analyzing",
        "research": "research",
        "resume": "resume",
      };

      if (statusToStage[job.status]) {
        // Freeze the display at "resume" once the ad gate has opened
        if (!adGateShownRef.current) {
          setPipelineStage(statusToStage[job.status]);
        }
        // Show the ad gate as soon as the Resume stage begins
        if (job.status === "resume" && !adGateShownRef.current) {
          adGateShownRef.current = true;
          setAdGateVisible(true);
        }
      }

      if (job.status === "error") {
        setPipelineError(job.error || "Generation failed");
      }

      // Job is complete — gate navigation on ad completion
      if (
        job.status === "resume-complete" ||
        job.status === "cover-letter" ||
        job.status === "dashboard" ||
        job.status === "complete"
      ) {
        // Show ad gate if it hasn't been shown yet (e.g. very fast generation)
        if (!adGateShownRef.current) {
          adGateShownRef.current = true;
          setPipelineStage("resume"); // freeze bar at Resume
          setAdGateVisible(true);
        }

        jobReadyIdRef.current = applicationId;

        if (adCompletedRef.current) {
          // Ad already dismissed — navigate immediately
          setPipelineStage("complete");
          navigate(`/applications/${applicationId}`);
        }
        // Otherwise wait: handleAdComplete will navigate when the ad finishes
      }
    });
    return () => { unsub(); };
  }, [applicationId, navigate]);

  const handleAnalyze = async () => {
    if (!useManualInput && !jobUrl.trim()) return;
    if (useManualInput && !manualJobDescription.trim()) return;
    if (!useManualInput && !isValidUrl(jobUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid job posting URL.", variant: "destructive" });
      return;
    }
    setStep("analyzing");
    setPipelineStage("reviewing-job");
    setPipelineError(undefined);

    try {
      const appId = await backgroundGenerator.startFullGeneration({
        jobUrl: jobUrl || "manual-input",
        companyUrl: genDashboard ? (companyUrl || undefined) : undefined,
        jobDescription: useManualInput ? manualJobDescription.trim() : undefined,
        useManualInput,
        selections: {
          resume: genResume,
          coverLetter: genCoverLetter,
          jdAnalysis: genJdAnalysis,
          materials: genMaterials,
          dashboard: genDashboard,
        },
      });
      setApplicationId(appId);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setStep("input");
    }
  };

  return (
    <PageShell>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/applications")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">New Job Application</h1>
        </div>

        {/* Step: Input */}
        {step === "input" && (
          <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {useManualInput ? <FileText className="h-5 w-5" /> : <Link className="h-5 w-5" />}
                      {useManualInput ? "Paste Job Description" : "Job Posting URL"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseManualInput(!useManualInput)}
                      className="text-xs"
                    >
                      {useManualInput ? "Use URL instead" : "Paste text instead"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {useManualInput ? (
                    <Textarea
                      placeholder="Paste the full job description text here..."
                      value={manualJobDescription}
                      onChange={(e) => setManualJobDescription(e.target.value)}
                      rows={10}
                    />
                  ) : (
                    <Input
                      type="url"
                      placeholder="https://jobs.example.com/role/12345"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                    />
                  )}
                  {!useManualInput && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Can't scrape the page? Click "Paste text instead" above.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {[
                      { id: "gen-resume", label: "Resume", checked: genResume, set: setGenResume },
                      { id: "gen-cover", label: "Cover Letter", checked: genCoverLetter, set: setGenCoverLetter },
                      { id: "gen-jd", label: "JD Analysis", checked: genJdAnalysis, set: setGenJdAnalysis },
                      { id: "gen-materials", label: "Materials", checked: genMaterials, set: setGenMaterials },
                      { id: "gen-dashboard", label: "Dashboard", checked: genDashboard, set: setGenDashboard },
                    ].map((opt) => (
                      <label key={opt.id} htmlFor={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          id={opt.id}
                          checked={opt.checked}
                          onCheckedChange={(v) => opt.set(!!v)}
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {genDashboard && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" /> Company Website URL
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Used to scrape branding (fonts, colors, design) for the dashboard
                    </p>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={
                  (useManualInput ? !manualJobDescription.trim() : !jobUrl.trim()) ||
                  (genDashboard && !isValidUrl(companyUrl))
                }
                className="w-full"
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" /> Analyze & Generate
              </Button>
          </div>
        )}

        {/* Step: Analyzing — shows progress bar while pipeline runs */}
        {step === "analyzing" && (
          <Card>
            <CardContent className="py-10 space-y-6">
              <GenerationProgressBar currentStage={pipelineStage} error={pipelineError} showBranding={genDashboard} />
              <div className="flex items-center justify-center gap-3 mt-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Building your application... You'll be redirected when your resume is ready.
                </p>
              </div>
              {pipelineError && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => { setStep("input"); setPipelineError(undefined); }}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Try Again
                  </Button>
                </div>
              )}
              {/* Ad gate — rendered below the progress message once the Resume
                  stage begins.  Progress bar is frozen at Resume until onComplete
                  fires (user skips or ad plays to end). */}
              {adGateVisible && (
                <GenerationAdGate onComplete={handleAdComplete} />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
};

export default NewApplication;
