import React from 'react';
import { useAuthStore } from '../../src/stores';
import DashboardScreen from '../dashboard';
import InvestorDashboardScreen from '../investor-dashboard';

export default function RoleBasedDashboard() {
  const { userRole } = useAuthStore();
  return userRole === 'consumer' ? <InvestorDashboardScreen /> : <DashboardScreen />;
}
