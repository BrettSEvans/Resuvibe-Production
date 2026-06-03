import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Copy, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { downloadHtmlAsDocx, downloadTextAsDocx } from "@/lib/docxExport";
import { downloadHtmlAsPdf } from "@/lib/pdfDownload";
import {
  getSingleUserSessionResult,
  subscribeToSingleUserSession,
  type SingleUserGenerationResult,
} from "@/lib/singleUserSession";

function coverLetterHtml(text: string) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;font-size:11pt;line-height:1.6;margin:1in;"><div style="white-space:pre-wrap">${escaped}</div></body></html>`;
}

function assetFileBase(result: SingleUserGenerationResult, asset: string) {
  const company = result.companyName || "company";
  const role = result.jobTitle || "role";
  return `${company}-${role}-${asset}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function SingleUserSessionResult() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [result, setResult] = useState(() => getSingleUserSessionResult());
  const [activeTab, setActiveTab] = useState("resume");

  useEffect(() => {
    return subscribeToSingleUserSession(() => setResult(getSingleUserSessionResult()));
  }, []);

  if (!result) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <Card className="p-8 text-center">
          <p className="mb-4 text-muted-foreground">No generated materials are available in this session.</p>
          <Button onClick={() => navigate("/applications/new")}>Start a New Application</Button>
        </Card>
      </main>
    );
  }

  const activeContent = activeTab === "resume" ? result.resumeHtml : result.coverLetter;
  const activeHtml = activeTab === "resume" ? result.resumeHtml : coverLetterHtml(result.coverLetter);
  const activeLabel = activeTab === "resume" ? "Resume" : "Cover letter";

  const copyActive = async () => {
    await navigator.clipboard.writeText(activeContent);
    toast({ title: "Copied!", description: `${activeLabel} copied to clipboard.` });
  };

  const downloadPdf = async () => {
    await downloadHtmlAsPdf(activeHtml, assetFileBase(result, activeTab));
  };

  const downloadDocx = () => {
    if (activeTab === "resume") {
      downloadHtmlAsDocx(result.resumeHtml, assetFileBase(result, "resume"));
    } else {
      downloadTextAsDocx(result.coverLetter, assetFileBase(result, "cover-letter"));
    }
    toast({ title: "Downloading", description: `${activeLabel} DOCX file is being prepared.` });
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Session Not Saved</p>
            <p className="text-sm">
              Covercraft Assist is currently running in local mode. Ensure you download or copy your generated assets before closing this window or your data will be lost.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">
          Your Tailored Application for {result.jobTitle || "Target Role"}{result.companyName ? ` at ${result.companyName}` : ""}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
        </TabsList>
        <TabsContent value="resume">
          <Card className="overflow-hidden bg-white">
            <iframe title="Generated resume" srcDoc={result.resumeHtml} className="min-h-[720px] w-full border-0" sandbox="" />
          </Card>
        </TabsContent>
        <TabsContent value="cover-letter">
          <Card className="min-h-[520px] whitespace-pre-wrap p-6 text-sm leading-7">
            {result.coverLetter || "No cover letter content was generated."}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 mt-6 border-t bg-background/95 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">Export Assets</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyActive}>
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </Button>
            <Button variant="outline" onClick={() => void downloadPdf()}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={downloadDocx}>
              <Download className="mr-2 h-4 w-4" />
              Download Word DOCX
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
