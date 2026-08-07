// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import axiosInstance from '../utils/axios';

// const Register = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     gstNo: '',
//   });

//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [verificationStep, setVerificationStep] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     // Basic validation
//     if (formData.password !== formData.confirmPassword) {
//       setError("Passwords don't match");
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await axiosInstance.post('http://localhost:5001/api/users/register', formData);
//       setFormData({ name: '', email: '', password: '', confirmPassword: '', gstNo: '' }); // Reset form
//       setVerificationStep(true);
      
//       // Show success toast
//       toast.success('Registration successful! Redirecting to login...', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#10B981',
//           color: '#fff',
//           padding: '16px',
//           borderRadius: '8px',
//         },
//       });
      
//       // Redirect to login after 3 seconds
//       setTimeout(() => {
//         navigate('/login');
//       }, 3000);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Registration failed');
//       toast.error(err.response?.data?.message || 'Registration failed', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#EF4444',
//           color: '#fff',
//           padding: '16px',
//           borderRadius: '8px',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Loading overlay component with improved animation
//   const LoadingOverlay = () => (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white p-8 rounded-lg shadow-xl text-center transform transition-all duration-300 scale-100">
//         <div className="relative">
//           <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
//           <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
//         </div>
//         <p className="mt-4 text-gray-700 text-lg font-medium">Creating your account...</p>
//         <p className="mt-2 text-gray-500 text-sm">Please wait while we set up your account</p>
//       </div>
//     </div>
//   );

//   // Verification success component with improved animation
//   const VerificationSuccess = () => (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md transform transition-all duration-300 scale-100">
//         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
//           <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
//           </svg>
//         </div>
//         <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
//         <p className="text-gray-600 mb-4">Your account has been created successfully.</p>
//         <div className="flex items-center justify-center space-x-2 text-gray-500">
//           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
//           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
//           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
//         </div>
//         <p className="mt-4 text-gray-500 text-sm">Redirecting to login page...</p>
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
//       {loading && <LoadingOverlay />}
//       {verificationStep && <VerificationSuccess />}
      
//       <div className="max-w-md mx-auto">
//         <div className="text-center mb-8">
//           <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//             Create Your Account
//           </h2>
//           <p className="mt-2 text-gray-600">Join our pharmacy management system</p>
//         </div>

//         <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
//           {error && (
//             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-shake">
//               <div className="flex">
//                 <div className="flex-shrink-0">
//                   <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm text-red-700">{error}</p>
//                 </div>
//               </div>
//             </div>
//           )}
          
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Full Name</label>
//               <div className="mt-1 relative rounded-md shadow-sm">
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Enter your full name"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Email Address</label>
//               <div className="mt-1 relative rounded-md shadow-sm">
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Enter your email"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Password</label>
//               <div className="mt-1 relative rounded-md shadow-sm">
//                 <input
//                   type="password"
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Create a password"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
//               <div className="mt-1 relative rounded-md shadow-sm">
//                 <input
//                   type="password"
//                   name="confirmPassword"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Confirm your password"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">GST Number</label>
//               <div className="mt-1 relative rounded-md shadow-sm">
//                 <input
//                   type="text"
//                   name="gstNo"
//                   value={formData.gstNo}
//                   onChange={handleChange}
//                   className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Enter your GST number"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {loading ? (
//                   <div className="flex items-center">
//                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Creating Account...
//                   </div>
//                 ) : (
//                   'Create Account'
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;


import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gstNo: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post(
        '/api/users/register', 
        formData
      );
      
      // Store the registered email for verification
      const userEmail = formData.email;
      setRegisteredEmail(userEmail);
      
      // Reset form but keep email for verification
      setFormData({ name: '', email: '', password: '', confirmPassword: '', gstNo: '' });
      setVerificationStep(true);
      
      if (response.data?.devOtp) {
        setOtp(response.data.devOtp.split(''));
        toast.success(`Dev Mode OTP: ${response.data.devOtp}`, { duration: 10000, position: 'top-center' });
      } else {
        toast.success(response.data?.message || 'Registration successful! Please check your email for verification code.', {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error(msg, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const verificationCode = otp.join("");
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setVerifyingCode(true);
    setError('');

    try {
      const response = await axiosInstance.post(
        '/api/users/verify-email',
        {
          email: registeredEmail,
          verificationCode: verificationCode.trim()
        }
      );

      toast.success('Email verified successfully! Redirecting to login...', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });

      // Redirect to login after successful verification
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      toast.error(err.response?.data?.message || 'Verification failed', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    setResendingCode(true);
    setError('');

    try {
      await axiosInstance.post(
        '/api/users/resend-verification',
        { email: registeredEmail }
      );

      toast.success('Verification code resent! Please check your email.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } finally {
      setResendingCode(false);
    }
  };

  // Loading overlay component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center transform transition-all duration-300 scale-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-700 text-lg font-medium">Creating your account...</p>
        <p className="mt-2 text-gray-500 text-sm">Please wait while we set up your account</p>
      </div>
    </div>
  );

  // Email verification component
  const EmailVerification = () => {
    const otpInputs = React.useRef([]);

    const handleOtpChange = (e, idx) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      if (!val) return;
      const newOtp = [...otp];
      newOtp[idx] = val[0];
      setOtp(newOtp);
      if (idx < 5 && val) {
        otpInputs.current[idx + 1].focus();
      }
    };

    const handleOtpKeyDown = (e, idx) => {
      if (e.key === 'Backspace') {
        if (otp[idx]) {
          const newOtp = [...otp];
          newOtp[idx] = '';
          setOtp(newOtp);
        } else if (idx > 0) {
          otpInputs.current[idx - 1].focus();
        }
      }
    };

    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Verify Your Email
          </h2>
          <p className="mt-2 text-gray-600">
            We've sent a verification code to <strong>{registeredEmail}</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Verification Code</label>
              <div className="mt-1">
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
                      className="w-12 h-12 text-center text-2xl border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={verifyingCode}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyingCode ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendingCode}
                  className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  {resendingCode ? 'Resending...' : 'Resend Code'}
                </button>
              </p>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setVerificationStep(false);
                  setError('');
                  setOtp(['', '', '', '', '', '']);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Registration
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      {loading && <LoadingOverlay />}
      
      {verificationStep ? (
        <EmailVerification />
      ) : (
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Create Your Account
            </h2>
            <p className="mt-2 text-gray-600">Join our pharmacy management system</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-shake">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">GST Number</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your GST number"
                    required
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-medium text-blue-600 hover:text-blue-500 underline"
                  >
                    Log In Here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;