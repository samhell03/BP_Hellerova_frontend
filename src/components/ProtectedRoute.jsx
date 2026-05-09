import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ isLoggedIn, authChecked, children }) {
  const location = useLocation();

  if (!authChecked) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-card">
          <div className="app-loading-spinner"></div>
          <h2>Ověřuji data</h2>
          <p>Probíhá kontrola přihlášení.</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
