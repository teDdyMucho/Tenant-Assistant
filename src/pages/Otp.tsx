import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function Otp() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    // Prevent duplicate submissions
    if (loading) {
      console.log('OTP verification already in progress, ignoring click');
      return;
    }

    setError('');
    setShowErrorPopup(false);

    if (!otp.trim()) {
      setError('Please enter the OTP code');
      setShowErrorPopup(true);
      return;
    }

    setLoading(true);

    try {
      // Get UserId from localStorage
      const userId = localStorage.getItem('tenant_user_id');

      // Send OTP verification to webhook
      const webhookResponse = await fetch(
        'https://primary-production-320b8.up.railway.app/webhook/OTPWEBHOOK-send-minirvresa23ssw3',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            otp: otp.trim(),
            UserId: userId,
          }),
        }
      );

      if (!webhookResponse.ok) {
        throw new Error('Failed to verify OTP. Please try again.');
      }

      const webhookData = await webhookResponse.json().catch((err) => {
        console.error('Failed to parse webhook response:', err);
        return null;
      });

      console.log('Webhook response data:', webhookData);
      console.log('Status check:', webhookData?.status, webhookData?.Status);

      // Check for success status from webhook
      if (!webhookData) {
        console.error('No webhook data received');
        setError('Invalid OTP. Please check the code and try again.');
        setShowErrorPopup(true);
        return;
      }

      // Check if status is Success (case-insensitive)
      const status = webhookData.status || webhookData.Status;
      if (status !== 'Success') {
        console.error('Status not Success:', status);
        setError('Invalid OTP. Please check the code and try again.');
        setShowErrorPopup(true);
        return;
      }

      console.log('OTP verification successful, saving data...');

      // Save all data from webhook response
      if (webhookData.id) {
        localStorage.setItem('tenant_id', webhookData.id.toString());
        console.log('Tenant ID stored from webhook:', webhookData.id);
      }
      
      // Store UserId if available
      if (webhookData.UserId || webhookData.userId) {
        localStorage.setItem('tenant_user_id', webhookData.UserId || webhookData.userId);
        console.log('User ID stored from OTP:', webhookData.UserId || webhookData.userId);
      }
      
      // Combine first and last name into full name
      if (webhookData.fname || webhookData.lname) {
        const fullName = `${webhookData.fname || ''} ${webhookData.lname || ''}`.trim();
        if (fullName) {
          localStorage.setItem('tenant_name', fullName);
          console.log('Full name stored:', fullName);
        }
      }
      
      if (webhookData.fname) {
        localStorage.setItem('tenant_fname', webhookData.fname);
        console.log('First name stored:', webhookData.fname);
      }
      if (webhookData.lname) {
        localStorage.setItem('tenant_lname', webhookData.lname);
        console.log('Last name stored:', webhookData.lname);
      }
      if (webhookData.phone) {
        localStorage.setItem('tenant_phone', webhookData.phone);
        console.log('Phone stored:', webhookData.phone);
      }
      if (webhookData.email) {
        localStorage.setItem('tenant_email', webhookData.email);
        console.log('Email stored:', webhookData.email);
      }
      if (webhookData.address) {
        localStorage.setItem('tenant_address', webhookData.address);
        console.log('Address stored:', webhookData.address);
      }
      if (webhookData.tenantType) {
        localStorage.setItem('tenant_type', webhookData.tenantType);
        console.log('Tenant type stored:', webhookData.tenantType);
      }
      if (webhookData.tenantid) {
        localStorage.setItem('tenant_tenant_id', webhookData.tenantid);
        console.log('Tenant ID (tenantid) stored:', webhookData.tenantid);
      }
      if (webhookData.unitid) {
        localStorage.setItem('tenant_unit_id', webhookData.unitid);
        console.log('Unit ID stored:', webhookData.unitid);
      }
      if (webhookData.propertyid) {
        localStorage.setItem('property_id', webhookData.propertyid);
        console.log('Property ID stored:', webhookData.propertyid);
      }
      if (webhookData.occupancyid) {
        localStorage.setItem('occupancy_id', webhookData.occupancyid);
        console.log('Occupancy ID stored:', webhookData.occupancyid);
      }
      
      console.log('All OTP data saved to localStorage');

      // Navigate to home page after successful verification
      console.log('Navigating to home page...');
      setLoading(false);
      navigate('/home');
    } catch (err) {
      console.error('Failed to verify OTP', err);
      setError('Failed to verify OTP. Please try again.');
      setShowErrorPopup(true);
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
                type="tel"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyPress={handleKeyPress}
                placeholder="Enter the OTP you received"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>


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
                onClick={() => {
                  setShowErrorPopup(false);
                  setOtp('');
                }}
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
