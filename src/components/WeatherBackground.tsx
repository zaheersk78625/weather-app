import React, { useMemo } from 'react';

interface WeatherBackgroundProps {
  bgType: string;
  isDay: boolean;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ bgType, isDay }) => {
  // Generate random particles
  const raindrops = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: `${(i * 2.8 + Math.random() * 2) % 100}%`,
      delay: `${(Math.random() * 1.5).toFixed(2)}s`,
      duration: `${(0.6 + Math.random() * 0.4).toFixed(2)}s`,
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }, []);

  const snowflakes = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${3 + Math.random() * 3}s`,
      size: `${3 + Math.random() * 5}px`,
      opacity: 0.4 + Math.random() * 0.5,
    }));
  }, []);

  const stars = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 80}%`,
      left: `${Math.random() * 100}%`,
      size: `${1 + Math.random() * 2.5}px`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-colors duration-1000">
      {/* Base Gradient Canvas */}
      {isDay ? (
        bgType === 'sunny' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-sky-600/30 via-slate-950/80 to-slate-950">
            {/* Sun Glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-sky-400/10 blur-3xl" />
          </div>
        ) : bgType === 'rain' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950/60 to-slate-950">
            <div className="absolute top-0 inset-x-0 h-96 bg-blue-500/10 blur-3xl" />
          </div>
        ) : bgType === 'thunderstorm' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/80 via-slate-950 to-slate-950">
            <div className="absolute top-0 inset-x-0 h-80 bg-purple-600/15 blur-3xl" />
          </div>
        ) : bgType === 'snow' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/50 via-slate-950/90 to-slate-950">
            <div className="absolute top-0 inset-x-0 h-80 bg-cyan-400/10 blur-3xl" />
          </div>
        ) : bgType === 'fog' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-slate-950 to-slate-950">
            <div className="absolute inset-0 bg-zinc-700/10 backdrop-blur-[2px]" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950">
            <div className="absolute top-0 inset-x-0 h-80 bg-sky-500/10 blur-3xl" />
          </div>
        )
      ) : (
        /* Night Canvas */
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-slate-950/95 to-slate-950">
          {/* Moon Glow */}
          <div className="absolute top-10 right-10 w-48 h-48 rounded-full bg-indigo-300/10 blur-2xl" />
          {/* Twinkling Stars */}
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-slate-100"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                animation: `twinkle ${star.duration} infinite ease-in-out ${star.delay}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Dynamic Rain Particle Stream */}
      {(bgType === 'rain' || bgType === 'thunderstorm') && (
        <div className="absolute inset-0">
          {raindrops.map((drop) => (
            <div
              key={drop.id}
              className="absolute w-[1.5px] bg-gradient-to-b from-transparent via-sky-300 to-sky-100/80 rounded-full"
              style={{
                left: drop.left,
                top: '-40px',
                height: '32px',
                opacity: drop.opacity,
                animation: `fall ${drop.duration} infinite linear ${drop.delay}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Dynamic Snow Particle Stream */}
      {bgType === 'snow' && (
        <div className="absolute inset-0">
          {snowflakes.map((flake) => (
            <div
              key={flake.id}
              className="absolute rounded-full bg-white blur-[0.5px]"
              style={{
                left: flake.left,
                top: '-20px',
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity,
                animation: `snowfall ${flake.duration} infinite linear ${flake.delay}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Dynamic Fog Drifting Sheets */}
      {bgType === 'fog' && (
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-slate-400/20 to-transparent animate-drift" />
        </div>
      )}
    </div>
  );
};
