export type Role = 'admin' | 'assistant' | 'dentist';

export interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
  active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  patient_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  nickname: string | null;
  dob: string | null;
  sex: string | null;
  civil_status: string | null;
  religion: string | null;
  nationality: string | null;
  contact_number: string | null;
  office_number: string | null;
  email: string | null;
  address: string | null;
  occupation: string | null;
  dental_insurance: string | null;
  insurance_effective_date: string | null;
  referral_source: string | null;
  reason_for_consultation: string | null;
  guardian_name: string | null;
  guardian_occupation: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Open-ended: keyed by the PDA-style 39-item checklist (see medicalHistoryOptions.ts),
// but left as a bag of booleans since clinics customize the checklist over time.
export interface MedicalConditions {
  [key: string]: boolean | undefined;
}

export interface DentalConditions {
  previous_dental_treatment?: boolean;
  previous_extraction?: boolean;
  root_canal?: boolean;
  orthodontic_treatment?: boolean;
  dentures?: boolean;
  [key: string]: boolean | undefined;
}

export interface MedicalHistory {
  id: string;
  patient_id: string;
  conditions: MedicalConditions;
  dental_conditions: DentalConditions;
  allergies: string | null;
  current_medications: string | null;
  previous_hospitalization: string | null;
  previous_surgeries: string | null;
  is_pregnant: boolean;
  is_nursing: boolean;
  taking_birth_control: boolean;
  physician_name: string | null;
  physician_contact: string | null;
  physician_office_address: string | null;
  physician_office_number: string | null;
  last_dental_visit: string | null;
  previous_dentist: string | null;
  oral_hygiene_notes: string | null;
  in_good_health: boolean;
  under_medical_treatment: boolean;
  medical_treatment_detail: string | null;
  ever_hospitalized_detail: string | null;
  ever_serious_illness_detail: string | null;
  uses_tobacco: boolean;
  uses_alcohol_or_drugs: boolean;
  allergy_local_anesthetic: boolean;
  allergy_penicillin: boolean;
  allergy_antibiotics: boolean;
  allergy_sulfa_drugs: boolean;
  allergy_aspirin: boolean;
  allergy_latex: boolean;
  allergy_others: string | null;
  bleeding_time: string | null;
  blood_type: string | null;
  blood_pressure: string | null;
  notes: string | null;
  updated_at: string;
}

export interface DentalExam {
  id: string;
  patient_id: string;
  periodontal: Record<string, boolean | string | undefined>;
  occlusion: Record<string, boolean | string | undefined>;
  appliances: Record<string, boolean | string | undefined>;
  tmd: Record<string, boolean | string | undefined>;
  xray: Record<string, boolean | string | undefined>;
  recorded_by: string | null;
  updated_at: string;
}

// Matches the Philippine Dental Association standard chart legend, grouped the same way
// the paper form groups them (Condition / Restorations & Prosthetics / Surgery).
export type ToothCondition =
  // Condition
  | 'healthy'
  | 'present'
  | 'decayed'
  | 'missing_caries'
  | 'missing_other'
  | 'impacted'
  | 'supernumerary'
  | 'root_fragment'
  | 'unerupted'
  // Restorations & Prosthetics
  | 'jacket_crown'
  | 'amalgam_filling'
  | 'composite_filling'
  | 'abutment'
  | 'pontic'
  | 'inlay'
  | 'fixed_composite'
  | 'implant'
  | 'sealant'
  | 'removable_denture'
  | 'attachment'
  // Surgery
  | 'extraction_caries'
  | 'extraction_other'
  | 'congenitally_missing'
  | 'other';

export interface ToothRecord {
  id: string;
  patient_id: string;
  tooth_number: string;
  condition: ToothCondition;
  existing_treatment: string | null;
  planned_treatment: string | null;
  notes: string | null;
  dentist_id: string | null;
  recorded_by: string | null;
  recorded_at: string;
}

export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface Treatment {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  assistant_name: string | null;
  tooth_numbers: string[];
  procedure_name: string;
  description: string | null;
  status: TreatmentStatus;
  cost: number;
  discount: number;
  final_amount: number;
  notes: string | null;
  visit_date: string;
  next_appointment_date: string | null;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

export type PaymentStatus = 'pending' | 'verified';
export type PaymentMethod = 'cash' | 'gcash' | 'bank_transfer' | 'card' | 'other';

export interface Payment {
  id: string;
  patient_id: string;
  treatment_id: string | null;
  amount_due: number;
  amount_paid: number;
  balance: number;
  payment_method: PaymentMethod;
  recorded_by: string | null;
  status: PaymentStatus;
  verified_by_doctor_id: string | null;
  verified_by_doctor_name: string | null;
  verified_at: string | null;
  payment_date: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  procedure_name?: string;
}

export type ConsentStatus = 'draft' | 'signed';
export type ConsentTemplate = 'general' | 'oral_surgery';

export interface ConsentSection {
  key: string;
  label: string;
  text: string;
  initials?: string;
}

export interface ConsentAnesthesia {
  local_anesthesia?: boolean;
  nitrous_oxide?: boolean;
  oral_sedation?: boolean;
}

export interface Consent {
  id: string;
  patient_id: string;
  treatment_id: string | null;
  template: ConsentTemplate;
  procedure_name: string;
  consent_text: string;
  sections: ConsentSection[] | null;
  anesthesia: ConsentAnesthesia | null;
  version: number;
  signature_data: string | null;
  signed_name: string | null;
  witness_name: string | null;
  guardian_name: string | null;
  dentist_id: string | null;
  status: ConsentStatus;
  signed_at: string | null;
  superseded_by: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_name: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  patient_id: string | null;
  description: string;
  created_at: string;
}

export interface TimelineEvent {
  type: string;
  at: string;
  title: string;
  detail: string;
  ref_id: string;
}

export interface DashboardSummary {
  totalPatients: number;
  todayTreatments: number;
  completedTreatments: number;
  pendingVerification: number;
  pendingBalance: number;
  todayRevenue: number;
  recentPatients: Patient[];
  recentActivity: AuditLogEntry[];
}
