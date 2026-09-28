export interface Patient {
  id: number;
  name: string;
  age: number;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Medicine {
  id: number;
  name: string;
  dosage: string;
  description: string;
  createdAt: string;
}

export interface Schedule {
  id: number;
  patientId: number;
  medicineId: number;
  medicineName: string;
  dosage: string;
  frequency: "DAILY" | "WEEKLY";
  scheduledTime: string;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

export interface Dose {
  id: number;
  scheduleId: number;
  medicineName: string;
  dosage: string;
  scheduledDate: string;
  scheduledTime: string;
  status: "PENDING" | "TAKEN" | "MISSED" | "OVERDUE";
  takenAt: string | null;
  createdAt: string;
}

export interface OverdueDose {
  doseId: number;
  patientId: number;
  patientName: string;
  medicineName: string;
  dosage: string;
  scheduledDate: string;
  scheduledTime: string;
  status: "OVERDUE";
}

export interface PatientPayload {
  name: string;
  age: number;
  phone: string;
  address: string;
}

export interface MedicinePayload {
  name: string;
  dosage: string;
  description: string;
}

export interface SchedulePayload {
  patientId: number;
  medicineId: number;
  dosage: string;
  frequency: "DAILY" | "WEEKLY";
  scheduledTime: string;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const message = problem?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function json(body: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(body) };
}

export const api = {
  patients: {
    list: () => request<Patient[]>("/api/patients"),
    create: (body: PatientPayload) => request<Patient>("/api/patients", json(body)),
    update: (id: number, body: PatientPayload) =>
      request<Patient>(`/api/patients/${id}`, { ...json(body), method: "PUT" }),
    remove: (id: number) => request<void>(`/api/patients/${id}`, { method: "DELETE" }),
  },
  medicines: {
    list: () => request<Medicine[]>("/api/medicines"),
    create: (body: MedicinePayload) => request<Medicine>("/api/medicines", json(body)),
    update: (id: number, body: MedicinePayload) =>
      request<Medicine>(`/api/medicines/${id}`, { ...json(body), method: "PUT" }),
    remove: (id: number) => request<void>(`/api/medicines/${id}`, { method: "DELETE" }),
  },
  schedules: {
    list: (patientId: number) => request<Schedule[]>(`/api/patients/${patientId}/schedules`),
    create: (body: SchedulePayload) => request<Schedule>("/api/schedules", json(body)),
    update: (id: number, body: SchedulePayload) =>
      request<Schedule>(`/api/schedules/${id}`, { ...json(body), method: "PUT" }),
    remove: (id: number) => request<void>(`/api/schedules/${id}`, { method: "DELETE" }),
    setActive: (id: number, active: boolean) =>
      request<Schedule>(`/api/schedules/${id}/${active ? "activate" : "deactivate"}`, {
        method: "PATCH",
      }),
  },
  doses: {
    today: (patientId: number) =>
      request<Dose[]>(`/api/patients/${patientId}/doses/today`),
    overdue: (patientId: number) =>
      request<OverdueDose[]>(`/api/patients/${patientId}/doses/overdue`),
    history: (patientId: number, from: string, to: string) =>
      request<Dose[]>(`/api/patients/${patientId}/missed-doses?from=${from}&to=${to}`),
    markTaken: (id: number) =>
      request<Dose>(`/api/doses/${id}/taken`, { method: "PUT" }),
  },
};