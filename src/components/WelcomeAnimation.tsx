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
    <div className={`relative flex flex-col items-center justify-center p-8 py-20 md:py-24 overflow-hidden transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Enhanced gradient background overlay */}
      <div 
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `radial-gradient(circle at 20% 30%, rgba(32, 178, 170, 0.12) 0%, transparent 50%),
                       radial-gradient(circle at 80% 70%, rgba(74, 222, 128, 0.10) 0%, transparent 50%),
                       linear-gradient(135deg, rgba(32, 178, 170, 0.04) 0%, rgba(74, 222, 128, 0.06) 100%)`,
        }}
      />

      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5 rounded-3xl"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2320b2aa' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

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
      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8 max-w-md w-full text-center animate-slide-up">
        {/* Main animated icon with enhanced effects */}
        <div className="relative mb-2">
          <div className="text-7xl md:text-8xl animate-bounce-slow filter drop-shadow-lg">🎵</div>
          {/* Enhanced glow effect */}
          <div 
            className="absolute inset-0 blur-3xl animate-pulse-slow"
            style={{
              background: 'radial-gradient(circle, rgba(32, 178, 170, 0.3) 0%, rgba(74, 222, 128, 0.2) 50%, transparent 70%)',
            }}
          />
          {/* Subtle ring */}
          <div 
            className="absolute inset-0 rounded-full border-2 opacity-20 animate-pulse-slow"
            style={{
              borderColor: 'var(--color-secondary)',
              transform: 'scale(1.2)',
            }}
          />
        </div>

        {/* Title with gradient using design system colors */}
        <h2 
          className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent animate-gradient"
          style={{
            backgroundImage: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 50%, var(--color-secondary) 100%)',
            backgroundSize: '200% 200%',
          }}
        >
          {title}
        </h2>

        {/* Description with better typography */}
        <p className="text-gray-700 text-base md:text-lg leading-relaxed max-w-sm font-medium" style={{ color: 'var(--color-ink)' }}>
          {description}
        </p>

        {/* Call-to-action hint */}
        <div className="mt-2 flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
          <span>Begin hieronder te typen</span>
          <span className="animate-bounce">👇</span>
        </div>

        {/* Enhanced decorative musical staff lines */}
        <div className="w-full max-w-xs space-y-2.5 mt-6 opacity-30">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent" />
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent" />
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent" />
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent" />
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent" />
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        .floating-icon {
          position: absolute;
          font-size: 1.75rem;
          opacity: 0;
          animation: float-up 14s infinite ease-in-out;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .icon-1 {
          left: 5%;
          animation-delay: 0s;
        }
        .icon-2 {
          left: 15%;
          animation-delay: 1.75s;
        }
        .icon-3 {
          left: 30%;
          animation-delay: 3.5s;
        }
        .icon-4 {
          left: 45%;
          animation-delay: 5.25s;
        }
        .icon-5 {
          left: 60%;
          animation-delay: 7s;
        }
        .icon-6 {
          left: 75%;
          animation-delay: 8.75s;
        }
        .icon-7 {
          left: 85%;
          animation-delay: 10.5s;
        }
        .icon-8 {
          left: 92%;
          animation-delay: 12.25s;
        }

        @keyframes float-up {
          0% {
            bottom: -10%;
            opacity: 0;
            transform: translateX(0) rotate(0deg) scale(0.8);
          }
          10% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            bottom: 110%;
            opacity: 0;
            transform: translateX(30px) rotate(20deg) scale(1.2);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 3.5s ease-in-out infinite;
        }

        .animate-gradient {
          animation: gradient 8s ease infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
