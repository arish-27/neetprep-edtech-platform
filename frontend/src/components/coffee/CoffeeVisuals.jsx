import React from "react";
import { motion } from "framer-motion";

/**
 * Hero Medical & Science Visual
 * Replaces the coffee cup with a glowing 3D Medical Caduceus, Stethoscope & Atom Emblem
 */
export function HeroMedicalVisual({ className = "w-64 h-64" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Subtle glowing ambient pulse */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(235,180,188,0.25) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Medical Emblem SVG */}
      <svg
        viewBox="0 0 280 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_16px_36px_rgba(30,15,10,0.45)]"
      >
        <defs>
          <radialGradient id="baseShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(30,15,10,0.4)" />
            <stop offset="100%" stopColor="rgba(30,15,10,0)" />
          </radialGradient>
          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#E8DDD2" />
            <stop offset="100%" stopColor="#C9B8A7" />
          </linearGradient>
          <linearGradient id="goldStaff" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="50%" stopColor="#FFB300" />
            <stop offset="100%" stopColor="#C67C00" />
          </linearGradient>
          <linearGradient id="silverTube" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#CFD8DC" />
            <stop offset="100%" stopColor="#78909C" />
          </linearGradient>
          <radialGradient id="crossRed" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#EF5350" />
            <stop offset="50%" stopColor="#D32F2F" />
            <stop offset="100%" stopColor="#B71C1C" />
          </radialGradient>
        </defs>

        {/* Shadow under pedestal */}
        <ellipse cx="140" cy="216" rx="95" ry="16" fill="url(#baseShadow)" />

        {/* Base Pedestal Dish */}
        <ellipse cx="140" cy="204" rx="88" ry="16" fill="url(#pedestalGrad)" />
        <ellipse cx="140" cy="202" rx="76" ry="12" fill="#D6C6B6" />
        <ellipse cx="140" cy="201" rx="70" ry="10" fill="#EFE5DB" />

        {/* Outer Atom Orbital Rings (Physics / Science) */}
        <ellipse
          cx="140"
          cy="120"
          rx="66"
          ry="24"
          transform="rotate(-30 140 120)"
          stroke="rgba(255, 230, 210, 0.45)"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />
        <ellipse
          cx="140"
          cy="120"
          rx="66"
          ry="24"
          transform="rotate(30 140 120)"
          stroke="rgba(255, 230, 210, 0.45)"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />

        {/* Orbiting Electrons */}
        <circle cx="85" cy="88" r="4.5" fill="#FFE082" />
        <circle cx="195" cy="152" r="4.5" fill="#FFE082" />
        <circle cx="85" cy="152" r="4" fill="#E8B4B8" />
        <circle cx="195" cy="88" r="4" fill="#E8B4B8" />

        {/* Stethoscope Tubing behind emblem */}
        <path
          d="M100 135 C90 170 120 195 140 195 C160 195 190 170 180 135"
          fill="none"
          stroke="url(#silverTube)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Stethoscope Chest Piece / Bell */}
        <ellipse cx="140" cy="195" rx="13" ry="7" fill="#ECEFF1" stroke="#90A4AE" strokeWidth="2" />
        <ellipse cx="140" cy="195" rx="7" ry="3.5" fill="#B0BEC5" />

        {/* Central Shield Crest */}
        <path
          d="M110 75 Q140 65 170 75 Q172 125 140 155 Q108 125 110 75 Z"
          fill="url(#pedestalGrad)"
          stroke="#E2D4C6"
          strokeWidth="1.5"
        />

        {/* Medical Red Cross */}
        <g transform="translate(140, 110)">
          <rect x="-6" y="-22" width="12" height="44" rx="3.5" fill="url(#crossRed)" />
          <rect x="-22" y="-6" width="44" height="12" rx="3.5" fill="url(#crossRed)" />
          {/* Subtle cross highlight */}
          <rect x="-4" y="-20" width="8" height="40" rx="2" fill="white" opacity="0.25" />
        </g>

        {/* Golden Caduceus Staff */}
        <path
          d="M140 40 L140 170"
          stroke="url(#goldStaff)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Staff Finial Top Sphere */}
        <circle cx="140" cy="38" r="8" fill="url(#goldStaff)" />
        <circle cx="138" cy="36" r="2.5" fill="#FFF8E1" opacity="0.8" />

        {/* Caduceus Wings */}
        <path
          d="M140 46 C120 35 105 45 112 55 C125 60 135 52 140 50 C145 52 155 60 168 55 C175 45 160 35 140 46 Z"
          fill="url(#goldStaff)"
        />

        {/* Entwined Serpents (Medicine Symbol) */}
        <path
          d="M128 75 Q140 68 152 75 Q158 92 140 102 Q122 112 128 130 Q140 142 152 130"
          fill="none"
          stroke="#FFE082"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * 3D Physics Visual
 * Replaces the cake slice with an Atom, Optics Prism & Electromagnetic Orbit
 */
export function PhysicsVisual({ className = "w-44 h-40" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(180,80,90,0.28)]"
      >
        <defs>
          <radialGradient id="physShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(80,30,40,0.3)" />
            <stop offset="100%" stopColor="rgba(80,30,40,0)" />
          </radialGradient>
          <radialGradient id="nucleusRuby" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FF8A80" />
            <stop offset="40%" stopColor="#E53935" />
            <stop offset="100%" stopColor="#880E4F" />
          </radialGradient>
          <linearGradient id="prismGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="50%" stopColor="rgba(255,235,238,0.7)" />
            <stop offset="100%" stopColor="rgba(239,154,154,0.5)" />
          </linearGradient>
          <linearGradient id="spectrumBeam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF1744" />
            <stop offset="33%" stopColor="#FFEA00" />
            <stop offset="66%" stopColor="#00E676" />
            <stop offset="100%" stopColor="#2979FF" />
          </linearGradient>
        </defs>

        {/* Soft shadow */}
        <ellipse cx="100" cy="148" rx="68" ry="14" fill="url(#physShadow)" />

        {/* Atomic Orbital Ellipses */}
        <ellipse
          cx="100"
          cy="78"
          rx="65"
          ry="24"
          transform="rotate(-25 100 78)"
          stroke="#C25964"
          strokeWidth="2.5"
          strokeDasharray="6 3"
        />
        <ellipse
          cx="100"
          cy="78"
          rx="65"
          ry="24"
          transform="rotate(25 100 78)"
          stroke="#D87A84"
          strokeWidth="2.5"
          strokeDasharray="6 3"
        />
        <ellipse
          cx="100"
          cy="78"
          rx="65"
          ry="20"
          stroke="#8A343E"
          strokeWidth="2"
        />

        {/* Orbiting Electrons */}
        <circle cx="48" cy="54" r="5" fill="#52272B" />
        <circle cx="48" cy="54" r="2" fill="#FFFFFF" />
        <circle cx="152" cy="102" r="5" fill="#52272B" />
        <circle cx="152" cy="102" r="2" fill="#FFFFFF" />
        <circle cx="146" cy="54" r="4.5" fill="#D32F2F" />
        <circle cx="54" cy="102" r="4.5" fill="#D32F2F" />

        {/* 3D Glass Optical Prism */}
        <polygon
          points="100,32 60,116 140,116"
          fill="url(#prismGlass)"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        {/* Prism Face divider */}
        <line x1="100" y1="32" x2="94" y2="116" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />

        {/* Incident White Ray into Prism */}
        <line x1="30" y1="74" x2="85" y2="82" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

        {/* Refracted Spectrum Beam from Prism */}
        <polygon
          points="105,82 170,68 172,96 108,86"
          fill="url(#spectrumBeam)"
          opacity="0.85"
        />

        {/* Central Atomic Nucleus Sphere */}
        <circle cx="100" cy="80" r="16" fill="url(#nucleusRuby)" />
        <circle cx="95" cy="75" r="4.5" fill="#FFFFFF" opacity="0.7" />
        {/* Orbiting particles within nucleus */}
        <circle cx="107" cy="84" r="4" fill="#B71C1C" />
        <circle cx="94" cy="86" r="3.5" fill="#FFCDD2" />
      </svg>
    </div>
  );
}

/**
 * 3D Chemistry Visual
 * Replaces the chocolate heart cube with an Erlenmeyer Flask & 3D Benzene Molecule
 */
export function ChemistryVisual({ className = "w-44 h-40" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(160,100,50,0.28)]"
      >
        <defs>
          <radialGradient id="chemShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(70,40,20,0.3)" />
            <stop offset="100%" stopColor="rgba(70,40,20,0)" />
          </radialGradient>
          <linearGradient id="amberLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFA726" />
            <stop offset="60%" stopColor="#F57C00" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
          <linearGradient id="flaskGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="50%" stopColor="rgba(255,243,224,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
          </linearGradient>
          <radialGradient id="atomGold" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="60%" stopColor="#FFB300" />
            <stop offset="100%" stopColor="#8D6E63" />
          </radialGradient>
        </defs>

        {/* Soft shadow */}
        <ellipse cx="98" cy="148" rx="66" ry="14" fill="url(#chemShadow)" />

        {/* Laboratory Erlenmeyer Flask */}
        {/* Flask Liquid */}
        <path
          d="M84 94 L62 136 C59 142 63 146 70 146 L126 146 C133 146 137 142 134 136 L112 94 Z"
          fill="url(#amberLiquid)"
        />
        {/* Liquid Surface Meniscus */}
        <ellipse cx="98" cy="94" rx="14" ry="4" fill="#FFB74D" />

        {/* Flask Glass Outline */}
        <path
          d="M90 40 L90 70 L58 136 C54 144 60 148 68 148 L128 148 C136 148 142 144 138 136 L106 70 L106 40 Z"
          fill="url(#flaskGlass)"
          stroke="#52321C"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Flask Lip */}
        <rect x="86" y="36" width="24" height="6" rx="2" fill="#FFFFFF" stroke="#52321C" strokeWidth="2.5" />

        {/* Glass Reflection Highlight */}
        <path
          d="M66 138 L92 78 L92 46"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Measurement gradation lines */}
        <line x1="84" y1="124" x2="94" y2="124" stroke="#FFE0B2" strokeWidth="1.8" />
        <line x1="86" y1="114" x2="98" y2="114" stroke="#FFE0B2" strokeWidth="1.8" />
        <line x1="88" y1="104" x2="96" y2="104" stroke="#FFE0B2" strokeWidth="1.8" />

        {/* Reaction Bubbles rising */}
        <circle cx="86" cy="130" r="3.5" fill="#FFE082" opacity="0.8" />
        <circle cx="106" cy="120" r="4.5" fill="#FFE082" opacity="0.8" />
        <circle cx="94" cy="108" r="3" fill="#FFE082" opacity="0.9" />
        <circle cx="98" cy="80" r="2.5" fill="#FFE082" />
        <circle cx="96" cy="58" r="3" fill="#FFE082" />

        {/* 3D Benzene Molecule Floating on Right */}
        <g transform="translate(130, 48)">
          {/* Hexagon bonds */}
          <polygon
            points="24,6 42,16 42,36 24,46 6,36 6,16"
            fill="none"
            stroke="#52321C"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Inner alternating double bonds */}
          <circle cx="24" cy="26" r="10" stroke="#E65100" strokeWidth="2" strokeDasharray="6 4" fill="none" />

          {/* Molecule vertex atoms */}
          <circle cx="24" cy="6" r="4.5" fill="url(#atomGold)" />
          <circle cx="42" cy="16" r="4.5" fill="url(#atomGold)" />
          <circle cx="42" cy="36" r="4.5" fill="url(#atomGold)" />
          <circle cx="24" cy="46" r="4.5" fill="url(#atomGold)" />
          <circle cx="6" cy="36" r="4.5" fill="url(#atomGold)" />
          <circle cx="6" cy="16" r="4.5" fill="url(#atomGold)" />
        </g>
      </svg>
    </div>
  );
}

/**
 * 3D Biology Visual
 * Replaces the lavender cake bar with a DNA Double Helix & Botanical Leaf
 */
export function BiologyVisual({ className = "w-44 h-40" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(130,80,140,0.28)]"
      >
        <defs>
          <radialGradient id="bioShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(60,30,70,0.3)" />
            <stop offset="100%" stopColor="rgba(60,30,70,0)" />
          </radialGradient>
          <linearGradient id="dnaStrandA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9C27B0" />
            <stop offset="50%" stopColor="#673AB7" />
            <stop offset="100%" stopColor="#3F51B5" />
          </linearGradient>
          <linearGradient id="leafGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#81C784" />
            <stop offset="50%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#2E7D32" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="102" cy="148" rx="66" ry="14" fill="url(#bioShadow)" />

        {/* Botanical Plant Leaf on the Left (Botany) */}
        <g transform="translate(36, 60)">
          <path
            d="M8 68 C8 30 35 10 52 0 C45 28 35 55 8 68 Z"
            fill="url(#leafGreen)"
            stroke="#2E7D32"
            strokeWidth="1.5"
          />
          {/* Leaf central vein */}
          <path d="M8 68 Q28 42 52 0" stroke="#A5D6A7" strokeWidth="2" fill="none" />
          {/* Side veins */}
          <line x1="20" y1="52" x2="32" y2="44" stroke="#A5D6A7" strokeWidth="1.2" />
          <line x1="28" y1="38" x2="42" y2="30" stroke="#A5D6A7" strokeWidth="1.2" />
          <line x1="36" y1="24" x2="48" y2="16" stroke="#A5D6A7" strokeWidth="1.2" />
        </g>

        {/* 3D DNA Double Helix Strand (Genetics / NCERT) */}
        {/* Base Pair Rungs */}
        <g strokeWidth="3" strokeLinecap="round">
          <line x1="90" y1="42" x2="126" y2="42" stroke="#E91E63" />
          <line x1="94" y1="58" x2="122" y2="58" stroke="#00BCD4" />
          <line x1="102" y1="74" x2="114" y2="74" stroke="#4CAF50" />
          <line x1="96" y1="90" x2="120" y2="90" stroke="#FF9800" />
          <line x1="90" y1="106" x2="126" y2="106" stroke="#9C27B0" />
          <line x1="94" y1="122" x2="122" y2="122" stroke="#E91E63" />
          <line x1="102" y1="138" x2="114" y2="138" stroke="#00BCD4" />
        </g>

        {/* DNA Helix Strand 1 (Sinusoidal wave) */}
        <path
          d="M88 32 Q130 52 108 74 Q84 96 128 116 Q132 136 88 148"
          fill="none"
          stroke="url(#dnaStrandA)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* DNA Helix Strand 2 (Opposite wave) */}
        <path
          d="M128 32 Q86 52 108 74 Q132 96 88 116 Q84 136 128 148"
          fill="none"
          stroke="#492C51"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Base Pair Connecting Spheres */}
        <circle cx="88" cy="32" r="5" fill="#E91E63" />
        <circle cx="128" cy="32" r="5" fill="#00BCD4" />
        <circle cx="108" cy="74" r="5.5" fill="#4CAF50" />
        <circle cx="88" cy="116" r="5" fill="#FF9800" />
        <circle cx="128" cy="116" r="5" fill="#9C27B0" />
        <circle cx="88" cy="148" r="4.5" fill="#E91E63" />
        <circle cx="128" cy="148" r="4.5" fill="#00BCD4" />

        {/* Human Heartbeat Pulse Line (ECG Physiology) */}
        <path
          d="M130 110 L142 110 L146 96 L152 126 L158 102 L162 110 L174 110"
          stroke="#D81B60"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/**
 * Study Lounge Visual
 * Replaces the latte art cup with an Open Medical Textbook & Stethoscope
 */
export function StudyLoungeVisual({ className = "w-48 h-44" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 220 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(70,40,30,0.25)]"
      >
        <defs>
          <radialGradient id="bookShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(50,25,15,0.3)" />
            <stop offset="100%" stopColor="rgba(50,25,15,0)" />
          </radialGradient>
          <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5A3423" />
            <stop offset="100%" stopColor="#3D2115" />
          </linearGradient>
          <linearGradient id="bookPages" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5EFE6" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="110" cy="155" rx="85" ry="16" fill="url(#bookShadow)" />

        {/* Hardcover Book Spine & Cover */}
        <path
          d="M25 136 C65 142 105 132 110 134 C115 132 155 142 195 136 L192 144 C155 150 115 140 110 142 C105 140 65 150 28 144 Z"
          fill="url(#bookCover)"
        />

        {/* Left Book Page Block */}
        <path
          d="M30 134 C65 140 105 130 110 132 L110 82 C105 80 65 90 30 84 Z"
          fill="url(#bookPages)"
          stroke="#E0D6C9"
          strokeWidth="1.2"
        />

        {/* Right Book Page Block */}
        <path
          d="M110 132 C115 130 155 140 190 134 L190 84 C155 90 115 80 110 82 Z"
          fill="url(#bookPages)"
          stroke="#E0D6C9"
          strokeWidth="1.2"
        />

        {/* Book Center Gutter line */}
        <line x1="110" y1="82" x2="110" y2="134" stroke="#C9B8A7" strokeWidth="2" />

        {/* Text line representations on left page */}
        <line x1="42" y1="96" x2="98" y2="96" stroke="#D7C9BB" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="42" y1="104" x2="95" y2="104" stroke="#D7C9BB" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="112" x2="92" y2="112" stroke="#D7C9BB" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="120" x2="80" y2="120" stroke="#D7C9BB" strokeWidth="2" strokeLinecap="round" />

        {/* Diagram & text on right page */}
        <rect x="122" y="94" width="24" height="20" rx="3" fill="#EAD6D8" />
        <line x1="152" y1="98" x2="178" y2="98" stroke="#D7C9BB" strokeWidth="2" strokeLinecap="round" />
        <line x1="152" y1="106" x2="175" y2="106" stroke="#D7C9BB" strokeWidth="2" strokeLinecap="round" />
        <line x1="122" y1="120" x2="178" y2="120" stroke="#D7C9BB" strokeWidth="2" strokeLinecap="round" />

        {/* Silk Bookmark Ribbon Hanging Down */}
        <path
          d="M110 82 Q112 110 118 148 L124 154 L128 146 Q118 110 110 82 Z"
          fill="#D32F2F"
        />

        {/* Stethoscope draped across book */}
        <path
          d="M48 110 C40 150 90 165 140 150 C170 142 180 120 170 95"
          fill="none"
          stroke="#455A64"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Stethoscope Disc */}
        <circle cx="170" cy="95" r="11" fill="#ECEFF1" stroke="#37474F" strokeWidth="2.5" />
        <circle cx="170" cy="95" r="5" fill="#78909C" />
      </svg>
    </div>
  );
}
