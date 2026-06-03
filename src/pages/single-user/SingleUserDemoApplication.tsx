import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Download, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { downloadHtmlAsDocx, downloadTextAsDocx } from "@/lib/docxExport";
import { downloadHtmlAsPdf } from "@/lib/pdfDownload";

const DEMO_APP_ID = "889931c5-30b7-4a1c-828b-358d0a8d6d49";

function coverLetterHtml(text: string) {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;font-size:11pt;line-height:1.6;margin:1in;"><div style="white-space:pre-wrap">${escaped}</div></body></html>`;
}

function fileBase(company: string, role: string, asset: string) {
  return `${company}-${role}-${asset}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type DemoApp = {
  company_name: string | null;
  job_title: string | null;
  resume_html: string | null;
  cover_letter: string | null;
};

export default function SingleUserDemoApplication() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [app, setApp] = useState<DemoApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("resume");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("company_name, job_title, resume_html, cover_letter")
        .eq("id", DEMO_APP_ID)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast({ title: "Unable to load example", description: error.message, variant: "destructive" });
      }
      setApp((data as DemoApp) ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [toast]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!app) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <Card className="p-8 text-center">
          <p className="mb-4 text-muted-foreground">Example application is unavailable.</p>
          <Button onClick={() => navigate("/applications/new")}>Build Your Own</Button>
        </Card>
      </main>
    );
  }

  const company = app.company_name || "company";
  const role = app.job_title || "role";
  const resume = app.resume_html || "";
  const cl = app.cover_letter || "";
  const activeContent = activeTab === "resume" ? resume : cl;
  const activeHtml = activeTab === "resume" ? resume : coverLetterHtml(cl);
  const activeLabel = activeTab === "resume" ? "Resume" : "Cover letter";

  const copyActive = async () => {
    await navigator.clipboard.writeText(activeContent);
    toast({ title: "Copied!", description: `${activeLabel} copied to clipboard.` });
  };

  const downloadPdf = async () => {
    await downloadHtmlAsPdf(activeHtml, fileBase(company, role, activeTab));
  };

  const downloadDocx = () => {
    if (activeTab === "resume") {
      downloadHtmlAsDocx(resume, fileBase(company, role, "resume"));
    } else {
      downloadTextAsDocx(cl, fileBase(company, role, "cover-letter"));
    }
    toast({ title: "Downloading", description: `${activeLabel} DOCX file is being prepared.` });
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Example Application</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {role} at {company}
          </h1>
        </div>
        <Button onClick={() => navigate("/applications/new")}>Build Your Own</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
        </TabsList>
        <TabsContent value="resume">
          <Card className="overflow-hidden bg-white">
            <iframe title="Example resume" srcDoc={resume} className="min-h-[720px] w-full border-0" sandbox="" />
          </Card>
        </TabsContent>
        <TabsContent value="cover-letter">
          <Card className="min-h-[520px] whitespace-pre-wrap p-6 text-sm leading-7">
            {cl || "No cover letter available."}
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
