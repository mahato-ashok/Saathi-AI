import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { loadState, saveState } from './data/seedData';

// Route Guard
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
import LoginBeneficiary from './pages/auth/LoginBeneficiary';
import LoginCounsellor from './pages/auth/LoginCounsellor';
import RegisterBeneficiary from './pages/auth/RegisterBeneficiary';
import RegisterCounsellor from './pages/auth/RegisterCounsellor';

// App Pages
import Landing from './pages/Landing';
import BeneficiaryDashboard from './pages/beneficiary/BeneficiaryDashboard';
import CheckIn from './pages/beneficiary/CheckIn';
import History from './pages/beneficiary/History';
import HelpPage from './pages/beneficiary/HelpPage';
import CounsellorDashboard from './pages/counsellor/CounsellorDashboard';
import CasesList from './pages/counsellor/CasesList';
import CaseDetail from './pages/counsellor/CaseDetail';
import AlertsPage from './pages/counsellor/AlertsPage';

import { useAuth } from './context/AuthContext';
import {
  fetchBeneficiaryCase,
  fetchBeneficiaryCheckins,
  fetchCounsellorCases,
  fetchCounsellorAlerts,
} from './utils/api';

export default function App() {
  const { user } = useAuth();
  const [state, setState] = useState(() => loadState(user?.email));

  // Sync user profile & load per-user clinical data from backend
  useEffect(() => {
    if (!user) {
      setState(loadState());
      return;
    }

    if (user.role === 'beneficiary') {
      const cached = localStorage.getItem(`saathi-state-${user.email}`);
      let base = cached ? JSON.parse(cached) : loadState();

      const userInitials = user.full_name
        ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

      const initialProfile = {
        ...(base.profile || {}),
        name: user.full_name,
        email: user.email,
        age: user.age || base.profile?.age || 25,
        location: user.area || base.profile?.location || 'Community Support Program',
        avatar: user.avatar || userInitials,
        streak: user.streak ?? 0,
        joinDate: user.join_date || 'Sep 2026',
        lastCheckinDate: user.last_checkin_date || null,
        checkinBaseScore: user.checkin_base_score ?? 0,
      };

      // If user has no cached state and is NOT Ananya, don't show Ananya's seed check-ins
      if (!cached && user.email !== 'ananya@example.com') {
        base = {
          ...base,
          profile: initialProfile,
          checkins: [],
        };
      } else {
        base = { ...base, profile: initialProfile };
      }
      setState(base);

      // Fetch fresh PostgreSQL case & checkins for this beneficiary
      let isMounted = true;
      Promise.allSettled([
        fetchBeneficiaryCase(),
        fetchBeneficiaryCheckins(30),
      ]).then(([caseRes, checkinsRes]) => {
        if (!isMounted) return;

        const caseData = caseRes.status === 'fulfilled' ? caseRes.value : null;
        const checkinsData = checkinsRes.status === 'fulfilled' ? checkinsRes.value : null;

        setState(prev => {
          let updatedCheckins = prev.checkins;
          if (Array.isArray(checkinsData)) {
            updatedCheckins = checkinsData.map(ci => {
              const d = new Date(ci.submitted_at);
              const isDateValid = !isNaN(d.getTime());
              return {
                id: String(ci.id),
                date: isDateValid ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Today',
                fullDate: isDateValid ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
                score: Math.round(ci.score),
                level: ci.level,
                mood: ci.mood,
                safety: ci.safety,
                sleep: ci.sleep,
                anxiety: ci.anxiety,
                support: ci.support,
                note: ci.note || '',
                submittedAt: isDateValid ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '',
                anomalyFlag: ci.anomaly_flag || false,
                emotions: ci.emotions || null,
                reflection: ci.gemini_reflection || null,
                source: 'backend',
              };
            });
          }

          const currentCaseRef = caseData?.case_ref || prev.profile?.caseRef || (user.email === 'ananya@example.com' ? 'ST-1042' : 'ST-XXXX');
          const latestScore = updatedCheckins[0]?.score ?? (caseData?.score !== undefined ? Math.round(caseData.score) : (user.checkin_base_score || 0));

          const syncedProfile = {
            ...prev.profile,
            name: user.full_name,
            email: user.email,
            age: user.age || caseData?.age || prev.profile?.age || 25,
            location: user.area || caseData?.area || prev.profile?.location || 'Community Support Program',
            avatar: user.avatar || userInitials,
            streak: user.streak ?? prev.profile?.streak ?? 0,
            joinDate: user.join_date || prev.profile?.joinDate || 'Sep 2026',
            lastCheckinDate: user.last_checkin_date || prev.profile?.lastCheckinDate || null,
            checkinBaseScore: latestScore,
            caseRef: currentCaseRef,
          };

          let updatedCases = prev.cases;
          if (caseData) {
            const caseItem = {
              id: caseData.case_ref,
              name: user.full_name,
              age: caseData.age || user.age || 25,
              area: caseData.area || user.area || 'Community Support',
              score: Math.round(caseData.score),
              risk: caseData.risk,
              status: caseData.status,
              updated: 'Just now',
              trend: caseData.trend,
              alerts: caseData.open_alerts || 0,
              notes: caseData.notes || '',
              indicators: caseData.indicators || {},
              interventions: caseData.interventions || [],
              history: (caseData.history || []).map(h => ({ d: h.d || 'Recent', score: Math.round(h.score) })),
            };
            updatedCases = [caseItem, ...prev.cases.filter(c => c.id !== caseData.case_ref && c.name !== user.full_name)];
          }

          const nextState = {
            ...prev,
            profile: syncedProfile,
            checkins: updatedCheckins,
            cases: updatedCases,
          };
          saveState(nextState, user.email);
          return nextState;
        });
      });

      return () => { isMounted = false; };
    } else if (user.role === 'counsellor') {
      Promise.allSettled([
        fetchCounsellorCases(),
        fetchCounsellorAlerts(),
      ]).then(([casesRes, alertsRes]) => {
        if (casesRes.status === 'fulfilled' && Array.isArray(casesRes.value)) {
          setState(prev => {
            const mappedCases = casesRes.value.map(c => ({
              id: c.case_ref,
              name: c.beneficiary_name || 'Beneficiary',
              age: c.age || 25,
              area: c.area || 'Community Support',
              score: Math.round(c.score),
              risk: c.risk,
              status: c.status,
              updated: 'Recently',
              trend: c.trend || 'stable',
              alerts: c.open_alerts || 0,
              notes: '',
              indicators: {},
              interventions: [],
              history: [],
            }));
            const next = { ...prev, cases: mappedCases };
            return next;
          });
        }
      });
    }
  }, [user?.id, user?.email, user?.streak, user?.last_checkin_date]);

  useEffect(() => {
    saveState(state, user?.email);
  }, [state, user?.email]);

  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<Landing />} />

      {/* Auth Routes */}
      <Route path="/login/beneficiary" element={<LoginBeneficiary />} />
      <Route path="/login/counsellor" element={<LoginCounsellor />} />
      <Route path="/register/beneficiary" element={<RegisterBeneficiary />} />
      <Route path="/register/counsellor" element={<RegisterCounsellor />} />

      {/* Beneficiary Protected Routes */}
      <Route
        path="/beneficiary"
        element={
          <ProtectedRoute role="beneficiary">
            <BeneficiaryDashboard state={state} setState={setState} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/beneficiary/checkin"
        element={
          <ProtectedRoute role="beneficiary">
            <CheckIn state={state} setState={setState} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/beneficiary/history"
        element={
          <ProtectedRoute role="beneficiary">
            <History state={state} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/beneficiary/help"
        element={
          <ProtectedRoute role="beneficiary">
            <HelpPage state={state} />
          </ProtectedRoute>
        }
      />

      {/* Counsellor Protected Routes */}
      <Route
        path="/counsellor"
        element={
          <ProtectedRoute role="counsellor">
            <CounsellorDashboard state={state} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counsellor/cases"
        element={
          <ProtectedRoute role="counsellor">
            <CasesList state={state} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counsellor/cases/:id"
        element={
          <ProtectedRoute role="counsellor">
            <CaseDetail state={state} setState={setState} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counsellor/alerts"
        element={
          <ProtectedRoute role="counsellor">
            <AlertsPage state={state} setState={setState} />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
