import React from "react";

export const RocketDoodle = ({ className }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M40 160 C 40 160, 20 180, 10 190 M 50 150 C 50 150, 60 180, 70 190 M 30 170 C 30 170, 40 180, 50 180"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M50 150 L 120 50 C 130 30, 150 20, 170 30 C 180 40, 170 60, 150 70 L 50 150"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M120 50 C 120 50, 110 80, 130 100"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M150 70 C 150 70, 120 80, 100 60"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle cx="140" cy="60" r="5" fill="currentColor" />
        </svg>
    );
};
