"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Compass, RefreshCw, Send, Target, TriangleAlert } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RouteGate } from "@/components/RouteGate";
import { useAuth } from "@/context/AuthContext";

type Role = { slug: string; name: string; summary: string; sourceNote: string };
type Gap = { skillName: string; requiredLevel: number; selfReportedLevel: number; demonstratedLevel: number; assessedLevel: number; assessedFrom: string; severity: string; priorityScore: number; whyItMatters: string; recommendedActivity: string; evidenceRequired: string };
type Profile = { targetRole?: { slug: string; name: string } | null; skills: { name: string; level: number; source?: string }[]; background: string; interests: string; careerStage: string; weeklyHours: number; gaps?: Gap[] };
type Roadmap = { id: number; revision: number; revisionToken: number; changeReason?: string | null; warnings?: string[]; items: { id: number; stage: string; title: string; objective: string; skillName: string; effortHours: number; evidenceRequired: string; status: string; targetDate?: string | null }[] };
type Evidence = { id: number; title: string; skillName: string; status: string; url?: string | null };

export default function CareerNavigatorPage() {
  return <RouteGate><CareerNavigator /></RouteGate>;
}

function CareerNavigator() {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [roleSlug, setRoleSlug] = useState("frontend-developer");
  const [skills, setSkills] = useState("HTML/CSS:1, JavaScript:1");
  const [background, setBackground] = useState("");
  const [interests, setInterests] = useState("");
  const [careerStage, setCareerStage] = useState("BEGINNER");
  const [weeklyHours, setWeeklyHours] = useState(6);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceSkill, setEvidenceSkill] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function request<T extends Record<string, unknown> = Record<string, unknown>>(path: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(path, { ...options, headers });
    const body = await response.text();
    let data: { detail?: string; [key: string]: unknown } = {};
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      throw new Error(`Server returned an invalid response (${response.status})`);
    }
    if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Request failed");
    return data as T;
  }

  async function load() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [roleResponse, profileResponse, roadmapResponse, evidenceResponse] = await Promise.all([
        request<{ roles: Role[] }>("/api/career-navigator/roles"),
        request<{ profile: Profile | null }>("/api/career-navigator/profile"),
        request<{ roadmap: Roadmap | null }>("/api/career-navigator/roadmap"),
        request<{ evidence: Evidence[] }>("/api/career-navigator/evidence"),
      ]);
      setRoles(roleResponse.roles || []);
      setProfile(profileResponse.profile);
      setRoadmap(roadmapResponse.roadmap);
      setEvidence(evidenceResponse.evidence || []);
      if (profileResponse.profile) {
        const saved = profileResponse.profile as Profile;
        setRoleSlug(saved.targetRole?.slug || "frontend-developer");
        setSkills((saved.skills || []).map((skill) => `${skill.name}:${skill.level}`).join(", "));
        setBackground(saved.background || "");
        setInterests(saved.interests || "");
        setCareerStage(saved.careerStage || "BEGINNER");
        setWeeklyHours(saved.weeklyHours || 6);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load Career Navigator");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  function parseSkills() {
    return skills.split(",").map((part) => {
      const [name, level] = part.split(":").map((value) => value.trim());
      return { name, level: Math.max(0, Math.min(5, Number(level || 1))), source: "SELF_REPORTED" };
    }).filter((skill) => skill.name);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const data = await request<{ profile: Profile | null }>("/api/career-navigator/profile", { method: "PATCH", body: JSON.stringify({ roleSlug, skills: parseSkills(), background, interests, careerStage, weeklyHours, previousProjects: [], targetDate: null, learningPreferences: "" }) });
      setProfile(data.profile); setMessage("Profile and assessment saved.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save profile"); } finally { setSaving(false); }
  }

  async function createRoadmap(action: "GENERATE" | "REPLAN") {
    setSaving(true); setError(""); setMessage("");
    try {
      const data = await request<{ roadmap: Roadmap | null }>("/api/career-navigator/roadmap", { method: "POST", body: JSON.stringify({ action, reason: action === "REPLAN" ? `Availability changed to ${weeklyHours} hours per week` : undefined, expectedRevisionToken: action === "REPLAN" ? roadmap?.revisionToken : undefined }) });
      setRoadmap(data.roadmap); setMessage(action === "REPLAN" ? "Unfinished work was rescheduled; completed work was preserved." : "Personalized roadmap generated from the saved assessment.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update roadmap"); } finally { setSaving(false); }
  }

  async function updateStatus(itemId: number, status: string) {
    if (!roadmap) return;
    try {
      const data = await request<{ item: { id: number; status: string } }>(`/api/career-navigator/roadmap/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ status, expectedRevisionToken: roadmap.revisionToken }) });
      setRoadmap((current) => current ? { ...current, revisionToken: current.revisionToken + 1, items: current.items.map((item) => item.id === data.item.id ? { ...item, ...data.item } : item) } : current);
      setMessage("Roadmap state saved.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save roadmap state"); }
  }

  async function submitEvidence(event: FormEvent) {
    event.preventDefault();
    try {
      await request("/api/career-navigator/evidence", { method: "POST", body: JSON.stringify({ title: evidenceTitle, type: "LIVE_PROJECT", skillName: evidenceSkill || profile?.gaps?.[0]?.skillName || "General", url: evidenceUrl }) });
      setEvidenceTitle(""); setEvidenceUrl(""); setMessage("Evidence submitted and marked awaiting review.");
      const data = await request<{ evidence: Evidence[] }>("/api/career-navigator/evidence"); setEvidence(data.evidence || []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to submit evidence"); }
  }

  async function askMentor(event: FormEvent) {
    event.preventDefault();
    try { const data = await request<{ answer: string }>("/api/career-navigator/mentor", { method: "POST", body: JSON.stringify({ question }) }); setAnswer(data.answer); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to answer mentor question"); }
  }

  return (
    <DashboardLayout title="Career Navigator" subtitle="A persisted, explainable path from your current skills to practical career evidence.">
      {loading ? <div className="card-surface p-8 text-sm text-surface-500">Loading your career workspace...</div> : <div className="space-y-6">
        {(error || message) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-danger-200 bg-danger-50 text-danger-700" : "border-success-200 bg-success-50 text-success-700"}`}>{error || message}</div>}
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <form onSubmit={saveProfile} className="card-surface space-y-4 p-6">
            <div className="flex items-center gap-3"><Compass className="h-5 w-5 text-primary-600" /><div><p className="text-xs font-bold uppercase tracking-widest text-primary-600">Learner profile</p><h2 className="font-heading text-xl font-semibold">Start with your context</h2></div></div>
            <label className="block text-sm font-medium">Target role<select value={roleSlug} onChange={(event) => setRoleSlug(event.target.value)} className="input mt-2">{roles.map((role) => <option key={role.slug} value={role.slug}>{role.name}</option>)}</select></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Career stage<select value={careerStage} onChange={(event) => setCareerStage(event.target.value)} className="input mt-2"><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></label><label className="block text-sm font-medium">Hours per week<input type="number" min="1" max="80" value={weeklyHours} onChange={(event) => setWeeklyHours(Number(event.target.value))} className="input mt-2" /></label></div>
            <label className="block text-sm font-medium">Skills and levels <span className="font-normal text-surface-400">(example: React:2, JavaScript:3)</span><input value={skills} onChange={(event) => setSkills(event.target.value)} className="input mt-2" /></label>
            <label className="block text-sm font-medium">Background<textarea value={background} onChange={(event) => setBackground(event.target.value)} className="input mt-2 min-h-20" /></label>
            <label className="block text-sm font-medium">Interests<textarea value={interests} onChange={(event) => setInterests(event.target.value)} className="input mt-2 min-h-16" /></label>
            <button disabled={saving} className="btn-primary">Save profile and assess</button>
          </form>
          <section className="card-surface p-6"><div className="flex items-center gap-3"><Target className="h-5 w-5 text-accent-600" /><div><p className="text-xs font-bold uppercase tracking-widest text-accent-600">Explainable gaps</p><h2 className="font-heading text-xl font-semibold">What matters next</h2></div></div><p className="mt-3 text-sm leading-6 text-surface-500">{profile?.targetRole ? roles.find((role) => role.slug === profile.targetRole?.slug)?.sourceNote : "Save a profile to calculate gaps against a curated framework."}</p><div className="mt-5 space-y-3">{(profile?.gaps || []).slice(0, 6).map((gap) => <div key={gap.skillName} className="rounded-xl border border-surface-200 p-3"><div className="flex justify-between gap-3 text-sm font-semibold"><span>{gap.skillName}</span><span className="text-xs text-primary-600">{gap.severity} · {gap.assessedFrom}</span></div><p className="mt-1 text-xs text-surface-500">Current {gap.assessedLevel} / required {gap.requiredLevel}. {gap.whyItMatters}</p></div>)}{!profile?.gaps?.length && <p className="text-sm text-surface-500">No assessment saved yet.</p>}</div></section>
        </div>
        <section className="card-surface p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-success-600">Roadmap</p><h2 className="font-heading text-xl font-semibold">Practice, submit, adapt</h2><p className="mt-1 text-sm text-surface-500">{roadmap ? `${roadmap.items.filter((item) => item.status === "COMPLETED").length} completed of ${roadmap.items.length}; revision ${roadmap.revision}.` : "Generate a plan after saving your profile."}</p></div><div className="flex gap-2"><button onClick={() => createRoadmap("GENERATE")} disabled={saving} className="btn-primary inline-flex items-center gap-2"><Target className="h-4 w-4" /> Generate</button>{roadmap && <button onClick={() => createRoadmap("REPLAN")} disabled={saving} className="btn-secondary inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Replan</button>}</div></div>{roadmap?.changeReason && <p className="mt-4 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">{roadmap.changeReason}</p>}<div className="mt-5 space-y-3">{roadmap?.items.map((item) => <article key={item.id} className="rounded-xl border border-surface-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-wider text-primary-600">{item.stage.replace("_", " ")} · {item.skillName}</span><h3 className="mt-1 font-semibold">{item.title}</h3><p className="mt-1 text-sm text-surface-500">{item.objective}</p></div><select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)} className="input w-auto py-2 text-xs"><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="BLOCKED">Blocked</option><option value="COMPLETED">Completed</option></select></div><p className="mt-3 text-xs text-surface-500">{item.effortHours} hours · target {item.targetDate ? new Date(item.targetDate).toLocaleDateString() : "flexible"} · evidence: {item.evidenceRequired}</p></article>)}{!roadmap && <p className="rounded-xl border border-dashed border-surface-300 p-8 text-center text-sm text-surface-500">No roadmap yet.</p>}</div></section>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]"><form onSubmit={submitEvidence} className="card-surface space-y-4 p-6"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-success-600" /><h2 className="font-heading text-xl font-semibold">Evidence vault</h2></div><input required value={evidenceTitle} onChange={(event) => setEvidenceTitle(event.target.value)} className="input" placeholder="Project or evidence title" /><input required type="url" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} className="input" placeholder="https://github.com/..." /><input value={evidenceSkill} onChange={(event) => setEvidenceSkill(event.target.value)} className="input" placeholder="Associated skill" /><p className="text-xs text-surface-400">Evidence is submitted for review; it is not automatically verified.</p><button className="btn-secondary inline-flex items-center gap-2"><Send className="h-4 w-4" /> Submit evidence</button><div className="space-y-2">{evidence.map((item) => <p key={item.id} className="text-xs text-surface-600">{item.title} · {item.skillName} · {item.status}</p>)}</div></form><section className="card-surface p-6"><div className="flex items-center gap-3"><Send className="h-5 w-5 text-primary-600" /><h2 className="font-heading text-xl font-semibold">Career mentor</h2></div><form onSubmit={askMentor} className="mt-4 space-y-3"><input required value={question} onChange={(event) => setQuestion(event.target.value)} className="input" placeholder="What should I complete this week?" /><button className="btn-primary">Ask from saved context</button></form>{answer && <p className="mt-4 rounded-xl bg-primary-50 p-4 text-sm leading-6 text-primary-900">{answer}</p>}</section></div>
        <p className="flex items-start gap-2 text-xs leading-5 text-surface-400"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />Career guidance is curated platform advice, not a promise of employment. Self-reported and submitted evidence remain distinct from reviewed evidence.</p>
      </div>}
    </DashboardLayout>
  );
}