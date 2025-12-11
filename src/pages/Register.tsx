import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+63');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUnitIdFromSupabase = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('tenant_reg')
        .select('unit_id')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error fetching unit_id from Supabase (register):', error);
        return null;
      }

      return data?.unit_id || null;
    } catch (error) {
      console.error('Error fetching unit_id from Supabase (register):', error);
      return null;
    }
  };

  const handleRegister = async () => {
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!/^\d+$/.test(phoneNumber)) {
      setError('Phone number must contain only digits');
      return;
    }

    if (phoneNumber.length < 6) {
      setError('Phone number must be at least 6 digits');
      return;
    }

    try {
      setLoading(true);
      const internationalPhone = `${countryCode}${phoneNumber}`;

      const response = await fetch(
        'https://primary-production-320b8.up.railway.app/webhook/registration',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName,
            email,
            phoneNumber: internationalPhone,
            countryCode,
            rawPhone: phoneNumber,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to register. Please try again.');
      }

      const data = await response.json().catch(() => null);

      // Detect error payloads like { "Error": "Error" } or an array of them
      let isErrorResponse = false;

      if (data) {
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0] as any;
          if (first && (first.Error === 'Error' || first.error === 'Error')) {
            isErrorResponse = true;
          }
        } else if (
          (data as any).Error === 'Error' ||
          (data as any).error === 'Error'
        ) {
          isErrorResponse = true;
        }
      }

      if (isErrorResponse) {
        setError(
          'It looks like you are not using your registered tenant email. Please use your tenant email and try again.'
        );
        return;
      }

      localStorage.setItem('tenant_name', fullName);
      localStorage.setItem('tenant_phone', internationalPhone);
      localStorage.setItem('tenant_email', email);

      // Fetch unit_id from Supabase using unique email
      const unitId = await fetchUnitIdFromSupabase(email);
      if (unitId) {
        localStorage.setItem('tenant_unit_id', unitId);
        console.log('Unit ID stored:', unitId);
      } else {
        console.warn('No unit_id found for user');
      }

      navigate('/otp');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
              <img
                src="/img/logo_icon.png"
                alt="Tenant Assistant logo"
                className="h-12 w-12 animate-spin"
              />
            </div>
            <p className="text-white text-sm">Verifying your details...</p>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-center">
          <img
            src="/img/logo.jpg"
            alt="Tenant Assistant logo"
            className="h-10 object-contain"
          />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[90px]"
                >
                  <option value="+1">US +1</option>
                  <option value="+44">UK +44</option>
                  <option value="+61">AU +61</option>
                  <option value="+63">PH +63</option>
                  <option value="+65">SG +65</option>
                </select>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="Enter your phone number"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleRegister}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-md"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
