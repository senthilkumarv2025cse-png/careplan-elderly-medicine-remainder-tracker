import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  HeartPulse,
  History,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Pencil,
  Pill,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  api,
  type Dose,
  type Medicine,
  type MedicinePayload,
  type OverdueDose,
  type Patient,
  type PatientPayload,
  type Schedule,
  type SchedulePayload,
} from "./api";

type Page = "overview" | "patients" | "medicines" | "schedule" | "history";
type EditorKind = "patient" | "medicine" | "schedule";
type EditorRecord = Patient | Medicine | Schedule | null;
type ModalState = { kind: EditorKind; record: EditorRecord } | null;

const pageInfo: Record<Page, { label: string; icon: typeof LayoutDashboard }> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  patients: { label: "Patients", icon: UsersRound },
  medicines: { label: "Medicines", icon: Pill },
  schedule: { label: "Schedule", icon: CalendarDays },
  history: { label: "Dose history", icon: History },
};

const today = localDate(new Date());
const thirtyDaysAgo = localDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function displayDate(value: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", options ?? { month: "short", day: "numeric" }).format(
    new Date(`${value.slice(0, 10)}T12:00:00`),
  );
}

function displayTime(value: string) {
  if (!value) return "—";
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(
    new Date(2000, 0, 1, hour, minute),
  );
}

function statusLabel(status: string) {
  return status.toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}

export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [overdue, setOverdue] = useState<OverdueDose[]>([]);
  const [history, setHistory] = useState<Dose[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [historyFrom, setHistoryFrom] = useState(thirtyDaysAgo);
  const [historyTo, setHistoryTo] = useState(today);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [busyDoseId, setBusyDoseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectedPatient = patients.find((patient) => String(patient.id) === selectedPatientId);
  const takenCount = doses.filter((dose) => dose.status === "TAKEN").length;
  const pendingCount = doses.filter((dose) => dose.status === "PENDING").length;
  const activeCount = schedules.filter((schedule) => schedule.active).length;

  useEffect(() => {
    let mounted = true;
    Promise.all([api.patients.list(), api.medicines.list()])
      .then(([patientList, medicineList]) => {
        if (!mounted) return;
        setPatients(patientList);
        setMedicines(medicineList);
        setConnected(true);
        setSelectedPatientId((current) => current || String(patientList[0]?.id ?? ""));
      })
      .catch(() => {
        if (mounted) setConnected(false);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPatientId) {
      setSchedules([]);
      setDoses([]);
      setOverdue([]);
      setHistory([]);
      return;
    }

    let mounted = true;
    const patientId = Number(selectedPatientId);
    Promise.allSettled([
      api.schedules.list(patientId),
      api.doses.today(patientId),
      api.doses.overdue(patientId),
      api.doses.history(patientId, historyFrom, historyTo),
    ]).then(([scheduleResult, doseResult, overdueResult, historyResult]) => {
      if (!mounted) return;
      if (scheduleResult.status === "fulfilled") setSchedules(scheduleResult.value);
      if (doseResult.status === "fulfilled") setDoses(doseResult.value);
      if (overdueResult.status === "fulfilled") setOverdue(overdueResult.value);
      if (historyResult.status === "fulfilled") setHistory(historyResult.value);
      setConnected([scheduleResult, doseResult, overdueResult, historyResult].some((result) => result.status === "fulfilled"));
    });
    return () => {
      mounted = false;
    };
  }, [selectedPatientId, historyFrom, historyTo]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  async function refreshDirectory() {
    const [patientList, medicineList] = await Promise.all([api.patients.list(), api.medicines.list()]);
    setPatients(patientList);
    setMedicines(medicineList);
    setConnected(true);
    return patientList;
  }

  async function saveRecord(kind: EditorKind, record: EditorRecord, payload: PatientPayload | MedicinePayload | SchedulePayload) {
    const id = record && "id" in record ? record.id : undefined;
    if (kind === "patient") {
      const saved = id
        ? await api.patients.update(id, payload as PatientPayload)
        : await api.patients.create(payload as PatientPayload);
      await refreshDirectory();
      if (!id) setSelectedPatientId(String(saved.id));
    } else if (kind === "medicine") {
      if (id) await api.medicines.update(id, payload as MedicinePayload);
      else await api.medicines.create(payload as MedicinePayload);
      await refreshDirectory();
    } else {
      if (id) await api.schedules.update(id, payload as SchedulePayload);
      else await api.schedules.create(payload as SchedulePayload);
      if (selectedPatientId) {
        const updatedSchedules = await api.schedules.list(Number(selectedPatientId));
        setSchedules(updatedSchedules);
      }
      setPage("schedule");
    }
    setModal(null);
    notify(`${kind === "patient" ? "Patient" : kind === "medicine" ? "Medicine" : "Schedule"} saved`);
  }

  async function removePatient(patient: Patient) {
    if (!window.confirm(`Delete ${patient.name}? This cannot be undone.`)) return;
    try {
      await api.patients.remove(patient.id);
      const patientList = await api.patients.list();
      setPatients(patientList);
      if (String(patient.id) === selectedPatientId) setSelectedPatientId(String(patientList[0]?.id ?? ""));
      notify("Patient removed");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not delete patient");
    }
  }

  async function removeMedicine(medicine: Medicine) {
    if (!window.confirm(`Delete ${medicine.name}? This cannot be undone.`)) return;
    try {
      await api.medicines.remove(medicine.id);
      setMedicines(await api.medicines.list());
      notify("Medicine removed");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not delete medicine");
    }
  }

  async function removeSchedule(schedule: Schedule) {
    if (!window.confirm(`Remove the ${schedule.medicineName} schedule?`)) return;
    try {
      await api.schedules.remove(schedule.id);
      setSchedules(await api.schedules.list(schedule.patientId));
      notify("Schedule removed");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not remove schedule");
    }
  }

  async function toggleSchedule(schedule: Schedule) {
    try {
      const updated = await api.schedules.setActive(schedule.id, !schedule.active);
      setSchedules((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      notify(updated.active ? "Schedule activated" : "Schedule paused");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update schedule");
    }
  }

  async function markTaken(dose: Dose) {
    setBusyDoseId(dose.id);
    try {
      const updated = await api.doses.markTaken(dose.id);
      setDoses((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setOverdue((current) => current.filter((item) => item.doseId !== updated.id));
      notify(`${dose.medicineName} marked as taken`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update dose");
    } finally {
      setBusyDoseId(null);
    }
  }

  function changePage(nextPage: Page) {
    setPage(nextPage);
    setSearch("");
    setMobileNavOpen(false);
  }

  const filteredPatients = patients.filter((patient) =>
    `${patient.name} ${patient.phone} ${patient.address}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredMedicines = medicines.filter((medicine) =>
    `${medicine.name} ${medicine.dosage} ${medicine.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredSchedules = schedules.filter((schedule) =>
    `${schedule.medicineName} ${schedule.dosage} ${schedule.frequency}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><HeartPulse size={20} strokeWidth={2.4} /></div>
          <div><span className="brand-name">CarePlan</span><span className="brand-caption">CARE DESK</span></div>
          <button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={18} /></button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {(Object.keys(pageInfo) as Page[]).map((key) => {
            const { label, icon: Icon } = pageInfo[key];
            const count = key === "patients" ? patients.length : key === "medicines" ? medicines.length : key === "schedule" ? schedules.length : null;
            return (
              <button key={key} className={`nav-link ${page === key ? "nav-link-active" : ""}`} onClick={() => changePage(key)}>
                <Icon size={18} strokeWidth={1.9} />
                <span>{label}</span>
                {count !== null && <span className="nav-count">{count}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status"><span className={`status-dot ${connected ? "" : "status-dot-off"}`} /><span>{connected ? "API connected" : "API unavailable"}</span></div>
          <div className="coordinator">
            <div className="coordinator-avatar">CP</div>
            <div className="coordinator-copy"><strong>Care coordinator</strong><span>Workspace admin</span></div>
            <MoreHorizontal size={18} className="muted-icon" />
          </div>
          <div className="sidebar-footnote"><ShieldCheck size={14} /> Private care workspace</div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Care desk</span><span className="crumb-slash">/</span><strong>{pageInfo[page].label}</strong></div>
          <div className="topbar-actions">
            <label className="patient-picker">
              <UserRound size={16} />
              <select aria-label="Selected patient" value={selectedPatientId} onChange={(event) => setSelectedPatientId(event.target.value)}>
                <option value="">Select patient</option>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
              </select>
              <ChevronDown size={14} />
            </label>
            <div className="topbar-date"><CalendarDays size={15} />{displayDate(today, { weekday: "short", month: "short", day: "numeric" })}</div>
          </div>
        </header>

        <main className="main-content">
          {loading ? <LoadingState /> : !connected ? <ConnectionState onRetry={() => window.location.reload()} /> : (
            <>
              {page === "overview" && <Overview
                patient={selectedPatient}
                patients={patients}
                schedules={schedules}
                doses={doses}
                overdue={overdue}
                takenCount={takenCount}
                pendingCount={pendingCount}
                activeCount={activeCount}
                busyDoseId={busyDoseId}
                onMarkTaken={markTaken}
                onNavigate={changePage}
                onAddPatient={() => setModal({ kind: "patient", record: null })}
                onAddSchedule={() => patients.length && medicines.length ? setModal({ kind: "schedule", record: null }) : notify("Add a patient and medicine first")}
              />}
              {page === "patients" && <PatientsPage
                patients={filteredPatients}
                selectedPatientId={selectedPatientId}
                schedules={schedules}
                search={search}
                onSearch={setSearch}
                onSelect={setSelectedPatientId}
                onAdd={() => setModal({ kind: "patient", record: null })}
                onEdit={(patient) => setModal({ kind: "patient", record: patient })}
                onDelete={removePatient}
              />}
              {page === "medicines" && <MedicinesPage
                medicines={filteredMedicines}
                schedules={schedules}
                search={search}
                onSearch={setSearch}
                onAdd={() => setModal({ kind: "medicine", record: null })}
                onEdit={(medicine) => setModal({ kind: "medicine", record: medicine })}
                onDelete={removeMedicine}
              />}
              {page === "schedule" && <SchedulePage
                patient={selectedPatient}
                schedules={filteredSchedules}
                search={search}
                onSearch={setSearch}
                onAdd={() => patients.length && medicines.length ? setModal({ kind: "schedule", record: null }) : notify("Add a patient and medicine first")}
                onEdit={(schedule) => setModal({ kind: "schedule", record: schedule })}
                onDelete={removeSchedule}
                onToggle={toggleSchedule}
              />}
              {page === "history" && <HistoryPage
                patient={selectedPatient}
                history={history}
                from={historyFrom}
                to={historyTo}
                onFrom={setHistoryFrom}
                onTo={setHistoryTo}
              />}
            </>
          )}
        </main>
      </div>

      {modal && <EditorModal
        kind={modal.kind}
        record={modal.record}
        patients={patients}
        medicines={medicines}
        onClose={() => setModal(null)}
        onSave={(payload) => saveRecord(modal.kind, modal.record, payload)}
      />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}

function LoadingState() {
  return <div className="center-state"><LoaderCircle size={24} className="spin" /><span>Connecting to your care workspace…</span></div>;
}

function ConnectionState({ onRetry }: { onRetry: () => void }) {
  return <div className="center-state connection-state"><div className="state-icon"><Activity size={23} /></div><h2>Care desk is offline</h2><p>Start the Java API at localhost:8080, then reconnect.</p><button className="button button-primary" onClick={onRetry}>Reconnect</button></div>;
}

function PageHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{detail}</p></div>{action && <div className="heading-action">{action}</div>}</div>;
}

function Overview(props: {
  patient?: Patient;
  patients: Patient[];
  schedules: Schedule[];
  doses: Dose[];
  overdue: OverdueDose[];
  takenCount: number;
  pendingCount: number;
  activeCount: number;
  busyDoseId: number | null;
  onMarkTaken: (dose: Dose) => void;
  onNavigate: (page: Page) => void;
  onAddPatient: () => void;
  onAddSchedule: () => void;
}) {
  const { patient, patients, schedules, doses, overdue, takenCount, pendingCount, activeCount } = props;
  const overdueIds = new Set(overdue.map((dose) => dose.doseId));
  const todayRows = [...doses].sort((left, right) => left.scheduledTime.localeCompare(right.scheduledTime));
  const nextDose = todayRows.find((dose) => dose.status === "PENDING");
  const duePercent = doses.length ? Math.round((takenCount / doses.length) * 100) : 0;

  return (
    <>
      <section className="overview-intro">
        <div className="intro-copy">
          <div className="eyebrow">{displayDate(today, { weekday: "long", month: "long", day: "numeric" })}</div>
          <h1>{patient ? `Hello, ${patient.name.split(" ")[0]}` : "Your care desk"}</h1>
          <p>{patient ? "Here’s the medication picture for today." : "A clear view of every care plan, in one place."}</p>
          {!patient && <button className="button button-primary intro-cta" onClick={props.onAddPatient}><Plus size={16} />Add first patient</button>}
        </div>
        <div className="intro-art" role="img" aria-label="Healthcare consultation">
          <div className="art-caption"><span className="art-caption-mark"><HeartPulse size={15} /></span><span><strong>Care, coordinated</strong><small>{patients.length} {patients.length === 1 ? "person" : "people"} in your workspace</small></span></div>
        </div>
      </section>

      <section className="metric-grid" aria-label="Today's care metrics">
        <MetricCard label="Doses today" value={doses.length} icon={Pill} tone="green" note={nextDose ? `Next at ${displayTime(nextDose.scheduledTime)}` : "No upcoming doses"} />
        <MetricCard label="Taken" value={takenCount} icon={CheckCheck} tone="blue" note={doses.length ? `${duePercent}% of today's plan` : "Ready when you are"} />
        <MetricCard label="Overdue" value={overdue.length} icon={AlertCircle} tone={overdue.length ? "coral" : "gold"} note={overdue.length ? "Needs attention" : "All clear right now"} />
        <MetricCard label="Active plans" value={activeCount} icon={CalendarDays} tone="ink" note={`${schedules.length} total for this patient`} />
      </section>

      <div className="overview-columns">
        <section className="content-panel today-panel">
          <div className="panel-heading"><div><div className="eyebrow">DAILY PLAN</div><h2>Today’s doses</h2></div><span className="panel-count">{doses.length} scheduled</span></div>
          {!patient ? <EmptyState title="Choose a patient to begin" detail="Select someone from the patient menu, or add a new patient to start a care plan." action={<button className="text-button" onClick={props.onAddPatient}><Plus size={15} />Add a patient</button>} /> : todayRows.length ? <div className="dose-list">
            {todayRows.map((dose) => <DoseRow key={dose.id} dose={dose} overdue={overdueIds.has(dose.id)} busy={props.busyDoseId === dose.id} onMarkTaken={() => props.onMarkTaken(dose)} />)}
          </div> : <EmptyState title="Nothing scheduled today" detail="Add a medicine schedule and today’s expected doses will appear here." action={<button className="text-button" onClick={props.onAddSchedule}><Plus size={15} />Create a schedule</button>} />}
          {todayRows.length > 0 && <div className="panel-footer"><span><span className="status-dot status-dot-green" />{takenCount} taken</span><span><span className="status-dot status-dot-gold" />{pendingCount} remaining</span><button className="text-button" onClick={() => props.onNavigate("history")}>View history <ArrowUpRight size={14} /></button></div>}
        </section>

        <aside className="overview-rail">
          <section className="content-panel attention-panel">
            <div className="panel-heading"><div><div className="eyebrow">CARE SIGNALS</div><h2>Needs attention</h2></div><span className={`signal-count ${overdue.length ? "signal-alert" : ""}`}>{overdue.length}</span></div>
            {overdue.length ? <div className="signal-list">{overdue.slice(0, 4).map((dose) => <div className="signal-row" key={dose.doseId}><div className="signal-icon"><Clock3 size={15} /></div><div className="signal-copy"><strong>{dose.medicineName}</strong><span>{displayDate(dose.scheduledDate)} · {displayTime(dose.scheduledTime)}</span></div><span className="signal-tag">Overdue</span></div>)}</div> : <div className="all-clear"><div className="all-clear-mark"><Check size={17} /></div><div><strong>All caught up</strong><span>No overdue doses for {patient?.name.split(" ")[0] ?? "this patient"}.</span></div></div>}
            <button className="panel-link" onClick={() => props.onNavigate("history")}>Open dose history <ArrowUpRight size={15} /></button>
          </section>

          <section className="content-panel patient-summary">
            <div className="panel-heading"><div><div className="eyebrow">PATIENT AT A GLANCE</div><h2>Care profile</h2></div><button className="icon-button" aria-label="View patients" onClick={() => props.onNavigate("patients")}><ArrowUpRight size={17} /></button></div>
            {patient ? <><div className="profile-line"><div className="patient-avatar">{initials(patient.name)}</div><div><strong>{patient.name}</strong><span>{patient.age} years · Patient #{patient.id}</span></div></div><dl className="profile-details"><div><dt>Phone</dt><dd>{patient.phone}</dd></div><div><dt>Address</dt><dd>{patient.address}</dd></div><div><dt>Care plans</dt><dd>{schedules.length} schedules</dd></div></dl></> : <EmptyState title="No patient selected" detail="Add patient details to create a care profile." action={<button className="text-button" onClick={props.onAddPatient}><Plus size={15} />Add patient</button>} />}
          </section>
        </aside>
      </div>
    </>
  );
}

function MetricCard({ label, value, icon: Icon, tone, note }: { label: string; value: number; icon: typeof Pill; tone: string; note: string }) {
  return <div className={`metric-card metric-${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={18} strokeWidth={1.9} /></span></div><div className="metric-value">{value}</div><div className="metric-note">{note}</div></div>;
}

function DoseRow({ dose, overdue, busy, onMarkTaken }: { dose: Dose; overdue: boolean; busy: boolean; onMarkTaken: () => void }) {
  const status = dose.status === "TAKEN" ? "TAKEN" : overdue ? "OVERDUE" : dose.status;
  return <div className={`dose-row ${status === "TAKEN" ? "dose-row-done" : ""}`}>
    <div className={`time-block ${status === "OVERDUE" ? "time-overdue" : ""}`}><strong>{displayTime(dose.scheduledTime)}</strong><span>{status === "TAKEN" ? "Complete" : status === "OVERDUE" ? "Late" : "Due"}</span></div>
    <div className="dose-symbol"><Pill size={17} /></div>
    <div className="dose-copy"><strong>{dose.medicineName}</strong><span>{dose.dosage}</span></div>
    <span className={`status-pill status-${status.toLowerCase()}`}>{statusLabel(status)}</span>
    {status === "TAKEN" ? <span className="taken-mark"><Check size={17} /></span> : <button className="button button-take" disabled={busy} onClick={onMarkTaken}>{busy ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}<span>Mark taken</span></button>}
  </div>;
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-mark"><Stethoscope size={19} /></div><strong>{title}</strong><p>{detail}</p>{action}</div>;
}

function TableTools({ search, onSearch, placeholder }: { search: string; onSearch: (value: string) => void; placeholder: string }) {
  return <label className="table-search"><Search size={16} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} /><kbd>/</kbd></label>;
}

function PatientsPage(props: {
  patients: Patient[];
  selectedPatientId: string;
  schedules: Schedule[];
  search: string;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}) {
  return <>
    <PageHeading eyebrow="PEOPLE" title="Patients" detail="Patient profiles and care contacts." action={<button className="button button-primary" onClick={props.onAdd}><Plus size={16} />Add patient</button>} />
    <div className="directory-toolbar"><div className="directory-count"><UsersRound size={17} /><strong>{props.patients.length}</strong><span>{props.patients.length === 1 ? "patient" : "patients"}</span></div><TableTools search={props.search} onSearch={props.onSearch} placeholder="Search patients" /></div>
    <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Age</th><th>Phone</th><th>Address</th><th>Care plans</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
      {props.patients.map((patient) => <tr key={patient.id} className={String(patient.id) === props.selectedPatientId ? "row-selected" : ""}>
        <td><button className="table-person" onClick={() => props.onSelect(String(patient.id))}><span className="patient-avatar patient-avatar-small">{initials(patient.name)}</span><span><strong>{patient.name}</strong><small>Patient #{patient.id}</small></span></button></td>
        <td>{patient.age}</td><td>{patient.phone}</td><td className="truncate-cell">{patient.address}</td><td><span className="table-badge">{String(patient.id) === props.selectedPatientId ? props.schedules.length : "—"} plans</span></td>
        <td><div className="row-actions"><button className="icon-button" title="Edit patient" aria-label={`Edit ${patient.name}`} onClick={() => props.onEdit(patient)}><Pencil size={15} /></button><button className="icon-button danger-hover" title="Delete patient" aria-label={`Delete ${patient.name}`} onClick={() => props.onDelete(patient)}><Trash2 size={15} /></button></div></td>
      </tr>)}
    </tbody></table>
      {!props.patients.length && <EmptyState title="No patient records found" detail="Add a patient to start organizing medication care." />}
    </div>
    <div className="list-footnote"><ShieldCheck size={14} />Patient information stays in your connected care workspace.</div>
  </>;
}

function MedicinesPage(props: {
  medicines: Medicine[];
  schedules: Schedule[];
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
  onEdit: (medicine: Medicine) => void;
  onDelete: (medicine: Medicine) => void;
}) {
  return <>
    <PageHeading eyebrow="MEDICATION LIBRARY" title="Medicines" detail="Keep medication details consistent across care plans." action={<button className="button button-primary" onClick={props.onAdd}><Plus size={16} />Add medicine</button>} />
    <div className="directory-toolbar"><div className="directory-count"><Pill size={17} /><strong>{props.medicines.length}</strong><span>{props.medicines.length === 1 ? "medicine" : "medicines"}</span></div><TableTools search={props.search} onSearch={props.onSearch} placeholder="Search medicines" /></div>
    <div className="table-wrap"><table><thead><tr><th>Medicine</th><th>Standard dosage</th><th>Notes</th><th>Used in plans</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
      {props.medicines.map((medicine) => <tr key={medicine.id}><td><div className="table-person"><span className="medicine-avatar"><Pill size={16} /></span><span><strong>{medicine.name}</strong><small>Medicine #{medicine.id}</small></span></div></td><td><span className="dose-tag">{medicine.dosage}</span></td><td className="truncate-cell description-cell">{medicine.description || "No additional notes"}</td><td><span className="table-badge">{props.schedules.filter((schedule) => schedule.medicineId === medicine.id).length} active here</span></td><td><div className="row-actions"><button className="icon-button" title="Edit medicine" aria-label={`Edit ${medicine.name}`} onClick={() => props.onEdit(medicine)}><Pencil size={15} /></button><button className="icon-button danger-hover" title="Delete medicine" aria-label={`Delete ${medicine.name}`} onClick={() => props.onDelete(medicine)}><Trash2 size={15} /></button></div></td></tr>)}
    </tbody></table>{!props.medicines.length && <EmptyState title="No medicines added" detail="Add a medicine once, then use it in any patient schedule." />}</div>
    <div className="list-footnote"><Pill size={14} />Medicine details are shared by schedules and dose records.</div>
  </>;
}

function SchedulePage(props: {
  patient?: Patient;
  schedules: Schedule[];
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
  onToggle: (schedule: Schedule) => void;
}) {
  return <>
    <PageHeading eyebrow="PLANNING" title="Schedule" detail={props.patient ? `Medication plan for ${props.patient.name}.` : "Select a patient to review their plan."} action={<button className="button button-primary" onClick={props.onAdd}><Plus size={16} />Add schedule</button>} />
    <div className="schedule-toolbar"><div className="segmented-control"><span className="segment-active">All schedules <b>{props.schedules.length}</b></span></div><TableTools search={props.search} onSearch={props.onSearch} placeholder="Search this plan" /></div>
    <div className="schedule-list">
      {props.schedules.map((schedule) => <article className={`schedule-item ${schedule.active ? "" : "schedule-paused"}`} key={schedule.id}>
        <div className="schedule-time"><span className="time-disc"><Clock3 size={16} /></span><strong>{displayTime(schedule.scheduledTime)}</strong></div>
        <div className="schedule-main"><div className="schedule-title"><h3>{schedule.medicineName}</h3><span className={`status-pill ${schedule.active ? "status-active" : "status-paused"}`}>{schedule.active ? "Active" : "Paused"}</span></div><p>{schedule.dosage} <span>·</span> {schedule.frequency.toLowerCase()} <span>·</span> Since {displayDate(schedule.startDate)}{schedule.endDate ? ` until ${displayDate(schedule.endDate)}` : " · no end date"}</p></div>
        <div className="schedule-control"><span className="switch-label">{schedule.active ? "On" : "Off"}</span><button className={`switch ${schedule.active ? "switch-on" : ""}`} role="switch" aria-checked={schedule.active} aria-label={`${schedule.active ? "Pause" : "Activate"} ${schedule.medicineName}`} onClick={() => props.onToggle(schedule)}><span /></button></div>
        <div className="row-actions schedule-actions"><button className="icon-button" title="Edit schedule" aria-label={`Edit ${schedule.medicineName} schedule`} onClick={() => props.onEdit(schedule)}><Pencil size={15} /></button><button className="icon-button danger-hover" title="Delete schedule" aria-label={`Delete ${schedule.medicineName} schedule`} onClick={() => props.onDelete(schedule)}><Trash2 size={15} /></button></div>
      </article>)}
      {!props.schedules.length && <div className="schedule-empty"><EmptyState title={props.patient ? "No schedules yet" : "Select a patient"} detail={props.patient ? "Add a medicine, time, and frequency to build this patient's plan." : "Choose a patient from the menu in the top bar."} action={props.patient ? <button className="text-button" onClick={props.onAdd}><Plus size={15} />Add first schedule</button> : undefined} /></div>}
    </div>
    <div className="list-footnote"><CalendarDays size={14} />Dose reminders are generated from active schedules for their applicable dates.</div>
  </>;
}

function HistoryPage(props: { patient?: Patient; history: Dose[]; from: string; to: string; onFrom: (value: string) => void; onTo: (value: string) => void }) {
  return <>
    <PageHeading eyebrow="RECORDS" title="Dose history" detail={props.patient ? `Missed and overdue doses for ${props.patient.name}.` : "Select a patient to review dose records."} />
    <section className="history-panel">
      <div className="history-toolbar"><div className="history-range"><label>From<input type="date" value={props.from} max={props.to} onChange={(event) => props.onFrom(event.target.value)} /></label><ArrowDownRight size={15} /><label>To<input type="date" value={props.to} min={props.from} onChange={(event) => props.onTo(event.target.value)} /></label></div><span className="history-result-count">{props.history.length} records</span></div>
      {props.history.length ? <div className="table-wrap history-table"><table><thead><tr><th>Date</th><th>Scheduled</th><th>Medicine</th><th>Dosage</th><th>Status</th></tr></thead><tbody>
        {props.history.map((dose) => <tr key={dose.id}><td>{displayDate(dose.scheduledDate, { month: "short", day: "numeric", year: "numeric" })}</td><td>{displayTime(dose.scheduledTime)}</td><td><div className="table-person"><span className="medicine-avatar"><Pill size={15} /></span><strong>{dose.medicineName}</strong></div></td><td>{dose.dosage}</td><td><span className={`status-pill status-${dose.status.toLowerCase()}`}>{statusLabel(dose.status)}</span></td></tr>)}
      </tbody></table></div> : <EmptyState title={props.patient ? "No missed doses in this range" : "Choose a patient"} detail={props.patient ? "A quiet history is a good sign. Try another date range to review older records." : "Select a patient from the top bar to see their dose history."} />}
    </section>
    <div className="list-footnote"><History size={14} />History includes missed doses and doses currently past their overdue threshold.</div>
  </>;
}

function EditorModal(props: {
  kind: EditorKind;
  record: EditorRecord;
  patients: Patient[];
  medicines: Medicine[];
  onClose: () => void;
  onSave: (payload: PatientPayload | MedicinePayload | SchedulePayload) => Promise<void>;
}) {
  const { kind, record } = props;
  const schedule = kind === "schedule" && record && "patientId" in record ? record : null;
  const patient = kind === "patient" && record && "phone" in record ? record : null;
  const medicine = kind === "medicine" && record && "description" in record ? record : null;
  const [name, setName] = useState(patient?.name ?? medicine?.name ?? "");
  const [age, setAge] = useState(patient ? String(patient.age) : "");
  const [phone, setPhone] = useState(patient?.phone ?? "");
  const [address, setAddress] = useState(patient?.address ?? "");
  const [dosage, setDosage] = useState(medicine?.dosage ?? schedule?.dosage ?? "");
  const [description, setDescription] = useState(medicine?.description ?? "");
  const [patientId, setPatientId] = useState(String(schedule?.patientId ?? props.patients[0]?.id ?? ""));
  const [medicineId, setMedicineId] = useState(String(schedule?.medicineId ?? props.medicines[0]?.id ?? ""));
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY">(schedule?.frequency ?? "DAILY");
  const [scheduledTime, setScheduledTime] = useState(schedule?.scheduledTime?.slice(0, 5) ?? "08:00");
  const [startDate, setStartDate] = useState(schedule?.startDate ?? today);
  const [endDate, setEndDate] = useState(schedule?.endDate ?? "");
  const [active, setActive] = useState(schedule?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(record);
  const title = `${editing ? "Edit" : "Add"} ${kind}`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (kind === "patient") {
        await props.onSave({ name: name.trim(), age: Number(age), phone: phone.trim(), address: address.trim() });
      } else if (kind === "medicine") {
        await props.onSave({ name: name.trim(), dosage: dosage.trim(), description: description.trim() });
      } else {
        await props.onSave({ patientId: Number(patientId), medicineId: Number(medicineId), dosage: dosage.trim(), frequency, scheduledTime: `${scheduledTime}:00`, startDate, endDate: endDate || null, active });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save changes");
      setSaving(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && props.onClose()}>
    <section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <div className="modal-heading"><div><div className="eyebrow">CARE DESK</div><h2 id="editor-title">{title}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={props.onClose}><X size={18} /></button></div>
      <form onSubmit={submit}>
        {kind === "patient" && <div className="form-grid">
          <label className="field field-span">Full name<input autoFocus required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Asha Raman" /></label>
          <label className="field">Age<input required type="number" min="1" max="130" value={age} onChange={(event) => setAge(event.target.value)} placeholder="72" /></label>
          <label className="field">Phone<input required pattern="[+0-9(). -]{7,20}" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 555 123 4567" /></label>
          <label className="field field-span">Address<input required maxLength={255} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street, city" /></label>
        </div>}
        {kind === "medicine" && <div className="form-grid">
          <label className="field field-span">Medicine name<input autoFocus required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Lisinopril" /></label>
          <label className="field field-span">Standard dosage<input required maxLength={100} value={dosage} onChange={(event) => setDosage(event.target.value)} placeholder="e.g. 5 mg" /></label>
          <label className="field field-span">Notes <span className="field-optional">Optional</span><textarea maxLength={500} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Instructions or additional details" /></label>
        </div>}
        {kind === "schedule" && <div className="form-grid">
          <label className="field field-span">Patient<select required value={patientId} onChange={(event) => setPatientId(event.target.value)}><option value="" disabled>Select a patient</option>{props.patients.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="field field-span">Medicine<select required value={medicineId} onChange={(event) => { setMedicineId(event.target.value); const selected = props.medicines.find((item) => String(item.id) === event.target.value); if (selected && !editing) setDosage(selected.dosage); }}><option value="" disabled>Select a medicine</option>{props.medicines.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.dosage}</option>)}</select></label>
          <label className="field">Dosage<input required maxLength={100} value={dosage} onChange={(event) => setDosage(event.target.value)} placeholder="5 mg" /></label>
          <label className="field">Frequency<select value={frequency} onChange={(event) => setFrequency(event.target.value as "DAILY" | "WEEKLY")}><option value="DAILY">Every day</option><option value="WEEKLY">Every week</option></select></label>
          <label className="field">Time<input required type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} /></label>
          <label className="field">Start date<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="field">End date <span className="field-optional">Optional</span><input type="date" min={today} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          {editing && <label className="field-toggle"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span className="checkbox-mark"><Check size={12} /></span><span>Schedule is active</span></label>}
        </div>}
        {error && <div className="form-error"><AlertCircle size={16} />{error}</div>}
        <div className="modal-actions"><button type="button" className="button button-quiet" onClick={props.onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving && <LoaderCircle size={15} className="spin" />}{saving ? "Saving…" : editing ? "Save changes" : `Add ${kind}`}</button></div>
      </form>
    </section>
  </div>;
}