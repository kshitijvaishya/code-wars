import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAuthStore } from './store/authStore';
import { useSocket } from './hooks/useSocket';
import { FullPageSpinner } from './components/ui/Spinner';
import { AppLayout, BareLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MatchmakingPage from './pages/MatchmakingPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import BattleArenaPage from './pages/BattleArenaPage';
import BattleResultPage from './pages/BattleResultPage';
import BattleHistoryPage from './pages/BattleHistoryPage';
import ProblemLibraryPage from './pages/ProblemLibraryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProblemEditorPage from './pages/ProblemEditorPage';
import PracticePage from './pages/PracticePage';

function SocketInitializer() {
  useSocket(); // mounts socket connection when authenticated
  return null;
}

function AppRoutes() {
  const { isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (isLoading) return <FullPageSpinner />;

  return (
    <Routes>
      {/* Public bare layout */}
      <Route element={<BareLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<AuthPage mode="login" />} />
        <Route path="/auth/register" element={<AuthPage mode="register" />} />
      </Route>

      {/* Authenticated app layout */}
      <Route element={<AppLayout />}>
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/matchmaking"
          element={<ProtectedRoute><MatchmakingPage /></ProtectedRoute>}
        />

        {/* Battle room join by invite code */}
        <Route
          path="/battle/join/:code"
          element={<ProtectedRoute><WaitingRoomPage /></ProtectedRoute>}
        />
        {/* Private battle creation redirect */}
        <Route
          path="/battle/create"
          element={<ProtectedRoute><MatchmakingPage /></ProtectedRoute>}
        />
        {/* Waiting room by battleId */}
        <Route
          path="/battle/:battleId/waiting"
          element={<ProtectedRoute><WaitingRoomPage /></ProtectedRoute>}
        />
        {/* Battle result */}
        <Route
          path="/battle/:id/result"
          element={<ProtectedRoute><BattleResultPage /></ProtectedRoute>}
        />
        {/* Battle history */}
        <Route
          path="/battles/history"
          element={<ProtectedRoute><BattleHistoryPage /></ProtectedRoute>}
        />

        {/* Problems */}
        <Route path="/problems" element={<ProblemLibraryPage />} />
        <Route path="/problems/:slug" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />

        {/* Leaderboard */}
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        {/* Profile */}
        <Route
          path="/profile/:username"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['contest_admin', 'super_admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/problems/:id"
          element={
            <ProtectedRoute roles={['contest_admin', 'super_admin']}>
              <ProblemEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/problems/:id/edit"
          element={
            <ProtectedRoute roles={['contest_admin', 'super_admin']}>
              <ProblemEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/problems/new"
          element={
            <ProtectedRoute roles={['contest_admin', 'super_admin']}>
              <ProblemEditorPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Battle arena — full-screen, no navbar */}
      <Route
        path="/battle/:id"
        element={
          <ProtectedRoute>
            <BattleArenaPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SocketInitializer />
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2333',
            color: '#e5e7eb',
            border: '1px solid #2f3548',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1f2333' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1f2333' } },
        }}
      />
    </BrowserRouter>
  );
}
