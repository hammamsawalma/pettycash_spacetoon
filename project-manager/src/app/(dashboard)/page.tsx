"use client"
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";
import AccountantDashboard from "@/components/dashboard/AccountantDashboard";
import GeneralManagerDashboard from "@/components/dashboard/GeneralManagerDashboard";

export default function Home() {
  const { role } = useAuth();

  switch (role) {
    case "GENERAL_MANAGER":
      return <GeneralManagerDashboard />;
    case "ADMIN":
      return <AdminDashboard />;
    case "USER":
      return <EmployeeDashboard />;
    case "GLOBAL_ACCOUNTANT":
      return <AccountantDashboard />;
    default:
      return <AdminDashboard />;
  }
}


