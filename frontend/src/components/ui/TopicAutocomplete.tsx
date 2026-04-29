/**
 * Reusable topic autocomplete input with NEET topic suggestions.
 * Shows dropdown as user types, supports keyboard navigation.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search, X } from "lucide-react";

// ── Full NEET topic bank ──────────────────────────────────────────────────────

export const TOPIC_BANK: Record<string, string[]> = {
  Physics: [
    "Kinematics", "Newton's Laws of Motion", "Work Energy Power",
    "Laws of Motion", "Circular Motion", "Gravitation",
    "Properties of Solids", "Thermodynamics", "Kinetic Theory of Gases",
    "Oscillations", "Waves", "Electrostatics",
    "Electric Field", "Electric Potential", "Capacitance",
    "Current Electricity", "Magnetic Effects of Current", "Magnetism",
    "Electromagnetic Induction", "Alternating Current",
    "Electromagnetic Waves", "Ray Optics", "Wave Optics",
    "Dual Nature of Matter", "Atoms and Nuclei",
    "Electronic Devices", "Communication Systems",
    "Projectile Motion", "Rotational Motion",
    "Simple Harmonic Motion", "Fluid Mechanics",
    "Surface Tension", "Viscosity", "Thermal Expansion",
    "Heat Transfer", "Photoelectric Effect", "Nuclear Physics",
    "Semiconductors", "Logic Gates", "Coulomb's Law",
    "Ohm's Law", "Kirchhoff's Laws", "Lenz's Law",
    "Faraday's Law", "Snell's Law", "Total Internal Reflection",
    "Lens Formula", "Mirror Formula",
  ],
  Chemistry: [
    "Mole Concept", "Atomic Structure", "Chemical Bonding",
    "Periodic Table", "States of Matter", "Thermodynamics",
    "Chemical Equilibrium", "Ionic Equilibrium", "Redox Reactions",
    "Electrochemistry", "Chemical Kinetics", "Surface Chemistry",
    "Metallurgy", "Hydrogen", "s-Block Elements",
    "p-Block Elements", "d and f Block Elements",
    "Coordination Compounds", "Haloalkanes", "Haloarenes",
    "Alcohols Phenols Ethers", "Aldehydes Ketones",
    "Carboxylic Acids", "Amines", "Biomolecules",
    "Polymers", "Chemistry in Everyday Life",
    "GOC General Organic Chemistry", "Isomerism",
    "Reaction Mechanisms", "Hydrocarbons", "Aromatic Compounds",
    "Acid Base Reactions", "Oxidation Reduction",
    "Stoichiometry", "Limiting Reagent", "Concentration Terms",
    "Colligative Properties", "Raoult's Law",
    "Le Chatelier's Principle", "Nernst Equation",
    "Faraday's Laws of Electrolysis", "Hybridization",
    "VSEPR Theory", "Molecular Orbital Theory",
    "Hydrogen Bonding", "Van der Waals Forces",
  ],
  Biology: [
    "Cell Structure and Function", "Cell Division",
    "Biomolecules", "Photosynthesis", "Respiration in Plants",
    "Plant Growth and Development", "Mineral Nutrition",
    "Transport in Plants", "Reproduction in Plants",
    "Sexual Reproduction in Flowering Plants",
    "Human Reproduction", "Reproductive Health",
    "Genetics and Mendel's Laws", "Molecular Basis of Inheritance",
    "DNA Structure and Replication", "Transcription and Translation",
    "Gene Expression", "Mutations",
    "Human Health and Disease", "Microbes in Human Welfare",
    "Biotechnology Principles", "Biotechnology Applications",
    "Organisms and Populations", "Ecosystem",
    "Biodiversity and Conservation", "Environmental Issues",
    "Evolution", "Origin of Life",
    "Digestion and Absorption", "Breathing and Exchange of Gases",
    "Body Fluids and Circulation", "Excretory Products",
    "Locomotion and Movement", "Neural Control and Coordination",
    "Chemical Coordination", "Immune System",
    "Endocrine System", "Nervous System",
    "Skeletal System", "Muscular System",
    "Kidney and Nephron", "Heart and Blood Vessels",
    "Hormones", "Enzymes", "Vitamins and Minerals",
  ],
};

interface Props {
  value: string;
  subject: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
}

export function TopicAutocomplete({
  value,
  subject,
  placeholder = "Type to search topics…",
  onChange,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Compute suggestions synchronously on every render
  const allTopics = TOPIC_BANK[subject] ?? [];
  const q = value.trim().toLowerCase();
  const suggestions = q
    ? allTopics.filter((t) => t.toLowerCase().includes(q))
    : allTopics.slice(0, 10);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIdx(0);
  }, [q, subject]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  function pick(topic: string) {
    onSelect(topic);
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setOpen(true);
    setActiveIdx(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown") { setOpen(true); return; }
      return;
    }
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (suggestions[activeIdx]) pick(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Highlight matched text
  function highlight(text: string) {
    if (!q) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return <span>{text}</span>;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-extrabold text-byjus-300 underline underline-offset-2">
          {text.slice(idx, idx + q.length)}
        </span>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-ink-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-9 text-sm font-semibold text-ink-100 placeholder:text-ink-400 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-byjus-500/50"
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {value ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear"
            className="absolute right-3 text-ink-400 hover:text-ink-100 transition"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange("");
              setOpen(true);
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <ChevronDown
            className={`pointer-events-none absolute right-3 h-4 w-4 text-ink-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            key="ac-dropdown"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            // High z-index so it floats above everything
            className="absolute left-0 right-0 top-full z-[200] mt-1 overflow-hidden rounded-2xl border border-white/15 bg-ink-900/98 shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-500">
                {subject} Topics
              </span>
              <span className="text-[10px] text-ink-500">
                {suggestions.length} match{suggestions.length !== 1 ? "es" : ""}
              </span>
            </div>

            {/* Suggestions list */}
            <ul ref={listRef} className="max-h-52 overflow-y-auto py-1">
              {suggestions.map((topic, i) => (
                <li key={topic}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep input focused
                      pick(topic);
                    }}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition ${
                      i === activeIdx
                        ? "bg-byjus-600/40 text-white"
                        : "text-ink-200 hover:bg-white/10"
                    }`}
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                    <span className="truncate">{highlight(topic)}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Keyboard hint */}
            <div className="flex items-center gap-4 border-t border-white/10 px-3 py-1.5 text-[10px] text-ink-500">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>Esc close</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
