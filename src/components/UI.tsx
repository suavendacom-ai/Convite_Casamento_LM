import React from 'react';

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false,
  type = 'button'
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const baseStyles = "px-6 py-2.5 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-center";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg",
    secondary: "bg-stone-800 text-white hover:bg-stone-900",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "text-stone-600 hover:bg-stone-100"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white p-8 rounded-3xl shadow-sm border border-stone-100 ${className}`}>
      {children}
    </div>
  );
}

export function Input({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  className = ""
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 ml-1">{label}</label>}
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
      />
    </div>
  );
}
