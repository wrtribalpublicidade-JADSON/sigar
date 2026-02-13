import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'rect';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width,
    height,
    variant = 'rect'
}) => {
    return (
        <div
            className={`skeleton-technical ${className}`}
            style={{
                width: width,
                height: height,
                border: '1px solid rgba(15, 23, 42, 0.1)'
            }}
        />
    );
};
