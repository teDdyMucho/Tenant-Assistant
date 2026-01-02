import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    // Prevent duplicate submissions
    if (loading) {
      console.log('Registration already in progress, ignoring click');
      return;
    }

    setError('');
    setShowErrorPopup(false);

    if (!fullName.trim()) {
      setError('Please enter your full name');
      setShowErrorPopup(true);
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      setShowErrorPopup(true);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setShowErrorPopup(true);
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      setShowErrorPopup(true);
      return;
    }

    if (!/^\d+$/.test(phoneNumber)) {
      setError('Phone number must contain only digits');
      setShowErrorPopup(true);
      return;
    }

    if (phoneNumber.length < 6) {
      setError('Phone number must be at least 6 digits');
      setShowErrorPopup(true);
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

      const data = await response.json().catch(() => null);

      // Handle HTTP errors after parsing response
      if (!response.ok) {
        // Check if it's a duplicate error
        if (data && (data.Error || data.error)) {
          const errorMsg = data.Error || data.error;
          if (errorMsg.toLowerCase().includes('duplicate')) {
            setError('This account already exists. Please try logging in instead.');
            setShowErrorPopup(true);
            return;
          }
          setError(errorMsg);
          setShowErrorPopup(true);
          return;
        }
        throw new Error('Failed to register. Please try again.');
      }

      // Check for success status
      if (data && (data.status === 'Success' || data.Status === 'Success')) {
        localStorage.setItem('tenant_name', fullName);
        localStorage.setItem('tenant_phone', internationalPhone);
        localStorage.setItem('tenant_email', email);

        // Store UserId from registration response
        if (data.UserId || data.userId) {
          localStorage.setItem('tenant_user_id', data.UserId || data.userId);
          console.log('User ID stored:', data.UserId || data.userId);
        } else {
          console.warn('No UserId in registration response');
        }

        navigate('/otp');
        return;
      }

      // Detect error payloads like { "Error": "message" } or an array of them
      if (data) {
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0] as any;
          if (first && (first.Error || first.error)) {
            setError(first.Error || first.error);
            setShowErrorPopup(true);
            return;
          }
        } else if ((data as any).Error || (data as any).error) {
          setError((data as any).Error || (data as any).error);
          setShowErrorPopup(true);
          return;
        }
      }

      // If we reach here, response was not success and not a known error
      setError('Registration failed. Please try again.');
      setShowErrorPopup(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      );
      setShowErrorPopup(true);
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


            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </div>
      </div>

      {showErrorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={() => setShowErrorPopup(false)}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
