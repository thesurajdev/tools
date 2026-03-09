'use client';

import { FormEvent, useEffect, useState } from 'react';

type FormState = {
  name: string;
  phoneNo: string;
  emailId: string;
  pinCode: string;
};

const initialFormState: FormState = {
  name: '',
  phoneNo: '',
  emailId: '',
  pinCode: '',
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const PIN_REGEX = /^\d{6}$/;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const FORM_STORAGE_KEY = 'secureye_form_data';

const fieldCookieMap: Record<keyof FormState, string> = {
  name: 'secureye_name',
  phoneNo: 'secureye_phone',
  emailId: 'secureye_email',
  pinCode: 'secureye_pin',
};

const fallbackCookieKeys: Record<keyof FormState, string[]> = {
  name: ['name', 'fullName'],
  phoneNo: ['phoneNo', 'phone', 'mobile', 'mobileNo'],
  emailId: ['emailId', 'email'],
  pinCode: ['pinCode', 'pincode', 'postalCode'],
};

const getCookie = (cookieName: string): string => {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${cookieName}=`));

  if (!cookie) return '';

  return decodeURIComponent(cookie.split('=').slice(1).join('='));
};

const getCookieFromAnyKey = (primaryKey: string, fallbackKeys: string[]): string => {
  const keys = [primaryKey, ...fallbackKeys];

  for (const key of keys) {
    const value = getCookie(key);
    if (value) return value;
  }

  return '';
};

const setCookie = (cookieName: string, value: string) => {
  if (!value) {
    document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  document.cookie = `${cookieName}=${encodeURIComponent(
    value,
  )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

const getStoredValue = (field: keyof FormState): string => {
  const cookieValue = getCookieFromAnyKey(fieldCookieMap[field], fallbackCookieKeys[field]);
  if (cookieValue) return cookieValue;

  try {
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as Partial<FormState>;
    return typeof parsed[field] === 'string' ? parsed[field] : '';
  } catch {
    return '';
  }
};

const setStoredValue = (field: keyof FormState, value: string) => {
  setCookie(fieldCookieMap[field], value);

  try {
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<FormState>) : {};
    parsed[field] = value;
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage failures (private mode/quota limits)
  }
};

const normalizePhoneInput = (value: string): string => {
  const compact = value.replace(/\s+/g, '');
  let cleaned = compact.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = `+${cleaned.slice(1).replace(/\+/g, '')}`;
  } else {
    cleaned = cleaned.replace(/\+/g, '');
  }

  const digits = cleaned.replace(/\D/g, '').slice(0, 15);
  return cleaned.startsWith('+') ? `+${digits}` : digits;
};

export default function SecureyeExpoPage() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    const savedName = getStoredValue('name').trim();
    const savedPhoneNo = normalizePhoneInput(getStoredValue('phoneNo').trim());
    const savedEmailId = getStoredValue('emailId').trim();
    const savedPinCode = getStoredValue('pinCode')
      .replace(/\D/g, '')
      .slice(0, 6);

    setFormData({
      name: savedName,
      phoneNo: savedPhoneNo,
      emailId: savedEmailId,
      pinCode: savedPinCode,
    });
  }, []);

  const validateField = (field: keyof FormState, value: string): string => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return 'This field is required.';
    }

    if (field === 'name' && trimmedValue.length < 2) {
      return 'Name must be at least 2 characters.';
    }

    if (field === 'phoneNo' && !PHONE_REGEX.test(trimmedValue)) {
      return 'Use format like +919876543210 (country code required).';
    }

    if (field === 'emailId' && !EMAIL_REGEX.test(trimmedValue)) {
      return 'Please enter a valid email address.';
    }

    if (field === 'pinCode' && !PIN_REGEX.test(trimmedValue)) {
      return 'PIN code must be exactly 6 digits.';
    }

    return '';
  };

  const validateForm = (): FormErrors => {
    return {
      name: validateField('name', formData.name),
      phoneNo: validateField('phoneNo', formData.phoneNo),
      emailId: validateField('emailId', formData.emailId),
      pinCode: validateField('pinCode', formData.pinCode),
    };
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setStoredValue(field, value);
  };

  const handleBlur = (field: keyof FormState) => {
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateForm();
    const hasErrors = Object.values(validationErrors).some(Boolean);
    setErrors(validationErrors);

    if (hasErrors) {
      setMessage('Please fix the highlighted fields and try again.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/secureye-expo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit form.');
      }

      setMessage('Form submitted successfully. Redirecting...');
      setMessageType('success');
      setFormData(initialFormState);
      window.location.assign('https://secureye.com');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClassName =
    'w-full rounded-xl border bg-white/80 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2';

  const hasAnyError = Object.values(errors).some(Boolean);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_15%,#fed7aa_0%,transparent_35%),radial-gradient(circle_at_80%_10%,#fdba74_0%,transparent_40%),linear-gradient(180deg,#fff7ed_0%,#fffbeb_60%,#ffffff_100%)] px-3 py-6 sm:px-4 sm:py-12">
      <div className="pointer-events-none absolute -left-16 top-24 h-44 w-44 rounded-full bg-orange-300/35 blur-2xl" />
      <div className="pointer-events-none absolute -right-12 top-8 h-40 w-40 rounded-full bg-amber-300/35 blur-2xl" />

      <div className="mx-auto w-full max-w-3xl animate-[fade-in_0.45s_ease-out] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_20px_70px_-30px_rgba(8,47,73,0.45)] backdrop-blur sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
          <div>
            <div className="mb-4 flex justify-center sm:justify-start">
              <a
                href="https://secureye.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Secureye website"
              >
                <img
                  src="https://www.secureye.com//uploads/images/1723622048_22ea1bb1f4fb807bb415.png"
                  alt="Secureye"
                  className="h-10 w-auto object-contain brightness-0 sm:h-12"
                  loading="eager"
                />
              </a>
            </div>
            <p className="inline-flex rounded-full border border-[#F16B1C]/30 bg-[#F16B1C]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#C45012]">
              SECUREYE EXPO
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:text-4xl">Visitor Registration</h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">Quick form. Takes less than 30 seconds to complete.</p>
          </div>
          <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs text-slate-600 sm:block">
            <p className="font-semibold text-slate-700">Required</p>
            <p>All 4 fields</p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="animate-[slide-up_0.45s_ease-out]" style={{ animationDelay: '50ms' }}>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(event) => handleInputChange('name', event.target.value)}
                onBlur={() => handleBlur('name')}
                autoComplete="name"
                className={`${inputBaseClassName} ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-200 focus:border-[#F16B1C] focus:ring-[#F16B1C]/25'
                }`}
                placeholder="Full name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : 'name-help'}
              />
              <p id="name-help" className="mt-1 text-xs text-slate-500">
                Enter your first and last name.
              </p>
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="animate-[slide-up_0.45s_ease-out]" style={{ animationDelay: '150ms' }}>
              <label htmlFor="pinCode" className="mb-1.5 block text-sm font-medium text-slate-700">
                PIN Code
              </label>
              <input
                id="pinCode"
                name="postal-code"
                type="text"
                value={formData.pinCode}
                onChange={(event) => handleInputChange('pinCode', event.target.value.replace(/\D/g, '').slice(0, 6))}
                onBlur={() => handleBlur('pinCode')}
                inputMode="numeric"
                autoComplete="postal-code"
                className={`${inputBaseClassName} ${
                  errors.pinCode
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-200 focus:border-[#F16B1C] focus:ring-[#F16B1C]/25'
                }`}
                placeholder="6 digit PIN"
                aria-invalid={Boolean(errors.pinCode)}
                aria-describedby={errors.pinCode ? 'pinCode-error' : 'pinCode-help'}
              />
              <p id="pinCode-help" className="mt-1 text-xs text-slate-500">
                Example: 110001
              </p>
              {errors.pinCode && (
                <p id="pinCode-error" className="mt-1 text-sm text-red-600">
                  {errors.pinCode}
                </p>
              )}
            </div>

          </div>

          <div className="animate-[slide-up_0.45s_ease-out]" style={{ animationDelay: '100ms' }}>
            <label htmlFor="phoneNo" className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone No
            </label>
            <input
              id="phoneNo"
              name="phone"
              type="tel"
              value={formData.phoneNo}
              onChange={(event) => handleInputChange('phoneNo', normalizePhoneInput(event.target.value))}
              onBlur={() => handleBlur('phoneNo')}
              inputMode="tel"
              autoComplete="tel"
              className={`${inputBaseClassName} ${
                errors.phoneNo
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-200 focus:border-[#F16B1C] focus:ring-[#F16B1C]/25'
              }`}
              placeholder="+919876543210"
              aria-invalid={Boolean(errors.phoneNo)}
              aria-describedby={errors.phoneNo ? 'phoneNo-error' : 'phoneNo-help'}
            />
            <p id="phoneNo-help" className="mt-1 text-xs text-slate-500">
              Include country code and use a WhatsApp-enabled number.
            </p>
            {errors.phoneNo && (
              <p id="phoneNo-error" className="mt-1 text-sm text-red-600">
                {errors.phoneNo}
              </p>
            )}
          </div>

          <div className="animate-[slide-up_0.45s_ease-out]" style={{ animationDelay: '200ms' }}>
            <label htmlFor="emailId" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email ID
            </label>
            <input
              id="emailId"
              name="email"
              type="email"
              value={formData.emailId}
              onChange={(event) => handleInputChange('emailId', event.target.value)}
              onBlur={() => handleBlur('emailId')}
              autoComplete="email"
              className={`${inputBaseClassName} ${
                errors.emailId
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-200 focus:border-[#F16B1C] focus:ring-[#F16B1C]/25'
              }`}
              placeholder="name@company.com"
              aria-invalid={Boolean(errors.emailId)}
              aria-describedby={errors.emailId ? 'emailId-error' : 'emailId-help'}
            />
            <p id="emailId-help" className="mt-1 text-xs text-slate-500">
              We use this for expo communication only.
            </p>
            {errors.emailId && (
              <p id="emailId-error" className="mt-1 text-sm text-red-600">
                {errors.emailId}
              </p>
            )}
          </div>

          <div className="animate-[slide-up_0.45s_ease-out] space-y-3" style={{ animationDelay: '250ms' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F16B1C] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-[#D95E19] disabled:cursor-not-allowed disabled:bg-[#F6B48A]"
            >
              {isSubmitting && (
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </button>

            <p className={`text-center text-xs ${hasAnyError ? 'text-red-600' : 'text-slate-500'}`}>
              {hasAnyError ? 'Please fix the highlighted fields.' : 'By submitting, you agree to be contacted regarding the expo.'}
            </p>
          </div>

          {message && (
            <p
              className={`rounded-xl border px-3 py-2.5 text-sm ${
                messageType === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </form>
      </div>

      <p className="fixed inset-x-0 bottom-3 z-10 text-center text-xs text-slate-500 sm:bottom-4">
        Crafted by{' '}
        <a
          href="https://surajdev.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#C45012] underline decoration-[#F16B1C]/40 underline-offset-2 hover:text-[#A7410F]"
        >
          Suraj Dev
        </a>
      </p>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
