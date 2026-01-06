import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Prevent duplicate submissions
    if (loading) {
      console.log('Login already in progress, ignoring click');
      return;
    }

    setError('');
    setShowErrorPopup(false);

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

    const storedEmail = localStorage.getItem('tenant_email');

    if (!storedEmail) {
      setError('User not found. Please register first.');
      setShowErrorPopup(true);
      return;
    }

    setLoading(true);

    try {
      // Call webhook to get updated UserId
      const response = await fetch(
        'https://primary-production-320b8.up.railway.app/webhook/registration',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: storedEmail,
            phoneNumber: `+${phoneNumber}`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to login. Please try again.');
      }

      const data = await response.json().catch(() => null);

      // Check for success status
      if (data && (data.status === 'Success' || data.Status === 'Success')) {
        // Update all user data from login response
        if (data.UserId || data.userId) {
          localStorage.setItem('tenant_user_id', data.UserId || data.userId);
          console.log('User ID updated on login:', data.UserId || data.userId);
        }
        if (data.fullName) {
          localStorage.setItem('tenant_name', data.fullName);
          console.log('Full name updated:', data.fullName);
        }
        if (data.phoneNumber) {
          localStorage.setItem('tenant_phone', data.phoneNumber);
          console.log('Phone updated:', data.phoneNumber);
        }
        if (data.email) {
          localStorage.setItem('tenant_email', data.email);
          console.log('Email updated:', data.email);
        }
        if (data.tenantId || data.tenantid) {
          localStorage.setItem('tenant_tenant_id', data.tenantId || data.tenantid);
          console.log('Tenant ID updated:', data.tenantId || data.tenantid);
        }
        if (data.unitId || data.unitid) {
          localStorage.setItem('tenant_unit_id', data.unitId || data.unitid);
          console.log('Unit ID updated:', data.unitId || data.unitid);
        }
        if (data.propertyId || data.propertyid) {
          localStorage.setItem('property_id', data.propertyId || data.propertyid);
          console.log('Property ID updated:', data.propertyId || data.propertyid);
        }
        if (data.occupancyId || data.occupancyid) {
          localStorage.setItem('occupancy_id', data.occupancyId || data.occupancyid);
          console.log('Occupancy ID updated:', data.occupancyId || data.occupancyid);
        }

        navigate('/home');
        return;
      }

      // Handle error response
      if (data && (data.Error || data.error)) {
        setError(data.Error || data.error);
        setShowErrorPopup(true);
        return;
      }

      setError('Login failed. Please try again.');
      setShowErrorPopup(true);
    } catch (err) {
      console.error('Login error:', err);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Login" />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>


            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <div className="text-center">
            </div>
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
