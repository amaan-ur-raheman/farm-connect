/**
 * Form Validation Utilities for FarmConnect Mobile App
 * Provides comprehensive validation for all form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => ValidationResult;
}

/**
 * Validate Indian phone number (+91 followed by 10 digits starting with 6-9)
 */
export const validatePhone = (phone: string): ValidationResult => {
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Enter a valid Indian phone number (e.g., +919876543210)' };
  }
  return { isValid: true };
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { isValid: false, error: 'Email address is required' };
  }
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Enter a valid email address' };
  }
  return { isValid: true };
};

/**
 * Validate OTP (6 digits)
 */
export const validateOtp = (otp: string): ValidationResult => {
  const otpRegex = /^\d{6}$/;
  if (!otp) {
    return { isValid: false, error: 'OTP is required' };
  }
  if (!otpRegex.test(otp)) {
    return { isValid: false, error: 'OTP must be 6 digits' };
  }
  return { isValid: true };
};

/**
 * Validate name (first/last)
 */
export const validateName = (name: string, fieldName = 'Name'): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  }
  if (name.trim().length > 50) {
    return { isValid: false, error: `${fieldName} must be less than 50 characters` };
  }
  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }
  return { isValid: true };
};

/**
 * Validate password (for future use)
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  return { isValid: true };
};

/**
 * Validate pincode (Indian postal code)
 */
export const validatePincode = (pincode: string): ValidationResult => {
  const pincodeRegex = /^\d{6}$/;
  if (!pincode) {
    return { isValid: false, error: 'Pincode is required' };
  }
  if (!pincodeRegex.test(pincode)) {
    return { isValid: false, error: 'Enter a valid 6-digit pincode' };
  }
  return { isValid: true };
};

/**
 * Validate city/state
 */
export const validateLocation = (value: string, fieldName = 'Location'): ValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (value.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  }
  if (value.trim().length > 100) {
    return { isValid: false, error: `${fieldName} must be less than 100 characters` };
  }
  const locationRegex = /^[a-zA-Z\s.-]+$/;
  if (!locationRegex.test(value.trim())) {
    return { isValid: false, error: `${fieldName} contains invalid characters` };
  }
  return { isValid: true };
};

/**
 * Validate farm area in acres
 */
export const validateFarmArea = (value: string): ValidationResult => {
  if (!value) {
    return { isValid: false, error: 'Farm area is required' };
  }
  const area = parseFloat(value);
  if (isNaN(area) || area <= 0) {
    return { isValid: false, error: 'Farm area must be a positive number' };
  }
  if (area > 10000) {
    return { isValid: false, error: 'Farm area seems too large (max 10,000 acres)' };
  }
  return { isValid: true };
};

/**
 * Validate price per acre
 */
export const validatePrice = (value: string): ValidationResult => {
  if (!value) {
    return { isValid: false, error: 'Price is required' };
  }
  const price = parseFloat(value);
  if (isNaN(price) || price <= 0) {
    return { isValid: false, error: 'Price must be a positive number' };
  }
  if (price > 10000000) {
    return { isValid: false, error: 'Price seems too high (max ₹1,00,00,000 per acre)' };
  }
  return { isValid: true };
};

/**
 * Validate listing title
 */
export const validateTitle = (title: string): ValidationResult => {
  if (!title || !title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }
  if (title.trim().length < 5) {
    return { isValid: false, error: 'Title must be at least 5 characters' };
  }
  if (title.trim().length > 100) {
    return { isValid: false, error: 'Title must be less than 100 characters' };
  }
  return { isValid: true };
};

/**
 * Validate description
 */
export const validateDescription = (description: string, minChars = 20, maxChars = 2000): ValidationResult => {
  if (!description || !description.trim()) {
    return { isValid: false, error: 'Description is required' };
  }
  if (description.trim().length < minChars) {
    return { isValid: false, error: `Description must be at least ${minChars} characters` };
  }
  if (description.trim().length > maxChars) {
    return { isValid: false, error: `Description must be less than ${maxChars} characters` };
  }
  return { isValid: true };
};

/**
 * Validate crop name
 */
export const validateCrop = (crop: string): ValidationResult => {
  if (!crop || !crop.trim()) {
    return { isValid: false, error: 'Crop name is required' };
  }
  if (crop.trim().length < 2) {
    return { isValid: false, error: 'Crop name must be at least 2 characters' };
  }
  if (crop.trim().length > 50) {
    return { isValid: false, error: 'Crop name must be less than 50 characters' };
  }
  const cropRegex = /^[a-zA-Z\s'-]+$/;
  if (!cropRegex.test(crop.trim())) {
    return { isValid: false, error: 'Crop name contains invalid characters' };
  }
  return { isValid: true };
};

/**
 * Validate chat message
 */
export const validateMessage = (message: string): ValidationResult => {
  if (!message || !message.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  if (message.trim().length > 2000) {
    return { isValid: false, error: 'Message must be less than 2000 characters' };
  }
  return { isValid: true };
};

/**
 * Validate dispute reason
 */
export const validateDisputeReason = (reason: string): ValidationResult => {
  if (!reason || !reason.trim()) {
    return { isValid: false, error: 'Reason is required' };
  }
  if (reason.trim().length < 10) {
    return { isValid: false, error: 'Reason must be at least 10 characters' };
  }
  if (reason.trim().length > 500) {
    return { isValid: false, error: 'Reason must be less than 500 characters' };
  }
  return { isValid: true };
};

/**
 * Validate review comment
 */
export const validateReviewComment = (comment: string): ValidationResult => {
  if (!comment || !comment.trim()) {
    return { isValid: false, error: 'Comment is required' };
  }
  if (comment.trim().length < 10) {
    return { isValid: false, error: 'Comment must be at least 10 characters' };
  }
  if (comment.trim().length > 1000) {
    return { isValid: false, error: 'Comment must be less than 1000 characters' };
  }
  return { isValid: true };
};

/**
 * Validate rating (1-5)
 */
export const validateRating = (rating: number): ValidationResult => {
  if (rating < 1 || rating > 5) {
    return { isValid: false, error: 'Rating must be between 1 and 5' };
  }
  return { isValid: true };
};

/**
 * Validate address
 */
export const validateAddress = (address: string): ValidationResult => {
  if (!address || !address.trim()) {
    return { isValid: false, error: 'Address is required' };
  }
  if (address.trim().length < 10) {
    return { isValid: false, error: 'Address must be at least 10 characters' };
  }
  if (address.trim().length > 200) {
    return { isValid: false, error: 'Address must be less than 200 characters' };
  }
  return { isValid: true };
};

/**
 * Validate IFSC code
 */
export const validateIfsc = (ifsc: string): ValidationResult => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifsc) {
    return { isValid: false, error: 'IFSC code is required' };
  }
  if (!ifscRegex.test(ifsc.toUpperCase())) {
    return { isValid: false, error: 'Enter a valid IFSC code (e.g., SBIN0001234)' };
  }
  return { isValid: true };
};

/**
 * Validate bank account number
 */
export const validateBankAccount = (accountNumber: string): ValidationResult => {
  const accountRegex = /^\d{9,18}$/;
  if (!accountNumber) {
    return { isValid: false, error: 'Account number is required' };
  }
  if (!accountRegex.test(accountNumber)) {
    return { isValid: false, error: 'Enter a valid account number (9-18 digits)' };
  }
  return { isValid: true };
};

/**
 * Validate URL (for images, documents)
 */
export const validateUrl = (url: string, fieldName = 'URL'): ValidationResult => {
  if (!url) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: `Enter a valid ${fieldName.toLowerCase()}` };
  }
};

/**
 * Validate latitude
 */
export const validateLatitude = (lat: number | string): ValidationResult => {
  const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
  if (isNaN(latitude)) {
    return { isValid: false, error: 'Invalid latitude' };
  }
  if (latitude < -90 || latitude > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }
  return { isValid: true };
};

/**
 * Validate longitude
 */
export const validateLongitude = (lng: number | string): ValidationResult => {
  const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;
  if (isNaN(longitude)) {
    return { isValid: false, error: 'Invalid longitude' };
  }
  if (longitude < -180 || longitude > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }
  return { isValid: true };
};

/**
 * Generic validator that applies multiple rules
 */
export const validateWithRules = (value: string, rules: ValidationRules): ValidationResult => {
  // Required check
  if (rules.required && (!value || !value.trim())) {
    return { isValid: false, error: 'This field is required' };
  }

  // Empty value passes if not required
  if (!value || !value.trim()) {
    return { isValid: true };
  }

  // Min length
  if (rules.minLength && value.trim().length < rules.minLength) {
    return { isValid: false, error: `Must be at least ${rules.minLength} characters` };
  }

  // Max length
  if (rules.maxLength && value.trim().length > rules.maxLength) {
    return { isValid: false, error: `Must be less than ${rules.maxLength} characters` };
  }

  // Pattern
  if (rules.pattern && !rules.pattern.test(value.trim())) {
    return { isValid: false, error: 'Invalid format' };
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return { isValid: true };
};

/**
 * Debounce function for real-time validation
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
