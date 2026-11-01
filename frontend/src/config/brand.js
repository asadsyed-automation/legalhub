/**
 * LegalHub Brand & Institutional Configuration
 * Centralized brand metadata and academic project details.
 */

export const APP_NAME = 'LegalHub'; // Working title

// Read contact email from Vite environment; null if unconfigured
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || null;

export const PROJECT_METADATA = {
  institution: 'Emerson University Multan',
  department: 'Department of Computer Science',
  degree: 'Bachelor of Science in Computer Science (BS CS)',
  projectType: 'Final Year Project (FYP)',
  academicYear: '2026',
  developers: [
    { name: 'Syed Asad', role: 'Full-Stack Developer' },
    { name: 'Muhammad Aqeel', role: 'Full-Stack Developer' },
    { name: 'Mubashir Mehmood', role: 'Full-Stack Developer' },
  ],
  supervision: 'Faculty of Computing & Information Technology',
  location: 'Bosan Road, Multan, Punjab, Pakistan',
};

export default {
  APP_NAME,
  CONTACT_EMAIL,
  PROJECT_METADATA,
};
