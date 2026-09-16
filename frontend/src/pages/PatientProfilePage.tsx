import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { patientsApi } from '../api/patients';
import { medicalHistoryApi } from '../api/medicalHistory';
import { treatmentsApi } from '../api/treatments';
import { paymentsApi } from '../api/payments';
import { doctorsApi } from '../api/doctors';
import type { Doctor, MedicalHistory, Patient, Payment, Treatment } from '../types';
import { PatientHeader } from '../components/patients/PatientHeader';
import { PatientForm } from '../components/patients/PatientForm';
import { MedicalHistoryForm } from '../components/medicalHistory/MedicalHistoryForm';
import { ToothChart } from '../components/toothChart/ToothChart';
import { ClinicalExamForm } from '../components/toothChart/ClinicalExamForm';
import { TreatmentForm } from '../components/treatments/TreatmentForm';
import { TreatmentTable } from '../components/treatments/TreatmentTable';
import { PaymentForm } from '../components/payments/PaymentForm';
import { PaymentTable } from '../components/payments/PaymentTable';
import { PaymentVerificationModal } from '../components/payments/PaymentVerificationModal';
import { ConsentPanel } from '../components/consent/ConsentPanel';
import { PatientTimeline } from '../components/timeline/PatientTimeline';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FullPageSpinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { useSession } from '../context/SessionContext';

const TABS = ['Overview', 'Medical History', 'Tooth Chart', 'Treatments', 'Payments', 'Consent', 'Timeline'] as const;
type Tab = (typeof TABS)[number];

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medHistory, setMedHistory] = useState<MedicalHistory | null>(null);
  const [treatments, setTreatments] = useState<Treatment[] | null>(null);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [tab, setTab] = useState<Tab>('Overview');
  const [showEdit, setShowEdit] = useState(false);
  const [showNewTreatment, setShowNewTreatment] = useState(false);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState<Payment | null>(null);
  const { session } = useSession();

  function loadPatient() {
    if (!id) return;
    patientsApi.get(id).then(setPatient);
  }
  function loadMedHistory() {
    if (!id) return;
    medicalHistoryApi.get(id).then(setMedHistory);
  }
  function loadTreatments() {
    if (!id) return;
    treatmentsApi.listByPatient(id).then(setTreatments);
  }
  function loadPayments() {
    if (!id) return;
    paymentsApi.listByPatient(id).then(setPayments);
  }

  useEffect(() => {
    loadPatient();
    loadMedHistory();
    loadTreatments();
    loadPayments();
    doctorsApi.list().then(setDoctors);
    setTab('Overview');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!patient || !id) return <FullPageSpinner label="Loading patient..." />;

  const patientName = `${patient.first_name} ${patient.last_name}`;

  return (
    <div className="space-y-4">
      <PatientHeader patient={patient} onEdit={() => setShowEdit(true)} />

      <div className="sticky top-0 z-10 -mx-3 overflow-x-auto bg-ink-50 px-3 py-1 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1 rounded-xl bg-white p-1 shadow-sm sm:w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                tab === t ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Overview' && (
        <Card>
          <CardHeader title="Patient Information" />
          <CardBody>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Patient ID" value={patient.patient_code} />
              <Field label="Full Name" value={`${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`} />
              <Field label="Nickname" value={patient.nickname} />
              <Field label="Date of Birth" value={patient.dob} />
              <Field label="Sex" value={patient.sex} />
              <Field label="Civil Status" value={patient.civil_status} />
              <Field label="Religion" value={patient.religion} />
              <Field label="Nationality" value={patient.nationality} />
              <Field label="Contact Number" value={patient.contact_number} />
              <Field label="Office Number" value={patient.office_number} />
              <Field label="Email" value={patient.email} />
              <Field label="Address" value={patient.address} />
              <Field label="Occupation" value={patient.occupation} />
              <Field label="Dental Insurance" value={patient.dental_insurance} />
              <Field label="Referred By" value={patient.referral_source} />
              <Field label="Reason for Consultation" value={patient.reason_for_consultation} />
              {patient.guardian_name && <Field label="Parent / Guardian" value={patient.guardian_name} />}
              <Field label="Emergency Contact" value={patient.emergency_contact_name} />
              <Field label="Emergency Contact Number" value={patient.emergency_contact_number} />
              <Field label="Status" value={patient.status} />
              <Field label="Notes" value={patient.notes} />
            </dl>
          </CardBody>
        </Card>
      )}

      {tab === 'Medical History' && (
        <Card>
          <CardHeader title="Medical & Dental History" subtitle="Keep this quick to fill — structured fields plus free-text notes." />
          <CardBody>
            <MedicalHistoryForm
              initial={medHistory}
              onSubmit={async (data) => {
                await medicalHistoryApi.save(id, { ...data, recorded_by: session.name, role: session.role });
                loadMedHistory();
              }}
            />
          </CardBody>
        </Card>
      )}

      {tab === 'Tooth Chart' && (
        <div className="space-y-4">
          <ClinicalExamForm patientId={id} />
          <Card>
            <CardHeader title="Dental / Tooth Chart" />
            <CardBody>
              <ToothChart patientId={id} />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'Treatments' && (
        <Card>
          <CardHeader
            title="Treatments & Procedures"
            action={<Button size="sm" onClick={() => setShowNewTreatment(true)}><Plus size={16} /> Add Treatment</Button>}
          />
          <CardBody className="p-0">
            {!treatments ? null : treatments.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No treatments recorded" description="Add the patient's first treatment or procedure." action={<Button onClick={() => setShowNewTreatment(true)}>Add Treatment</Button>} />
              </div>
            ) : (
              <TreatmentTable treatments={treatments} />
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'Payments' && (
        <Card>
          <CardHeader
            title="Payments"
            subtitle="Every payment needs doctor PIN verification."
            action={<Button size="sm" onClick={() => setShowNewPayment(true)}><Plus size={16} /> Record Payment</Button>}
          />
          <CardBody className="p-0">
            {!payments ? null : payments.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No payments recorded" description="Record a payment once a treatment has a cost." action={<Button onClick={() => setShowNewPayment(true)}>Record Payment</Button>} />
              </div>
            ) : (
              <PaymentTable payments={payments} onVerify={setVerifyingPayment} />
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'Consent' && (
        <ConsentPanel patientId={id} patientName={patientName} patientDob={patient.dob} treatments={treatments ?? []} />
      )}

      {tab === 'Timeline' && (
        <Card>
          <CardHeader title="Patient Timeline" subtitle="Chronological history of this patient's care." />
          <CardBody>
            <PatientTimeline patientId={id} />
          </CardBody>
        </Card>
      )}

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Patient Information" size="lg">
        <PatientForm
          initial={patient}
          submitLabel="Save Changes"
          onCancel={() => setShowEdit(false)}
          onSubmit={async (data) => {
            await patientsApi.update(id, { ...data, recorded_by: session.name, role: session.role });
            setShowEdit(false);
            loadPatient();
          }}
        />
      </Modal>

      <Modal open={showNewTreatment} onClose={() => setShowNewTreatment(false)} title="Add Treatment / Procedure" size="lg">
        <TreatmentForm
          doctors={doctors}
          onCancel={() => setShowNewTreatment(false)}
          onSubmit={async (data) => {
            await treatmentsApi.create({ ...data, patient_id: id, assistant_name: session.name, recorded_by: session.name, role: session.role });
            setShowNewTreatment(false);
            loadTreatments();
          }}
        />
      </Modal>

      <Modal open={showNewPayment} onClose={() => setShowNewPayment(false)} title="Record Payment" size="md">
        <PaymentForm
          treatments={treatments ?? []}
          onCancel={() => setShowNewPayment(false)}
          onSubmit={async (data) => {
            await paymentsApi.create({ ...data, patient_id: id, recorded_by: session.name, role: session.role });
            setShowNewPayment(false);
            loadPayments();
          }}
        />
      </Modal>

      {verifyingPayment && (
        <PaymentVerificationModal
          open={!!verifyingPayment}
          onClose={() => setVerifyingPayment(null)}
          payment={{ ...verifyingPayment, first_name: patient.first_name, last_name: patient.last_name }}
          onVerified={() => {
            loadPayments();
          }}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-800">{value || '—'}</dd>
    </div>
  );
}
