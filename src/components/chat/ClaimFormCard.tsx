"use client";

import { useState } from "react";
import type { ClaimSubmissionPayload } from "@/types/claim";

type DocumentEntry = {
  file_id: string;
  file_name: string;
  actual_type: string;
  mime_type: string;
  file_content_base64: string;
  content_summary: string;
  content_source?: string;
};

type Props = {
  loading: boolean;
  variant?: "member" | "ops";
  onSubmit: (payload: ClaimSubmissionPayload) => Promise<void>;
};

const CATEGORIES = [
  "CONSULTATION",
  "DIAGNOSTIC",
  "PHARMACY",
  "DENTAL",
  "VISION",
  "ALTERNATIVE_MEDICINE",
];

const DOC_TYPES = [
  "PRESCRIPTION",
  "HOSPITAL_BILL",
  "PHARMACY_BILL",
  "LAB_REPORT",
  "DIAGNOSTIC_REPORT",
];

function guessDocType(fileName: string): string {
  const name = fileName.toLowerCase();
  if (name.includes("prescription") || name.includes("rx")) return "PRESCRIPTION";
  if (name.includes("pharmacy")) return "PHARMACY_BILL";
  if (name.includes("hospital") || name.includes("clinic") || name.includes("bill"))
    return "HOSPITAL_BILL";
  if (name.includes("lab") || name.includes("report")) return "LAB_REPORT";
  return "";
}

export default function ClaimFormCard({ loading, variant = "member", onSubmit }: Props) {
  const [memberId, setMemberId] = useState("EMP001");
  const [category, setCategory] = useState("CONSULTATION");
  const [treatmentDate, setTreatmentDate] = useState("2024-11-01");
  const [claimedAmount, setClaimedAmount] = useState(1500);
  const [hospitalName, setHospitalName] = useState("");
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [textDoc, setTextDoc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const addFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    setDocuments((prev) => [
      ...prev,
      {
        file_id: `F${prev.length + 1}`,
        file_name: file.name,
        actual_type: guessDocType(file.name),
        mime_type: file.type || "application/octet-stream",
        file_content_base64: base64,
        content_summary: "",
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const docs = [...documents];
    if (textDoc.trim()) {
      docs.push({
        file_id: `F${docs.length + 1}`,
        file_name: "prescription.txt",
        actual_type: "PRESCRIPTION",
        mime_type: "text/plain",
        file_content_base64: "",
        content_summary: textDoc,
        content_source: "user_paste",
      });
    }

    if (docs.length === 0) {
      setFormError("Upload at least one document.");
      return;
    }

    const untyped = docs.filter((d) => !d.actual_type);
    if (untyped.length > 0) {
      setFormError(`Select document type for: ${untyped.map((d) => d.file_name).join(", ")}`);
      return;
    }

    if (category === "CONSULTATION") {
      const types = docs.map((d) => d.actual_type);
      if (!types.includes("PRESCRIPTION") || !types.includes("HOSPITAL_BILL")) {
        setFormError(
          "Consultation claims need a PRESCRIPTION and a HOSPITAL_BILL (not pharmacy bill)."
        );
        return;
      }
    }

    onSubmit({
      member_id: memberId,
      policy_id: "PLUM_GHI_2024",
      claim_category: category,
      treatment_date: treatmentDate,
      claimed_amount: claimedAmount,
      hospital_name: hospitalName || undefined,
      documents: docs.map(({ file_content_base64, content_summary, actual_type, ...rest }) => ({
        ...rest,
        actual_type,
        file_content_base64: file_content_base64 || undefined,
        content_summary: content_summary || undefined,
      })),
    });
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text outline-none transition focus:border-plum-brand/50 focus:ring-2 focus:ring-plum-brand/10";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-white p-5 shadow-sm ring-1 ring-black/[0.03]"
    >
      <p className="mb-4 text-sm font-semibold text-text">
        {variant === "ops" ? "Claim input for adjudication" : "Submit your claim details"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-text-muted">Member ID</span>
          <input className={inputClass} value={memberId} onChange={(e) => setMemberId(e.target.value)} required />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-text-muted">Category</span>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace("_", " ")}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-text-muted">Treatment date</span>
          <input
            type="date"
            className={inputClass}
            value={treatmentDate}
            onChange={(e) => setTreatmentDate(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-text-muted">Claimed amount (₹)</span>
          <input
            type="number"
            className={inputClass}
            value={claimedAmount}
            onChange={(e) => setClaimedAmount(Number(e.target.value))}
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-text-muted">Hospital (optional)</span>
          <input
            className={inputClass}
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            placeholder="Apollo Hospitals"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-text-muted">
            Prescription text (optional if uploading images)
          </span>
          <textarea
            className={`${inputClass} font-mono`}
            rows={3}
            value={textDoc}
            onChange={(e) => setTextDoc(e.target.value)}
            placeholder={"Patient: Rajesh Kumar\nDiagnosis: Viral Fever"}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-text-muted">Documents</span>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.txt"
            className="mt-1 w-full rounded-xl border border-dashed border-border bg-surface-muted px-3 py-4 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-plum-brand file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-plum-brand-dark"
            onChange={(e) => {
              const files = e.target.files;
              if (files) Array.from(files).forEach(addFile);
            }}
          />
        </label>
      </div>

      {documents.length > 0 && (
        <ul className="mt-3 space-y-2">
          {documents.map((d, i) => (
            <li
              key={d.file_id}
              className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm"
            >
              <span className="font-medium text-text">{d.file_name}</span>
              <select
                className="rounded-lg border border-border px-2 py-1 text-xs"
                value={d.actual_type}
                onChange={(e) => {
                  const val = e.target.value;
                  setDocuments((prev) =>
                    prev.map((doc, idx) => (idx === i ? { ...doc, actual_type: val } : doc))
                  );
                }}
              >
                <option value="">Auto-detect</option>
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-plum-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-plum-brand-dark disabled:opacity-50"
      >
        {loading
          ? variant === "ops"
            ? "Running pipeline…"
            : "Processing claim…"
          : variant === "ops"
            ? "Run adjudication"
            : "Check claim decision"}
      </button>

      {formError && <p className="mt-3 text-sm text-rose-600">{formError}</p>}
    </form>
  );
}
