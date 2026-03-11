// Validation utility functions

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{12}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateWebsite = (website: string): boolean => {
  if (!website) return true; // Optional field
  const websiteRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return websiteRegex.test(website);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && Number(value) >= 0;
};

export const validatePositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

export const sanitizePhoneInput = (value: string): string => {
  return value.replace(/[^0-9]/g, '').slice(0, 12);
};

export const sanitizeNumberInput = (value: string): string => {
  return value.replace(/[^0-9.]/g, '');
};
