import React from 'react';

// Shared icon components for consistent styling across the application

interface IconProps {
    className?: string;
}

export const SchoolIcon: React.FC<IconProps> = ({ className }) => (
    <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z" />
        <path d="M12 13v9" />
        <path d="M12 2v4" />
    </svg>
);
