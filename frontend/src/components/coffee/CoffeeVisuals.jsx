import React from "react";
import { motion } from "framer-motion";

/**
 * Whipped Coffee Cup with Cream, Raspberry & Rising Steam
 * Exact match to the hero visual in the Coffee template.
 */
export function WhippedCoffeeCup({ className = "w-64 h-64" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Animated steam curls */}
      <motion.div
        className="absolute -top-6 flex gap-3 pointer-events-none z-10"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.3, 0.75, 0.3], y: [-2, -12, -2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M12 36C10 28 18 22 14 14C12 9 15 4 17 2"
            stroke="rgba(255,245,235,0.6)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M24 38C22 30 30 24 26 16C24 11 27 6 29 4"
            stroke="rgba(255,245,235,0.5)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* Main Cup & Saucer SVG */}
      <svg
        viewBox="0 0 280 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_16px_32px_rgba(40,20,10,0.35)]"
      >
        <defs>
          <radialGradient id="saucerShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(30,15,10,0.35)" />
            <stop offset="100%" stopColor="rgba(30,15,10,0)" />
          </radialGradient>
          <linearGradient id="saucerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#EDE6DE" />
            <stop offset="100%" stopColor="#D4C9BC" />
          </linearGradient>
          <linearGradient id="cupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#EFE8E1" />
            <stop offset="100%" stopColor="#D6CABE" />
          </linearGradient>
          <linearGradient id="cupInner" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5A3423" />
            <stop offset="100%" stopColor="#3D2115" />
          </linearGradient>
          <linearGradient id="creamGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="50%" stopColor="#F7ECCF" />
            <stop offset="100%" stopColor="#E3CCA3" />
          </linearGradient>
          <linearGradient id="creamGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EAD6B5" />
          </linearGradient>
          <radialGradient id="berryGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#C41E3A" />
            <stop offset="50%" stopColor="#8E0E25" />
            <stop offset="100%" stopColor="#4A0512" />
          </radialGradient>
        </defs>

        {/* Shadow under saucer */}
        <ellipse cx="140" cy="215" rx="100" ry="18" fill="url(#saucerShadow)" />

        {/* Saucer */}
        <ellipse cx="140" cy="205" rx="90" ry="18" fill="url(#saucerGrad)" />
        <ellipse cx="140" cy="204" rx="78" ry="13" fill="#DFD6C9" />
        <ellipse cx="140" cy="203" rx="72" ry="11" fill="#EDE4D8" />

        {/* Cup Handle */}
        <path
          d="M185 140 C215 140 220 180 185 185"
          fill="none"
          stroke="url(#cupGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M185 142 C210 142 215 178 185 183"
          fill="none"
          stroke="#E5DDD2"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Cup Body */}
        <path
          d="M95 125 L105 190 C107 198 173 198 175 190 L185 125 Z"
          fill="url(#cupGrad)"
        />

        {/* Cup Rim highlight */}
        <ellipse cx="140" cy="125" rx="45" ry="10" fill="url(#cupInner)" />

        {/* Whipped Cream Base Mound */}
        <path
          d="M100 126 C90 115 110 100 125 105 C135 90 155 92 165 105 C180 105 190 118 180 126 Z"
          fill="url(#creamGrad1)"
        />

        {/* Whipped Cream Swirl 1 */}
        <path
          d="M106 120 C108 105 128 98 140 102 C155 96 172 105 174 120 C165 124 150 115 140 116 C128 115 115 124 106 120 Z"
          fill="url(#creamGrad2)"
        />

        {/* Whipped Cream Swirl 2 (Middle) */}
        <path
          d="M115 108 C118 90 135 80 148 84 C160 82 170 94 165 108 C158 102 148 98 140 100 C130 98 122 104 115 108 Z"
          fill="url(#creamGrad1)"
        />

        {/* Whipped Cream Swirl 3 (Top Peak) */}
        <path
          d="M125 90 C128 72 142 60 148 65 C155 60 165 74 158 90 C152 84 144 80 140 82 C134 80 128 85 125 90 Z"
          fill="url(#creamGrad2)"
        />

        {/* Cream Peak curl */}
        <path
          d="M142 65 C146 52 143 45 140 42 C146 45 152 52 148 65 Z"
          fill="#FFFBF2"
        />

        {/* Raspberry on Top of Cream */}
        <g transform="translate(138, 38)">
          <ellipse cx="6" cy="10" rx="9" ry="11" fill="url(#berryGrad)" />
          {/* Raspberry seed nodules */}
          <circle cx="2" cy="5" r="2.2" fill="#D32F2F" />
          <circle cx="7" cy="4" r="2.2" fill="#E53935" />
          <circle cx="11" cy="6" r="2.2" fill="#C62828" />
          <circle cx="1" cy="9" r="2.3" fill="#D32F2F" />
          <circle cx="6" cy="8" r="2.5" fill="#EF5350" />
          <circle cx="11" cy="10" r="2.4" fill="#C62828" />
          <circle cx="2" cy="13" r="2.2" fill="#B71C1C" />
          <circle cx="6" cy="13" r="2.4" fill="#C62828" />
          <circle cx="10" cy="14" r="2.2" fill="#880E4F" />
          {/* Subtle highlight */}
          <circle cx="5" cy="6" r="1" fill="#FFFFFF" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Strawberry Layered Cake Slice (Physics Card)
 * Matching the left card 'Aatis' in the template.
 */
export function StrawberryCakeSlice({ className = "w-44 h-40" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(180,80,90,0.28)]"
      >
        <defs>
          <radialGradient id="cakeShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(80,30,40,0.3)" />
            <stop offset="100%" stopColor="rgba(80,30,40,0)" />
          </radialGradient>
          <linearGradient id="spongeDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4A2511" />
            <stop offset="100%" stopColor="#6B371D" />
          </linearGradient>
          <linearGradient id="spongeLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D99B61" />
            <stop offset="100%" stopColor="#E8B076" />
          </linearGradient>
          <linearGradient id="creamLayer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="100%" stopColor="#F5EFE0" />
          </linearGradient>
          <linearGradient id="topCream" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F7F1E6" />
          </linearGradient>
          <radialGradient id="berryRed" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#E53935" />
            <stop offset="60%" stopColor="#B71C1C" />
            <stop offset="100%" stopColor="#5B0813" />
          </radialGradient>
        </defs>

        {/* Soft shadow under cake */}
        <ellipse cx="98" cy="148" rx="72" ry="14" fill="url(#cakeShadow)" />

        {/* Cake Slice Base (Side Facing) */}
        {/* Layer 1: Bottom Biscuit Base */}
        <path d="M40 126 L145 126 L160 114 L55 114 Z" fill="url(#spongeLight)" />

        {/* Layer 2: Dark Chocolate Ganache Layer */}
        <path d="M40 114 L145 114 L145 106 L40 106 Z" fill="url(#spongeDark)" />

        {/* Layer 3: Vanilla Cream Layer */}
        <path d="M40 106 L145 106 L145 98 L40 98 Z" fill="url(#creamLayer)" />

        {/* Layer 4: Dark Cocoa Sponge Layer */}
        <path d="M40 98 L145 98 L145 90 L40 90 Z" fill="url(#spongeDark)" />

        {/* Layer 5: Thick Cream Top Layer */}
        <path d="M40 90 L145 90 L145 78 L40 78 Z" fill="url(#topCream)" />

        {/* Triangle Top Face */}
        <path d="M40 78 L145 78 L95 44 L40 78 Z" fill="url(#topCream)" stroke="#EAE0D2" strokeWidth="0.8" />

        {/* Back triangle side */}
        <path d="M145 78 L145 126 L160 114 L160 66 L145 78 Z" fill="#D49050" />

        {/* Whipped cream rosette on top */}
        <ellipse cx="90" cy="54" rx="15" ry="6" fill="#FFFFFF" />
        <ellipse cx="90" cy="51" rx="10" ry="4" fill="#FFF9ED" />

        {/* Fresh Raspberry on top of rosette */}
        <g transform="translate(80, 24)">
          <ellipse cx="10" cy="14" rx="9" ry="11" fill="url(#berryRed)" />
          {/* Seed nodules */}
          <circle cx="6" cy="8" r="2.2" fill="#EF5350" />
          <circle cx="11" cy="7" r="2.2" fill="#E53935" />
          <circle cx="15" cy="10" r="2.2" fill="#C62828" />
          <circle cx="5" cy="13" r="2.4" fill="#EF5350" />
          <circle cx="10" cy="12" r="2.6" fill="#F44336" />
          <circle cx="15" cy="14" r="2.2" fill="#B71C1C" />
          <circle cx="6" cy="17" r="2.2" fill="#C62828" />
          <circle cx="10" cy="18" r="2.4" fill="#B71C1C" />
          <circle cx="14" cy="19" r="2.0" fill="#7F0000" />
          {/* White glint */}
          <circle cx="9" cy="9" r="1.1" fill="#FFFFFF" opacity="0.75" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Chocolate Cube Cake with White Heart (Chemistry Card)
 * Matching the middle card 'Lermi' in the template.
 */
export function ChocolateHeartCake({ className = "w-44 h-40" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(160,100,50,0.28)]"
      >
        <defs>
          <radialGradient id="chocShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(70,40,20,0.3)" />
            <stop offset="100%" stopColor="rgba(70,40,20,0)" />
          </radialGradient>
          <linearGradient id="spongeBase" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2A662" />
            <stop offset="100%" stopColor="#C88440" />
          </linearGradient>
          <linearGradient id="spongeSide" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B37130" />
            <stop offset="100%" stopColor="#8C531F" />
          </linearGradient>
          <linearGradient id="chocTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#381D11" />
            <stop offset="50%" stopColor="#29140B" />
            <stop offset="100%" stopColor="#1B0C06" />
          </linearGradient>
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EADED6" />
          </linearGradient>
        </defs>

        {/* Soft shadow */}
        <ellipse cx="102" cy="146" rx="68" ry="14" fill="url(#chocShadow)" />

        {/* 3D Isometric Cube Cake */}
        {/* Front Left Sponge Face */}
        <path d="M52 98 L104 122 L104 140 L52 116 Z" fill="url(#spongeBase)" />

        {/* Front Right Sponge Face */}
        <path d="M104 122 L156 98 L156 116 L104 140 Z" fill="url(#spongeSide)" />

        {/* Front Left Chocolate Top Ganache Layer */}
        <path d="M52 82 L104 106 L104 98 L52 74 Z" fill="#241108" />

        {/* Front Right Chocolate Top Ganache Layer */}
        <path d="M104 106 L156 82 L156 74 L104 98 Z" fill="#180A04" />

        {/* Top Glazed Chocolate Surface */}
        <path d="M104 58 L156 82 L104 106 L52 82 Z" fill="url(#chocTop)" />

        {/* Glossy specular reflection line on top chocolate */}
        <path d="M58 82 L104 62 L112 66 L66 86 Z" fill="rgba(255,255,255,0.12)" />

        {/* White Confectionery Heart in the center of top chocolate */}
        <g transform="translate(90, 68)">
          <path
            d="M14 8 C14 3 8 0 4 3 C0 6 0 11 5 15 L14 23 L23 15 C28 11 28 6 24 3 C20 0 14 3 14 8 Z"
            fill="url(#heartGrad)"
            stroke="#DFD1C7"
            strokeWidth="0.8"
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          />
          {/* Soft inner glint */}
          <ellipse cx="10" cy="8" rx="2.5" ry="1.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Berry-Dusted Cake Bar with Lavender Sprigs (Biology Card)
 * Matching the right card 'Flitre' in the template.
 */
export function LavenderBerryCake({ className = "w-44 h-40" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(130,80,140,0.28)]"
      >
        <defs>
          <radialGradient id="lavShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(60,30,70,0.3)" />
            <stop offset="100%" stopColor="rgba(60,30,70,0)" />
          </radialGradient>
          <linearGradient id="goldenSponge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F7CA82" />
            <stop offset="100%" stopColor="#E2A657" />
          </linearGradient>
          <linearGradient id="spongeRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4883A" />
            <stop offset="100%" stopColor="#9C641E" />
          </linearGradient>
          <linearGradient id="chocDust" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3E2014" />
            <stop offset="100%" stopColor="#251109" />
          </linearGradient>
          <linearGradient id="berryCluster" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7E4733" />
            <stop offset="100%" stopColor="#4A2518" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="105" cy="148" rx="68" ry="14" fill="url(#lavShadow)" />

        {/* 3D Isometric Sponge Bar */}
        {/* Front Left Sponge Face */}
        <path d="M58 96 L112 122 L112 138 L58 112 Z" fill="url(#goldenSponge)" />

        {/* Front Right Sponge Face */}
        <path d="M112 122 L158 98 L158 114 L112 138 Z" fill="url(#spongeRight)" />

        {/* Crumbs & Texture dots on sponge face */}
        <circle cx="70" cy="104" r="1.2" fill="#B2762A" />
        <circle cx="86" cy="112" r="1" fill="#B2762A" />
        <circle cx="130" cy="110" r="1.1" fill="#7E4C12" />

        {/* Top Surface with Berry/Chocolate Dusting */}
        <path d="M112 60 L158 84 L112 108 L66 84 Z" fill="url(#chocDust)" />

        {/* Chocolate/Berry Crisp Pearls on Top */}
        <g transform="translate(100, 72)">
          <circle cx="0" cy="0" r="4.2" fill="url(#berryCluster)" />
          <circle cx="7" cy="-2" r="4.5" fill="url(#berryCluster)" />
          <circle cx="14" cy="1" r="3.8" fill="url(#berryCluster)" />
          <circle cx="4" cy="5" r="4.0" fill="url(#berryCluster)" />
          <circle cx="11" cy="6" r="4.4" fill="url(#berryCluster)" />
          <circle cx="18" cy="4" r="3.5" fill="url(#berryCluster)" />
          <circle cx="8" cy="11" r="3.8" fill="url(#berryCluster)" />
          {/* Crisp highlights */}
          <circle cx="1" cy="-1" r="1" fill="#D79E83" />
          <circle cx="8" cy="-3" r="1.1" fill="#D79E83" />
          <circle cx="12" cy="5" r="1" fill="#D79E83" />
        </g>

        {/* Lavender Sprigs resting alongside cake */}
        <g transform="translate(42, 110)">
          {/* Green stem */}
          <path
            d="M2 28 C12 24 24 16 38 12"
            stroke="#5B7E58"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Lavender purple florets */}
          <ellipse cx="14" cy="22" rx="3.5" ry="2" transform="rotate(-30 14 22)" fill="#8A65A8" />
          <ellipse cx="20" cy="18" rx="3.5" ry="2" transform="rotate(-40 20 18)" fill="#9C77BB" />
          <ellipse cx="26" cy="15" rx="3.8" ry="2.2" transform="rotate(-20 26 15)" fill="#7C569A" />
          <ellipse cx="32" cy="13" rx="3.2" ry="1.8" transform="rotate(-35 32 13)" fill="#AF8ECE" />
          <ellipse cx="38" cy="11" rx="2.5" ry="1.5" fill="#C5A8E2" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Bottom Section Heart Latte Art Cup & Saucer
 * Matching the 'MUn Coffee' visual in the template.
 */
export function LatteArtCup({ className = "w-48 h-48" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Steam */}
      <motion.div
        className="absolute -top-3 left-16 pointer-events-none"
        animate={{ opacity: [0.2, 0.6, 0.2], y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M8 22C6 16 12 12 10 6C9 3 11 1 12 0"
            stroke="rgba(120,80,60,0.4)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      <svg
        viewBox="0 0 220 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(70,40,30,0.25)]"
      >
        <defs>
          <radialGradient id="latteShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(50,25,15,0.3)" />
            <stop offset="100%" stopColor="rgba(50,25,15,0)" />
          </radialGradient>
          <linearGradient id="saucerPink" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F9DFE1" />
            <stop offset="50%" stopColor="#ECD0D3" />
            <stop offset="100%" stopColor="#D9B7BA" />
          </linearGradient>
          <linearGradient id="cupPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDFBF9" />
            <stop offset="60%" stopColor="#EAD8DA" />
            <stop offset="100%" stopColor="#D2BAC0" />
          </linearGradient>
          <linearGradient id="cremaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C98852" />
            <stop offset="40%" stopColor="#9C5A2A" />
            <stop offset="100%" stopColor="#6E3816" />
          </linearGradient>
          <radialGradient id="berrySmall" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#E53935" />
            <stop offset="70%" stopColor="#B71C1C" />
            <stop offset="100%" stopColor="#540710" />
          </radialGradient>
        </defs>

        {/* Saucer shadow */}
        <ellipse cx="110" cy="155" rx="85" ry="16" fill="url(#latteShadow)" />

        {/* Soft Pink Saucer */}
        <ellipse cx="110" cy="146" rx="80" ry="16" fill="url(#saucerPink)" />
        <ellipse cx="110" cy="145" rx="68" ry="12" fill="#E2C1C5" />
        <ellipse cx="110" cy="144" rx="62" ry="10" fill="#EED5D8" />

        {/* Small Teaspoon on Saucer */}
        <path
          d="M148 148 L178 126 C180 124 184 126 182 129 L154 153 Z"
          fill="#D6CFCA"
        />

        {/* Fresh Berry on Saucer */}
        <g transform="translate(48, 136)">
          <ellipse cx="7" cy="8" rx="7" ry="8" fill="url(#berrySmall)" />
          <circle cx="4" cy="5" r="1.8" fill="#EF5350" />
          <circle cx="8" cy="5" r="1.8" fill="#E53935" />
          <circle cx="5" cy="9" r="1.9" fill="#E53935" />
          <circle cx="8" cy="9" r="1.9" fill="#C62828" />
          <circle cx="6" cy="6" r="0.8" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* Cup Handle */}
        <path
          d="M145 95 C170 95 174 125 146 130"
          fill="none"
          stroke="url(#cupPink)"
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* Cup Body */}
        <path
          d="M72 82 L82 136 C84 142 138 142 140 136 L150 82 Z"
          fill="url(#cupPink)"
        />

        {/* Cup Rim & Crema */}
        <ellipse cx="111" cy="82" rx="39" ry="11" fill="url(#cremaGrad)" />
        <ellipse cx="111" cy="82" rx="38" ry="10" stroke="#FFF7ED" strokeWidth="0.8" />

        {/* Concentric Heart / Rosetta Latte Art in White Cream */}
        <g transform="translate(101, 74)">
          {/* Outer heart ring */}
          <path
            d="M10 4 C10 1 6 0 3 2 C0 4 0 7 4 10 L10 15 L16 10 C20 7 20 4 17 2 C14 0 10 1 10 4 Z"
            fill="none"
            stroke="#FFFDF9"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Inner heart ring */}
          <path
            d="M10 6 C10 4 7 3 5 5 C3 6 4 9 7 11 L10 13 L13 11 C16 9 17 6 15 5 C13 3 10 4 10 6 Z"
            fill="#FFFDF9"
          />
          {/* Stem flourish */}
          <path d="M10 1 C10 8 10 15 10 16" stroke="#FFFDF9" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
