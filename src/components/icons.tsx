import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
            <path id="circle-text-path" d="M 20,100 a 80,80 0 1,1 160,0 a 80,80 0 1,1 -160,0" />
        </defs>
        
        {/* Outer dark circular ring */}
        <circle cx="100" cy="100" r="98" fill="#2C3A47" />
        
        {/* Curved Text */}
        <text style={{ fontSize: '16px', fontFamily: 'var(--font-headline), sans-serif', fill: '#f39c12', fontWeight: 'bold', letterSpacing: '1.5px' }}>
            <textPath xlinkHref="#circle-text-path" startOffset="0%">
                KUNTALA VIDEOGRAPHY
            </textPath>
            <textPath xlinkHref="#circle-text-path" startOffset="50%">
                KUNTALA VIDEOGRAPHY
            </textPath>
        </text>
        
        {/* Center circle for graphics */}
        <circle cx="100" cy="100" r="68" fill="#2C3A47" />
        
        {/* Central Graphics */}
        <g transform="translate(0, 5)">
            {/* Teal mountain shape */}
            <path d="M 80 90 L 100 65 L 120 90 Z" fill="#1abc9c" />

            {/* Decorative teal infinity line */}
            <path 
                d="M 60 105 C 40 105, 40 125, 60 125 C 80 125, 120 95, 140 95 C 160 95, 160 115, 140 115 C 120 115, 80 145, 60 145" 
                stroke="#1abc9c" 
                strokeWidth="5" 
                fill="none" 
                strokeLinecap="round"
                transform="translate(0, -15)"
            />
            
            {/* Gold ribbon */}
            <g transform="translate(0, 15)">
              <path d="M 70,120 C 85,130, 115,130, 130,120 L 120,135 L 80,135 Z" fill="#f1c40f" />
              <text x="100" y="129" textAnchor="middle" fill="#c0392b" style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'sans-serif'}}>
                  Media launcher
              </text>
            </g>
        </g>
      </svg>
    </div>
  );
}
