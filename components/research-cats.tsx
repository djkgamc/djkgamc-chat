"use client";

import React from "react";

const catPositions = [
  { top: "10%", left: "5%", delay: "0s", size: 32 },
  { top: "15%", right: "8%", delay: "0.3s", size: 28 },
  { top: "30%", left: "12%", delay: "0.6s", size: 36 },
  { top: "25%", right: "15%", delay: "0.2s", size: 30 },
  { top: "45%", left: "3%", delay: "0.8s", size: 34 },
  { top: "50%", right: "5%", delay: "0.4s", size: 32 },
  { top: "65%", left: "8%", delay: "0.1s", size: 28 },
  { top: "60%", right: "10%", delay: "0.7s", size: 36 },
];

const ResearchCat: React.FC<{
  style: React.CSSProperties;
  delay: string;
  size: number;
}> = ({ style, delay, size }) => {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        ...style,
        animation: `catBob 1.5s ease-in-out infinite, catLook 3s ease-in-out infinite`,
        animationDelay: delay,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 20L8 8L20 16L44 16L56 8L52 20L52 44C52 52 44 56 32 56C20 56 12 52 12 44L12 20Z"
          fill="#1a1a1a"
        />
        <ellipse cx="22" cy="32" rx="4" ry="5" fill="#2a2a2a" />
        <ellipse cx="42" cy="32" rx="4" ry="5" fill="#2a2a2a" />
        <circle cx="22" cy="32" r="2" fill="#FFD700">
          <animate
            attributeName="cx"
            values="21;23;21"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="42" cy="32" r="2" fill="#FFD700">
          <animate
            attributeName="cx"
            values="41;43;41"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <ellipse cx="32" cy="42" rx="3" ry="2" fill="#ff6b9d" />
        <path
          d="M26 46 Q32 50 38 46"
          stroke="#2a2a2a"
          strokeWidth="1.5"
          fill="none"
        />
        <line x1="10" y1="38" x2="2" y2="36" stroke="#333" strokeWidth="1" />
        <line x1="10" y1="42" x2="2" y2="44" stroke="#333" strokeWidth="1" />
        <line x1="54" y1="38" x2="62" y2="36" stroke="#333" strokeWidth="1" />
        <line x1="54" y1="42" x2="62" y2="44" stroke="#333" strokeWidth="1" />
        <ellipse cx="32" cy="58" rx="8" ry="3" fill="#1a1a1a" opacity="0.3" />
        <circle cx="18" cy="24" r="2" fill="#8b5cf6" opacity="0.8">
          <animate
            attributeName="opacity"
            values="0.8;0.3;0.8"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="46" cy="24" r="2" fill="#8b5cf6" opacity="0.8">
          <animate
            attributeName="opacity"
            values="0.3;0.8;0.3"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-purple-600 font-medium whitespace-nowrap opacity-80"
        style={{
          animation: `fadeInOut 2s ease-in-out infinite`,
          animationDelay: delay,
        }}
      >
        researching...
      </div>
    </div>
  );
};

const ResearchCats: React.FC = () => {
  return (
    <>
      <style jsx global>{`
        @keyframes catBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes catLook {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {catPositions.map((pos, index) => (
          <ResearchCat
            key={index}
            style={{
              top: pos.top,
              left: pos.left,
              right: pos.right,
            }}
            delay={pos.delay}
            size={pos.size}
          />
        ))}
      </div>
    </>
  );
};

export default ResearchCats;
