import React, { useState, useRef } from 'react';
import axiosInstance from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // View modes: 'login' | 'verify' | 'forgotEmail' | 'resetPassword'
  const [viewMode, setViewMode] = useState('login');

  // Email verification / Reset password state
  const [targetEmail, setTargetEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);

  const otpInputs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Login Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post(
        "/api/users/login",
        formData
      );

      if (response.status === 200 && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('email', formData.email.toLowerCase());
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const resData = err.response?.data;
      if (resData?.needsVerification) {
        setTargetEmail(resData.email || formData.email.toLowerCase());
        setViewMode('verify');
        setError(resData.message || 'Please verify your email before logging in.');

        if (resData.devOtp) {
          setOtp(resData.devOtp.split(''));
          toast.success(`Dev Mode OTP: ${resData.devOtp}`, { duration: 10000, position: 'top-center' });
        } else {
          toast.error(resData.message || 'Please verify your email before logging in.', {
            duration: 5000,
            position: 'top-center'
          });
        }
      } else if (resData?.message) {
        setError(resData.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP inputs handling
  const handleOtpChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;
    const newOtp = [...otp];
    newOtp[idx] = val[0];
    setOtp(newOtp);
    if (idx < 5 && val) {
      otpInputs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (otp[idx]) {
        const newOtp = [...otp];
        newOtp[idx] = '';
        setOtp(newOtp);
      } else if (idx > 0) {
        otpInputs.current[idx - 1]?.focus();
      }
    }
  };

  // Handle Verify Email Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const verificationCode = otp.join("");
    if (!verificationCode.trim() || verificationCode.length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      await axiosInstance.post(
        '/api/users/verify-email',
        {
          email: targetEmail,
          verificationCode: verificationCode.trim()
        }
      );

      toast.success('Email verified successfully! You can now log in.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });

      setViewMode('login');
      setError('');
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Resend Verification Code
  const handleResendCode = async () => {
    setResendingCode(true);
    setError('');

    try {
      const res = await axiosInstance.post(
        '/api/users/resend-verification',
        { email: targetEmail }
      );

      if (res.data?.devOtp) {
        setOtp(res.data.devOtp.split(''));
        toast.success(`Dev Mode OTP: ${res.data.devOtp}`, { duration: 10000, position: 'top-center' });
      } else {
        toast.success('Verification code resent! Please check your email.', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code';
      setError(msg);
      toast.error(msg);
    } finally {
      setResendingCode(false);
    }
  };

  // Handle Forgot Password Request (Step 1)
  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      setError('Please enter your registered email address');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const res = await axiosInstance.post('/api/users/forgot-password', {
        email: targetEmail.trim()
      });

      toast.success(res.data?.message || 'Reset code sent to your email.');

      if (res.data?.devOtp) {
        setOtp(res.data.devOtp.split(''));
        toast.success(`Dev Mode Reset OTP: ${res.data.devOtp}`, { duration: 10000, position: 'top-center' });
      }

      setViewMode('resetPassword');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to process forgot password request';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reset Password Submit (Step 2)
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const resetCode = otp.join("");

    if (!resetCode || resetCode.length < 6) {
      setError('Please enter the 6-digit reset code');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      await axiosInstance.post('/api/users/reset-password', {
        email: targetEmail.trim(),
        resetCode: resetCode.trim(),
        newPassword,
        confirmPassword
      });

      toast.success('Password updated successfully! Please log in with your new password.', {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });

      setViewMode('login');
      setError('');
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        
        {/* VIEW 1: EMAIL VERIFICATION MODE */}
        {viewMode === 'verify' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-indigo-600">Verify Your Email</h2>
              <p className="text-sm text-gray-600 mt-1">
                Enter the code sent to <strong>{targetEmail}</strong>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2 text-center">
                  6-Digit Verification Code
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => otpInputs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e, idx)}
                      onKeyDown={e => handleOtpKeyDown(e, idx)}
                      className="w-11 h-12 text-center text-xl font-bold border-2 border-indigo-100 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                      required
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400"
              >
                {actionLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  Didn't get the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendingCode}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                  >
                    {resendingCode ? 'Resending...' : 'Resend Code'}
                  </button>
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setError('');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 2: FORGOT PASSWORD - STEP 1 (REQUEST CODE) */}
        {viewMode === 'forgotEmail' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-amber-600">Forgot Password?</h2>
              <p className="text-sm text-gray-600 mt-1">
                Enter your registered email to receive a 6-digit password reset code.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400"
              >
                {actionLoading ? 'Sending Code...' : 'Send Reset Code'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setError('');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 3: FORGOT PASSWORD - STEP 2 (ENTER CODE & NEW PASSWORD) */}
        {viewMode === 'resetPassword' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-600">Reset Your Password</h2>
              <p className="text-sm text-gray-600 mt-1">
                Enter the code sent to <strong>{targetEmail}</strong> and choose a new password.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2 text-center">
                  6-Digit Reset Code
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => otpInputs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e, idx)}
                      onKeyDown={e => handleOtpKeyDown(e, idx)}
                      className="w-11 h-12 text-center text-xl font-bold border-2 border-indigo-100 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                      required
                    />
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400"
              >
                {actionLoading ? 'Updating Password...' : 'Reset Password'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setError('');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 4: NORMAL LOGIN MODE */}
        {viewMode === 'login' && (
          <div>
            <h2 className="text-3xl font-bold text-indigo-600 mb-6 text-center">Login</h2>
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                />
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setTargetEmail(formData.email);
                    setViewMode('forgotEmail');
                    setError('');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Register Here
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
