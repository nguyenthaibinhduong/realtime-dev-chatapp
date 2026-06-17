import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./blocks/Loading";

const AuthGuard = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [needsGithubLink, setNeedsGithubLink] = useState(localStorage.getItem("needs_github_link"));
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    const handleStorage = () => {
      setNeedsGithubLink(localStorage.getItem("needs_github_link"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated()) {
        navigate("/landing", { replace: true });
      } else {
        console.log("user in auth guard", user);

        if (user && (user.github_verified === false && user.github_installation_id === null)) {
          if (needsGithubLink === "true") {
            setIsLoading(false);
          } else {
            localStorage.setItem("needs_github_link", "true");
            setNeedsGithubLink("true");
            navigate("/auth/github/register", { replace: true });
          }
        } else {
          setIsLoading(false);
        }
      }
    }
  }, [loading, isAuthenticated, navigate, needsGithubLink, user]);

  if (loading) return <Loading />; // chờ verify xong mới render
  if (loading || isLoading) return <Loading />;
  if (!isAuthenticated()) return null; // tránh render sớm trong lúc redirect

  return <>
    {children}
  </>;
};

export default AuthGuard;
