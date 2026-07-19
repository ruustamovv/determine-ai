import React from 'react';

export default function Logo({ size = 36, className = '' }) {
  const id = `logo-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Determine-AI"
    >
      <defs>
        <linearGradient
          id={id}
          x1="4"
          y1="2"
          x2="37"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      <path
        d="M4 8L19 2L37 20L19 38L4 32Z"
        fill={`url(#${id})`}
      />

      <path d="M4 8L17 20L19 2Z" fill="white" fillOpacity="0.14" />
      <path d="M19 2L17 20L37 20Z" fill="white" fillOpacity="0.07" />
      <path d="M37 20L17 20L19 38Z" fill="black" fillOpacity="0.07" />
      <path d="M19 38L17 20L4 32Z" fill="black" fillOpacity="0.14" />
      <path d="M4 32L17 20L4 8Z" fill="black" fillOpacity="0.22" />

      <path
        d="M4 8L19 2L37 20L19 38L4 32Z"
        stroke="white"
        strokeOpacity="0.18"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <path
        d="M4 8L17 20M19 2L17 20M37 20L17 20M19 38L17 20M4 32L17 20"
        stroke="white"
        strokeOpacity="0.14"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
