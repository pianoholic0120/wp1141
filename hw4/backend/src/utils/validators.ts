export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // Min 8 chars, at least one uppercase, one lowercase, one number, one special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function sanitizeString(input: string): string {
  return input.replace(/[<>]/g, '');
}

export function validatePropertyType(type: string): boolean {
  const validTypes = ['apartment', 'house', 'condo', 'townhouse', 'studio', 'other'];
  return validTypes.includes(type.toLowerCase());
}

export function validateStatus(status: string): boolean {
  const validStatuses = ['available', 'rented', 'pending'];
  return validStatuses.includes(status.toLowerCase());
}

