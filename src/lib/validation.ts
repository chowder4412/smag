const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (value.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return "Phone number is required.";
  if (!/^\+?[\d\s\-()]{7,15}$/.test(value)) return "Enter a valid phone number.";
  return null;
}

export function validateFullName(value: string): string | null {
  if (!value.trim()) return "Full name is required.";
  if (value.trim().length < 2) return "Name must be at least 2 characters.";
  return null;
}
