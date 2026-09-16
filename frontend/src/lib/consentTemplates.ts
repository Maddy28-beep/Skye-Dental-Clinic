import type { ConsentSection } from '../types';

// Content adapted from the standard informed-consent sections used on Philippine dental
// clinic intake forms. Each section is initialed separately by the patient (not just one
// blanket signature), matching how the paper form is actually filled out.
export function buildGeneralConsentSections(procedure: string): ConsentSection[] {
  return [
    {
      key: 'treatment',
      label: 'Treatment to be Done',
      text: `I understand and consent to have any treatment done by the dentist for "${procedure}" after the procedure, its risks, benefits and cost have been fully explained. These treatments include, but are not limited to, x-rays, cleanings, periodontal treatments, fillings, crowns, bridges, root canals, and/or dentures, local anesthesia, and surgical cases.`,
    },
    {
      key: 'drugs',
      label: 'Drugs & Medications',
      text: 'I understand that antibiotics, analgesics, and other medications can cause allergic reactions such as redness and swelling of tissues, pain, itching, vomiting, and/or anaphylactic shock.',
    },
    {
      key: 'treatment_plan',
      label: 'Changes in Treatment Plan',
      text: 'I understand that during treatment it may be necessary to change or add procedures because of conditions found while working on the teeth that were not discovered during examination. I give my permission to the dentist to make any additional changes as necessary, along with any additional costs.',
    },
    {
      key: 'radiograph',
      label: 'Radiograph',
      text: 'I understand that an x-ray or radiograph may be necessary as part of diagnostic aid to come up with a tentative diagnosis of my dental problem, and to make a good treatment plan, but this will not give me 100% assurance for the accuracy of the treatment, since all dental treatments are subject to unpredictable complications that may later lead to sudden change of treatment plan and subject to new charges.',
    },
    {
      key: 'removal_teeth',
      label: 'Removal of Teeth',
      text: 'I understand that there are alternatives to tooth removal, including their risk and benefits, prior to authorizing the dentist to remove teeth and any other structures necessary for reasons above. I understand that removing teeth does not always remove all the infection, if present, and it may be necessary to have further treatment.',
    },
    {
      key: 'crowns_bridges',
      label: 'Crowns (Caps) & Bridges',
      text: 'I understand that a tooth may irritate the nerve tissue in the center of the tooth, leaving the tooth extra-sensitive to heat, cold, and pressure. I understand that a bridge/crown may require several visits, and that I may be wearing a temporary crown/bridge that could come off easily and should be cared for until the permanent crown/bridge is delivered.',
    },
    {
      key: 'endodontics',
      label: 'Endodontics (Root Canal)',
      text: 'I understand there is no guarantee that a root canal treatment will save a tooth, and that complications can occur from the treatment. I understand endodontic files and drills are very fine instruments and are stressed in their normal usage, and that it may be necessary to perform additional treatment if a separated instrument cannot be removed or bypassed.',
    },
    {
      key: 'periodontal',
      label: 'Periodontal Disease',
      text: 'I understand periodontal (gum) disease is a serious condition causing gum and bone loss, and is generally treatable. I understand that undertaking any dental procedures may have future effects on my periodontal condition.',
    },
    {
      key: 'fillings',
      label: 'Fillings',
      text: 'I understand that care must be exercised in chewing on fillings, especially during the first 24 hours, to avoid breakage. I understand fillings, crowns, and bridges are sometimes temporary and may need to be adjusted, replaced, or fractured, and that further treatment or creating sensitivity is a possible complication.',
    },
    {
      key: 'dentures',
      label: 'Dentures',
      text: 'I understand that wearing dentures can be difficult, and that sore spots, altered speech, and difficulty in eating are common problems. I understand that immediate dentures require considerable adjustment, and that permanent relining or a remake may be needed within the first several months of wear, at additional cost if not included in the original agreement.',
    },
  ];
}

export const GENERAL_CONSENT_CLOSING =
  'I understand that dentistry is not an exact science and that no dentist can properly guarantee accurate results all the time. I hereby authorize the doctors/dental auxiliaries to proceed with and perform the dental restorations and treatments as explained to me. I understand that these are subject to modification depending on undiagnosable circumstances that may arise during the course of treatment, and that regardless of any dental insurance coverage I may have, I am responsible for payment of any attorney\'s fees, collection fee, or court costs that may be incurred should my obligation be referred to this office. All treatment fees, and any unforeseen circumstances that may arise during the procedure, have been explained to me and my acknowledgement of them, with full trust and confidence in him/her, to undergo dental treatment under his/her care.';

export const ORAL_SURGERY_RISKS: string[] = [
  'Postoperative discomfort and swelling that may necessitate several days of home recuperation.',
  'Restricted mouth opening for several days or weeks.',
  'Heavy bleeding that may be prolonged.',
  'Nausea and vomiting (usually associated with medications prescribed for pain).',
  'Postoperative infection requiring additional treatment.',
  'Decision to leave a small piece of root in the jaw when its removal would require extensive surgery.',
  'Damage to adjacent teeth, fillings, and crowns.',
  'Stretching of the corners of the mouth with resulting cracking and bruising.',
  'Change in occlusion and temporal-mandibular joint difficulty.',
  'Prolonged drowsiness.',
  'With surgery and extractions of the upper jaw, an opening into the maxillary nasal sinus or nose (a normal cavity situated above the upper teeth) requiring additional surgery.',
  'With surgery and extractions of the lower jaw, injury to the nerve underlying the teeth resulting in numbness or tingling of the lip, chin, gums, cheek, teeth, and/or tongue on the operated side. This may persist for several weeks, months, or in remote instances, be permanent.',
  'Breakage / fracture of the jaw.',
  'Cardiac arrest.',
];

export const ORAL_SURGERY_INTRO = (procedure: string) =>
  `I authorize the dentist and any other dentist of this clinic to perform the following treatment or surgical procedure: "${procedure}". I understand that this is an elective, urgent, or emergency procedure. I have been informed that the risks to my health if this procedure is not performed include, but are not limited to, pain, infection, cyst formation, loss of bone around teeth causing their loss, and an increased risk of complications if surgery is postponed. I have been informed of any possible alternative methods of treatment should any exist. I understand that there are certain inherent and potential risks in any treatment or procedure, and that in this specific instance, such risks may include the following:`;

export const ORAL_SURGERY_CLOSING =
  'I certify that I have read the above and fully understand this consent for surgery, and that I understand that a perfect result cannot be guaranteed. If unexpected problems arise during the procedure, the doctor has my permission to do what is deemed necessary to correct the condition. Drugs given at the time of surgery for sedative purposes or control of pain following the surgery may cause drowsiness and a lack of awareness or coordination. If instructed to do so, I will not drive or perform hazardous chores until I have recovered from the effects of these medications.';
