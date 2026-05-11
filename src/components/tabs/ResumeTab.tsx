import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import VersionDownloadAlert from "@/components/VersionDownloadAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit3,
  Loader2,
  FileText,
  RefreshCw,
  Download,
  FileDown,
  Sparkles,
  Target,
  ChevronDown,
  Send,
  ArrowUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ResumeHealthPanel from "@/components/ResumeHealthPanel";
import ResumeRevisions from "@/components/ResumeRevisions";
import InlineHtmlEditor from "@/components/InlineHtmlEditor";
import { saveJobApplication } from "@/lib/api/jobApplication";
import { generateOptimizedResume } from "@/lib/api/resumeGeneration";
import { downloadHtmlAsDocx } from "@/lib/docxExport";
import { supabase } from "@/integrations/supabase/client";
import type { JobApplication, UserResumePickerItem, FabricationChange, ToastFn } from "@/types/models";
import type { ExtractedKeyword } from "@/lib/keywordMatcher";
import type { ResumeVariant } from "@/hooks/useResumeEditor";
import { buildFileName } from "@/lib/fileNaming";
import type { UserProfileSnapshot } from "@/types/models";

/** Fit-to-page preview for resume */
function ResumePagePreview({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScale(Math.min(entry.contentRect.width / 816, 1));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Card className="overflow-hidden px-6">
      <div ref={containerRef} className="w-full bg-white" style={{ height: `${1056 * scale}px`, overflow: "hidden" }}>
        <iframe
          srcDoc={html}
          sandbox="allow-scripts"
          title="Resume Preview"
          style={{
            width: "816px",
            height: "1056px",
            border: "none",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </Card>
  );
}

interface ResumeTabProps {
  id: string;
  app: JobApplication;
  userProfile: UserProfileSnapshot | null;
  setApp: (fn: (prev: JobApplication | null) => JobApplication | null) => void;
  jobDescription: string;
  companyName: string;
  jobTitle: string;
  resumeText: string | null;
  userResumes: UserResumePickerItem[];
  isBgGenerating: boolean;
  bgJob: import("@/lib/backgroundGenerator").GenerationJob | undefined;
  previewResumeHtml: string | null;
  setPreviewResumeHtml: (val: string | null) => void;
  resumeRevisionTrigger: number;
  setResumeRevisionTrigger: (fn: (t: number) => number) => void;
  // Resume editor hook
  regenDialogOpen: boolean;
  setRegenDialogOpen: (val: boolean) => void;
  selectedResumeId: string;
  setSelectedResumeId: (val: string) => void;
  isRegeneratingResume: boolean;
  editingResume: boolean;
  setEditingResume: (val: boolean) => void;
  handleRegenerateResume: () => Promise<void>;
  activeVariant: ResumeVariant;
  setActiveVariant: (val: ResumeVariant) => void;
  openRegenDialog: (variant: ResumeVariant) => void;
  // Actions
  saveField: (fields: Record<string, unknown>) => Promise<void>;
  handleAcceptFabrication: (change: FabricationChange) => void;
  handleRevertFabrication: (change: FabricationChange) => Promise<void>;
  toast: ToastFn;
}

function ResumeDownloadButton({
  variant,
  variantLabel,
  displayHtml,
  isOlderVersion,
  companyName,
  userProfile,
  toast,
  disabled,
}: {
  variant: ResumeVariant;
  variantLabel: string;
  displayHtml: string;
  isOlderVersion: boolean;
  companyName: string;
  userProfile: UserProfileSnapshot | null;
  toast: ToastFn;
  disabled?: boolean;
}) {
  const [versionAlert, setVersionAlert] = useState<(() => void) | null>(null);

  const guardedDownload = (action: () => void) => {
    if (isOlderVersion) {
      setVersionAlert(() => action);
    } else {
      action();
    }
  };

  const downloadPdf = () => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:none;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      toast({ title: "Error", description: "Could not open print frame.", variant: "destructive" });
      document.body.removeChild(iframe);
      return;
    }
    const printStyles = `<style>@page{size:letter;margin:0}@media print{html{margin:0 !important;padding:0 !important}body{margin:0 !important;padding:0.5in !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>`;
    const sourceDoc = new DOMParser().parseFromString(displayHtml, "text/html");
    const printDocument = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title></title>${printStyles}${sourceDoc.head?.innerHTML || ""}</head><body>${sourceDoc.body?.innerHTML || displayHtml}</body></html>`;
    doc.open();
    doc.write(printDocument);
    doc.close();
    doc.title = "";
    const triggerPrint = () => {
      try { iframe.contentWindow?.print(); } catch (_) {}
      setTimeout(() => { if (iframe.parentNode) document.body.removeChild(iframe); }, 1000);
    };
    iframe.onload = () => setTimeout(triggerPrint, 400);
    setTimeout(triggerPrint, 1500);
  };

  const downloadDocx = () => {
    const name = buildFileName(userProfile?.first_name, userProfile?.last_name, `${variant}-resume`, companyName, "docx");
    downloadHtmlAsDocx(displayHtml, name);
    toast({ title: "Downloading", description: `${variantLabel} resume DOCX file is being prepared.` });
  };

  return (
    <>
      <VersionDownloadAlert
        open={!!versionAlert}
        onOpenChange={(open) => { if (!open) setVersionAlert(null); }}
        onConfirm={() => { versionAlert?.(); setVersionAlert(null); }}
        versionLabel={isOlderVersion ? "an older revision" : undefined}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Download className="mr-2 h-4 w-4" /> Download
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => guardedDownload(downloadPdf)}>
            <FileDown className="mr-2 h-4 w-4" /> PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => guardedDownload(downloadDocx)}>
            <Download className="mr-2 h-4 w-4" /> DOCX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function ResumeVariantToolbar({
  isRegenerating,
  isRefining,
  askPrompt,
  setAskPrompt,
  onAskForChanges,
  onEdit,
  onRegenerate,
}: {
  isRegenerating: boolean;
  isRefining: boolean;
  askPrompt: string;
  setAskPrompt: (v: string) => void;
  onAskForChanges: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
}) {
  const disabled = isRefining || isRegenerating;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 w-[220px]">
        <Input
          placeholder="Ask for changes (e.g. shorten the summary)"
          value={askPrompt}
          onChange={(e) => setAskPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && askPrompt.trim() && !disabled) {
              e.preventDefault();
              onAskForChanges();
            }
          }}
          disabled={disabled}
          aria-label="Ask for changes"
          className="h-9"
        />
        <Button
          size="icon"
          onClick={onAskForChanges}
          disabled={disabled || !askPrompt.trim()}
          aria-label={isRefining ? "Applying changes" : "Send"}
          className="h-9 w-9 rounded-full shadow-md disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
        >
          {isRefining ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </Button>
      </div>
      <Button variant="outline" size="sm" onClick={onEdit} disabled={disabled}>
        <Edit3 className="mr-2 h-4 w-4" /> Edit
      </Button>
      <Button variant="outline" size="sm" disabled={disabled} onClick={onRegenerate}>
        {isRegenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {isRegenerating ? "Regenerating…" : "Regenerate"}
      </Button>
    </div>
  );
}

function ResumeVariantContent({
  variant,
  variantLabel,
  html,
  previewHtml,
  id,
  app,
  setApp,
  jobDescription,
  companyName,
  jobTitle,
  resumeText,
  userProfile,
  isRegenerating,
  editingResume,
  setEditingResume,
  setPreviewResumeHtml,
  resumeRevisionTrigger,
  setResumeRevisionTrigger,
  openRegenDialog,
  saveField,
  handleAcceptFabrication,
  handleRevertFabrication,
  toast,
}: {
  variant: ResumeVariant;
  variantLabel: string;
  html: string | null;
  previewHtml: string | null;
  id: string;
  app: JobApplication;
  setApp: (fn: (prev: JobApplication | null) => JobApplication | null) => void;
  jobDescription: string;
  companyName: string;
  jobTitle: string;
  resumeText: string | null;
  userProfile: UserProfileSnapshot | null;
  isRegenerating: boolean;
  editingResume: boolean;
  setEditingResume: (val: boolean) => void;
  setPreviewResumeHtml: (val: string | null) => void;
  resumeRevisionTrigger: number;
  setResumeRevisionTrigger: (fn: (t: number) => number) => void;
  openRegenDialog: (variant: ResumeVariant) => void;
  saveField: (fields: Record<string, unknown>) => Promise<void>;
  handleAcceptFabrication: (change: FabricationChange) => void;
  handleRevertFabrication: (change: FabricationChange) => Promise<void>;
  toast: ToastFn;
}) {
  const htmlField = variant === "ats" ? "resume_html" : "clarity_resume_html";
  const [askPrompt, setAskPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  const handleAskForChanges = async () => {
    if (!askPrompt.trim() || !html) return;
    setIsRefining(true);
    const promptText = askPrompt.trim();
    try {
      // Save current as revision
      try {
        await supabase.from("resume_revisions").insert({
          application_id: id,
          html,
          label: `Before "${promptText.slice(0, 60)}" (${variantLabel})`,
          revision_number: Date.now(),
          resume_type: variant,
        });
      } catch (_) { /* non-critical */ }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refine-material`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentContent: html,
          contentType: "html",
          assetName: `${variantLabel} resume`,
          userMessage: promptText,
        }),
      });

      if (!resp.ok || !resp.body) {
        let msg = "Refine failed";
        try { const j = await resp.json(); if (j?.error) msg = j.error; } catch (_) {}
        throw new Error(msg);
      }

      // Stream SSE and accumulate full HTML
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";
      let done = false;
      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) result += c;
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      let cleaned = result.trim()
        .replace(/^```html\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
        .trim();

      if (!cleaned || cleaned.length < 50) throw new Error("AI returned empty response");

      await saveJobApplication({ id, job_url: app.job_url, [htmlField]: cleaned } as any);
      setApp((prev) => prev ? { ...prev, [htmlField]: cleaned } : prev);
      setResumeRevisionTrigger((t) => t + 1);
      setAskPrompt("");
      toast({ title: "Changes applied", description: `${variantLabel} resume updated.` });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Couldn't apply changes", description: message, variant: "destructive" });
    } finally {
      setIsRefining(false);
    }
  };

  if (!html) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-medium">No {variantLabel} resume generated yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This resume will be generated automatically when you create an application, or you can regenerate it manually.
          </p>
          <Button variant="outline" size="sm" onClick={() => openRegenDialog(variant)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Generate {variantLabel} Resume
          </Button>
        </CardContent>
      </Card>
    );
  }

  const toolbarTarget = typeof document !== "undefined" ? document.getElementById("resume-variant-actions") : null;
  const toolbar = (
    <ResumeVariantToolbar
      isRegenerating={isRegenerating}
      isRefining={isRefining}
      askPrompt={askPrompt}
      setAskPrompt={setAskPrompt}
      onAskForChanges={handleAskForChanges}
      onEdit={() => { setEditingResume(true); setPreviewResumeHtml(null); }}
      onRegenerate={() => openRegenDialog(variant)}
    />
  );

  return (
    <div className="space-y-4">
      {toolbarTarget ? createPortal(toolbar, toolbarTarget) : toolbar}

      {editingResume ? (
        <InlineHtmlEditor
          html={html}
          height="60vh"
          onSave={async (newHtml) => {
            try {
              await supabase.from("resume_revisions").insert({
                application_id: id,
                html: html,
                label: `Before manual edit (${variantLabel})`,
                revision_number: Date.now(),
                resume_type: variant,
              });
            } catch (_) {}
            await saveJobApplication({ id, job_url: app.job_url, [htmlField]: newHtml } as any);
            setApp((prev) => prev ? { ...prev, [htmlField]: newHtml } : prev);
            setEditingResume(false);
            setResumeRevisionTrigger((t) => t + 1);
            toast({ title: `${variantLabel} resume saved` });
          }}
          onCancel={() => setEditingResume(false)}
        />
      ) : (
        <ResumePagePreview html={previewHtml || html} />
      )}

      <ResumeRevisions
        applicationId={id}
        currentHtml={html}
        onPreviewRevision={setPreviewResumeHtml}
        refreshTrigger={resumeRevisionTrigger}
        resumeType={variant}
      />

      {variant === "ats" && jobDescription && (
        <ResumeHealthPanel
          resumeHtml={html}
          jobDescription={jobDescription}
          resumeText={resumeText}
          companyName={companyName}
          jobTitle={jobTitle}
          onOptimize={async (missingKeywords: ExtractedKeyword[], userPrompt?: string) => {
            if (!resumeText) {
              toast({ title: "No resume found", description: "Upload a resume in your Profile first.", variant: "destructive" });
              return;
            }
            const kwList = missingKeywords.map(k => k.keyword).join(", ");
            toast({ title: "Optimizing resume…", description: `Injecting keywords: ${kwList}` });
            try {
              const { resume_html } = await generateOptimizedResume({
                jobDescription,
                resumeText,
                missingKeywords,
                userPrompt,
                companyName,
                jobTitle,
              });
              await saveJobApplication({ id, job_url: app.job_url, resume_html });
              setApp((prev) => prev ? { ...prev, resume_html } : prev);
              toast({ title: "Resume optimized!", description: `${missingKeywords.length} keywords injected.` });
            } catch (e: unknown) {
              const message = e instanceof Error ? e.message : "Unknown error";
              toast({ title: "Optimization failed", description: message, variant: "destructive" });
            }
          }}
          onApplyBulletFix={(original, replacement) => {
            const updatedHtml = html.replace(original, replacement);
            saveJobApplication({ id, job_url: app.job_url, resume_html: updatedHtml })
              .then(() => setApp((prev) => prev ? { ...prev, resume_html: updatedHtml } : prev));
            toast({ title: "Bullet updated", description: `Replaced: "${original.slice(0, 40)}…"` });
          }}
          onAcceptFabrication={handleAcceptFabrication}
          onRevertFabrication={handleRevertFabrication}
        />
      )}
    </div>
  );
}

export function ResumeTab({
  id,
  app,
  userProfile,
  setApp,
  jobDescription,
  companyName,
  jobTitle,
  resumeText,
  userResumes,
  isBgGenerating,
  bgJob,
  previewResumeHtml,
  setPreviewResumeHtml,
  resumeRevisionTrigger,
  setResumeRevisionTrigger,
  regenDialogOpen,
  setRegenDialogOpen,
  selectedResumeId,
  setSelectedResumeId,
  isRegeneratingResume,
  editingResume,
  setEditingResume,
  handleRegenerateResume,
  activeVariant,
  setActiveVariant,
  openRegenDialog,
  saveField,
  handleAcceptFabrication,
  handleRevertFabrication,
  toast,
}: ResumeTabProps) {
  const navigate = useNavigate();
  const atsHtml = app?.resume_html || null;
  const clarityHtml = (app as any)?.clarity_resume_html || null;
  const hasAnyResume = !!atsHtml || !!clarityHtml;

  if (isBgGenerating && !hasAnyResume) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">{bgJob?.progress || "Generating resumes..."}</p>
          <p className="text-xs text-muted-foreground">You can navigate away — generation continues in the background.</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasAnyResume && !isBgGenerating) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-medium">No resume generated yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {!resumeText
              ? "Add your resume text in your Profile first, then use Keyword Analysis to generate an optimized resume."
              : !jobDescription
              ? "Add a job description in the JD Analysis tab, then use Keyword Analysis to generate an optimized resume."
              : "Use Keyword Analysis in this tab to generate an optimized, keyword-injected resume."}
          </p>
          {!resumeText && (
            <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
              Go to Profile
            </Button>
          )}
          {resumeText && jobDescription && (
            <ResumeHealthPanel
              resumeHtml=""
              jobDescription={jobDescription}
              resumeText={resumeText}
              companyName={companyName}
              jobTitle={jobTitle}
              onOptimize={async (missingKeywords: ExtractedKeyword[], userPrompt?: string) => {
                const kwList = missingKeywords.map(k => k.keyword).join(", ");
                toast({ title: "Optimizing resume…", description: `Injecting keywords: ${kwList}` });
                try {
                  const { resume_html } = await generateOptimizedResume({
                    jobDescription, resumeText, missingKeywords, userPrompt, companyName, jobTitle,
                  });
                  await saveJobApplication({ id, job_url: app.job_url, resume_html });
                  setApp((prev) => prev ? { ...prev, resume_html } : prev);
                  toast({ title: "Resume optimized!", description: `${missingKeywords.length} keywords injected.` });
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : "Unknown error";
                  toast({ title: "Optimization failed", description: message, variant: "destructive" });
                }
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Regenerate Dialog (shared between both variants) */}
      <Dialog open={regenDialogOpen} onOpenChange={setRegenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Resume</DialogTitle>
            <DialogDescription>
              Choose which uploaded resume to use as the baseline for regeneration.
            </DialogDescription>
          </DialogHeader>
          {userResumes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No resumes uploaded. Go to your Profile to upload a resume first.
            </p>
          ) : (
            <div className="space-y-3 py-2">
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {userResumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.file_name}
                      {r.is_active ? " (Primary)" : ""}
                      {!r.resume_text ? " — not extracted" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedResumeId && !userResumes.find((r) => r.id === selectedResumeId)?.resume_text && (
                <p className="text-xs text-destructive">
                  This resume's text hasn't been extracted yet. Re-upload it from your Profile.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRegenerateResume}
              disabled={!selectedResumeId || !userResumes.find((r) => r.id === selectedResumeId)?.resume_text}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-tabs for ATS Play vs Clarity */}
      <Tabs value={activeVariant} onValueChange={(v) => { setActiveVariant(v as ResumeVariant); setEditingResume(false); setPreviewResumeHtml(null); }}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <TooltipProvider delayDuration={150}>
            <TabsList>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <TabsTrigger value="ats" className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      ATS
                      {isBgGenerating && !atsHtml && <Loader2 className="h-3 w-3 animate-spin" />}
                    </TabsTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <strong>ATS Play</strong> — Optimized for Applicant Tracking Systems with maximum keyword density, mirrored terminology, and structured sections to pass automated screening.
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <TabsTrigger value="clarity" className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Clarity
                      {isBgGenerating && !clarityHtml && <Loader2 className="h-3 w-3 animate-spin" />}
                    </TabsTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <strong>Clarity</strong> — Human-first strategy optimized for recruiter readability. Highlights impact, outcomes, and career narrative so a hiring manager can understand your value in 5 seconds.
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </TooltipProvider>
          <div id="resume-variant-actions" className="flex flex-wrap items-center gap-2 ml-auto justify-end" />
          {(() => {
            const activeHtml = activeVariant === "ats" ? atsHtml : clarityHtml;
            if (!activeHtml) return null;
            const displayHtml = previewResumeHtml || activeHtml;
            const portalTarget = typeof document !== "undefined" ? document.getElementById("resume-tab-actions") : null;
            const downloadBtn = (
              <ResumeDownloadButton
                variant={activeVariant}
                variantLabel={activeVariant === "ats" ? "ATS Play" : "Clarity"}
                displayHtml={displayHtml}
                isOlderVersion={!!previewResumeHtml}
                companyName={companyName}
                userProfile={userProfile}
                toast={toast}
              />
            );
            return portalTarget ? createPortal(downloadBtn, portalTarget) : downloadBtn;
          })()}
        </div>

        <TabsContent value="ats" className="space-y-4 mt-4">
          <ResumeVariantContent
            variant="ats"
            variantLabel="ATS Play"
            html={atsHtml}
            previewHtml={activeVariant === "ats" ? previewResumeHtml : null}
            id={id}
            app={app}
            setApp={setApp}
            jobDescription={jobDescription}
            companyName={companyName}
            jobTitle={jobTitle}
            resumeText={resumeText}
            userProfile={userProfile}
            isRegenerating={isRegeneratingResume}
            editingResume={activeVariant === "ats" && editingResume}
            setEditingResume={setEditingResume}
            setPreviewResumeHtml={setPreviewResumeHtml}
            resumeRevisionTrigger={resumeRevisionTrigger}
            setResumeRevisionTrigger={setResumeRevisionTrigger}
            openRegenDialog={openRegenDialog}
            saveField={saveField}
            handleAcceptFabrication={handleAcceptFabrication}
            handleRevertFabrication={handleRevertFabrication}
            toast={toast}
          />
        </TabsContent>

        <TabsContent value="clarity" className="space-y-4 mt-4">
          <ResumeVariantContent
            variant="clarity"
            variantLabel="Clarity"
            html={clarityHtml}
            previewHtml={activeVariant === "clarity" ? previewResumeHtml : null}
            id={id}
            app={app}
            setApp={setApp}
            jobDescription={jobDescription}
            companyName={companyName}
            jobTitle={jobTitle}
            resumeText={resumeText}
            userProfile={userProfile}
            isRegenerating={isRegeneratingResume}
            editingResume={activeVariant === "clarity" && editingResume}
            setEditingResume={setEditingResume}
            setPreviewResumeHtml={setPreviewResumeHtml}
            resumeRevisionTrigger={resumeRevisionTrigger}
            setResumeRevisionTrigger={setResumeRevisionTrigger}
            openRegenDialog={openRegenDialog}
            saveField={saveField}
            handleAcceptFabrication={handleAcceptFabrication}
            handleRevertFabrication={handleRevertFabrication}
            toast={toast}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
