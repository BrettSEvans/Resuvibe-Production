import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, User, FileText, Zap, X, Trash2 } from "lucide-react";
import ResumeManager from "@/components/ResumeManager";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { backgroundGenerator } from "@/lib/backgroundGenerator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const EXPERIENCE_OPTIONS = ["0-1", "2-4", "5-9", "10-14", "15+"];
const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "AWS", "Docker",
  "Project Management", "Data Analysis", "Marketing", "Sales", "Design", "Leadership",
];
const TONE_OPTIONS = ["professional", "conversational", "confident", "formal", "friendly"];

export default function Profile() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [experience, setExperience] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [tone, setTone] = useState("professional");
  const [masterCoverLetter, setMasterCoverLetter] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [baseline, setBaseline] = useState<string>("");
  const [hasNewUpload, setHasNewUpload] = useState(false);

  const currentSnapshot = JSON.stringify({
    firstName,
    lastName,
    experience,
    resumeText,
    skills: [...skills].sort(),
    industries: [...industries].sort(),
    tone,
    masterCoverLetter,
  });
  const isDirty = initialized && (currentSnapshot !== baseline || hasNewUpload);

  // Initialize form from profile data
  if (profile && !initialized) {
    const fn = profile.first_name ?? "";
    const ln = profile.last_name ?? "";
    const exp = profile.years_experience ?? "";
    const rt = profile.resume_text ?? "";
    const sk = profile.key_skills ?? [];
    const ind = profile.target_industries ?? [];
    const tn = profile.preferred_tone ?? "professional";
    const mcl = profile.master_cover_letter ?? "";
    setFirstName(fn);
    setLastName(ln);
    setExperience(exp);
    setResumeText(rt);
    setSkills(sk);
    setIndustries(ind);
    setTone(tn);
    setMasterCoverLetter(mcl);
    setBaseline(JSON.stringify({
      firstName: fn, lastName: ln, experience: exp, resumeText: rt,
      skills: [...sk].sort(), industries: [...ind].sort(), tone: tn, masterCoverLetter: mcl,
    }));
    setInitialized(true);
  }

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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        years_experience: experience || null,
        resume_text: resumeText || null,
        key_skills: skills.length > 0 ? skills : [],
        target_industries: industries.length > 0 ? industries : [],
        preferred_tone: tone || "professional",
        master_cover_letter: masterCoverLetter || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      setBaseline(currentSnapshot);
      setHasNewUpload(false);
      toast.success("Profile saved!");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Deletion failed");
      }
      // Wipe all local state before navigating away
      queryClient.clear();
      backgroundGenerator.clearAll();
      await signOut();
    } catch (err: unknown) {
      setDeleting(false);
      toast.error("Could not delete account: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="px-4 md:px-8 py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
    <div className="px-4 md:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-primary" /> Profile
        </h1>
        <Button onClick={handleSave} disabled={saving || !isDirty} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Years of Experience</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o} years</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume uploads */}
      {user && (
        <ResumeManager
          userId={user.id}
          onResumeUploaded={() => setHasNewUpload(true)}
          onResumeTextExtracted={(text) => setResumeText(text)}
        />
      )}

      {/* Resume text (paste or auto-populated from PDF upload) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Resume Text
          </CardTitle>
          <CardDescription>
            Paste your resume text here, or upload a PDF above — it will be extracted automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            placeholder="Paste your resume content here… We'll use this to personalise your generated materials."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Tip: Copy all text from your current resume and paste it here. This helps us tailor documents to your experience.
          </p>
          {!resumeText && (
            <p className="text-xs text-amber-500">
              💡 Add your resume text to improve the quality of generated materials
            </p>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4" /> Key Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SKILLS.map((s) => (
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
          {skills.filter((s) => !COMMON_SKILLS.includes(s)).map((s) => (
            <Badge key={s} variant="default" className="text-xs gap-1 mr-1">
              {s} <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => toggleSkill(s)} />
            </Badge>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom skill..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
              className="text-sm"
            />
            <Button variant="outline" size="sm" onClick={addCustomSkill}>Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Master Cover Letter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Master Cover Letter</CardTitle>
          <CardDescription>A reusable base cover letter that gets tailored to each application</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={masterCoverLetter}
            onChange={(e) => setMasterCoverLetter(e.target.value)}
            rows={8}
            placeholder="Write your master cover letter template here..."
            className="text-sm"
          />
          {!masterCoverLetter && (
            <p className="text-xs text-amber-500 mt-2">
              💡 Add a master cover letter to improve the quality of generated cover letters
            </p>
          )}
        </CardContent>
      </Card>
      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                {deleting ? "Deleting…" : "Delete My Account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently erase your profile, all job applications, resumes, cover
                  letters, and every generated asset. This action cannot be undone and satisfies
                  your GDPR / CCPA right to erasure.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteAccount}
                >
                  Yes, permanently delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
    </PageShell>
  );
}
