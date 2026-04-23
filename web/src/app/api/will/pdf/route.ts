export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";

type Asset = {
  id: string;
  type: string;
  description: string;
  value: number | null;
};

type Beneficiary = {
  id: string;
  fullName: string;
  relationship: string;
  isMinor: boolean;
};

type Executor = {
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
};

type Allocation = {
  beneficiaryId: string;
  percentage: number;
};

type Distributions = Record<string, Allocation[]>;

type Witness = {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
};

type PersonalDetails = {
  fullName?: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  maritalStatus?: string;
  spouseFullName?: string;
  spouseIdNumber?: string;
  numberOfChildren?: number;
};

type Confirmations = {
  confirmed?: boolean;
  confirmedAt?: unknown;
};

type ResidueInfo =
  | { mode: "EQUAL" }
  | { mode: "BENEFICIARY"; beneficiaryId: string }
  | { mode: "PERCENTAGES"; allocations: Allocation[] };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function safeNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function getUserFieldString(
  user: unknown,
  key: "fullName" | "email"
): string | undefined {
  if (!isObject(user)) return undefined;
  return safeString(user[key]);
}

function formatZAR(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
}

function safeDateFromUnknown(input: unknown): Date | null {
  if (!input) return null;

  if (input instanceof Date) {
    return Number.isFinite(input.getTime()) ? input : null;
  }

  if (typeof input === "string" || typeof input === "number") {
    const d = new Date(input);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  if (isObject(input)) {
    const maybe = input.value ?? input.date ?? input.iso ?? input.timestamp;
    if (typeof maybe === "string" || typeof maybe === "number") {
      const d = new Date(maybe);
      return Number.isFinite(d.getTime()) ? d : null;
    }
  }

  return null;
}

function formatDateZA(d: Date) {
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

/**
 * Sanitizes text so it won't crash pdf-lib's WinAnsi encoding (Helvetica/StandardFonts).
 * Replaces common “smart” punctuation + symbols with ASCII alternatives, removes control chars,
 * and strips characters outside a safe WinAnsi-ish subset.
 */
function sanitizeWinAnsi(input: string): string {
  let s = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

  const replacements: Array<[RegExp, string]> = [
    [/[\u2018\u2019\u201A\u201B]/g, "'"],
    [/[\u201C\u201D\u201E\u201F]/g, '"'],
    [/[\u2013\u2014\u2212]/g, "-"],
    [/\u2026/g, "..."],
    [/\u00A0/g, " "],
    [/\u2022/g, "*"],
    [/\u00B7/g, "*"],
    [/\u00D7/g, "x"],
    [/\u00F7/g, "/"],
    [/\u2264/g, "<="],
    [/\u2265/g, ">="],
    [/\u2260/g, "!="],
    [
      /\u2248|\u2249|\u224A|\u224B|\u224C|\u224D|\u224E|\u224F|\u2250|\u2251|\u2252|\u2253|\u2254|\u2255|\u2256|\u2257|\u2258|\u2259|\u225A|\u225B|\u225C|\u225D|\u225E|\u225F/g,
      "~",
    ],
    [/\u2248|\u2243|\u2245|\u2247|\u2246|\u2242|\u2241|\u2240|\u223C|\u223D/g, "~"],
    [/\u2248/g, "~"],
    [/\u20AC/g, "EUR"],
    [/\u00A3/g, "GBP"],
    [/\u00A5/g, "JPY"],
    [/\u2122/g, "TM"],
    [/\u00AE/g, "(R)"],
    [/\u00A9/g, "(C)"],
    [/\u2192/g, "->"],
    [/\u2190/g, "<-"],
    [/\u2020/g, "+"],
    [/\u2021/g, "++"],
  ];

  for (const [re, rep] of replacements) s = s.replace(re, rep);

  s = s.replace(/[^\x09\x0A\x20-\x7E]/g, "");
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n");

  return s;
}

function safePersonalDetails(data: unknown): PersonalDetails | null {
  if (!isObject(data)) return null;
  const p = data.personalDetails;
  if (!isObject(p)) return null;

  const out: PersonalDetails = {};
  const pickStr = (k: keyof PersonalDetails) => {
    const v = (p as Record<string, unknown>)[k as string];
    const s = safeString(v);
    if (s) (out as Record<string, unknown>)[k as string] = s;
  };
  const pickNum = (k: keyof PersonalDetails) => {
    const v = (p as Record<string, unknown>)[k as string];
    const n = safeNumber(v);
    if (typeof n === "number")
      (out as Record<string, unknown>)[k as string] = n;
  };

  pickStr("fullName");
  pickStr("idNumber");
  pickStr("email");
  pickStr("phone");
  pickStr("address");
  pickStr("city");
  pickStr("province");
  pickStr("postalCode");
  pickStr("maritalStatus");
  pickStr("spouseFullName");
  pickStr("spouseIdNumber");
  pickNum("numberOfChildren");

  return Object.keys(out).length ? out : null;
}

function safeAssets(data: unknown): Asset[] {
  if (!isObject(data)) return [];
  const a = data.assets;
  if (!Array.isArray(a)) return [];
  const out: Asset[] = [];
  for (const item of a) {
    if (!isObject(item)) continue;
    const id = typeof item.id === "string" ? item.id : "";
    const type = typeof item.type === "string" ? item.type : "Other";
    const description =
      typeof item.description === "string" ? item.description : "";
    const value = typeof item.value === "number" ? item.value : null;
    if (!id || !description) continue;
    out.push({ id, type, description, value });
  }
  return out;
}

function safeBeneficiaries(data: unknown): Beneficiary[] {
  if (!isObject(data)) return [];
  const b = data.beneficiaries;
  if (!Array.isArray(b)) return [];
  const out: Beneficiary[] = [];
  for (const item of b) {
    if (!isObject(item)) continue;
    const id = typeof item.id === "string" ? item.id : "";
    const fullName = typeof item.fullName === "string" ? item.fullName : "";
    const relationship =
      typeof item.relationship === "string" ? item.relationship : "";
    const isMinor = typeof item.isMinor === "boolean" ? item.isMinor : false;
    if (!id || !fullName) continue;
    out.push({ id, fullName, relationship, isMinor });
  }
  return out;
}

function safeExecutors(data: unknown): {
  primary: Executor | null;
  alternate: Executor | null;
} {
  if (!isObject(data)) return { primary: null, alternate: null };
  const ex = data.executors;
  if (!isObject(ex)) return { primary: null, alternate: null };

  const primary = isObject(ex.primary)
    ? {
        fullName:
          typeof ex.primary.fullName === "string" ? ex.primary.fullName : "",
        idNumber:
          typeof ex.primary.idNumber === "string" ? ex.primary.idNumber : "",
        email: typeof ex.primary.email === "string" ? ex.primary.email : "",
        phone: typeof ex.primary.phone === "string" ? ex.primary.phone : "",
      }
    : null;

  const alternate = isObject(ex.alternate)
    ? {
        fullName:
          typeof ex.alternate.fullName === "string"
            ? ex.alternate.fullName
            : "",
        idNumber:
          typeof ex.alternate.idNumber === "string"
            ? ex.alternate.idNumber
            : "",
        email:
          typeof ex.alternate.email === "string" ? ex.alternate.email : "",
        phone:
          typeof ex.alternate.phone === "string" ? ex.alternate.phone : "",
      }
    : null;

  return { primary, alternate };
}

function safeDistributions(data: unknown): Distributions {
  if (!isObject(data)) return {};
  const d = data.distributions;
  if (!isObject(d)) return {};

  const out: Distributions = {};
  for (const [assetId, allocsUnknown] of Object.entries(d)) {
    if (!Array.isArray(allocsUnknown)) continue;
    const allocs: Allocation[] = [];
    for (const a of allocsUnknown) {
      if (!isObject(a)) continue;
      const beneficiaryId =
        typeof a.beneficiaryId === "string" ? a.beneficiaryId : "";
      const percentage =
        typeof a.percentage === "number" ? a.percentage : NaN;
      if (!beneficiaryId) continue;
      if (!Number.isFinite(percentage)) continue;
      allocs.push({ beneficiaryId, percentage });
    }
    out[assetId] = allocs;
  }
  return out;
}

function safeWitnesses(data: unknown): Witness[] {
  if (!isObject(data)) return [];
  const w = data.witnesses;
  if (!Array.isArray(w)) return [];
  const out: Witness[] = [];
  for (const item of w) {
    if (!isObject(item)) continue;
    out.push({
      id: typeof item.id === "string" ? item.id : "",
      fullName: typeof item.fullName === "string" ? item.fullName : "",
      idNumber: typeof item.idNumber === "string" ? item.idNumber : "",
      phone: typeof item.phone === "string" ? item.phone : "",
      email: typeof item.email === "string" ? item.email : "",
    });
  }
  return out;
}

function safeConfirmations(data: unknown): Confirmations | null {
  if (!isObject(data)) return null;
  const c = data.confirmations;
  if (!isObject(c)) return null;

  const confirmed =
    typeof c.confirmed === "boolean" ? c.confirmed : undefined;
  const confirmedAt: unknown = (c as Record<string, unknown>).confirmedAt;

  if (
    typeof confirmed === "undefined" &&
    (confirmedAt === null || typeof confirmedAt === "undefined")
  ) {
    return null;
  }

  return { confirmed, confirmedAt };
}

function safeResidueInfo(data: unknown): ResidueInfo {
  if (!isObject(data)) return { mode: "EQUAL" };

  const r = (data as Record<string, unknown>).residue;
  if (!isObject(r)) return { mode: "EQUAL" };

  const mode = safeString((r as Record<string, unknown>).mode)?.toUpperCase();
  if (mode === "BENEFICIARY") {
    const beneficiaryId = safeString(
      (r as Record<string, unknown>).beneficiaryId
    );
    if (beneficiaryId) return { mode: "BENEFICIARY", beneficiaryId };
  }

  if (mode === "PERCENTAGES") {
    const allocsUnknown = (r as Record<string, unknown>).allocations;
    if (Array.isArray(allocsUnknown)) {
      const allocations: Allocation[] = [];
      for (const a of allocsUnknown) {
        if (!isObject(a)) continue;
        const beneficiaryId =
          safeString((a as Record<string, unknown>).beneficiaryId) ?? "";
        const percentage = safeNumber(
          (a as Record<string, unknown>).percentage
        );
        if (!beneficiaryId) continue;
        if (typeof percentage !== "number") continue;
        allocations.push({ beneficiaryId, percentage });
      }
      if (allocations.length) return { mode: "PERCENTAGES", allocations };
    }
  }

  return { mode: "EQUAL" };
}

type PdfLayout = {
  pageW: number;
  pageH: number;
  margin: number;
  bottom: number;
  width: number;
};

class PdfWriter {
  private pdf: PDFDocument;
  private layout: PdfLayout;
  private font: PDFFont;
  private fontBold: PDFFont;
  private page: PDFPage;
  private y: number;

  constructor(args: {
    pdf: PDFDocument;
    layout: PdfLayout;
    font: PDFFont;
    fontBold: PDFFont;
  }) {
    this.pdf = args.pdf;
    this.layout = args.layout;
    this.font = args.font;
    this.fontBold = args.fontBold;
    this.page = this.pdf.addPage([this.layout.pageW, this.layout.pageH]);
    this.y = this.layout.pageH - this.layout.margin;
  }

  private ensureSpace(minSpace: number) {
    if (this.y - minSpace <= this.layout.bottom) {
      this.page = this.pdf.addPage([this.layout.pageW, this.layout.pageH]);
      this.y = this.layout.pageH - this.layout.margin;
    }
  }

  private textWidth(text: string, size: number, bold: boolean) {
    const f = bold ? this.fontBold : this.font;
    return f.widthOfTextAtSize(text, size);
  }

  private wrap(
    text: string,
    size: number,
    bold: boolean,
    maxWidth: number
  ): string[] {
    const cleaned = sanitizeWinAnsi(text).replace(/\s+/g, " ").trim();
    if (!cleaned) return [""];
    const words = cleaned.split(" ");
    const lines: string[] = [];
    let line = "";

    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (this.textWidth(test, size, bold) <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        if (this.textWidth(w, size, bold) > maxWidth) {
          let chunk = "";
          for (const ch of w) {
            const t = chunk + ch;
            if (this.textWidth(t, size, bold) <= maxWidth) chunk = t;
            else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          line = chunk;
        } else {
          line = w;
        }
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  public spacer(px: number) {
    this.ensureSpace(px);
    this.y -= px;
  }

  public hr() {
    this.ensureSpace(18);
    this.y -= 8;
    this.page.drawLine({
      start: { x: this.layout.margin, y: this.y },
      end: { x: this.layout.margin + this.layout.width, y: this.y },
      thickness: 1,
      color: rgb(0.86, 0.86, 0.86),
    });
    this.y -= 10;
  }

  public heading(text: string) {
    this.ensureSpace(28);
    this.spacer(6);
    this.drawText(text, { size: 12, bold: true });
    this.spacer(2);
  }

  public title(text: string) {
    this.ensureSpace(40);
    this.drawText(text, { size: 18, bold: true });
    this.spacer(6);
  }

  public subTitle(text: string) {
    this.ensureSpace(18);
    this.drawText(text, {
      size: 10,
      bold: false,
      color: rgb(0.27, 0.27, 0.27),
    });
  }

  public drawText(
    text: string,
    opts?: {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      indent?: number;
      lineGap?: number;
    }
  ) {
    const size = opts?.size ?? 10;
    const bold = opts?.bold ?? false;
    const color = opts?.color ?? rgb(0.07, 0.07, 0.07);
    const indent = opts?.indent ?? 0;
    const lineGap = opts?.lineGap ?? 6;
    const x = this.layout.margin + indent;
    const maxWidth = this.layout.width - indent;

    const safeText = sanitizeWinAnsi(text);
    const lines = this.wrap(safeText, size, bold, maxWidth);
    const minSpace = lines.length * (size + lineGap) + 2;
    this.ensureSpace(minSpace);

    const f = bold ? this.fontBold : this.font;
    for (const line of lines) {
      const safeLine = sanitizeWinAnsi(line);
      this.page.drawText(safeLine, {
        x,
        y: this.y,
        size,
        font: f,
        color,
        maxWidth,
      });
      this.y -= size + lineGap;
    }
  }

  public bullet(text: string, opts?: { size?: number; indent?: number }) {
    const size = opts?.size ?? 10;
    const indent = opts?.indent ?? 0;
    const bulletIndent = indent + 10;

    this.ensureSpace(size + 10);
    this.page.drawText("•", {
      x: this.layout.margin + indent,
      y: this.y,
      size,
      font: this.font,
      color: rgb(0.07, 0.07, 0.07),
    });
    this.drawText(text, { size, indent: bulletIndent, lineGap: 6 });
  }

  public keyValue(label: string, value: string) {
    this.drawText(`${label}: ${value}`);
  }

  public signatureBlock(args: {
    title: string;
    nameLine?: string;
    idLine?: string;
  }) {
    this.ensureSpace(110);

    this.drawText(args.title, { size: 10, bold: true });
    this.spacer(6);

    const sigY = this.y;
    this.page.drawLine({
      start: { x: this.layout.margin, y: sigY },
      end: { x: this.layout.margin + this.layout.width, y: sigY },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.y -= 18;
    this.drawText("Signature", { size: 9, color: rgb(0.27, 0.27, 0.27) });
    this.spacer(6);

    if (args.nameLine) this.drawText(args.nameLine, { size: 10 });
    if (args.idLine) this.drawText(args.idLine, { size: 10 });

    this.spacer(6);
    this.drawText(
      "Date: ____________________________    Place: ____________________________",
      { size: 10 }
    );

    this.spacer(10);
  }
}

function buildAddress(personal: PersonalDetails | null) {
  const address = [
    personal?.address,
    personal?.city,
    personal?.province,
    personal?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
  return address || "—";
}

function safeTextOrPlaceholder(v?: string, placeholder = "—") {
  const s = safeString(v);
  return s ?? placeholder;
}

function percentTotal(allocs: Allocation[]) {
  let t = 0;
  for (const a of allocs) {
    if (Number.isFinite(a.percentage)) t += a.percentage;
  }
  return Math.round(t * 100) / 100;
}

function normalizePercentages(allocs: Allocation[]) {
  return allocs
    .filter((a) => a.beneficiaryId && Number.isFinite(a.percentage))
    .map((a) => ({ beneficiaryId: a.beneficiaryId, percentage: a.percentage }));
}

function computeDefaultResidue(
  beneficiaries: Beneficiary[],
  residue: ResidueInfo
): Allocation[] {
  const valid = beneficiaries.map((b) => b.id).filter(Boolean);
  if (valid.length === 0) return [];

  if (residue.mode === "BENEFICIARY") {
    if (valid.includes(residue.beneficiaryId)) {
      return [{ beneficiaryId: residue.beneficiaryId, percentage: 100 }];
    }
    return [];
  }

  if (residue.mode === "PERCENTAGES") {
    const allocs = normalizePercentages(residue.allocations).filter((a) =>
      valid.includes(a.beneficiaryId)
    );
    if (!allocs.length) return [];
    return allocs;
  }

  const each = Math.round((100 / valid.length) * 100) / 100;
  const allocs: Allocation[] = valid.map((id, i) => ({
    beneficiaryId: id,
    percentage:
      i === valid.length - 1
        ? Math.round((100 - each * (valid.length - 1)) * 100) / 100
        : each,
  }));
  return allocs;
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
  }

  if (!user.onboardingCompleted) {
    return NextResponse.json(
      { error: "ONBOARDING_INCOMPLETE" },
      { status: 403 }
    );
  }

  const draft = await prisma.willDraft.findUnique({
    where: { userId: user.id },
    select: { status: true, updatedAt: true, data: true },
  });

  if (!draft) {
    return NextResponse.json({ error: "NO_DRAFT" }, { status: 404 });
  }

  if (draft.status !== "LOCKED") {
    return NextResponse.json(
      {
        error: "NOT_LOCKED",
        message: "Will must be locked before downloading PDF.",
      },
      { status: 400 }
    );
  }

  const data = draft.data as unknown;

  const personal = safePersonalDetails(data);
  const assets = safeAssets(data);
  const beneficiaries = safeBeneficiaries(data);
  const executors = safeExecutors(data);
  const distributions = safeDistributions(data);
  const witnesses = safeWitnesses(data);
  const confirmations = safeConfirmations(data);
  const residueInfo = safeResidueInfo(data);

  const beneficiaryById = new Map<string, Beneficiary>();
  for (const b of beneficiaries) beneficiaryById.set(b.id, b);

  const userFullName = getUserFieldString(user, "fullName");
  const userEmail = getUserFieldString(user, "email");

  const testatorName = safeTextOrPlaceholder(
    personal?.fullName ?? userFullName ?? undefined,
    "__________________________"
  );
  const testatorId = safeTextOrPlaceholder(
    personal?.idNumber,
    "__________________________"
  );
  const testatorEmail = safeTextOrPlaceholder(
    personal?.email ?? userEmail ?? undefined,
    "—"
  );
  const testatorPhone = safeTextOrPlaceholder(personal?.phone, "—");
  const testatorAddress = buildAddress(personal);

  const placeForDisplay = safeTextOrPlaceholder(
    personal?.city,
    "__________________________"
  );

  const confirmedAtDate = safeDateFromUnknown(confirmations?.confirmedAt);
  const generatedAt = confirmedAtDate ?? draft.updatedAt;
  const generatedDateForDisplay = formatDateZA(generatedAt);

  const primaryExecutorName = safeTextOrPlaceholder(
    executors.primary?.fullName,
    "__________________________"
  );
  const primaryExecutorId = safeTextOrPlaceholder(
    executors.primary?.idNumber,
    "__________________________"
  );
  const alternateExecutorName = safeTextOrPlaceholder(
    executors.alternate?.fullName,
    "__________________________"
  );
  const alternateExecutorId = safeTextOrPlaceholder(
    executors.alternate?.idNumber,
    "__________________________"
  );

  const minorBeneficiaries = beneficiaries.filter((b) => b.isMinor);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const layout: PdfLayout = {
    pageW: 595.28,
    pageH: 841.89,
    margin: 50,
    bottom: 55,
    width: 595.28 - 100,
  };

  const w = new PdfWriter({ pdf, layout, font, fontBold });

  w.title("LAST WILL AND TESTAMENT");
  w.subTitle(`Generated by KeepSave • ${generatedDateForDisplay}`);
  w.hr();

  w.heading("1. TESTATOR IDENTIFICATION");
  w.drawText(
    `I, ${testatorName}, Identity/Passport Number ${testatorId}, residing at ${testatorAddress}, hereby declare this document to be my Last Will and Testament.`
  );
  w.spacer(6);
  w.keyValue("Email", testatorEmail);
  w.keyValue("Phone", testatorPhone);

  w.heading("2. REVOCATION OF PREVIOUS WILLS");
  w.drawText(
    "I revoke all prior wills, codicils and testamentary dispositions previously made by me."
  );

  w.heading("3. DECLARATION");
  w.drawText(
    "I declare that I am of sound mind and disposing memory, that I understand the nature and effect of this Will, and that I sign it freely and voluntarily."
  );

  w.heading("4. MARITAL STATUS AND DEPENDANTS");
  const maritalStatus = safeTextOrPlaceholder(
    personal?.maritalStatus,
    "__________________________"
  );
  w.drawText(`Marital status: ${maritalStatus}`);
  const childrenCount =
    typeof personal?.numberOfChildren === "number"
      ? String(personal.numberOfChildren)
      : "__________________________";
  w.drawText(`Number of children / dependants: ${childrenCount}`);
  w.spacer(6);

  if (minorBeneficiaries.length > 0) {
    w.drawText("The following beneficiaries are recorded as minors:");
    for (const b of minorBeneficiaries) {
      const rel = b.relationship ? ` (${b.relationship})` : "";
      w.bullet(`${b.fullName}${rel}`);
    }
  } else {
    w.drawText(
      "If I have any minor children or minor beneficiaries at the time of my death, guardianship provisions may be required."
    );
  }

  w.spacer(6);
  w.drawText(
    "Guardian placeholder: I appoint ____________________________ (ID: ____________________________) as guardian of any minor children or minor beneficiaries, subject to lawful requirements. (This clause will be refined when a guardian step is added.)"
  );

  w.heading("5. APPOINTMENT OF EXECUTOR");
  w.drawText(
    `I nominate and appoint ${primaryExecutorName} (ID: ${primaryExecutorId}) as the Executor of my estate.`
  );
  w.spacer(6);
  w.drawText(
    `If the above Executor is unable or unwilling to act, I nominate and appoint ${alternateExecutorName} (ID: ${alternateExecutorId}) as alternate Executor.`
  );
  w.spacer(8);
  w.drawText("Executor powers:");
  w.bullet(
    "To administer my estate in accordance with South African law, to collect assets, pay debts, expenses and taxes, and to distribute the remainder in terms of this Will."
  );
  w.bullet(
    "To sell, exchange, lease or otherwise deal with assets of the estate as reasonably necessary."
  );
  w.bullet(
    "To sign all documents and do all things necessary to give effect to this Will."
  );

  w.heading("6. SCHEDULE OF BENEFICIARIES");
  if (beneficiaries.length === 0) {
    w.drawText(
      "No beneficiaries have been captured. This Will cannot be completed without at least one beneficiary."
    );
  } else {
    w.drawText("I record the following beneficiaries:");
    for (const b of beneficiaries) {
      const rel = b.relationship ? ` — ${b.relationship}` : "";
      const minor = b.isMinor ? " (Minor)" : "";
      w.bullet(`${b.fullName}${rel}${minor}`);
    }
  }

  w.heading("7. ASSET DISTRIBUTION SCHEDULE");
  if (assets.length === 0) {
    w.drawText("No assets have been captured.");
  } else if (beneficiaries.length === 0) {
    w.drawText(
      "Assets are captured, but beneficiaries are missing. Please add beneficiaries to allocate assets."
    );
  } else {
    w.drawText(
      "I bequeath the following assets and allocations. Percentages reflect the intended share of each listed asset."
    );
    w.spacer(6);

    for (const a of assets) {
      const valueStr =
        a.value !== null ? ` • Estimated value: ${formatZAR(a.value)}` : "";
      w.drawText(`${a.type}: ${a.description}${valueStr}`, { bold: true });

      const allocs = normalizePercentages(distributions[a.id] ?? []);
      if (allocs.length === 0) {
        w.drawText("No allocations captured for this asset.", {
          color: rgb(0.27, 0.27, 0.27),
        });
        w.spacer(6);
        continue;
      }

      const total = percentTotal(allocs);
      w.drawText(`Total allocation recorded: ${total}%`, {
        size: 9,
        color: rgb(0.27, 0.27, 0.27),
      });

      for (const x of allocs) {
        const b = beneficiaryById.get(x.beneficiaryId);
        const name = b ? b.fullName : "Unknown beneficiary";
        if (a.value !== null && Number.isFinite(a.value)) {
          const amount = (a.value * x.percentage) / 100;
          w.bullet(`${name} — ${x.percentage}% (~ ${formatZAR(amount)})`, {
            indent: 4,
          });
        } else {
          w.bullet(`${name} — ${x.percentage}%`, { indent: 4 });
        }
      }

      w.spacer(8);
    }
  }

  w.heading("8. RESIDUE OF ESTATE");
  if (beneficiaries.length === 0) {
    w.drawText(
      "Residue clause cannot be applied because no beneficiaries are recorded. Please add beneficiaries."
    );
  } else {
    const residueAllocations = computeDefaultResidue(
      beneficiaries,
      residueInfo
    );
    w.drawText(
      "I direct that the residue of my estate (being all property not otherwise specifically bequeathed in this Will) shall be distributed as follows:"
    );
    w.spacer(6);

    if (residueAllocations.length === 0) {
      w.drawText(
        "Residue allocations could not be determined. Default is equal split among beneficiaries.",
        {
          color: rgb(0.27, 0.27, 0.27),
        }
      );
    } else {
      const total = percentTotal(residueAllocations);
      w.drawText(`Residue allocation total: ${total}%`, {
        size: 9,
        color: rgb(0.27, 0.27, 0.27),
      });
      for (const a of residueAllocations) {
        const b = beneficiaryById.get(a.beneficiaryId);
        w.bullet(
          `${b ? b.fullName : "Unknown beneficiary"} — ${a.percentage}%`,
          { indent: 4 }
        );
      }
    }
  }

  w.heading("9. SIGNING AND WITNESSING");
  w.drawText(
    "I sign this Will in the presence of the undersigned witnesses, all being present at the same time, and the witnesses sign in my presence and in the presence of each other."
  );
  w.spacer(8);
  w.drawText(
    `Signed at ${placeForDisplay} on this ______ day of __________________ 20____.`
  );

  w.spacer(14);

  w.signatureBlock({
    title: "TESTATOR",
    nameLine: `Full Name: ${testatorName}`,
    idLine: `ID / Passport: ${testatorId}`,
  });

  const w1 = witnesses[0];
  const w2 = witnesses[1];

  w.signatureBlock({
    title: "WITNESS 1",
    nameLine: `Full Name: ${safeTextOrPlaceholder(
      w1?.fullName,
      "__________________________"
    )}`,
    idLine: `ID / Passport: ${safeTextOrPlaceholder(
      w1?.idNumber,
      "__________________________"
    )}`,
  });

  w.signatureBlock({
    title: "WITNESS 2",
    nameLine: `Full Name: ${safeTextOrPlaceholder(
      w2?.fullName,
      "__________________________"
    )}`,
    idLine: `ID / Passport: ${safeTextOrPlaceholder(
      w2?.idNumber,
      "__________________________"
    )}`,
  });

  w.spacer(6);
  w.drawText(
    "Note: This document is generated from information you provided in KeepSave. If you are unsure about any clause or your circumstances are complex (e.g., minors, trusts, overseas assets), seek advice from a qualified South African legal professional.",
    { size: 9, color: rgb(0.27, 0.27, 0.27) }
  );

  const bytes = await pdf.save();
  const body = new Uint8Array(bytes);

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="KeepSave-last-will-and-testament.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
