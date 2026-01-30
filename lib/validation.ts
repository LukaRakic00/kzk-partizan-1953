/**
 * Input validation and sanitization utilities
 */

import { isValidEmail } from './utils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  return isValidEmail(email);
}

/**
 * Validates and sanitizes string input
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove null bytes and trim
  let sanitized = input.replace(/\0/g, '').trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validates required fields
 */
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): ValidationResult {
  const errors: string[] = [];
  
  for (const field of fields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`${field} je obavezno polje`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates contact form data
 */
export function validateContactForm(data: {
  name?: unknown;
  email?: unknown;
  title?: unknown;
  message?: unknown;
}): ValidationResult {
  const errors: string[] = [];
  
  // Validate required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Ime je obavezno polje');
  }
  
  if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
    errors.push('Email je obavezno polje');
  } else if (!validateEmail(data.email)) {
    errors.push('Email nije u validnom formatu');
  }
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Naslov poruke je obavezno polje');
  }
  
  // Validate lengths
  if (data.name && typeof data.name === 'string' && data.name.length > 100) {
    errors.push('Ime ne može biti duže od 100 karaktera');
  }
  
  if (data.email && typeof data.email === 'string' && data.email.length > 255) {
    errors.push('Email ne može biti duži od 255 karaktera');
  }
  
  if (data.title && typeof data.title === 'string' && data.title.length > 200) {
    errors.push('Naslov ne može biti duži od 200 karaktera');
  }
  
  if (data.message && typeof data.message === 'string' && data.message.length > 5000) {
    errors.push('Poruka ne može biti duža od 5000 karaktera');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validates pagination parameters
 */
export function validatePagination(
  page?: unknown,
  limit?: unknown
): { page: number; limit: number } {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : 
                  typeof page === 'number' ? page : 1;
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 
                   typeof limit === 'number' ? limit : 10;
  
  return {
    page: Math.max(1, isNaN(pageNum) ? 1 : pageNum),
    limit: Math.min(100, Math.max(1, isNaN(limitNum) ? 10 : limitNum)),
  };
}
