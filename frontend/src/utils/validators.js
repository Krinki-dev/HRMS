export const validators = {

  aadhaar: (v) => {
    if (!v) return null;
    const clean = v.replace(/\s|-/g, '');
    if (!/^\d{12}$/.test(clean)) return 'Aadhaar must be exactly 12 digits';
    return null;
  },

  pan: (v) => {
    if (!v) return null;
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.toUpperCase()))
      return 'Invalid PAN — format must be ABCDE1234F';
    return null;
  },

  mobile: (v) => {
    if (!v) return null;
    if (!/^[6-9]\d{9}$/.test(v))
      return 'Enter valid 10-digit mobile number starting with 6, 7, 8 or 9';
    return null;
  },

  ifsc: (v) => {
    if (!v) return null;
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.toUpperCase()))
      return 'Invalid IFSC — format must be HDFC0001234';
    return null;
  },

  email: (v) => {
    if (!v) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      return 'Invalid email address';
    return null;
  },

  pincode: (v) => {
    if (!v) return null;
    if (!/^\d{6}$/.test(v)) return 'Pincode must be exactly 6 digits';
    return null;
  },

  uan: (v) => {
    if (!v) return null;
    if (!/^\d{12}$/.test(v)) return 'UAN must be exactly 12 digits';
    return null;
  },

  esi: (v) => {
    if (!v) return null;
    if (!/^\d{10,17}$/.test(v)) return 'ESI IP Number must be 10 to 17 digits';
    return null;
  },

  gstin: (v) => {
    if (!v) return null;
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v.toUpperCase()))
      return 'Invalid GSTIN format';
    return null;
  },

  accountNumber: (v) => {
    if (!v) return null;
    if (!/^\d{9,18}$/.test(v)) return 'Account number must be 9 to 18 digits';
    return null;
  },

  password: (v) => {
    if (!v) return 'Password is required';
    if (v.length < 8)  return 'Password must be at least 8 characters';
    if (v.length > 20) return 'Password must not exceed 20 characters';
    if (!/[A-Z]/.test(v)) return 'Must contain at least one uppercase letter (A-Z)';
    if (!/[a-z]/.test(v)) return 'Must contain at least one lowercase letter (a-z)';
    if (!/[0-9]/.test(v)) return 'Must contain at least one number (0-9)';
    if (!/[!@#$%^&*()_+\-=\]{};"'\\|,.<>?/]/.test(v))
      return 'Must contain at least one special character (!@#$%...)';
    return null;
  },

  required: (v, label = 'This field') => {
    if (!v || (typeof v === 'string' && !v.trim())) return `${label} is required`;
    return null;
  },

  dob: (v) => {
    if (!v) return null;
    const ageYears = (new Date() - new Date(v)) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageYears < 14) return 'Employee must be at least 14 years old';
    if (ageYears > 80) return 'Please check date of birth';
    return null;
  },
};

// Auto-format Aadhaar as user types — shows as: 1234 5678 9012
export function formatAadhaar(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  return digits.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
    [a, b, c].filter(Boolean).join(' ')
  );
}

