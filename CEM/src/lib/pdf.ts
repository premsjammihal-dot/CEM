import { jsPDF } from "jspdf";
import type { Certificate, EventItem } from "@/services/types";
import { fmtDate } from "./utils";

/**
 * Certificate PDF generator (client-side, deterministic).
 * Produces a themed landscape A4 certificate with a unique verification ID.
 */

const NAVY: [number, number, number] = [9, 13, 25];
const PANEL: [number, number, number] = [17, 24, 39];
const PURPLE: [number, number, number] = [139, 92, 246];
const CYAN: [number, number, number] = [34, 211, 238];
const WHITE: [number, number, number] = [241, 245, 249];
const MUTED: [number, number, number] = [148, 163, 184];

export function downloadCertificatePdf(opts: {
  cert: Certificate;
  event: EventItem;
  studentName: string;
  usn: string;
  collegeName: string;
}): void {
  const { cert, event, studentName, usn, collegeName } = opts;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, H, "F");

  // Accent washes
  doc.setFillColor(30, 27, 60);
  doc.circle(W - 40, -30, 190, "F");
  doc.setFillColor(12, 40, 55);
  doc.circle(20, H + 20, 170, "F");

  // Double border
  doc.setDrawColor(...PURPLE);
  doc.setLineWidth(2.5);
  doc.roundedRect(24, 24, W - 48, H - 48, 14, 14, "S");
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.8);
  doc.roundedRect(34, 34, W - 68, H - 68, 10, 10, "S");

  // Header ribbon
  doc.setFillColor(...PANEL);
  doc.roundedRect(W / 2 - 140, 52, 280, 34, 17, 17, "F");
  doc.setTextColor(...CYAN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("C A M P U S S P H E R E", W / 2, 74, { align: "center" });

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(collegeName, W / 2, 108, { align: "center" });

  // Title
  const isWinner = cert.kind === "winner";
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text(isWinner ? "CERTIFICATE OF ACHIEVEMENT" : "CERTIFICATE OF PARTICIPATION", W / 2, 168, {
    align: "center",
  });

  doc.setDrawColor(...PURPLE);
  doc.setLineWidth(1.2);
  doc.line(W / 2 - 190, 186, W / 2 + 190, 186);

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(isWinner ? "This certificate is proudly presented to" : "This is to certify that", W / 2, 216, {
    align: "center",
  });

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(studentName, W / 2, 258, { align: "center" });

  doc.setTextColor(...CYAN);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(usn, W / 2, 280, { align: "center" });

  doc.setTextColor(...MUTED);
  doc.setFontSize(12.5);
  const line1 = isWinner
    ? `secured the position of ${cert.rank} in`
    : "has successfully participated in";
  doc.text(line1, W / 2, 312, { align: "center" });

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(event.title, W / 2, 344, { align: "center" });

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`held on ${fmtDate(event.date)} · organized via CampusSphere`, W / 2, 372, { align: "center" });

  // Footer: signature lines + cert id
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.7);
  doc.line(90, H - 120, 250, H - 120);
  doc.line(W - 250, H - 120, W - 90, H - 120);
  doc.setFontSize(10);
  doc.text("Event Coordinator", 170, H - 104, { align: "center" });
  doc.text("Head of Institution", W - 170, H - 104, { align: "center" });

  doc.setTextColor(...CYAN);
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.text(`Certificate ID: ${cert.certUid}`, W / 2, H - 78, { align: "center" });

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Issued ${fmtDate(cert.issuedAt.slice(0, 10))} · Verify at campussphere.edu/verify`, W / 2, H - 60, {
    align: "center",
  });

  doc.save(`CampusSphere-${cert.certUid}.pdf`);
}
