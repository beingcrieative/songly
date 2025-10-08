"use client";

interface MusicGenerationProgressProps {
  stage: 1 | 2 | 3;
  estimatedTimeRemaining: number;
}

const STAGE_MESSAGES = {
  1: { icon: "🎵", text: "Melodie wordt gemaakt..." },
  2: { icon: "🎤", text: "Vocals worden toegevoegd..." },
  3: { icon: "✨", text: "Laatste details..." },
};

export function MusicGenerationProgress({
  stage,
  estimatedTimeRemaining,
}: MusicGenerationProgressProps) {
  const currentMessage = STAGE_MESSAGES[stage];

  return (
    <div className="relative flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 opacity-60" />

      {/* Floating musical notes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-note note-1">♪</div>
        <div className="floating-note note-2">♫</div>
        <div className="floating-note note-3">♬</div>
        <div className="floating-note note-4">♪</div>
        <div className="floating-note note-5">♫</div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full">
        {/* Stage indicator timeline */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((stageNum) => {
              const isCompleted = stageNum < stage;
              const isActive = stageNum === stage;
              const isInactive = stageNum > stage;

              return (
                <div key={stageNum} className="flex flex-col items-center flex-1">
                  {/* Node */}
                  <div
                    className={`
                      h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                      ${isCompleted ? "bg-green-500 text-white" : ""}
                      ${isActive ? "bg-purple-600 text-white scale-110" : ""}
                      ${isInactive ? "bg-gray-300 text-gray-500" : ""}
                    `}
                  >
                    {isCompleted ? "✓" : stageNum}
                  </div>

                  {/* Connecting line */}
                  {stageNum < 3 && (
                    <div className="absolute h-1 w-1/3 top-6" style={{ left: `${(stageNum - 1) * 33.33 + 16.67}%` }}>
                      <div
                        className={`
                          h-full transition-all duration-300
                          ${stageNum < stage ? "bg-green-500" : "bg-gray-300"}
                        `}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current stage message */}
        <div className="text-center">
          <div className="text-5xl mb-3 animate-pulse">{currentMessage.icon}</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {currentMessage.text}
          </h3>
          <p className="text-sm text-gray-600">
            Nog ongeveer {estimatedTimeRemaining} seconden...
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-linear"
            style={{ width: `${((stage - 1) * 33.33) + 33.33}%` }}
          />
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        .floating-note {
          position: absolute;
          font-size: 2rem;
          color: rgba(168, 85, 247, 0.4);
          animation: float-up 8s infinite ease-in-out;
        }

        .note-1 {
          left: 10%;
          animation-delay: 0s;
        }
        .note-2 {
          left: 30%;
          animation-delay: 2s;
        }
        .note-3 {
          left: 50%;
          animation-delay: 4s;
        }
        .note-4 {
          left: 70%;
          animation-delay: 1s;
        }
        .note-5 {
          left: 85%;
          animation-delay: 3s;
        }

        @keyframes float-up {
          0% {
            bottom: -10%;
            opacity: 0;
            transform: translateX(0) rotate(0deg);
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            bottom: 110%;
            opacity: 0;
            transform: translateX(20px) rotate(15deg);
          }
        }
      `}</style>
    </div>
  );
}
