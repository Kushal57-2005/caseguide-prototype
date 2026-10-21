/**
 * @file mockLegalAnswers.js
 * @description Curated mock responses matching the 4 sample problems and generic queries for offline test mode.
 * @inputs User query string.
 * @outputs Validated LegalAnswerSchema-compliant response object.
 */

export const SAMPLE_ANSWERS = {
  defective_product: {
    in_scope: true,
    problem_summary: "Online seller or merchant refusing to refund or replace a defective product delivered to the consumer.",
    category: "consumer",
    legal_match: [
      {
        type: "Section",
        name: "Consumer Protection Act, 2019",
        reference: "Section 2(11) & Section 84",
        why_it_applies: "Defines 'deficiency in service' and 'product liability' holding manufacturers and sellers liable for defective goods.",
        confidence: "high"
      },
      {
        type: "Rule",
        name: "Consumer Protection (E-Commerce) Rules, 2020",
        reference: "Rule 4 & Rule 6",
        why_it_applies: "Mandates transparent cancellation, return, and refund policies for all e-commerce platforms in India.",
        confidence: "high"
      }
    ],
    plain_explanation: "Under Indian consumer law, you are legally entitled to either a free repair, a brand new replacement, or a full refund if a product has manufacturing flaws or does not conform to the promised specifications. Sellers and platforms cannot evade liability through arbitrary 'no refund' banners.",
    next_steps: [
      {
        title: "Send Written Demand to Customer Support",
        detail: "Draft an email to the seller and platform grievances officer attaching order invoice, unboxing photos/video, and giving 48 hours to refund."
      },
      {
        title: "Lodge National Consumer Helpline (NCH) Complaint",
        detail: "Call toll-free 1915 or register the complaint on consumerhelpline.gov.in with invoice details for quick pre-litigation mediation."
      },
      {
        title: "File e-Daakhil Online Consumer Case",
        detail: "If unresolved after 15 days, file a formal complaint before the District Consumer Disputes Redressal Commission via edaakhil.nic.in without hiring an advocate."
      }
    ],
    forum: {
      office: "District Consumer Commission / National Consumer Helpline (1915)",
      fee: "Zero fee for claims up to ₹5 Lakhs (nominal fee above ₹5L)",
      likely_time: "NCH: 7-21 days; District Commission: 3-6 months"
    },
    documents_needed: [
      "Original purchase invoice / tax bill",
      "Delivery receipt or courier tracking proof",
      "Photographs or unboxing video highlighting the defect",
      "Screenshots of correspondence / emails refusing refund"
    ],
    timeline: [
      { when: "Day 1-2", what: "Send formal written notice / email to seller grievance desk" },
      { when: "Day 3-5", what: "Register complaint on National Consumer Helpline (1915)" },
      { when: "Day 15-30", what: "If no settlement, file petition on e-Daakhil portal" }
    ],
    warnings: [
      "Do not tamper with or attempt uncertified third-party repair before recording evidence.",
      "Consumer complaints must be filed within 2 years from the date of cause of action (Sec 69, CPA 2019)."
    ],
    disclaimer: "This information is based on the Consumer Protection Act, 2019 and E-Commerce Rules, 2020. It provides legal guidance and does not substitute professional legal counsel."
  },

  upi_fraud: {
    in_scope: true,
    problem_summary: "Unauthorized money deduction through deceptive UPI link, fake customer care, or OTP sharing fraud.",
    category: "cyber fraud",
    legal_match: [
      {
        type: "Section",
        name: "Bharatiya Nyaya Sanhita (BNS), 2023",
        reference: "Section 318(4) [Corresponding to old IPC Section 420]",
        why_it_applies: "Cheating and dishonestly inducing delivery of property or unauthorized bank transfer.",
        confidence: "high"
      },
      {
        type: "Section",
        name: "Information Technology Act, 2000",
        reference: "Section 66D",
        why_it_applies: "Punishment for cheating by personation using computer resource or electronic communication device.",
        confidence: "high"
      },
      {
        type: "Rule",
        name: "RBI Circular on Customer Liability in Unauthorized Electronic Banking",
        reference: "RBI/2017-18/15 DBR.No.Leg.BC.78/09.07.005/2017-18",
        why_it_applies: "Zero or limited customer liability if unauthorized transaction is notified to bank within the 'Golden 72 Hours'.",
        confidence: "high"
      }
    ],
    plain_explanation: "Cyber fraud involving UPI and OTP is a cognizable criminal offense under BNS and the IT Act. The Reserve Bank of India has strict guidelines safeguarding consumers: if you report an unauthorized deduction immediately within the golden hour, your bank is mandated to freeze the beneficiary account and reverse unauthorized charges.",
    next_steps: [
      {
        title: "Immediately Dial Cyber Crime Helpline 1930",
        detail: "Call 1930 within the 'Golden Hour' to trigger the Citizen Financial Cyber Fraud Reporting System (CFCFRMS) to freeze the suspect's mule wallet/account."
      },
      {
        title: "Block Card / UPI & Notify Bank in Writing",
        detail: "Inform your bank's fraud monitoring cell immediately and obtain an official dispute Acknowledgement Reference Number."
      },
      {
        title: "File Formal Cyber Crime Complaint",
        detail: "Submit complaint on cybercrime.gov.in and visit the nearest Cyber Police Station with your bank statement."
      }
    ],
    forum: {
      office: "National Cyber Crime Reporting Portal (1930) & Bank Grievance Cell",
      fee: "Zero fee",
      likely_time: "Lien freeze: within hours; Bank investigation: 30 to 90 days"
    },
    documents_needed: [
      "Bank statement showing the debit transaction details and UTR number",
      "SMS alerts received during the unauthorized transaction",
      "Screenshot of fraudulent WhatsApp chat, call log, or phishing payment link",
      "Copy of Cyber Crime Complaint Acknowledgement (CFCFRMS)"
    ],
    timeline: [
      { when: "0 - 2 Hours", what: "Call 1930 to freeze beneficiary account and block UPI" },
      { when: "Within 24 Hours", what: "Submit written dispute letter to home branch bank manager" },
      { when: "Within 72 Hours", what: "File online report at cybercrime.gov.in to limit consumer liability" }
    ],
    warnings: [
      "Never disclose passwords, card CVV, or OTP to anyone claiming to be bank or police personnel.",
      "Reporting within 72 hours is vital under RBI guidelines; delays past 7 days significantly reduce bank liability."
    ],
    disclaimer: "This guidance is aligned with Bharatiya Nyaya Sanhita, 2023 and RBI Customer Protection directives. Consult a legal advocate or cyber law expert for ongoing court representations."
  },

  refusing_fir: {
    in_scope: true,
    problem_summary: "Station House Officer (SHO) or police officers refusing to register a First Information Report (FIR) for a cognizable crime.",
    category: "police/FIR",
    legal_match: [
      {
        type: "Section",
        name: "Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
        reference: "Section 173(1) & 173(3) [Old CrPC Section 154]",
        why_it_applies: "Mandates that every information relating to the commission of a cognizable offence must be recorded as an FIR (or e-FIR).",
        confidence: "high"
      },
      {
        type: "Section",
        name: "Bharatiya Nyaya Sanhita (BNS), 2023",
        reference: "Section 199 [Old IPC Section 166A]",
        why_it_applies: "Imposes strict punishment on a public servant who knowingly disobeys law, including refusing to record information.",
        confidence: "high"
      },
      {
        type: "Section",
        name: "Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
        reference: "Section 175(3) & 175(4) [Old CrPC Section 156(3)]",
        why_it_applies: "Empowers the Judicial Magistrate to direct the police to register an FIR and conduct investigation.",
        confidence: "high"
      }
    ],
    plain_explanation: "Under the Constitution of India and BNSS 2023 (as reaffirmed by the Supreme Court in the landmark Lalita Kumari v. Govt of UP ruling), police officers have no discretion to refuse registration of an FIR if the complaint discloses a cognizable offense. BNSS also formally permits filing an e-FIR.",
    next_steps: [
      {
        title: "Send Written Complaint to SP / DCP (BNSS Sec 173(4))",
        detail: "Send the full written complaint along with proof of refusal to the Superintendent of Police or Commissioner via Registered Post AD."
      },
      {
        title: "Approach the Judicial Magistrate (BNSS Sec 175(3))",
        detail: "If the SP fails to act, file an application under Section 175(3) BNSS before the local Magistrate praying for directions to lodge the FIR."
      },
      {
        title: "Lodge Complaint with Police Complaints Authority",
        detail: "Submit an inquiry request before the State/District Police Complaints Authority against the errant officer under Section 199 BNS."
      }
    ],
    forum: {
      office: "Office of Superintendent of Police (SP) / Court of Judicial Magistrate",
      fee: "Nominal court fee stamps (approx ₹10 - ₹50)",
      likely_time: "SP review: 7-15 days; Magistrate hearing: 2-4 weeks"
    },
    documents_needed: [
      "Typed copy of original complaint with date, time, and incident facts",
      "Postal tracking receipt of Registered Post sent to the SP / DCP",
      "General Diary (GD) entry copy or diary number if provided at the station",
      "Names/designation of police officers who declined registration (if noted)"
    ],
    timeline: [
      { when: "Day 1", what: "Demand written acknowledgment or GD entry from station officer" },
      { when: "Day 2-3", what: "Dispatch complaint to Superintendent of Police via Registered Post" },
      { when: "Day 15+", what: "File Section 175(3) BNSS application before the Judicial Magistrate" }
    ],
    warnings: [
      "Always retain the postal receipt (Speed Post / Regd AD) as essential proof for the Magistrate.",
      "Do not sign blank papers or agree to downgrade a serious cognizable crime into a non-cognizable (NC) diary entry."
    ],
    disclaimer: "This guidance reflects BNSS, 2023 and Supreme Court directives. For courtroom filings before the Judicial Magistrate, consulting a criminal defense advocate is strongly advised."
  },

  rti_no_reply: {
    in_scope: true,
    problem_summary: "Public Information Officer (PIO) failed to respond or furnish requested information within statutory 30-day RTI deadline.",
    category: "RTI",
    legal_match: [
      {
        type: "Section",
        name: "Right to Information Act, 2005",
        reference: "Section 7(1)",
        why_it_applies: "Mandates the PIO to provide information or reject the request within 30 days of receiving the application (48 hours for life & liberty).",
        confidence: "high"
      },
      {
        type: "Section",
        name: "Right to Information Act, 2005",
        reference: "Section 7(6)",
        why_it_applies: "Requires that if the public authority fails to reply within 30 days, information must be provided free of cost.",
        confidence: "high"
      },
      {
        type: "Section",
        name: "Right to Information Act, 2005",
        reference: "Section 19(1)",
        why_it_applies: "Permits applicant to file a First Appeal before the First Appellate Authority (FAA) within 30 days from expiry of the deadline.",
        confidence: "high"
      },
      {
        type: "Section",
        name: "Right to Information Act, 2005",
        reference: "Section 20(1)",
        why_it_applies: "Information Commission can impose personal penalty of ₹250/day (up to ₹25,000) on the defaulting PIO.",
        confidence: "medium"
      }
    ],
    plain_explanation: "Under the RTI Act 2005, the Public Information Officer is legally obligated to reply within 30 calendar days. If they fail to answer, it is legally deemed a 'deemed refusal' under Section 7(2). You now have the right to file a First Appeal, and the public body loses the legal right to charge photocopying or inspection fees.",
    next_steps: [
      {
        title: "File First Appeal under Section 19(1)",
        detail: "Address your First Appeal to the designated First Appellate Authority (senior officer in the same department) citing 'Deemed Refusal under Section 7(2)'."
      },
      {
        title: "Claim Free Information under Section 7(6)",
        detail: "Explicitly mention that because 30 days have elapsed, the department must supply all documents completely free of cost."
      },
      {
        title: "Prepare Second Appeal to CIC / SIC (Sec 19(3))",
        detail: "If the First Appellate Authority does not issue an order within 30 to 45 days, file a Second Appeal and penalty petition before the Information Commission."
      }
    ],
    forum: {
      office: "First Appellate Authority (FAA) / Central/State Information Commission",
      fee: "Zero fee in most states / nominal ₹10 or ₹20 in select states",
      likely_time: "First Appeal: 30-45 days; Second Appeal: 3-6 months"
    },
    documents_needed: [
      "Copy of the original RTI application submitted",
      "Proof of payment of initial RTI fee (IPO, demand draft, or online payment receipt)",
      "Postal delivery confirmation / tracking showing when the PIO received the RTI",
      "Form of First Appeal clearly mentioning the grounds of appeal"
    ],
    timeline: [
      { when: "Day 31", what: "Calculate completion of 30-day statutory window" },
      { when: "Day 31-60", what: "Submit First Appeal before the First Appellate Authority" },
      { when: "Day 90+", what: "If no FAA order, file Second Appeal with Information Commission (CIC/SIC)" }
    ],
    warnings: [
      "Ensure First Appeal is filed within 30 days of the deadline expiry (delay condonation requires valid cause).",
      "Do not alter the original questions or ask new queries in the Appeal stage."
    ],
    disclaimer: "Information based on the Right to Information Act, 2005. Legal procedures apply across Central and State public authorities."
  }
};

/**
 * Returns a high-quality mock legal answer based on user query keywords.
 * @param {string} question 
 * @returns {object} Mock legal answer matching schema
 */
export function getMockLegalAnswer(question = '') {
  const q = question.toLowerCase();

  if (q.includes('refund') || q.includes('defective') || q.includes('product') || q.includes('consumer') || q.includes('seller') || q.includes('flipkart') || q.includes('amazon')) {
    return SAMPLE_ANSWERS.defective_product;
  }

  if (q.includes('upi') || q.includes('otp') || q.includes('fraud') || q.includes('scam') || q.includes('cyber') || q.includes('phishing') || q.includes('hacked') || q.includes('bank transfer')) {
    return SAMPLE_ANSWERS.upi_fraud;
  }

  if (q.includes('fir') || q.includes('police') || q.includes('station') || q.includes('refus') || q.includes('bns') || q.includes('bnss') || q.includes('ipc') || q.includes('crime')) {
    return SAMPLE_ANSWERS.refusing_fir;
  }

  if (q.includes('rti') || q.includes('right to information') || q.includes('pio') || q.includes('appellate') || q.includes('cic')) {
    return SAMPLE_ANSWERS.rti_no_reply;
  }

  // Generic in-scope fallback answer
  return {
    in_scope: true,
    problem_summary: question.length > 80 ? question.slice(0, 80) + '...' : question,
    category: "general legal",
    legal_match: [
      {
        type: "Act",
        name: "Constitution of India & Relevant Statutes",
        reference: "Article 21 & Applicable Civil/Criminal Laws",
        why_it_applies: "Protects legal rights, due process, and remedies for Indian citizens.",
        confidence: "medium"
      }
    ],
    plain_explanation: "Under Indian jurisprudence, grievances of this nature involve statutory rights and grievance redressal mechanisms governed by relevant national and state regulations.",
    next_steps: [
      {
        title: "Preserve Evidentiary Trail",
        detail: "Compile all relevant dates, communications, notices, invoices, or audio/video documentation."
      },
      {
        title: "Send Legal Notice or Formal Grievance",
        detail: "Serve a formal written grievance or advocate-drafted legal notice granting the opposing party a statutory window to resolve the matter."
      },
      {
        title: "Seek Competent Legal Representation",
        detail: "Engage an advocate practicing before the jurisdictional court or tribunal."
      }
    ],
    forum: {
      office: "Jurisdictional Civil Court / Specialized Regulatory Tribunal",
      fee: "Prescribed court fee as per State Court Fees Act",
      likely_time: "Varies depending on forum procedures"
    },
    documents_needed: [
      "Identity verification proof (Aadhaar / Voter ID / PAN)",
      "Chronological timeline of incident and written correspondence",
      "Proof of financial damage or rights violation"
    ],
    timeline: [
      { when: "Immediate", what: "Assemble evidence and document timeline" },
      { when: "15 Days", what: "Allow opposing party time to reply to formal notice" },
      { when: "Thereafter", what: "Initiate litigation or alternative dispute resolution" }
    ],
    warnings: [
      "Pay strict heed to statutory limitation periods for civil suits and complaints under the Limitation Act, 1963.",
      "Do not destroy or alter original documentary proof."
    ],
    disclaimer: "This analysis is an informational summary under Indian law and does not constitute formal legal representation."
  };
}
