import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchUnitIdFromSupabase = async (phoneNumber: string) => {
    try {
      const storedEmail = localStorage.getItem('tenant_email');

      let query = supabase.from('tenant_reg').select('unit_id');

      if (storedEmail) {
        // Prefer unique email if we have it
        query = query.eq('email', storedEmail);
      } else {
        // Fallback: match on phone number only
        query = query.eq('number', phoneNumber);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('Error fetching unit_id from Supabase (login):', error);
        return null;
      }

      return data?.unit_id || null;
    } catch (error) {
      console.error('Error fetching unit_id from Supabase (login):', error);
      return null;
    }
  };

  const handleLogin = async () => {
    setError('');

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!/^\d+$/.test(phoneNumber)) {
      setError('Phone number must contain only digits');
      return;
    }

    const storedPhone = localStorage.getItem('tenant_phone');

    if (!storedPhone) {
      setError('User not found. Please register first.');
      return;
    }

    if (phoneNumber !== storedPhone) {
      setError('User not found. Please check your phone number.');
      return;
    }

    // Fetch and store unit_id if not already stored
    const existingUnitId = localStorage.getItem('tenant_unit_id');
    if (!existingUnitId) {
      const unitId = await fetchUnitIdFromSupabase(storedPhone);
      if (unitId) {
        localStorage.setItem('tenant_unit_id', unitId);
        console.log('Unit ID stored during login:', unitId);
      } else {
        console.warn('No unit_id found for user during login');
      }
    }

    navigate('/home');
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-md"
            >
              Log In
            </button>

            <div className="text-center">
              <button
                onClick={() => navigate('/register')}
                className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
              >
                Don't have an account? Register here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
