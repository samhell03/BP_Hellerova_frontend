import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ isLoggedIn, authChecked, children }) {
  const location = useLocation();

  if (!authChecked) {
    return null;
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
