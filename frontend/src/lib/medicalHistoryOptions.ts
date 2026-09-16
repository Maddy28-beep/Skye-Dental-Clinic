// The standard 39-item "Do you have or have you had any of the following?" checklist used
// on Philippine dental intake forms (PDA-style), laid out in the same 3-column grouping as
// the paper form so it stays quick to scan/fill during intake.
export const CONDITION_COLUMNS: { key: string; label: string }[][] = [
  [
    { key: 'high_blood_pressure', label: 'High Blood Pressure' },
    { key: 'low_blood_pressure', label: 'Low Blood Pressure' },
    { key: 'epilepsy_convulsions', label: 'Epilepsy / Convulsions' },
    { key: 'aids_hiv', label: 'AIDS or HIV Infection' },
    { key: 'std', label: 'Sexually Transmitted Disease' },
    { key: 'stomach_ulcers', label: 'Stomach Troubles / Ulcers' },
    { key: 'fainting_seizure', label: 'Fainting Seizure' },
    { key: 'rapid_weight_loss', label: 'Rapid Weight Loss' },
    { key: 'radiation_therapy', label: 'Radiation Therapy' },
    { key: 'joint_replacement', label: 'Joint Replacement / Implant' },
    { key: 'heart_surgery', label: 'Heart Surgery' },
    { key: 'heart_attack', label: 'Heart Attack' },
    { key: 'thyroid_problem', label: 'Thyroid Problem' },
  ],
  [
    { key: 'heart_disease', label: 'Heart Disease' },
    { key: 'heart_murmur', label: 'Heart Murmur' },
    { key: 'hepatitis_liver', label: 'Hepatitis / Liver Disease' },
    { key: 'rheumatic_fever', label: 'Rheumatic Fever' },
    { key: 'hay_fever_allergies', label: 'Hay Fever / Allergies' },
    { key: 'respiratory_problems', label: 'Respiratory Problems' },
    { key: 'hepatitis_jaundice', label: 'Hepatitis / Jaundice' },
    { key: 'tuberculosis', label: 'Tuberculosis' },
    { key: 'swollen_ankles', label: 'Swollen Ankles' },
    { key: 'kidney_disease', label: 'Kidney Disease' },
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'chest_pain', label: 'Chest Pain' },
    { key: 'stroke', label: 'Stroke' },
  ],
  [
    { key: 'cancer_tumors', label: 'Cancer / Tumors' },
    { key: 'anemia', label: 'Anemia' },
    { key: 'angina', label: 'Angina' },
    { key: 'asthma', label: 'Asthma' },
    { key: 'emphysema', label: 'Emphysema' },
    { key: 'bleeding_problems', label: 'Bleeding Problems' },
    { key: 'blood_diseases', label: 'Blood Diseases' },
    { key: 'head_injuries', label: 'Head Injuries' },
    { key: 'arthritis_rheumatism', label: 'Arthritis / Rheumatism' },
    { key: 'other', label: 'Other' },
  ],
];

export const ALLERGY_FIELDS: { key: string; label: string }[] = [
  { key: 'allergy_local_anesthetic', label: 'Local Anesthetic (Lidocaine)' },
  { key: 'allergy_penicillin', label: 'Penicillin' },
  { key: 'allergy_antibiotics', label: 'Antibiotics' },
  { key: 'allergy_sulfa_drugs', label: 'Sulfa Drugs' },
  { key: 'allergy_aspirin', label: 'Aspirin' },
  { key: 'allergy_latex', label: 'Latex' },
];

export const DENTAL_CONDITIONS: { key: string; label: string }[] = [
  { key: 'previous_dental_treatment', label: 'Previous Dental Treatment' },
  { key: 'previous_extraction', label: 'Previous Extraction' },
  { key: 'root_canal', label: 'Previous Root Canal' },
  { key: 'orthodontic_treatment', label: 'Orthodontic Treatment' },
  { key: 'dentures', label: 'Denture History' },
];

export const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
