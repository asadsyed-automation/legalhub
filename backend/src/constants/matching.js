/**
 * Rule-Based Matching Constants & Keyword Dictionaries
 */

const CONFIDENCE_LEVELS = Object.freeze({
  HIGH: 'high',
  LOW: 'low',
  NONE: 'none'
});

const URGENCY_LEVELS = Object.freeze({
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  FLEXIBLE: 'flexible'
});

const MATCHING_WEIGHTS = Object.freeze({
  CITY: 30,
  URGENCY_TODAY: 25,
  URGENCY_THIS_WEEK: 25,
  URGENCY_FLEXIBLE: 10,
  MODE: 15,
  BUDGET: 10,
  LANGUAGE: 10,
  EXPERIENCE_MAX_POINTS: 10,
  EXPERIENCE_CAP_YEARS: 15
});

/**
 * Curated starter keyword lists per practice area.
 * Contains both English legal terms and common Pakistani transliterated legal vocabulary.
 */
const MATCHING_KEYWORDS = Object.freeze({
  Criminal: [
    'fir',
    'police',
    'arrest',
    'bail',
    'remand',
    'murder',
    'theft',
    'robbery',
    'narcotics',
    'fraud',
    'bailable',
    'investigation',
    'challan',
    'accused',
    'cybercrime',
    'harassment',
    'assault',
    'crime',
    'custody'
  ],
  Civil: [
    'contract',
    'agreement',
    'damages',
    'injunction',
    'stay',
    'declaration',
    'recovery',
    'suit',
    'decree',
    'breach',
    'execution',
    'compensation',
    'tort',
    'dispute'
  ],
  Family: [
    'divorce',
    'talaq',
    'khula',
    'maintenance',
    'custody',
    'guardian',
    'dower',
    'haq mehr',
    'child support',
    'marriage',
    'nikahnama',
    'restitution',
    'visitation',
    'iddat'
  ],
  Property: [
    'land',
    'plot',
    'registry',
    'fard',
    'intiqal',
    'mutation',
    'possession',
    'tenant',
    'landlord',
    'eviction',
    'rent',
    'patwari',
    'demarcation',
    'partition',
    'lease',
    'encroachment',
    'title deed',
    'real estate'
  ],
  Corporate: [
    'company',
    'secp',
    'shares',
    'director',
    'incorporation',
    'partnership',
    'merger',
    'acquisition',
    'compliance',
    'shareholder',
    'startup',
    'board',
    'mou',
    'nda',
    'corporate'
  ],
  Labor: [
    'employment',
    'termination',
    'salary',
    'wages',
    'gratuity',
    'pension',
    'workplace',
    'labor court',
    'dismissal',
    'union',
    'severance',
    'provident fund',
    'employee'
  ],
  Tax: [
    'fbr',
    'income tax',
    'sales tax',
    'audit',
    'tax return',
    'withholding',
    'pra',
    'appellate tribunal',
    'tax notice',
    'customs',
    'duty',
    'exemption',
    'tax'
  ],
  Constitutional: [
    'fundamental rights',
    'high court writ',
    'supreme court',
    'habeas corpus',
    'mandamus',
    'quo warranto',
    'certiorari',
    'article 199',
    'public interest',
    'human rights',
    'unconstitutional'
  ],
  Banking: [
    'loan',
    'default',
    'cheque',
    'section 489f',
    'mortgage',
    'financial institution',
    'guarantee',
    'banking court',
    'foreclosure',
    'promissory note',
    'recovery suit',
    'bank'
  ],
  Consumer: [
    'defective product',
    'consumer court',
    'warranty',
    'service deficiency',
    'false advertising',
    'refund',
    'complaint',
    'consumer protection',
    'faulty'
  ]
});

/**
 * Follow-up diagnostic questions for the client intake pipeline.
 */
const GENERIC_FOLLOW_UP_QUESTIONS = Object.freeze([
  {
    key: 'city',
    question: 'In which city or district is your legal matter located?',
    type: 'select'
  },
  {
    key: 'urgency',
    question: 'How quickly do you need a consultation with an advocate?',
    options: ['today', 'this_week', 'flexible'],
    type: 'select'
  },
  {
    key: 'documents',
    question: 'Do you have relevant official documents, notices, or contracts ready?',
    options: ['yes', 'partial', 'no'],
    type: 'select'
  }
]);

const CATEGORY_SPECIFIC_QUESTIONS = Object.freeze({
  Criminal:
    'Has a police FIR already been registered, or are you seeking pre-arrest bail guidance?',
  Civil:
    'Is there an ongoing civil court proceeding or stay application, or do you plan to file a new suit?',
  Family:
    'Has a family suit for khula, custody, or maintenance already been filed in Family Court?',
  Property:
    'Do you have the registered sale deed, Fard Malkiat, or mutation (intiqal) record in hand?',
  Corporate:
    'Is your corporate entity registered with SECP, or is this related to a new commercial agreement?',
  Labor:
    'Did you receive a formal termination letter, suspension order, or show-cause notice from your employer?',
  Tax:
    'Have you received an official assessment order, audit notice, or penalty letter from FBR or PRA?',
  Constitutional:
    'Which government department, public body, or statutory official is involved in the grievance?',
  Banking:
    'Is the dispute concerning a dishonoured cheque (Section 489-F) or a recovery notice from a bank?',
  Consumer:
    'Have you served a formal 15-day statutory legal notice to the manufacturer or service vendor?'
});

module.exports = {
  CONFIDENCE_LEVELS,
  URGENCY_LEVELS,
  MATCHING_WEIGHTS,
  MATCHING_KEYWORDS,
  GENERIC_FOLLOW_UP_QUESTIONS,
  CATEGORY_SPECIFIC_QUESTIONS
};
