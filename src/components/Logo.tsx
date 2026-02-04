import { Link } from "react-router-dom";
import logoImage from "@/assets/logo-latruffe-main.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  linkTo?: string;
  className?: string;
}

export const Logo = ({ size = "md", linkTo = "/", className = "" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12"
  };

  const logoElement = (
    <img 
      src={logoImage} 
      alt="La Truffe" 
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
    />
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-80 transition-opacity">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
};

export default Logo;
