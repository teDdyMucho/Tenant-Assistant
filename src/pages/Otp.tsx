import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { supabase } from '../lib/supabaseClient';

export default function Otp() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    setLoading(true);

    try {
      const { data, error: supabaseError } = await supabase
        .from('tenant_reg')
        .select('name, email, number, otp, unit_id')
        .eq('otp', otp.trim())
        .maybeSingle();

      if (supabaseError) {
        throw supabaseError;
      }

      if (!data) {
        setError('Invalid OTP. Please check the code and try again.');
        return;
      }

      localStorage.setItem('tenant_name', data.name ?? '');
      localStorage.setItem('tenant_email', data.email ?? '');
      localStorage.setItem('tenant_phone', data.number ?? '');

      if (data.unit_id) {
        localStorage.setItem('tenant_unit_id', data.unit_id as string);
        console.log('Unit ID stored from OTP:', data.unit_id);
      } else {
        console.warn('No unit_id present on OTP verification record');
      }

      navigate('/home');
    } catch (err) {
      console.error('Failed to verify OTP', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Enter OTP" />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                OTP Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                onKeyPress={handleKeyPress}
                placeholder="Enter the OTP you received"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
