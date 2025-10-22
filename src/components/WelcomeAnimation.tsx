"use client";

import { useEffect, useState } from 'react';

interface WelcomeAnimationProps {
  title: string;
  description: string;
}

export function WelcomeAnimation({ title, description }: WelcomeAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay to trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative flex flex-col items-center justify-center p-8 py-16 overflow-hidden transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 opacity-70 rounded-3xl" />

      {/* Floating love-themed emojis and musical notes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <div className="floating-icon icon-1">💕</div>
        <div className="floating-icon icon-2">♪</div>
        <div className="floating-icon icon-3">✨</div>
        <div className="floating-icon icon-4">♫</div>
        <div className="floating-icon icon-5">💝</div>
        <div className="floating-icon icon-6">🎼</div>
        <div className="floating-icon icon-7">❤️</div>
        <div className="floating-icon icon-8">♬</div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full text-center">
        {/* Main animated icon */}
        <div className="relative">
          <div className="text-7xl animate-bounce-slow">🎵</div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 blur-2xl bg-pink-400/30 animate-pulse" />
        </div>

        {/* Title with gradient */}
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
          {title}
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-base md:text-lg leading-relaxed">
          {description}
        </p>

        {/* Decorative musical staff lines */}
        <div className="w-full max-w-xs space-y-2 mt-4 opacity-20">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
          <div className="h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
          <div className="h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
          <div className="h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
          <div className="h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        .floating-icon {
          position: absolute;
          font-size: 1.5rem;
          opacity: 0;
          animation: float-up 12s infinite ease-in-out;
        }

        .icon-1 {
          left: 5%;
          animation-delay: 0s;
        }
        .icon-2 {
          left: 15%;
          animation-delay: 1.5s;
        }
        .icon-3 {
          left: 30%;
          animation-delay: 3s;
        }
        .icon-4 {
          left: 45%;
          animation-delay: 4.5s;
        }
        .icon-5 {
          left: 60%;
          animation-delay: 6s;
        }
        .icon-6 {
          left: 75%;
          animation-delay: 7.5s;
        }
        .icon-7 {
          left: 85%;
          animation-delay: 9s;
        }
        .icon-8 {
          left: 92%;
          animation-delay: 10.5s;
        }

        @keyframes float-up {
          0% {
            bottom: -10%;
            opacity: 0;
            transform: translateX(0) rotate(0deg) scale(0.8);
          }
          10% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            bottom: 110%;
            opacity: 0;
            transform: translateX(30px) rotate(20deg) scale(1.2);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-size: 200% 200%;
            background-position: 0% 50%;
          }
          50% {
            background-size: 200% 200%;
            background-position: 100% 50%;
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
      `}</style>
    </div>
  );
}
