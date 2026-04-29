import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
