import { useState } from 'react';
import type { MedicalHistory } from '../../types';
import { Button } from '../common/Button';
import { CONDITION_COLUMNS, ALLERGY_FIELDS, DENTAL_CONDITIONS, BLOOD_TYPES } from '../../lib/medicalHistoryOptions';

interface MedicalHistoryFormProps {
  initial: MedicalHistory | null;
  onSubmit: (data: Partial<MedicalHistory>) => Promise<void>;
  readOnly?: boolean;
}

const FIELD_CLASS =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-ink-700';

function YesNo({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 px-3.5 py-2.5">
      <span className="text-sm text-ink-700">{label}</span>
      <div className="flex gap-1 rounded-lg bg-ink-100 p-0.5">
        <button type="button" onClick={() => onChange(true)} className={`rounded-md px-3 py-1 text-xs font-medium ${value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'}`}>Yes</button>
        <button type="button" onClick={() => onChange(false)} className={`rounded-md px-3 py-1 text-xs font-medium ${!value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'}`}>No</button>
      </div>
    </div>
  );
}

export function MedicalHistoryForm({ initial, onSubmit, readOnly }: MedicalHistoryFormProps) {
  const [conditions, setConditions] = useState(initial?.conditions ?? {});
  const [dentalConditions, setDentalConditions] = useState(initial?.dental_conditions ?? {});
  const [allergies, setAllergies] = useState(initial?.allergies ?? '');
  const [currentMedications, setCurrentMedications] = useState(initial?.current_medications ?? '');
  const [previousHospitalization, setPreviousHospitalization] = useState(initial?.previous_hospitalization ?? '');
  const [previousSurgeries, setPreviousSurgeries] = useState(initial?.previous_surgeries ?? '');
  const [isPregnant, setIsPregnant] = useState(!!initial?.is_pregnant);
  const [isNursing, setIsNursing] = useState(!!initial?.is_nursing);
  const [takingBirthControl, setTakingBirthControl] = useState(!!initial?.taking_birth_control);
  const [physicianName, setPhysicianName] = useState(initial?.physician_name ?? '');
  const [physicianContact, setPhysicianContact] = useState(initial?.physician_contact ?? '');
  const [physicianOfficeAddress, setPhysicianOfficeAddress] = useState(initial?.physician_office_address ?? '');
  const [physicianOfficeNumber, setPhysicianOfficeNumber] = useState(initial?.physician_office_number ?? '');
  const [lastDentalVisit, setLastDentalVisit] = useState(initial?.last_dental_visit ?? '');
  const [previousDentist, setPreviousDentist] = useState(initial?.previous_dentist ?? '');
  const [oralHygieneNotes, setOralHygieneNotes] = useState(initial?.oral_hygiene_notes ?? '');
  const [inGoodHealth, setInGoodHealth] = useState(initial?.in_good_health ?? true);
  const [underMedicalTreatment, setUnderMedicalTreatment] = useState(!!initial?.under_medical_treatment);
  const [medicalTreatmentDetail, setMedicalTreatmentDetail] = useState(initial?.medical_treatment_detail ?? '');
  const [everHospitalizedDetail, setEverHospitalizedDetail] = useState(initial?.ever_hospitalized_detail ?? '');
  const [everSeriousIllnessDetail, setEverSeriousIllnessDetail] = useState(initial?.ever_serious_illness_detail ?? '');
  const [usesTobacco, setUsesTobacco] = useState(!!initial?.uses_tobacco);
  const [usesAlcoholOrDrugs, setUsesAlcoholOrDrugs] = useState(!!initial?.uses_alcohol_or_drugs);
  const [allergyFlags, setAllergyFlags] = useState<Record<string, boolean>>({
    allergy_local_anesthetic: !!initial?.allergy_local_anesthetic,
    allergy_penicillin: !!initial?.allergy_penicillin,
    allergy_antibiotics: !!initial?.allergy_antibiotics,
    allergy_sulfa_drugs: !!initial?.allergy_sulfa_drugs,
    allergy_aspirin: !!initial?.allergy_aspirin,
    allergy_latex: !!initial?.allergy_latex,
  });
  const [allergyOthers, setAllergyOthers] = useState(initial?.allergy_others ?? '');
  const [bleedingTime, setBleedingTime] = useState(initial?.bleeding_time ?? '');
  const [bloodType, setBloodType] = useState(initial?.blood_type ?? '');
  const [bloodPressure, setBloodPressure] = useState(initial?.blood_pressure ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await onSubmit({
        conditions,
        dental_conditions: dentalConditions,
        allergies: allergies || null,
        current_medications: currentMedications || null,
        previous_hospitalization: previousHospitalization || null,
        previous_surgeries: previousSurgeries || null,
        is_pregnant: isPregnant,
        is_nursing: isNursing,
        taking_birth_control: takingBirthControl,
        physician_name: physicianName || null,
        physician_contact: physicianContact || null,
        physician_office_address: physicianOfficeAddress || null,
        physician_office_number: physicianOfficeNumber || null,
        last_dental_visit: lastDentalVisit || null,
        previous_dentist: previousDentist || null,
        oral_hygiene_notes: oralHygieneNotes || null,
        in_good_health: inGoodHealth,
        under_medical_treatment: underMedicalTreatment,
        medical_treatment_detail: medicalTreatmentDetail || null,
        ever_hospitalized_detail: everHospitalizedDetail || null,
        ever_serious_illness_detail: everSeriousIllnessDetail || null,
        uses_tobacco: usesTobacco,
        uses_alcohol_or_drugs: usesAlcoholOrDrugs,
        ...allergyFlags,
        allergy_others: allergyOthers || null,
        bleeding_time: bleedingTime || null,
        blood_type: bloodType || null,
        blood_pressure: bloodPressure || null,
        notes: notes || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <fieldset disabled={readOnly} className="space-y-6">
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-ink-800">General Health</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <YesNo value={inGoodHealth} onChange={setInGoodHealth} label="Are you in good health?" />
          <YesNo value={underMedicalTreatment} onChange={setUnderMedicalTreatment} label="Under medical treatment now?" />
        </div>
        {underMedicalTreatment && (
          <input className={FIELD_CLASS} placeholder="If so, what condition is being treated?" value={medicalTreatmentDetail} onChange={(e) => setMedicalTreatmentDetail(e.target.value)} />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={FIELD_CLASS} placeholder="Serious illness or surgical operation? If so, what?" value={everSeriousIllnessDetail} onChange={(e) => setEverSeriousIllnessDetail(e.target.value)} />
          <input className={FIELD_CLASS} placeholder="Ever hospitalized? If so, when and why?" value={everHospitalizedDetail} onChange={(e) => setEverHospitalizedDetail(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <YesNo value={usesTobacco} onChange={setUsesTobacco} label="Do you use tobacco products?" />
          <YesNo value={usesAlcoholOrDrugs} onChange={setUsesAlcoholOrDrugs} label="Alcohol, cocaine, or other drugs?" />
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold text-ink-800">Do you have or have you had any of the following?</h4>
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
          {CONDITION_COLUMNS.map((column, i) => (
            <div key={i} className="space-y-1.5">
              {column.map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm has-checked:border-brand-400 has-checked:bg-brand-50"
                >
                  <input
                    type="checkbox"
                    checked={!!conditions[c.key]}
                    onChange={(e) => setConditions((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                    className="h-4 w-4 shrink-0 accent-brand-600"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold text-ink-800">Allergies</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALLERGY_FIELDS.map((a) => (
            <label
              key={a.key}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm has-checked:border-brand-400 has-checked:bg-brand-50"
            >
              <input
                type="checkbox"
                checked={!!allergyFlags[a.key]}
                onChange={(e) => setAllergyFlags((prev) => ({ ...prev, [a.key]: e.target.checked }))}
                className="h-4 w-4 accent-brand-600"
              />
              {a.label}
            </label>
          ))}
        </div>
        <input className={`${FIELD_CLASS} mt-2`} placeholder="Other allergies" value={allergyOthers} onChange={(e) => setAllergyOthers(e.target.value)} />
        <input className={`${FIELD_CLASS} mt-2`} placeholder="General allergy notes (free text)" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold text-ink-800">Vitals &amp; Women's Health</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={LABEL_CLASS}>Blood Type</label>
            <select className={FIELD_CLASS} value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
              <option value="">Unknown</option>
              {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Blood Pressure</label>
            <input className={FIELD_CLASS} placeholder="e.g. 120/80" value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Bleeding Time</label>
            <input className={FIELD_CLASS} value={bleedingTime} onChange={(e) => setBleedingTime(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm has-checked:border-brand-400 has-checked:bg-brand-50">
            <input type="checkbox" checked={isPregnant} onChange={(e) => setIsPregnant(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Currently Pregnant
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm has-checked:border-brand-400 has-checked:bg-brand-50">
            <input type="checkbox" checked={isNursing} onChange={(e) => setIsNursing(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Currently Nursing
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm has-checked:border-brand-400 has-checked:bg-brand-50">
            <input type="checkbox" checked={takingBirthControl} onChange={(e) => setTakingBirthControl(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Taking Birth Control Pills
          </label>
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold text-ink-800">Medications &amp; Physician</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS}>Current Medications</label>
            <input className={FIELD_CLASS} value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Previous Surgeries</label>
            <input className={FIELD_CLASS} value={previousSurgeries} onChange={(e) => setPreviousSurgeries(e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Previous Hospitalization</label>
            <input className={FIELD_CLASS} value={previousHospitalization} onChange={(e) => setPreviousHospitalization(e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Physician Name</label>
            <input className={FIELD_CLASS} placeholder="Dr." value={physicianName} onChange={(e) => setPhysicianName(e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Physician Office Address</label>
            <input className={FIELD_CLASS} value={physicianOfficeAddress} onChange={(e) => setPhysicianOfficeAddress(e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Physician Office Number</label>
            <input className={FIELD_CLASS} value={physicianOfficeNumber} onChange={(e) => setPhysicianOfficeNumber(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Physician Contact (mobile)</label>
            <input className={FIELD_CLASS} value={physicianContact} onChange={(e) => setPhysicianContact(e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold text-ink-800">Dental History</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DENTAL_CONDITIONS.map((c) => (
            <label
              key={c.key}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm has-checked:border-brand-400 has-checked:bg-brand-50"
            >
              <input
                type="checkbox"
                checked={!!dentalConditions[c.key]}
                onChange={(e) => setDentalConditions((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                className="h-4 w-4 accent-brand-600"
              />
              {c.label}
            </label>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={LABEL_CLASS}>Previous Dentist</label>
            <input className={FIELD_CLASS} placeholder="Dr." value={previousDentist} onChange={(e) => setPreviousDentist(e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Last Dental Visit</label>
            <input type="date" className={FIELD_CLASS} value={lastDentalVisit} onChange={(e) => setLastDentalVisit(e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Oral Hygiene Notes</label>
            <input className={FIELD_CLASS} value={oralHygieneNotes} onChange={(e) => setOralHygieneNotes(e.target.value)} />
          </div>
        </div>
      </section>

      <div>
        <label className={LABEL_CLASS}>Additional Notes</label>
        <textarea className={FIELD_CLASS} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {!readOnly && (
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-emerald-600">Saved</span>}
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Medical History'}
          </Button>
        </div>
      )}
    </fieldset>
  );
}
