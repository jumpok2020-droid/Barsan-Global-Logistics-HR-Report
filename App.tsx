import React, { useState, useMemo } from 'react';
import { Employee, UserRole, EmployeeStatus, LeaveQuota } from './types';
import { EMPLOYEES, DEPARTMENTS } from './constants';
import useLeaveData from './hooks/useLeaveData';
import EmployeeDashboard from './views/EmployeeDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import HRDashboard from './views/HRDashboard';
import { postLoginWebhook, postResetPasswordWebhook, postRegisterWebhook } from './utils/postWebhook';

const LoginScreen: React.FC<{ 
    onLogin: (email: string, password: string) => void;
    isLoggingIn: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ onLogin, isLoggingIn, error, setError }) => {
    // Shared State
    const [view, setView] = useState<'login' | 'forgotPassword' | 'register'>('login');
    
    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Forgot Password State
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    // Register State
    const [name, setName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState('');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) return;
        setIsResetting(true);
        setResetMessage('');
        setError(null);
        
        const result = await postResetPasswordWebhook(resetEmail);
        
        if (result.ok) {
            setResetMessage(`If an account exists for ${resetEmail}, a password reset link has been sent.`);
        } else {
            setError(result.error || 'Failed to send reset link. Please try again.');
        }

        setIsResetting(false);
    };
    
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (regPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsRegistering(true);
        setRegisterSuccess('');
        setError(null);

        const result = await postRegisterWebhook({ name, email: regEmail, password: regPassword });

        if (result.ok) {
            setRegisterSuccess("Registration successful! Please sign in.");
            // Reset form and switch to login after a delay
            setTimeout(() => {
                setView('login');
                setName('');
                setRegEmail('');
                setRegPassword('');
                setConfirmPassword('');
                setRegisterSuccess('');
            }, 2000);
        } else {
            setError(result.error || "Registration failed. Please try again.");
        }

        setIsRegistering(false);
    };
    
    const resetAllState = () => {
        setError(null);
        setResetMessage('');
        setResetEmail('');
        setRegisterSuccess('');
        setName('');
        setRegEmail('');
        setRegPassword('');
        setConfirmPassword('');
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6 animate-fade-in">
                {view === 'login' && (
                    <>
                        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                            Leave Management Portal
                        </h1>
                        <p className="text-center text-gray-600 dark:text-gray-300">Sign in to your account</p>
                        
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            {/* Email and Password inputs */}
                             <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                                </div>
                            </div>
                            <div className="flex items-center justify-end">
                                <div className="text-sm">
                                    <button type="button" onClick={() => { setView('forgotPassword'); resetAllState(); }} className="font-medium text-primary hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none bg-transparent border-none p-0 cursor-pointer">
                                        Forgot your password?
                                    </button>
                                </div>
                            </div>
                            
                            {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

                            <div>
                                <button type="submit" disabled={isLoggingIn} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-wait">
                                    {isLoggingIn ? 'Signing In...' : 'Sign In'}
                                </button>
                            </div>
                        </form>
                         <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                            Don't have an account?{' '}
                            <button type="button" onClick={() => { setView('register'); resetAllState(); }} className="font-medium text-primary hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none bg-transparent border-none p-0 cursor-pointer">
                                Sign Up
                            </button>
                        </p>
                    </>
                )}
                
                {view === 'forgotPassword' && (
                    <>
                        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                            Reset Password
                        </h1>
                        <p className="text-center text-gray-600 dark:text-gray-300 h-5">
                           {!resetMessage && 'Enter your email to receive a reset link.'}
                        </p>
                        
                        <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                             {resetMessage ? (
                                <p className="text-sm text-center text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/40 p-4 rounded-md">
                                    {resetMessage}
                                </p>
                            ) : (
                                <div>
                                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                                    <div className="mt-1">
                                        <input id="reset-email" name="email" type="email" autoComplete="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                                    </div>
                                </div>
                            )}

                             {error && !resetMessage && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

                            {!resetMessage && (
                                <div>
                                    <button type="submit" disabled={isResetting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-wait">
                                        {isResetting ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </div>
                            )}
                        </form>
                         <p className="text-sm text-center">
                            <button type="button" onClick={() => { setView('login'); resetAllState(); }} className="font-medium text-primary hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none bg-transparent border-none p-0 cursor-pointer">
                                &larr; Back to Sign In
                            </button>
                        </p>
                    </>
                )}
                
                 {view === 'register' && (
                    <>
                        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                            Create Account
                        </h1>
                        <p className="text-center text-gray-600 dark:text-gray-300">Join the portal to manage your leave</p>
                        
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            {registerSuccess ? (
                                <p className="text-sm text-center text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/40 p-4 rounded-md">
                                    {registerSuccess}
                                </p>
                            ) : (
                                <>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                        <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                                    </div>
                                    <div>
                                        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                                        <input id="reg-email" name="email" type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                                    </div>
                                    <div>
                                        <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                        <input id="reg-password" name="password" type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                                    </div>
                                    <div>
                                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                                        <input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                                    </div>
                                </>
                            )}
                            
                            {error && !registerSuccess && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
                            
                            {!registerSuccess && (
                                <button type="submit" disabled={isRegistering} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-wait">
                                    {isRegistering ? 'Signing Up...' : 'Sign Up'}
                                </button>
                            )}
                        </form>
                        <p className="text-sm text-center">
                            <button type="button" onClick={() => { setView('login'); resetAllState(); }} className="font-medium text-primary hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none bg-transparent border-none p-0 cursor-pointer">
                                &larr; Back to Sign In
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

const AuthenticatedApp: React.FC<{
  currentUser: Employee;
  onLogout: () => void;
}> = ({ currentUser, onLogout }) => {
  const leaveData = useLeaveData(currentUser);
  
  const updatedCurrentUser = useMemo(() => 
      leaveData.employees.find(e => e.id === currentUser.id) || currentUser,
      [leaveData.employees, currentUser]
  );

  const renderDashboard = () => {
    switch (updatedCurrentUser.role) {
      case UserRole.EMPLOYEE:
        return <EmployeeDashboard currentUser={updatedCurrentUser} leaveData={leaveData} onLogout={onLogout} />;
      case UserRole.MANAGER:
        return <ManagerDashboard currentUser={updatedCurrentUser} leaveData={leaveData} onLogout={onLogout} />;
      case UserRole.HR_ADMIN:
        return <HRDashboard currentUser={updatedCurrentUser} leaveData={leaveData} onLogout={onLogout} />;
      default:
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Error: Invalid user role detected.</p>
                <button onClick={onLogout} className="ml-4 px-4 py-2 bg-primary text-white rounded">Logout</button>
            </div>
        );
    }
  };

  return (
    <>
      {renderDashboard()}
    </>
  );
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const handleLogin = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setLoginError(null);

    const trimmedEmail = email.toLowerCase().trim();

    const payload = {
        event: "login_attempt",
        timestamp: new Date().toISOString(),
        user: {
            email: trimmedEmail,
            password: password,
        },
        client: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
        },
    };

    try {
        const hook = await postLoginWebhook(payload);

        if (!hook.ok) {
            const errorMessage = hook.error?.includes('abort')
                ? "Login request timed out. The server might be slow. Please try again."
                : "Invalid email or password. Please try again.";
            console.error('Webhook authentication failed:', hook.error || 'Request failed');
            setLoginError(errorMessage);
            setIsLoggingIn(false);
            return;
        }

        if (!hook.data) {
            console.error('Webhook authentication failed:', 'No data returned from server');
            setLoginError("Login successful, but user profile is invalid. Please contact support.");
            setIsLoggingIn(false);
            return;
        }
        
        const userDataArray = hook.data;
        if (!Array.isArray(userDataArray) || userDataArray.length === 0) {
            console.error('Webhook returned invalid data format:', userDataArray);
            setLoginError("Login successful, but user profile is invalid. Please contact support.");
            setIsLoggingIn(false);
            return;
        }
        
        const userData = userDataArray[0];

        const existingEmployee = EMPLOYEES.find(e => e.email.toLowerCase() === trimmedEmail);

        // Department mapping: Prioritize existing employee data, then try to map from webhook.
        let department = existingEmployee ? DEPARTMENTS.find(d => d.id === existingEmployee.departmentId) : undefined;
        if (!department && userData.department) {
            department = DEPARTMENTS.find(d => 
                d.name.toLowerCase().includes(userData.department.toLowerCase())
            );
        }

        if (!department) {
            console.error("Could not map department:", userData.department);
            setLoginError("Your department is not configured in the system.");
            setIsLoggingIn(false);
            return;
        }
        
        const manager = EMPLOYEES.find(e => e.name === userData.Manager);

        // Role determination based on new rules
        let role: UserRole;
        const position = userData.position?.toLowerCase() || '';
        const role1 = userData.Role?.toLowerCase() || '';
        const role2 = userData.Role2?.toLowerCase() || '';
        
        if (role2 === 'system' || position === 'director') {
            role = UserRole.HR_ADMIN;
        } else if (position.includes('manager')) {
            role = UserRole.MANAGER;
        } else {
            role = UserRole.EMPLOYEE; // Default/fallback for "User" and other cases
        }
        
        let quota: LeaveQuota;
        if (role === UserRole.EMPLOYEE) {
            quota = { Annual: 6, Sick: 30, Business: 3, Other: 5 };
        } else {
            quota = { Annual: 10, Sick: 30, Business: 5, Other: 5 };
        }
        
        const statusString = userData.Status?.toLowerCase() || '';
        const isActive = statusString === 'active' || statusString === 'manager';

        const newCurrentUser: Employee = {
            id: existingEmployee?.id || Date.now(),
            name: userData.FullName || `${userData.Name} ${userData.Lastname}`,
            email: trimmedEmail,
            password: password,
            departmentId: department.id,
            managerId: manager?.id || null,
            managerEmail: userData['Email Manager'],
            role: role,
            quota: existingEmployee?.quota || quota,
            status: isActive ? EmployeeStatus.ACTIVE : EmployeeStatus.INACTIVE,
            upToDate: userData['Up to Date'],
        };
        
        setCurrentUser(newCurrentUser);

    } catch (error) {
        console.error("An unexpected error occurred during login:", error);
        setLoginError("An unexpected error occurred. Please try again later.");
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginError(null);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} isLoggingIn={isLoggingIn} error={loginError} setError={setLoginError} />;
  }

  return <AuthenticatedApp currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;