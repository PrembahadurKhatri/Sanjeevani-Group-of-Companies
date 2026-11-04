"use client";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, formatDate, hasPermission, label, type Me } from "@/components/admin/api";
import { LoadingBlock, LoadingInline } from "@/components/admin/Loading";
import { type Field, FieldInputs, fromItem, type Lookups, toInput } from "@/components/admin/FieldForm";
import { CORE_SECTIONS, SECTION_DEFAULTS, resolveSections, type ResolvedSection } from "@/lib/company-sections";

// The parts of Admin → Companies that manage a company's own records:
// services/products, projects & achievements, related businesses, and the
// links to its news and vacancies. Records are saved one by one through
// /api/admin/companies/<id>/items/<kind>; the server checks every request
// against the company, whatever this screen shows.

type Item = Record<string, unknown> & { id: string; status: string; updatedAt: string };
type Kind = "offerings" | "achievements" | "relations";

export const OFFERING_FIELDS: Field[] = [
  { k: "title", label: "Title", type: "text", required: true, wide: true },
  { k: "summary", label: "Short description", type: "textarea", help: "Shown on the card." },
  { k: "imageId", label: "Image or icon", type: "image", rel: "image", folder: "companies" },
  { k: "body", label: "Detail page text (optional)", type: "textarea", help: "Fill this in to give the item its own page with a Learn more link. Leave a blank line between paragraphs." },
];

const KIND_OPTIONS: [string, string][] = [["PROJECT", "Project"], ["AWARD", "Award"], ["CERTIFICATION", "Certification"], ["ACHIEVEMENT", "Achievement"], ["MILESTONE", "Milestone (also shown in About us)"]];
export const ACHIEVEMENT_FIELDS: Field[] = [
  { k: "title", label: "Title", type: "text", required: true, wide: true },
  { k: "kind", label: "Category", type: "select", options: KIND_OPTIONS, required: true },
  { k: "date", label: "Date", type: "date" },
  { k: "imageId", label: "Image", type: "image", rel: "image", folder: "companies" },
  { k: "description", label: "Description", type: "textarea" },
];

export const RELATION_FIELDS: Field[] = [
  { k: "relatedCompanyId", label: "One of the group's companies", type: "select", options: "companies", empty: "Not a group company (enter the details below)", help: "Choosing one uses that company's name, logo and page, so nothing is copied." },
  { k: "relationType", label: "Relationship", type: "select", options: [["SUBSIDIARY", "Subsidiary"], ["BRAND", "Brand"], ["DIVISION", "Division"], ["ASSOCIATE", "Associate"], ["PARTNER", "Partner"]], required: true },
  { k: "name", label: "Business name", type: "text", help: "Only needed when it is not one of the group's companies." },
  { k: "logoId", label: "Logo", type: "image", rel: "logo", folder: "companies" },
  { k: "description", label: "Short description", type: "textarea" },
  { k: "websiteUrl", label: "Website", type: "text", help: "e.g. www.example.com" },
];

function useItemRights(me: Me) {
  return {
    write: hasPermission(me, "company.update") || hasPermission(me, "content.update"),
    publish: hasPermission(me, "company.publish") || hasPermission(me, "content.publish"),
  };
}

export function ItemsManager({ me, companyId, kind, fields, noun, lookups, filter, defaults, describe, intro }: {
  me: Me; companyId: string; kind: Kind; fields: Field[]; noun: string; lookups: Lookups;
  filter?: (i: Item) => boolean; defaults?: Record<string, unknown>; describe: (i: Item) => { title: string; meta?: string }; intro?: string;
}) {
  const base = `/api/admin/companies/${companyId}/items/${kind}`;
  const [items, setItems] = useState<Item[] | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; updatedAt?: string; status?: string; values: Record<string, unknown> } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const rights = useItemRights(me);
  const shown = items ? (filter ? items.filter(filter) : items) : null;

  const load = useCallback(async () => {
    try { setItems((await api<{ items: Item[] }>(base)).items); setError(""); } catch (e) { setItems([]); setError((e as Error).message); }
  }, [base]);
  useEffect(() => { void load(); }, [load]);

  async function act(fn: () => Promise<unknown>, message: string) {
    setError(""); setNotice("");
    try { await fn(); setNotice(message); await load(); } catch (e) { setError((e as Error).message); }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const then = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value ?? "";
    const body: Record<string, unknown> = { ...(defaults ?? {}), ...toInput(fields, editing.values) };
    if (then) body.status = then;
    await act(async () => {
      if (editing.id) await api(`${base}/${editing.id}`, { method: "PATCH", body: { ...body, expectedUpdatedAt: editing.updatedAt } });
      else await api(base, { body: { ...body, sortOrder: shown?.length ?? 0 } });
      setEditing(null);
    }, then === "PUBLISHED" ? "Saved and published." : then === "DRAFT" ? "Saved and taken off the page." : "Saved as a draft.");
  }

  function move(index: number, delta: number) {
    if (!shown) return;
    const order = [...shown];
    const [moved] = order.splice(index, 1);
    order.splice(index + delta, 0, moved);
    void act(() => api(base, { method: "PUT", body: { ids: order.map((i) => i.id) } }), "Order saved.");
  }

  const live = editing?.status === "PUBLISHED";
  return (
    <div className="adm-company-items">
      <div className="admin-list-heading">
        <div>{intro && <p className="adm-muted">{intro}</p>}<p>{shown === null ? <LoadingInline /> : `${shown.length} in total`}</p></div>
        {rights.write && !editing && <button type="button" className="admin-primary-button" onClick={() => setEditing({ id: null, values: fromItem(fields, defaults ?? null) })}>Add {noun} <span aria-hidden="true">＋</span></button>}
      </div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}

      {editing && (
        <form className="admin-business-form adm-subform" onSubmit={save}>
          <div className="admin-form-heading">
            <h3>{editing.id ? `Edit ${noun}` : `New ${noun}`}</h3>
            <button className="admin-close-button" type="button" onClick={() => setEditing(null)} aria-label="Close">×</button>
          </div>
          <div className="admin-form-grid">
            <FieldInputs fields={fields} values={editing.values} onChange={(values) => setEditing({ ...editing, values })} lookups={lookups} altFrom={String(editing.values.title ?? editing.values.name ?? "")} idPrefix={`ci-${kind}`} />
          </div>
          <div className="admin-form-actions">
            <button className={rights.publish && !live ? "admin-secondary-button" : "admin-primary-button"} type="submit">{live ? "Save changes" : "Save as draft"}</button>
            {rights.publish && !live && <button className="admin-primary-button" type="submit" value="PUBLISHED">Save and publish</button>}
            {rights.publish && live && <button className="admin-secondary-button" type="submit" value="DRAFT">Save and unpublish</button>}
            <button className="admin-secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
          {!rights.publish && <p className="adm-muted">A publisher puts this on the website after you save it.</p>}
        </form>
      )}

      {shown && shown.length === 0 && !editing && <p className="admin-empty">No {noun}s yet. The section stays hidden on the website until something is published, unless you choose to show it under Page sections.</p>}
      {shown && shown.length > 0 && (
        <table className="admin-table">
          <thead><tr><th>Order</th><th>{noun.charAt(0).toUpperCase() + noun.slice(1)}</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {shown.map((item, index) => {
              const d = describe(item);
              return (
                <tr key={item.id}>
                  <td className="admin-button-row">
                    <button type="button" className="adm-order-button" aria-label={`Move ${d.title} up`} disabled={!rights.write || index === 0} onClick={() => move(index, -1)}>↑</button>
                    <button type="button" className="adm-order-button" aria-label={`Move ${d.title} down`} disabled={!rights.write || index === shown.length - 1} onClick={() => move(index, 1)}>↓</button>
                  </td>
                  <td>{d.title}{d.meta && <small>{d.meta}</small>}</td>
                  <td><span className={`admin-badge admin-badge-${item.status.toLowerCase()}`}>{label(item.status)}</span></td>
                  <td className="admin-button-row">
                    {rights.write && <button type="button" className="admin-secondary-button" onClick={() => setEditing({ id: item.id, updatedAt: item.updatedAt, status: item.status, values: fromItem(fields, item) })}>Edit</button>}
                    {rights.write && <button type="button" className="admin-secondary-button" onClick={() => { if (window.confirm(`Delete "${d.title}"? It is removed from the company page at once.`)) void act(() => api(`${base}/${item.id}`, { method: "DELETE" }), "Deleted."); }}>Delete</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

type NewsRow = { id: string; title: string; type: string; status: string; companyId: string | null; updatedAt: string; publishedAt: string | null };

// News is written in the Newsroom; here it is only linked to the company.
export function CompanyNews({ me, companyId }: { me: Me; companyId: string }) {
  const [rows, setRows] = useState<NewsRow[] | null>(null);
  const [pick, setPick] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canLink = hasPermission(me, "content.update");

  const load = useCallback(async () => {
    try { setRows((await api<{ items: NewsRow[] }>("/api/admin/content/news")).items); } catch (e) { setRows([]); setError((e as Error).message); }
  }, []);
  useEffect(() => { if (canLink) void load(); else setRows([]); }, [load, canLink]);

  async function link(row: NewsRow, to: string | null, message: string) {
    setError(""); setNotice("");
    try { await api(`/api/admin/content/news/${row.id}`, { method: "PATCH", body: { companyId: to, expectedUpdatedAt: row.updatedAt } }); setNotice(message); setPick(""); await load(); } catch (e) { setError((e as Error).message); }
  }

  if (!canLink) return <p className="adm-muted">News articles are linked to companies in the Newsroom by content editors.</p>;
  const linked = rows?.filter((r) => r.companyId === companyId) ?? [];
  const available = rows?.filter((r) => r.companyId === null) ?? [];
  return (
    <div className="adm-company-items">
      <p className="adm-muted">Articles are written and published in <Link className="admin-link-button" href="/admin?tab=newsroom">Newsroom</Link>. Link existing ones here; published ones appear in this company&rsquo;s News &amp; updates.</p>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}
      {rows === null ? <LoadingBlock label="Loading articles" rows={3} /> : (
        <>
          {linked.length === 0 ? <p className="admin-empty">No articles linked to this company yet.</p> : (
            <table className="admin-table">
              <thead><tr><th>Article</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {linked.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title}<small>{label(r.type)}{r.publishedAt ? `, published ${formatDate(r.publishedAt, false)}` : ""}</small></td>
                    <td><span className={`admin-badge admin-badge-${r.status.toLowerCase()}`}>{label(r.status)}</span></td>
                    <td><button type="button" className="admin-secondary-button" onClick={() => void link(r, null, "Unlinked. The article stays in the Newsroom.")}>Unlink</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {available.length > 0 && (
            <div className="adm-inline-form">
              <label className="adm-field"><span className="adm-field-label">Link an existing article</span>
                <select value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">Choose an article…</option>
                  {available.map((r) => <option key={r.id} value={r.id}>{r.title} ({label(r.status)})</option>)}
                </select>
              </label>
              <button type="button" className="admin-primary-button" disabled={!pick} onClick={() => { const r = available.find((x) => x.id === pick); if (r) void link(r, companyId, "Article linked."); }}>Link</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

type VacancyRow = { id: string; title: string; status: string; deadline: string | null; _count?: { applications: number } };

// Vacancies are managed under Recruitment → Vacancies; this lists this company's.
export function CompanyCareers({ me, companyId }: { me: Me; companyId: string }) {
  const [rows, setRows] = useState<VacancyRow[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hasPermission(me, "vacancy.read")) { setRows([]); return; }
    api<{ vacancies: VacancyRow[] }>(`/api/admin/vacancies?companyId=${companyId}`).then((r) => setRows(r.vacancies)).catch((e: Error) => { setRows([]); setError(e.message); });
  }, [me, companyId]);
  if (!hasPermission(me, "vacancy.read")) return <p className="adm-muted">Vacancies are managed by HR under Recruitment → Vacancies.</p>;
  return (
    <div className="adm-company-items">
      <p className="adm-muted">Published vacancies appear automatically in this company&rsquo;s Careers section. <Link className="admin-link-button" href="/admin?tab=vacancies">Manage vacancies</Link></p>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {rows === null ? <LoadingBlock label="Loading vacancies" rows={3} /> : rows.length === 0 ? <p className="admin-empty">No vacancies for this company yet.</p> : (
        <table className="admin-table">
          <thead><tr><th>Position</th><th>Status</th><th>Deadline</th><th>Applications</th></tr></thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td>{v.title}</td>
                <td><span className={`admin-badge admin-badge-${v.status.toLowerCase()}`}>{label(v.status)}</span></td>
                <td>{v.deadline ? formatDate(v.deadline, false) : "—"}</td>
                <td className="num">{v._count?.applications ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Turn sections on or off, rename them and change their order. Overview and
// Get in touch are always shown.
export function SectionsEditor({ value, servicesTitle, onChange }: { value: unknown; servicesTitle?: string; onChange: (sections: ResolvedSection[]) => void }) {
  const sections = resolveSections(value, servicesTitle);
  const update = (index: number, patch: Partial<ResolvedSection>) => onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const move = (index: number, delta: number) => {
    const next = [...sections];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved);
    onChange(next);
  };
  return (
    <div className="adm-field-wide adm-sections-editor">
      <div className="adm-form-section"><h4>Page sections</h4><p className="adm-muted">Choose which sections this company&rsquo;s page shows, what they are called and in what order. An empty section stays hidden unless &ldquo;Show when empty&rdquo; is ticked.</p></div>
      <table className="admin-table">
        <thead><tr><th>Order</th><th>Section</th><th>Label on the page</th><th>Shown</th><th>Show when empty</th></tr></thead>
        <tbody>
          {sections.map((s, index) => {
            const core = CORE_SECTIONS.includes(s.key);
            return (
              <tr key={s.key}>
                <td className="admin-button-row">
                  <button type="button" className="adm-order-button" aria-label={`Move ${s.label} up`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
                  <button type="button" className="adm-order-button" aria-label={`Move ${s.label} down`} disabled={index === sections.length - 1} onClick={() => move(index, 1)}>↓</button>
                </td>
                <td>{SECTION_DEFAULTS[s.key].label}{core && <small>Always shown</small>}</td>
                <td><input aria-label={`Label for ${s.key}`} value={s.label} maxLength={40} onChange={(e) => update(index, { label: e.target.value })} /></td>
                <td><input type="checkbox" aria-label={`Show ${s.label}`} checked={s.enabled} disabled={core} onChange={(e) => update(index, { enabled: e.target.checked })} /></td>
                <td><input type="checkbox" aria-label={`Show ${s.label} when empty`} checked={s.showEmpty} disabled={core || !s.enabled} onChange={(e) => update(index, { showEmpty: e.target.checked })} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// For saving: only what the editor controls, in display order. A label is
// kept only when it differs from the default (so the Services section keeps
// following the "Section title" field until it is renamed here).
export const sectionsForSave = (sections: ResolvedSection[], servicesTitle?: string) =>
  sections.map(({ key, enabled, label: text, showEmpty }) => {
    const fallback = key === "services" && servicesTitle?.trim() ? servicesTitle.trim() : SECTION_DEFAULTS[key].label;
    return { key, enabled, showEmpty, ...(text.trim() && text.trim() !== fallback ? { label: text.trim() } : {}) };
  });
