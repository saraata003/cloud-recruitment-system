"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_TEMPLATES, type WhatsAppTemplateKey } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/utils";
import { Button } from "./Button";

function messageFor(key: WhatsAppTemplateKey, name: string, position: string, branch: string): string {
  switch (key) {
    case "INTERVIEW_INVITATION":
      return WHATSAPP_TEMPLATES.INTERVIEW_INVITATION.build(name, branch);
    case "ACCEPTED":
      return WHATSAPP_TEMPLATES.ACCEPTED.build(name, position);
    case "NOT_SELECTED":
      return WHATSAPP_TEMPLATES.NOT_SELECTED.build(name);
    case "KEEP_FOR_FUTURE":
      return WHATSAPP_TEMPLATES.KEEP_FOR_FUTURE.build(name);
  }
}

export function WhatsAppButton({
  phone,
  name,
  position,
  branch,
}: {
  phone: string;
  name: string;
  position: string;
  branch: string;
}) {
  const [open, setOpen] = useState(false);

  function send(key: WhatsAppTemplateKey) {
    window.open(buildWhatsAppLink(phone, messageFor(key, name, position, branch)), "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button variant="whatsapp" size="md" onClick={() => setOpen((o) => !o)}>
        <MessageCircle size={16} /> WhatsApp
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Send a message
            </p>
            {(Object.keys(WHATSAPP_TEMPLATES) as WhatsAppTemplateKey[]).map((key) => (
              <button
                key={key}
                onClick={() => send(key)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
              >
                {WHATSAPP_TEMPLATES[key].label}
              </button>
            ))}
            <div className="my-1 border-t border-stone-100" />
            <button
              onClick={() => {
                window.open(buildWhatsAppLink(phone, ""), "_blank", "noopener,noreferrer");
                setOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-stone-500 hover:bg-stone-50"
            >
              Open blank chat
            </button>
          </div>
        </>
      )}
    </div>
  );
}
