import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";

import "./App.css";

import Sidebar from "./components/layout/Sidebar";
import NewTrip from "./components/NewTrip";

import HomePage from "./pages/HomePage";
import MyTrips from "./pages/MyTrips";
import TripDetail from "./pages/TripDetail";
import Profile from "./pages/Profile";
import CalendarPage from "./pages/CalendarPage";
import ProtectedRoute from "./components/ProtectedRoute";
import StatisticsPage from "./pages/StatisticsPage";
import TemplatesPage from "./pages/TemplatesPage";
import SharedPackagesPage from "./pages/SharedPackagesPage";
import NotificationsBell from "./components/notifications/NotificationsBell";

import { clearAuthData, fetchMe } from "./api/auth";
import { getTripDetail, getTrips, removeTrip } from "./api/trips";
import { enrichTrip, enrichTrips, getUpcomingTrip } from "./utils/tripMapper";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { showError, showInfo, showSuccess } from "./utils/toast";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const storedToken = localStorage.getItem("token");
  const storedUserId = localStorage.getItem("userId");
  const storedUserName = localStorage.getItem("userName");

  const [authChecked, setAuthChecked] = useState(!storedToken);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(storedToken));
  const [userId, setUserId] = useState(storedUserId || null);
  const [userName, setUserName] = useState(storedUserName || "Cestovateli");

  const [myTrips, setMyTrips] = useState([]);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  const fetchTrips = async () => {
    try {
      const trips = await getTrips();
      setMyTrips(enrichTrips(trips));
    } catch (err) {
      console.error("Chyba při načítání výletů:", err);
      setMyTrips([]);
    }
  };

  const fetchTripById = async (tripId) => {
    try {
      const trip = await getTripDetail(tripId);
      return enrichTrip(trip);
    } catch (err) {
      console.error("Chyba při načítání detailu výletu:", err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const hasToken = Boolean(localStorage.getItem("token"));

      if (!hasToken) {
        if (!isMounted) return;
        setAuthChecked(true);
        setIsLoggedIn(false);
        setUserId(null);
        setUserName("Cestovateli");
        setMyTrips([]);
        return;
      }

      try {
        const user = await fetchMe();

        if (!isMounted) return;

        if (!user) {
          setIsLoggedIn(false);
          setUserId(null);
          setUserName("Cestovateli");
          setMyTrips([]);
          clearAuthData();
          return;
        }

        setIsLoggedIn(true);
        setUserId(user.userId);
        setUserName(user.userName);

        await fetchTrips();
      } catch (err) {
        console.error("Chyba při automatickém přihlášení:", err);

        if (!isMounted) return;

        setIsLoggedIn(false);
        setUserId(null);
        setUserName("Cestovateli");
        setMyTrips([]);
        clearAuthData();
      } finally {
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setIsPlanOpen(false);
    setEditingTrip(null);
  }, [location.pathname]);

    const handleLogout = () => {
    clearAuthData();
    setIsLoggedIn(false);
    setUserId(null);
    setUserName("Cestovateli");
    setMyTrips([]);
    setIsPlanOpen(false);
    setEditingTrip(null);
    showInfo("Odhlášení proběhlo úspěšně.");
    navigate("/");
  };

  const handleOpenCreateTrip = () => {
    setEditingTrip(null);
    setIsPlanOpen(true);
  };

  const handleOpenEditTrip = (trip) => {
    setEditingTrip(trip);
    setIsPlanOpen(true);
  };

  const handleCloseTripModal = () => {
    setIsPlanOpen(false);
    setEditingTrip(null);
  };

    const handleDeleteTrip = async (tripId) => {
    const confirmed = window.confirm("Opravdu chceš tento výlet smazat?");

    if (!confirmed) {
      return;
    }

    try {
      await removeTrip(tripId);
      setMyTrips((prevTrips) => prevTrips.filter((trip) => trip._id !== tripId));
      showSuccess("Výlet byl úspěšně smazán.");
    } catch (err) {
      console.error("Chyba při mazání:", err);
      showError(err.message || "Smazání se nezdařilo.");
    }
  };

  const upcomingTrip = useMemo(() => getUpcomingTrip(myTrips), [myTrips]);

  return (
    <>
      <Sidebar
        isLoggedIn={isLoggedIn}
        authChecked={authChecked}
        setIsLoggedIn={setIsLoggedIn}
        setUserId={setUserId}
        setUserName={setUserName}
        fetchTrips={fetchTrips}
        handleLogout={handleLogout}
      />
      {isLoggedIn && authChecked && <NotificationsBell />}
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              isLoggedIn={isLoggedIn}
              userName={userName}
              myTrips={myTrips}
              upcomingTrip={upcomingTrip}
              onCreateTrip={handleOpenCreateTrip}
              openEdit={handleOpenEditTrip}
              handleDeleteTrip={handleDeleteTrip}
            />
          }
        />

        <Route
          path="/trips"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} authChecked={authChecked}>
              <MyTrips
                isLoggedIn={isLoggedIn}
                myTrips={myTrips}
                onCreateTrip={handleOpenCreateTrip}
                onEditTrip={handleOpenEditTrip}
                onDeleteTrip={handleDeleteTrip}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trips/:id"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} authChecked={authChecked}>
              <TripDetail
                isLoggedIn={isLoggedIn}
                myTrips={myTrips}
                onEditTrip={handleOpenEditTrip}
                onDeleteTrip={handleDeleteTrip}
                fetchTripById={fetchTripById}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} authChecked={authChecked}>
              <CalendarPage isLoggedIn={isLoggedIn} myTrips={myTrips} />
            </ProtectedRoute>
          }
        />

        <Route
        path="/statistic"
        element={
        <ProtectedRoute isLoggedIn={isLoggedIn} authChecked={authChecked}>
        <StatisticsPage isLoggedIn={isLoggedIn} myTrips={myTrips} />
        </ProtectedRoute>
        }
        />

        <Route
  path="/shared"
  element={
    <ProtectedRoute isLoggedIn={isLoggedIn} authChecked={authChecked}>
      <SharedPackagesPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/templates"
  element={
    <ProtectedRoute isLoggedIn={isLoggedIn} authChecked={authChecked}>
      <TemplatesPage myTrips={myTrips} />
    </ProtectedRoute>
  }
/>

        <Route
          path="/profile"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} authChecked={authChecked}>
              <Profile
                isLoggedIn={isLoggedIn}
                myTrips={myTrips}
                setUserName={setUserName}
              />
            </ProtectedRoute>
          }
        />
      </Routes>

            {isPlanOpen && (
        <NewTrip
          userId={userId}
          tripToEdit={editingTrip}
          onClose={handleCloseTripModal}
          onSave={fetchTrips}
        />
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
