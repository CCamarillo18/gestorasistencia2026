import { BrowserRouter as Router, Routes, Route } from "react-router";
import LoginPage from "@/react-app/pages/Login";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import DashboardPage from "@/react-app/pages/Dashboard";
import AttendancePage from "@/react-app/pages/Attendance";
import ReportsPage from "@/react-app/pages/Reports";
import SchoolAbsencesPage from "@/react-app/pages/SchoolAbsences";
import ManualAttendancePage from "@/react-app/pages/ManualAttendance";
import AdminPage from "@/react-app/pages/Admin";
import ImportStudentsPage from "@/react-app/pages/ImportStudents";
import TeacherManagementPage from "@/react-app/pages/TeacherManagement";
import MobileStudentsPage from "@/react-app/pages/MobileStudents";
import StudentsPanelPage from "@/react-app/pages/StudentsPanel";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance/:scheduleId"
          element={
            <ProtectedRoute>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school-absences"
          element={
            <ProtectedRoute>
              <SchoolAbsencesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manual-attendance"
          element={
            <ProtectedRoute>
              <ManualAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/import-students"
          element={
            <ProtectedRoute>
              <ImportStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <TeacherManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mobile/students"
          element={
            <ProtectedRoute>
              <MobileStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <StudentsPanelPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
