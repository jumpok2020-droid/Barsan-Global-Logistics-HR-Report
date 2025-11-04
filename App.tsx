import React, { useState, useMemo } from 'react';
import { Employee, UserRole, EmployeeStatus, LeaveQuota } from './types';
import { EMPLOYEES, DEPARTMENTS } from './constants';
import useLeaveData from './hooks/useLeaveData';
import EmployeeDashboard from './views/EmployeeDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import HRDashboard from './views/HRDashboard';
import { postLoginWebhook } from './utils/postWebhook';

const LoginScreen: React.FC<{ 
    onLogin: (email: string, password: string) => void;
    isLoggingIn: boolean;
    error: string | null;
}> = ({ onLogin, isLoggingIn, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    Leave Management Portal
                </h1>
                <p className="text-center text-gray-600 dark:text-gray-300">Sign in to your account</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>
                    
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isLoggingIn ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
                 <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Hint: Use any employee email. The password for all users is 'password'.
                </p>
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
    return <LoginScreen onLogin={handleLogin} isLoggingIn={isLoggingIn} error={loginError} />;
  }

  return <AuthenticatedApp currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;