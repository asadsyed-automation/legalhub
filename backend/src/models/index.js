const { sequelize } = require('../config/db');
const { initUserModel } = require('./user.model');
const { initLawyerApplicationModel } = require('./lawyerApplication.model');
const { initLawyerProfileModel } = require('./lawyerProfile.model');
const { initLawyerServiceModel } = require('./lawyerService.model');
const { initAvailabilityRuleModel } = require('./availabilityRule.model');
const { initBlockedDateModel } = require('./blockedDate.model');
const { initBookingModel } = require('./booking.model');
const { initEnquiryModel } = require('./enquiry.model');
const { initPaymentModel } = require('./payment.model');
const { initBookingEventModel } = require('./bookingEvent.model');
const { initConsultationNoteModel } = require('./consultationNote.model');
const { initEngagementModel } = require('./engagement.model');
const { initReviewModel } = require('./review.model');
const { initCaseModel } = require('./case.model');
const { initCasePartyModel } = require('./caseParty.model');
const { initCaseStatusEventModel } = require('./caseStatusEvent.model');
const { initCaseEntryModel } = require('./caseEntry.model');
const { initHearingModel } = require('./hearing.model');
const { initDocumentModel } = require('./document.model');
const { initFeeAgreementModel } = require('./feeAgreement.model');
const { initFeePaymentModel } = require('./feePayment.model');
const { initNotificationModel } = require('./notification.model');
const { initMessageModel } = require('./message.model');

// Initialize models
const User = initUserModel(sequelize);
const LawyerApplication = initLawyerApplicationModel(sequelize);
const LawyerProfile = initLawyerProfileModel(sequelize);
const LawyerService = initLawyerServiceModel(sequelize);
const AvailabilityRule = initAvailabilityRuleModel(sequelize);
const BlockedDate = initBlockedDateModel(sequelize);
const Booking = initBookingModel(sequelize);
const Enquiry = initEnquiryModel(sequelize);
const Payment = initPaymentModel(sequelize);
const BookingEvent = initBookingEventModel(sequelize);
const ConsultationNote = initConsultationNoteModel(sequelize);
const Engagement = initEngagementModel(sequelize);
const Review = initReviewModel(sequelize);
const Case = initCaseModel(sequelize);
const CaseParty = initCasePartyModel(sequelize);
const CaseStatusEvent = initCaseStatusEventModel(sequelize);
const CaseEntry = initCaseEntryModel(sequelize);
const Hearing = initHearingModel(sequelize);
const Document = initDocumentModel(sequelize);
const FeeAgreement = initFeeAgreementModel(sequelize);
const FeePayment = initFeePaymentModel(sequelize);
const Notification = initNotificationModel(sequelize);
const Message = initMessageModel(sequelize);

// User <-> LawyerApplication
User.hasOne(LawyerApplication, {
  foreignKey: 'userId',
  as: 'lawyerApplication',
  onDelete: 'CASCADE'
});

LawyerApplication.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

LawyerApplication.belongsTo(User, {
  foreignKey: 'reviewedBy',
  as: 'reviewer'
});

// User <-> LawyerProfile
User.hasOne(LawyerProfile, {
  foreignKey: 'userId',
  as: 'profile',
  onDelete: 'CASCADE'
});

LawyerProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User <-> LawyerService
User.hasMany(LawyerService, {
  foreignKey: 'lawyerId',
  as: 'services',
  onDelete: 'CASCADE'
});

LawyerService.belongsTo(User, {
  foreignKey: 'lawyerId',
  as: 'lawyer'
});

// User <-> AvailabilityRule
User.hasMany(AvailabilityRule, {
  foreignKey: 'lawyerId',
  as: 'availabilityRules',
  onDelete: 'CASCADE'
});

AvailabilityRule.belongsTo(User, {
  foreignKey: 'lawyerId',
  as: 'lawyer'
});

// User <-> BlockedDate
User.hasMany(BlockedDate, {
  foreignKey: 'lawyerId',
  as: 'blockedDates',
  onDelete: 'CASCADE'
});

BlockedDate.belongsTo(User, {
  foreignKey: 'lawyerId',
  as: 'lawyer'
});

// Cross-joins for Directory (LawyerApplication <-> Profile / Services / Rules / Blocked via shared userId)
LawyerApplication.hasOne(LawyerProfile, {
  foreignKey: 'userId',
  sourceKey: 'userId',
  as: 'profile'
});

LawyerProfile.belongsTo(LawyerApplication, {
  foreignKey: 'userId',
  targetKey: 'userId',
  as: 'application'
});

LawyerApplication.hasMany(LawyerService, {
  foreignKey: 'lawyerId',
  sourceKey: 'userId',
  as: 'services'
});

LawyerService.belongsTo(LawyerApplication, {
  foreignKey: 'lawyerId',
  targetKey: 'userId',
  as: 'application'
});

LawyerApplication.hasMany(AvailabilityRule, {
  foreignKey: 'lawyerId',
  sourceKey: 'userId',
  as: 'availabilityRules'
});

AvailabilityRule.belongsTo(LawyerApplication, {
  foreignKey: 'lawyerId',
  targetKey: 'userId',
  as: 'application'
});

LawyerApplication.hasMany(BlockedDate, {
  foreignKey: 'lawyerId',
  sourceKey: 'userId',
  as: 'blockedDates'
});

BlockedDate.belongsTo(LawyerApplication, {
  foreignKey: 'lawyerId',
  targetKey: 'userId',
  as: 'application'
});

// User <-> Booking (Client & Lawyer roles)
User.hasMany(Booking, {
  foreignKey: 'clientId',
  as: 'clientBookings',
  onDelete: 'CASCADE'
});

Booking.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'client'
});

User.hasMany(Booking, {
  foreignKey: 'lawyerId',
  as: 'lawyerBookings',
  onDelete: 'CASCADE'
});

Booking.belongsTo(User, {
  foreignKey: 'lawyerId',
  as: 'lawyer'
});

// LawyerService <-> Booking
LawyerService.hasMany(Booking, {
  foreignKey: 'serviceId',
  as: 'bookings',
  onDelete: 'SET NULL'
});

Booking.belongsTo(LawyerService, {
  foreignKey: 'serviceId',
  as: 'service'
});

// LawyerApplication <-> Booking
LawyerApplication.hasMany(Booking, {
  foreignKey: 'lawyerId',
  sourceKey: 'userId',
  as: 'bookings'
});

Booking.belongsTo(LawyerApplication, {
  foreignKey: 'lawyerId',
  targetKey: 'userId',
  as: 'application'
});

// User <-> Enquiry (Client & Lawyer roles)
User.hasMany(Enquiry, {
  foreignKey: 'clientId',
  as: 'clientEnquiries',
  onDelete: 'CASCADE'
});

Enquiry.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'client'
});

User.hasMany(Enquiry, {
  foreignKey: 'lawyerId',
  as: 'lawyerEnquiries',
  onDelete: 'CASCADE'
});

Enquiry.belongsTo(User, {
  foreignKey: 'lawyerId',
  as: 'lawyer'
});

// LawyerApplication <-> Enquiry
LawyerApplication.hasMany(Enquiry, {
  foreignKey: 'lawyerId',
  sourceKey: 'userId',
  as: 'enquiries'
});

Enquiry.belongsTo(LawyerApplication, {
  foreignKey: 'lawyerId',
  targetKey: 'userId',
  as: 'application'
});

// Booking <-> Enquiry (Conversion link)
Booking.hasOne(Enquiry, {
  foreignKey: 'convertedBookingId',
  as: 'enquiry',
  onDelete: 'SET NULL'
});

Enquiry.belongsTo(Booking, {
  foreignKey: 'convertedBookingId',
  as: 'convertedBooking'
});

// Booking <-> Payment
Booking.hasOne(Payment, {
  foreignKey: 'bookingId',
  as: 'payment',
  onDelete: 'CASCADE'
});

Payment.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

// Booking <-> BookingEvent (Audit trail)
Booking.hasMany(BookingEvent, {
  foreignKey: 'bookingId',
  as: 'events',
  onDelete: 'CASCADE'
});

BookingEvent.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

BookingEvent.belongsTo(User, {
  foreignKey: 'actorId',
  as: 'actor'
});

User.hasMany(BookingEvent, {
  foreignKey: 'actorId',
  as: 'bookingEvents'
});

// Booking <-> ConsultationNote
Booking.hasOne(ConsultationNote, {
  foreignKey: 'bookingId',
  as: 'consultationNote',
  onDelete: 'CASCADE'
});

ConsultationNote.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

User.hasMany(ConsultationNote, {
  foreignKey: 'lawyerId',
  as: 'consultationNotes',
  onDelete: 'CASCADE'
});

ConsultationNote.belongsTo(User, {
  foreignKey: 'lawyerId',
  as: 'lawyer'
});

// User / Booking <-> Engagement
User.hasMany(Engagement, {
  foreignKey: 'clientId',
  as: 'clientEngagements',
  onDelete: 'CASCADE'
});

Engagement.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'client'
});

User.hasMany(Engagement, {
  foreignKey: 'lawyerId',
  as: 'lawyerEngagements',
  onDelete: 'CASCADE'
});

Engagement.belongsTo(User, {
  foreignKey: 'lawyerId',
  as: 'lawyer'
});

Booking.hasOne(Engagement, {
  foreignKey: 'bookingId',
  as: 'engagement',
  onDelete: 'SET NULL'
});

Engagement.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

// Booking / User <-> Review
Booking.hasOne(Review, {
  foreignKey: 'bookingId',
  as: 'review',
  onDelete: 'CASCADE'
});

Review.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

User.hasMany(Review, {
  foreignKey: 'clientId',
  as: 'givenReviews',
  onDelete: 'CASCADE'
});

Review.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'client'
});

User.hasMany(Review, {
  foreignKey: 'lawyerId',
  as: 'receivedReviews',
  onDelete: 'CASCADE'
});

Review.belongsTo(User, {
  foreignKey: 'lawyerId',
  as: 'lawyer'
});

LawyerApplication.hasMany(Review, {
  foreignKey: 'lawyerId',
  sourceKey: 'userId',
  as: 'reviews'
});

// ==========================================
// Case, CaseParty, CaseStatusEvent Associations (Phase 3 Part H)
// ==========================================
User.hasMany(Case, {
  foreignKey: 'lawyerId',
  as: 'lawyerCases',
  onDelete: 'CASCADE'
});

Case.belongsTo(User, {
  foreignKey: 'lawyerId',
  as: 'lawyer'
});

User.hasMany(Case, {
  foreignKey: 'clientId',
  as: 'clientCases',
  onDelete: 'SET NULL'
});

Case.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'client'
});

Booking.hasOne(Case, {
  foreignKey: 'bookingId',
  as: 'case',
  onDelete: 'SET NULL'
});

Case.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

Case.hasMany(CaseParty, {
  foreignKey: 'caseId',
  as: 'parties',
  onDelete: 'CASCADE'
});

CaseParty.belongsTo(Case, {
  foreignKey: 'caseId',
  as: 'case'
});

Case.hasMany(CaseStatusEvent, {
  foreignKey: 'caseId',
  as: 'statusEvents',
  onDelete: 'CASCADE'
});

CaseStatusEvent.belongsTo(Case, {
  foreignKey: 'caseId',
  as: 'case'
});

CaseStatusEvent.belongsTo(User, {
  foreignKey: 'changedBy',
  as: 'actor'
});

// Case <-> CaseEntry
Case.hasMany(CaseEntry, {
  foreignKey: 'caseId',
  as: 'entries',
  onDelete: 'CASCADE'
});

CaseEntry.belongsTo(Case, {
  foreignKey: 'caseId',
  as: 'case'
});

// Case <-> Hearing
Case.hasMany(Hearing, {
  foreignKey: 'caseId',
  as: 'hearings',
  onDelete: 'CASCADE'
});

Hearing.belongsTo(Case, {
  foreignKey: 'caseId',
  as: 'case'
});

// Case <-> Document
Case.hasMany(Document, {
  foreignKey: 'caseId',
  as: 'documents',
  onDelete: 'CASCADE'
});

Document.belongsTo(Case, {
  foreignKey: 'caseId',
  as: 'case'
});

Document.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploader'
});

User.hasMany(Document, {
  foreignKey: 'uploadedBy',
  as: 'uploadedDocuments'
});

// Case <-> FeeAgreement (1-to-1)
Case.hasOne(FeeAgreement, {
  foreignKey: 'caseId',
  as: 'feeAgreement',
  onDelete: 'CASCADE'
});

FeeAgreement.belongsTo(Case, {
  foreignKey: 'caseId',
  as: 'case'
});

// Case <-> FeePayment (1-to-many)
Case.hasMany(FeePayment, {
  foreignKey: 'caseId',
  as: 'feePayments',
  onDelete: 'CASCADE'
});

FeePayment.belongsTo(Case, {
  foreignKey: 'caseId',
  as: 'case'
});

// User <-> Notification (1-to-many)
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE'
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User <-> Message (1-to-many sent)
User.hasMany(Message, {
  foreignKey: 'senderId',
  as: 'sentMessages',
  onDelete: 'CASCADE'
});

Message.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender'
});

// Booking <-> Message (1-to-many)
Booking.hasMany(Message, {
  foreignKey: 'bookingId',
  as: 'messages',
  onDelete: 'CASCADE'
});

Message.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

// Case <-> Message (1-to-many)
Case.hasMany(Message, {
  foreignKey: 'caseId',
  as: 'messages',
  onDelete: 'CASCADE'
});

Message.belongsTo(Case, {
  foreignKey: 'caseId',
  as: 'case'
});

const db = {
  sequelize,
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  AvailabilityRule,
  BlockedDate,
  Booking,
  Enquiry,
  Payment,
  BookingEvent,
  ConsultationNote,
  Engagement,
  Review,
  Case,
  CaseParty,
  CaseStatusEvent,
  CaseEntry,
  Hearing,
  Document,
  FeeAgreement,
  FeePayment,
  Notification,
  Message
};

module.exports = db;






