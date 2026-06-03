import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BriefcaseBusiness, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateSingleUserApplication } from "@/lib/singleUserGeneration";
import { setSingleUserSessionResult } from "@/lib/singleUserSession";
import { extractSourceMaterialText } from "@/lib/sourceMaterialExtraction";

type MaterialKind = "resume" | "coverLetter";

function SourceDropZone({
  label,
  onText,
}: {
  label: string;
  onText: (text: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    try {
      const text = await extractSourceMaterialText(file);
      onText(text);
      setFileName(file.name);
      toast({ title: "File loaded", description: `${file.name} was added to this session.` });
    } catch (error) {
      toast({
        title: "File not loaded",
        description: error instanceof Error ? error.message : "Paste the text instead.",
        variant: "destructive",
      });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-5 text-center transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40"
      }`}
    >
      <Upload className={`h-6 w-6 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
      <div className="text-sm font-medium">{fileName || label}</div>
      <div className="text-xs text-muted-foreground">PDF, DOCX, or text file</div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}

export default function SingleUserNewApplication() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companyUrl, setCompanyUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");
  const [generating, setGenerating] = useState(false);

  const updateMaterial = (kind: MaterialKind, text: string) => {
    if (kind === "resume") setResumeText(text);
    else setCoverLetterText(text);
  };

  const canGenerate = jobDescription.trim().length > 0 && resumeText.trim().length > 0 && !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const result = await generateSingleUserApplication({
        companyUrl: companyUrl.trim() || undefined,
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        resumeText: resumeText.trim(),
        coverLetterText: coverLetterText.trim() || undefined,
      });
      setSingleUserSessionResult(result);
      navigate("/applications/session");
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Could not generate application assets.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Start a New Application</h1>
        <p className="text-muted-foreground">Generate a tailored resume and cover letter instantly.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
              <BriefcaseBusiness className="h-4 w-4" />
              Step 1: Target Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-url">Company URL (Optional)</Label>
              <Input
                id="company-url"
                type="url"
                placeholder="https://..."
                value={companyUrl}
                onChange={(event) => setCompanyUrl(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                placeholder="e.g., Senior Frontend Developer"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the full job description here..."
                rows={10}
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
              <FileText className="h-4 w-4" />
              Step 2: Your Source Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Since you are in a secure local session, provide the base documents you want tailored.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <SourceDropZone label="Drag & drop base resume PDF/DOCX" onText={(text) => updateMaterial("resume", text)} />
                <div className="space-y-2">
                  <Label htmlFor="resume-text">Paste Resume Text</Label>
                  <Textarea
                    id="resume-text"
                    rows={10}
                    value={resumeText}
                    onChange={(event) => setResumeText(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <SourceDropZone label="Drag & drop base cover letter PDF/DOCX" onText={(text) => updateMaterial("coverLetter", text)} />
                <div className="space-y-2">
                  <Label htmlFor="cover-letter-text">Paste Cover Letter Text</Label>
                  <Textarea
                    id="cover-letter-text"
                    rows={10}
                    value={coverLetterText}
                    onChange={(event) => setCoverLetterText(event.target.value)}
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full" size="lg">
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
              Generate Application Assets
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
