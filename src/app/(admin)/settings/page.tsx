"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Sparkles, Link2 } from "lucide-react";
import { Section } from "@/components/Section";
import { useApiData } from "@/lib/use-api";
import { BRANCHES, BRANCH_LABELS, EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS, POSITIONS, POSITION_LABELS } from "@/lib/constants";

export default function SettingsPage() {
  const { data } = useApiData<{ aiConfigured: boolean }>("/api/settings");
  const [copied, setCopied] = useState(false);

  // Starts as the relative path (matches server-rendered HTML) and is
  // upgraded to an absolute URL after mount, to avoid a hydration mismatch
  // from reading window.location during render.
  const [applyUrl, setApplyUrl] = useState("/apply");
  useEffect(() => {
    // window is only available client-side, so this can't be computed
    // during render without diverging from the server-rendered HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApplyUrl(`${window.location.origin}/apply`);
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(applyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500">Reference information for DRINKAT Recruitment.</p>
      </div>

      <Section title="Public Application Link" icon={Link2}>
        <p className="text-sm text-stone-600">
          Share this link with candidates. It opens a mobile-friendly form — no login required.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-700">{applyUrl}</code>
          <button
            onClick={copyLink}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-800"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </Section>

      <Section title="AI Features" icon={Sparkles}>
        {data?.aiConfigured ? (
          <p className="text-sm text-emerald-700">
            AI-powered CV summaries and interview questions are active, using Claude.
          </p>
        ) : (
          <p className="text-sm text-stone-600">
            CV summaries and interview questions are currently generated with smart built-in templates. Set an{" "}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">ANTHROPIC_API_KEY</code> environment variable to switch on
            full AI-generated summaries and tailored interview questions.
          </p>
        )}
      </Section>

      <Section title="Positions">
        <div className="flex flex-wrap gap-1.5">
          {POSITIONS.map((p) => (
            <span key={p} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
              {POSITION_LABELS[p]}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Branches">
        <div className="flex flex-wrap gap-1.5">
          {BRANCHES.map((b) => (
            <span key={b} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
              {BRANCH_LABELS[b]}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Employment Types">
        <div className="flex flex-wrap gap-1.5">
          {EMPLOYMENT_TYPES.map((e) => (
            <span key={e} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
              {EMPLOYMENT_TYPE_LABELS[e]}
            </span>
          ))}
        </div>
      </Section>

      <p className="text-center text-xs text-stone-400">DRINKAT Recruitment</p>
    </div>
  );
}
