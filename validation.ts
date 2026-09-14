export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  // Loose international phone check: optional +, 7-15 digits.
  return /^\+?[0-9]{7,15}$/.test(value.replace(/[\s-]/g, ''));
}

export function isValidWhatsApp(value: string): boolean {
  return isValidPhone(value);
}

export function isValidTelegram(value: string): boolean {
  return /^@?[a-zA-Z0-9_]{5,32}$/.test(value.trim()) || /^https:\/\/t\.me\/[a-zA-Z0-9_]+$/.test(value.trim());
}

export function isValidPrice(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, or WebP images are allowed.' };
  }
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: 'Image must be under 5MB.' };
  }
  return { valid: true };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
