import { Award, Download, Medal } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { myCertificates } from "@/services/results";
import { downloadCertificatePdf } from "@/lib/pdf";
import { db } from "@/services/db";
import { fmtDate } from "@/lib/utils";
import { Badge, Button, EmptyState, LinkButton } from "@/components/ui";
import { useToast } from "@/components/overlays";

export default function CertificatesPage() {
  const { user, student } = useApp();
  const toast = useToast();
  if (!user) return null;
  const certs = myCertificates(user.id);

  const download = (view: (typeof certs)[number]) => {
    downloadCertificatePdf({
      cert: view.cert,
      event: view.event,
      studentName: user.name,
      usn: student?.usn ?? "",
      collegeName: db().settings.collegeName,
    });
    toast.success("Certificate downloaded", view.cert.certUid);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Certificates</h1>
        <p className="mt-1 text-sm text-muted">Verifiable PDFs with unique IDs — participation and victory, forever yours.</p>
      </div>

      {certs.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          body="Attend an event and it lands here the moment organizers issue certificates."
          action={<LinkButton to="/events">Browse events</LinkButton>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {certs.map((c) => {
            const winner = c.cert.kind === "winner";
            return (
              <div key={c.cert.id} className="glass card-hover relative overflow-hidden rounded-2xl p-6">
                <div className={`absolute -right-10 -top-10 size-32 rounded-full blur-3xl ${winner ? "bg-amber-500/20" : "bg-cyan-500/15"}`} aria-hidden />
                <div className="relative flex items-start justify-between gap-3">
                  <div className={`flex size-12 items-center justify-center rounded-xl ${winner ? "bg-amber-500/15 text-amber-300" : "bg-cyan-500/15 text-cyan-300"}`}>
                    {winner ? <Medal className="size-6" aria-hidden /> : <Award className="size-6" aria-hidden />}
                  </div>
                  <Badge tone={winner ? "amber" : "cyan"}>{winner ? (c.cert.rank ?? "Winner") : "Participation"}</Badge>
                </div>
                <h3 className="relative mt-4 font-display text-lg font-bold text-ink">{c.event.title}</h3>
                <p className="relative mt-1 text-xs text-muted">
                  Issued {fmtDate(c.cert.issuedAt.slice(0, 10))} · {c.event.category}
                </p>
                <p className="relative mt-3 rounded-lg border border-line bg-panel px-3 py-2 font-mono text-[11px] tracking-[0.18em] text-cyan-300">{c.cert.certUid}</p>
                <Button variant={winner ? "primary" : "secondary"} size="sm" className="relative mt-4" icon={Download} onClick={() => download(c)}>
                  Download PDF
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
