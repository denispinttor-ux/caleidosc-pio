import {motion, useReducedMotion} from 'motion/react';

export function KaleidoscopeBackdrop() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Subtle architectural dot-matrix grid */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(38, 50, 138, 0.16) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Luminous kaleidoscope atmospheric halos */}
      <div
        className="absolute -top-44 -left-36 h-[560px] w-[560px] rounded-full opacity-35 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(46,165,219,0.42) 0%, rgba(38,50,138,0.14) 55%, transparent 100%)',
        }}
      />
      <div
        className="absolute top-1/4 right-[-120px] h-[500px] w-[500px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(184,29,98,0.34) 0%, rgba(245,147,30,0.16) 55%, transparent 100%)',
        }}
      />

      {/* Primary rotating geometric kaleidoscope rosette */}
      <motion.svg
        viewBox="0 0 600 600"
        className="absolute -top-28 right-[-110px] h-[580px] w-[580px] opacity-[0.16]"
        animate={shouldReduceMotion ? undefined : {rotate: 360}}
        transition={
          shouldReduceMotion
            ? undefined
            : {duration: 68, repeat: Infinity, ease: 'linear'}
        }
      >
        <g transform="translate(300,300)">
          {Array.from({length: 12}).map((_, i) => {
            const angle = i * 30;
            const colors = [
              '#26328A',
              '#2EA5DB',
              '#B81D62',
              '#F5931E',
              '#7BB62D',
              '#2EA5DB',
            ];
            const fill = colors[i % colors.length];
            return (
              <g key={i} transform={`rotate(${angle})`}>
                <polygon
                  points="0,-24 36,-142 0,-236 -36,-142"
                  fill={fill}
                  fillOpacity="0.42"
                />
                <polygon
                  points="0,-86 20,-176 0,-220 -20,-176"
                  fill="none"
                  stroke={fill}
                  strokeWidth="1.25"
                  strokeOpacity="0.75"
                />
                <line
                  x1="0"
                  y1="-24"
                  x2="0"
                  y2="-260"
                  stroke={fill}
                  strokeWidth="0.75"
                  strokeOpacity="0.4"
                />
              </g>
            );
          })}
          <circle
            r="68"
            fill="none"
            stroke="#26328A"
            strokeWidth="1.25"
            strokeOpacity="0.55"
          />
          <circle
            r="148"
            fill="none"
            stroke="#2EA5DB"
            strokeWidth="1"
            strokeDasharray="6 6"
            strokeOpacity="0.55"
          />
          <circle
            r="242"
            fill="none"
            stroke="#B81D62"
            strokeWidth="0.8"
            strokeOpacity="0.35"
          />
        </g>
      </motion.svg>

      {/* Secondary counter-rotating kaleidoscope prism */}
      <motion.svg
        viewBox="0 0 400 400"
        className="hidden lg:block absolute bottom-[-90px] left-[-90px] h-[380px] w-[380px] opacity-[0.12]"
        animate={shouldReduceMotion ? undefined : {rotate: -360}}
        transition={
          shouldReduceMotion
            ? undefined
            : {duration: 84, repeat: Infinity, ease: 'linear'}
        }
      >
        <g transform="translate(200,200)">
          {Array.from({length: 8}).map((_, i) => {
            const angle = i * 45;
            const colors = ['#2EA5DB', '#B81D62', '#F5931E', '#7BB62D'];
            const fill = colors[i % colors.length];
            return (
              <g key={i} transform={`rotate(${angle})`}>
                <polygon
                  points="0,-18 28,-96 0,-168 -28,-96"
                  fill={fill}
                  fillOpacity="0.42"
                />
              </g>
            );
          })}
        </g>
      </motion.svg>
    </div>
  );
}
