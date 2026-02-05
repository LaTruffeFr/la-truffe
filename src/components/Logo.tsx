import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  linkTo?: string;
  className?: string;
  showBadge?: boolean;
}

export const Logo = ({ size = "md", linkTo = "/", className = "", showBadge = false }: LogoProps) => {
  const sizeClasses = {
    sm: "text-lg md:text-xl",
    md: "text-xl md:text-2xl",
    lg: "text-2xl md:text-3xl"
  };

  const logoElement = (
    <span className={`font-bold tracking-tight text-slate-900 ${sizeClasses[size]} ${className}`}>
      La Truffe
    </span>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-80 transition-opacity flex items-center gap-2">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
};

export default Logo;
