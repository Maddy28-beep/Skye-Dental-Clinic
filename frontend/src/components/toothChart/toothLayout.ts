import type { ToothCondition } from '../../types';

// FDI (ISO 3950) notation - two digits: quadrant + position. Used because it scales
// cleanly to both permanent (quadrants 1-4) and primary/pediatric (quadrants 5-8) teeth
// without switching numbering systems between the two chart modes.
export const ADULT_UPPER = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
export const ADULT_LOWER = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

export const PEDIATRIC_UPPER = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65'];
export const PEDIATRIC_LOWER = ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75'];

interface ConditionMeta {
  label: string;
  code: string;
  color: string;
  textColor: string;
}

// Matches the Philippine Dental Association standard chart legend (Condition /
// Restorations & Prosthetics / Surgery), so charting here reads the same way a dentist
// already reads a paper chart.
export const CONDITION_META: Record<ToothCondition, ConditionMeta> = {
  healthy: { label: 'Healthy / Unremarkable', code: '', color: '#ffffff', textColor: '#333743' },
  present: { label: 'Present Teeth', code: '✓', color: '#f0fdf4', textColor: '#166534' },
  decayed: { label: 'Decayed (Caries Indicated for Filling)', code: 'D', color: '#fde68a', textColor: '#78350f' },
  missing_caries: { label: 'Missing due to Caries', code: 'M', color: '#e2e5ea', textColor: '#8691a2' },
  missing_other: { label: 'Missing due to Other Causes', code: 'MO', color: '#d5d9e0', textColor: '#8691a2' },
  impacted: { label: 'Impacted Tooth', code: 'Im', color: '#fca5a5', textColor: '#7f1d1d' },
  supernumerary: { label: 'Supernumerary Tooth', code: 'Sp', color: '#fde68a', textColor: '#78350f' },
  root_fragment: { label: 'Root Fragment', code: 'RF', color: '#fecdd3', textColor: '#9f1239' },
  unerupted: { label: 'Unerupted', code: 'Un', color: '#e9d5ff', textColor: '#6b21a8' },

  jacket_crown: { label: 'Jacket Crown', code: 'JC', color: '#ddd6fe', textColor: '#5b21b6' },
  amalgam_filling: { label: 'Amalgam Filling', code: 'Am', color: '#bae6fd', textColor: '#075985' },
  composite_filling: { label: 'Composite Filling', code: 'Co', color: '#a5f3fc', textColor: '#155e75' },
  abutment: { label: 'Abutment', code: 'Ab', color: '#c7d2fe', textColor: '#3730a3' },
  pontic: { label: 'Pontic', code: 'P', color: '#bfdbfe', textColor: '#1e40af' },
  inlay: { label: 'Inlay', code: 'In', color: '#99f6e4', textColor: '#115e59' },
  fixed_composite: { label: 'Fixed Cure Composites', code: 'Fx', color: '#a7f3d0', textColor: '#065f46' },
  implant: { label: 'Implant', code: 'Imp', color: '#86efac', textColor: '#14532d' },
  sealant: { label: 'Sealants', code: 'S', color: '#fef08a', textColor: '#713f12' },
  removable_denture: { label: 'Removable Denture', code: 'Rm', color: '#fed7aa', textColor: '#9a3412' },
  attachment: { label: 'Attachment', code: 'Att', color: '#fbcfe8', textColor: '#9d174d' },

  extraction_caries: { label: 'Extraction due to Caries', code: 'X', color: '#fca5a5', textColor: '#7f1d1d' },
  extraction_other: { label: 'Extraction due to Other Causes', code: 'XO', color: '#f87171', textColor: '#7f1d1d' },
  congenitally_missing: { label: 'Congenitally Missing', code: 'Cm', color: '#d5d9e0', textColor: '#434a5b' },
  other: { label: 'Other', code: '?', color: '#d5d9e0', textColor: '#434a5b' },
};

export const CONDITION_GROUPS: { title: string; options: ToothCondition[] }[] = [
  {
    title: 'Condition',
    options: ['healthy', 'present', 'decayed', 'missing_caries', 'missing_other', 'impacted', 'supernumerary', 'root_fragment', 'unerupted'],
  },
  {
    title: 'Restorations & Prosthetics',
    options: ['jacket_crown', 'amalgam_filling', 'composite_filling', 'abutment', 'pontic', 'inlay', 'fixed_composite', 'implant', 'sealant', 'removable_denture', 'attachment'],
  },
  {
    title: 'Surgery',
    options: ['extraction_caries', 'extraction_other', 'congenitally_missing', 'other'],
  },
];

export const CONDITION_OPTIONS: ToothCondition[] = CONDITION_GROUPS.flatMap((g) => g.options);
