import { Navigate } from "react-router-dom";

// Ce fichier redirige vers la page Landing
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
