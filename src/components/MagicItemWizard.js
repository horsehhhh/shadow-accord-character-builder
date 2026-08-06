import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import { powersData } from '../data/powersData';

const ST_PASSWORD = '1234!';

// Energy types (new 2026 rules add Vitality, Mists, Faith)
const ENERGY_TYPES = [
  'Vitae (Vampire)',
  'Gnosis (Shifter)',
  'Pathos (Wraith)',
  'Essence (Human / Sorcerer)',
  'Vitality',
  'Mists',
  'Faith',
];

const FACTION_CODE = {
  'Vitae (Vampire)':            'V',
  'Gnosis (Shifter)':           'S',
  'Pathos (Wraith)':            'W',
  'Essence (Human / Sorcerer)': 'H',
};

// Damage type table (new 2026 rules): weapon cost / armor cost / scorch cost (null = N/A)
const DAMAGE_TYPES = [
  { label: 'Agg',       weapon: 5, armor: null, scorch: null },
  { label: 'Fire',      weapon: 4, armor: 4,    scorch: -3  },
  { label: 'Blood',     weapon: 3, armor: 3,    scorch: -2  },
  { label: 'Dark',      weapon: 3, armor: 3,    scorch: -2  },
  { label: 'Light',     weapon: 3, armor: 3,    scorch: -2  },
  { label: 'Silver',    weapon: 3, armor: 3,    scorch: -2  },
  { label: 'Wolfsbane', weapon: 3, armor: 3,    scorch: -2  },
  { label: 'Gold',      weapon: 2, armor: 2,    scorch: -1  },
  { label: 'Holy',      weapon: 2, armor: 2,    scorch: -1  },
  { label: 'Iron',      weapon: 2, armor: 2,    scorch: -1  },
  { label: 'Other',     weapon: 1, armor: 1,    scorch:  0  },
];

const RESTRICTION_MSG = {
  'npc-only':                  'NPC-Only — cannot be placed on items.',
  'not-for-items':             'Not intended for items per rulebook.',
  'fundamental-or-merit-only': 'Fundamental / Merit-only — cannot be placed on items.',
};

// Flaws table (new 2026 rules)
const FLAWS = [
  { label: 'Augment reduced by 1',                              reduction: 3 },
  { label: 'Regeneration Rate reduced by 1 (min 0)',            reduction: 3 },
  { label: 'Maximum Health reduced by X',                       reduction: null, hasX: true },
  { label: 'Cannot speak (per Silence)',                        reduction: 3 },
  { label: 'Cannot lie',                                        reduction: 3 },
  { label: 'Cannot run',                                        reduction: 5 },
  { label: 'All powers cost double',                            reduction: 5 },
  { label: 'All Ritual costs are doubled',                      reduction: 3 },
  { label: 'Cannot cast rituals',                               reduction: 5 },
  { label: 'Cannot Frenzy',                                     reduction: null, hasVG: true, energyNote: 'Vitae=2, Gnosis=4' },
  { label: 'All damage is considered Agg',                      reduction: 5 },
  { label: 'Sunsickness',                                       reduction: 1, energyNote: 'Any non-Vitae' },
  { label: 'Demonic Vice <Vice>',                               reduction: 3 },
  { label: 'Cannot spend Virtue as Willpower while Tainted',    reduction: 1 },
  { label: 'Affected by a Fae Echo (ST decides)',               reduction: null, stRange: '1-5' },
  { label: 'Item may only be carried in hand',                  reduction: 4 },
  { label: 'Shadow in Control while touching (not Catharsis)',  reduction: 3, energyNote: 'Pathos + Shadow' },
  { label: 'Immediately enter Catharsis; cannot end voluntarily', reduction: 5, energyNote: 'Pathos + Shadow' },
  { label: 'Call no effect to Disquiet',                        reduction: 3, energyNote: 'Pathos + Shadow' },
  { label: 'Cannot harvest chosen Passion while attuned',       reduction: 3, energyNote: 'Pathos + Harvesting' },
  { label: 'Gain clan curse of [Clan]',                         reduction: 1, energyNote: 'Vitae + Vampire' },
  { label: 'Amaranth Count reads as X higher',                  reduction: 1, energyNote: 'Vitae + Vampire' },
  { label: 'Cannot consume more than 3 Vitae in a Draining',   reduction: 3, energyNote: 'Vitae + Vampire' },
  { label: 'Always in Homid Form',                              reduction: 1, energyNote: 'Gnosis + Shifter' },
  { label: 'Always in Crinos',                                  reduction: 4, energyNote: 'Gnosis + Shifter' },
  { label: 'Cannot Step Sideways',                              reduction: 2, energyNote: 'Gnosis + Step Sideways' },
  { label: 'Must adhere to a spirit Ban',                       reduction: null, stRange: '1-5', energyNote: 'Gnosis or Essence' },
  { label: 'Derangement',                                       reduction: 3 },
  { label: 'Using any power causes 1 damage',                   reduction: 3, energyNote: 'Essence only' },
  { label: 'Cannot resist <Specific Power>',                    reduction: 1 },
  { label: 'Cannot flee from an attacker',                      reduction: 2 },
  { label: 'Limited Attunement to specific energy type(s)',     reduction: 0 },
  { label: 'Cannot resist (choose: damage/Statuses/Mentals)',   reduction: 3 },
];

const KLAIVE_PASSIVES = [
  { key: 'none',  label: 'None',      cost: 0 },
  { key: 'dmg_1', label: '+1 Damage', cost: 4 },
  { key: 'dmg_2', label: '+2 Damage', cost: 6 },
];

function getPowerRestriction(power) {
  if (!power) return null;
  if (/NPC Only/i.test(power.description))               return 'npc-only';
  if (/Not intended for items/i.test(power.description)) return 'not-for-items';
  const tokens = power.sources.split(' ');
  if (tokens.every(t => t === 'M' || /^[A-Z][A-Z]?f\d*$/.test(t))) return 'fundamental-or-merit-only';
  return null;
}

function detectModifiers(power, energyType) {
  if (!power) return { level: null, notAvailable: true, rare: false, corrupted: false };
  const factionCode = FACTION_CODE[energyType];
  const tokens = power.sources.split(' ').filter(Boolean);
  let factionLevel = null;
  let lowestLevel = Infinity;
  let rare = false;
  let corrupted = false;
  for (const t of tokens) {
    if (t === 'K' || t === 'M') continue;
    if (t === 'Wt') { corrupted = true; continue; }
    const m = t.match(/^([A-Z][A-Z]?)([rcf]?)(\d*)$/);
    if (!m) continue;
    const [, code, mod, lvlStr] = m;
    const lvl = lvlStr ? parseInt(lvlStr, 10) : null;
    if (factionCode && code === factionCode) {
      if (mod === 'r') rare = true;
      if (mod === 'c') corrupted = true;
      if (lvl !== null && (factionLevel === null || lvl < factionLevel)) factionLevel = lvl;
    }
    if (lvl !== null && mod !== 'f' && lvl < lowestLevel) lowestLevel = lvl;
  }
  const notAvailable = factionCode ? !tokens.some(t => t.startsWith(factionCode)) : true;
  const level = factionLevel ?? (lowestLevel === Infinity ? null : lowestLevel);
  return { level, notAvailable, rare, corrupted };
}

function PowerSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return powersData.filter(p => p.searchableText.includes(q)).slice(0, 30);
  }, [query]);
  return (
    <div ref={ref} className="relative">
      <input
        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
        placeholder="Search powers…"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (results.length > 0 || !query.trim()) && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded max-h-60 overflow-y-auto shadow-xl">
          <button className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 italic" onClick={() => { onSelect(null); setQuery(''); setOpen(false); }}>— No Power —</button>
          {results.map(p => {
            const restriction = getPowerRestriction(p);
            return (
              <button key={p.name}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${restriction ? 'text-red-400' : 'text-white'}`}
                onClick={() => { onSelect(p); setQuery(p.name); setOpen(false); }}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-400 ml-2 text-xs">{p.sources}</span>
                {restriction && <span className="ml-2 text-xs">⛔ {RESTRICTION_MSG[restriction]}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function blankSlot() {
  return { power: null, restriction: null, level: null, notAvailable: false, rare: false, corrupted: false };
}

function getPassiveOptions(itemType) {
  switch (itemType) {
    case 'weapon': return [
      { key: 'none',  label: 'None',     cost: 0 },
      { key: 'dmg_1', label: '+1 Damage', cost: 4 },
      { key: 'dmg_2', label: '+2 Damage', cost: 6 },
    ];
    case 'armor': return [
      { key: 'none',  label: 'None',            cost: 0 },
      { key: 'arm_1', label: '+1 Armor Points', cost: 1 },
      { key: 'arm_2', label: '+2 Armor Points', cost: 2 },
      { key: 'arm_3', label: '+3 Armor Points', cost: 3 },
      { key: 'arm_4', label: '+4 Armor Points', cost: 4 },
    ];
    case 'accessory': return [
      { key: 'none', label: 'None',              cost: 0 },
      { key: 'hp_1', label: '+1 Maximum Health', cost: 1 },
      { key: 'hp_2', label: '+2 Maximum Health', cost: 2 },
    ];
    default: return [{ key: 'none', label: 'None', cost: 0 }];
  }
}

const isTrustedUser = () => {
  if (sessionStorage.getItem('stSessionUnlocked') === 'true') return true;
  try {
    const stEmail = localStorage.getItem('stEmail');
    if (!stEmail) return false;
    return JSON.parse(localStorage.getItem('user'))?.email === stEmail;
  } catch { return false; }
};

export default function MagicItemWizard({ onBack }) {
  const [unlocked, setUnlocked] = useState(isTrustedUser);
  const [pwInput, setPwInput]   = useState('');
  const [pwError, setPwError]   = useState('');
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-8 w-full max-w-sm shadow-2xl border border-gray-700">
          <div className="flex flex-col items-center mb-6 gap-3">
            <Lock className="text-amber-400" size={40} />
            <h2 className="text-xl font-bold">ST Magic Item Wizard</h2>
            <p className="text-gray-400 text-sm text-center">Restricted to Storytellers — 2026 Draft Rules</p>
          </div>
          <input type="password" autoFocus
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none mb-3"
            placeholder="Password" value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { if (pwInput === ST_PASSWORD) { sessionStorage.setItem('stSessionUnlocked', 'true'); setUnlocked(true); } else { setPwError('Incorrect password.'); setPwInput(''); } }
              if (e.key === 'Escape') onBack();
            }}
          />
          {pwError && <p className="text-red-400 text-sm mb-3">{pwError}</p>}
          <div className="flex gap-2">
            <button className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded font-semibold"
              onClick={() => { if (pwInput === ST_PASSWORD) { sessionStorage.setItem('stSessionUnlocked', 'true'); setUnlocked(true); } else { setPwError('Incorrect password.'); setPwInput(''); } }}>Unlock</button>
            <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded" onClick={onBack}>Back</button>
          </div>
        </div>
      </div>
    );
  }
  return <ItemBuilder onBack={onBack} />;
}

function ItemBuilder({ onBack }) {
  const [itemName, setItemName]       = useState('');
  const [itemType, setItemType]       = useState('weapon');
  const [energyType, setEnergyType]   = useState('Vitae (Vampire)');
  const [isTainted, setIsTainted]     = useState(false);
  const [slot1, setSlot1]             = useState(blankSlot());
  const [passiveKey, setPassiveKey]   = useState('none');
  const [passiveDmgType, setPassiveDmgType]     = useState(null);
  const [passiveArmorType, setPassiveArmorType] = useState(null);
  const [benefit2Type, setBenefit2Type]     = useState('none');
  const [slot2, setSlot2]                   = useState(blankSlot());
  const [passive2Key, setPassive2Key]       = useState('none');
  const [passive2DmgType, setPassive2DmgType]     = useState(null);
  const [passive2ArmorType, setPassive2ArmorType] = useState(null);
  const [scorchType, setSCorchType] = useState(null);
  const [flawIndex, setFlawIndex]   = useState(-1);
  const [flawXValue, setFlawXValue] = useState(1);
  const [flawVGChoice, setFlawVGChoice] = useState('Vitae (Vampire)');
  const [stMod, setStMod]           = useState(0);
  const [klaiveMode, setKlaiveMode]               = useState(false);
  const [klaiveSubMode, setKlaiveSubMode]           = useState('unfinished');
  const [klaiveName, setKlaiveName]                 = useState('');
  const [klaiveSpiritName, setKlaiveSpiritName]     = useState('');
  const [klaiveSpiritName2, setKlaiveSpiritName2]   = useState('');
  const [klaivePower1, setKlaivePower1]             = useState(blankSlot());
  const [klaivePower2, setKlaivePower2]             = useState(blankSlot());
  const [klaiveBanFlaw, setKlaiveBanFlaw]           = useState('');
  const [klaiveBanAtt, setKlaiveBanAtt]             = useState(1);
  const [klaiveBan2Flaw, setKlaiveBan2Flaw]         = useState('');
  const [klaiveBan2Att, setKlaiveBan2Att]           = useState(1);
  const [klaiveOptFlaw, setKlaiveOptFlaw]           = useState(-1);
  const [klaiveOptAtt, setKlaiveOptAtt]             = useState(0);
  // Per-spirit steps 3–5 state
  const [klaiveP1Pass, setKlaiveP1Pass]             = useState('none');
  const [klaiveP1DmgType, setKlaiveP1DmgType]       = useState(null);
  const [klaiveB2Type1, setKlaiveB2Type1]           = useState('none');
  const [klaiveP1b, setKlaiveP1b]                   = useState(blankSlot());
  const [klaiveP1bPass, setKlaiveP1bPass]           = useState('none');
  const [klaiveP1bDmgType, setKlaiveP1bDmgType]     = useState(null);
  const [klaiveScorch1, setKlaiveScorch1]           = useState(null);
  const [klaiveP2Pass, setKlaiveP2Pass]             = useState('none');
  const [klaiveP2DmgType, setKlaiveP2DmgType]       = useState(null);
  const [klaiveB2Type2, setKlaiveB2Type2]           = useState('none');
  const [klaiveP2b, setKlaiveP2b]                   = useState(blankSlot());
  const [klaiveP2bPass, setKlaiveP2bPass]           = useState('none');
  const [klaiveP2bDmgType, setKlaiveP2bDmgType]     = useState(null);
  const [klaiveScorch2, setKlaiveScorch2]           = useState(null);
  const [klaiveShowP1, setKlaiveShowP1]             = useState(false);
  const [klaiveShowP2, setKlaiveShowP2]             = useState(false);

  useEffect(() => {
    if (slot1.power) { const d = detectModifiers(slot1.power, energyType); setSlot1(s => ({ ...s, ...d })); }
    if (slot2.power) { const d = detectModifiers(slot2.power, energyType); setSlot2(s => ({ ...s, ...d })); }
  }, [energyType]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectPower(n, power) {
    const s = { power, restriction: getPowerRestriction(power), ...detectModifiers(power, energyType) };
    if (n === 1) setSlot1(s); else setSlot2(s);
  }

  const KLAIVE_ENERGY = 'Gnosis (Shifter)';
  function selectKlaivePower(setter, power) {
    if (!power) { setter(blankSlot()); return; }
    setter({ power, restriction: getPowerRestriction(power), ...detectModifiers(power, KLAIVE_ENERGY) });
  }
  function pCost(slot) {
    if (!slot?.power || slot.restriction) return 0;
    const lvl = slot.level ?? 1;
    let c = lvl === 1 ? 2 : lvl === 2 ? 4 : 6;
    if (!slot.notAvailable) { if (slot.corrupted) c += 2; else if (slot.rare) c += 1; }
    else c += 2;
    return c;
  }
  function kPCost(pKey, dmgIdx) {
    const base = KLAIVE_PASSIVES.find(o => o.key === pKey)?.cost ?? 0;
    const dt = dmgIdx !== null && DAMAGE_TYPES[dmgIdx] ? DAMAGE_TYPES[dmgIdx].weapon : 0;
    return base + dt;
  }
  function kSCost(idx) { return (idx !== null && DAMAGE_TYPES[idx]?.scorch != null) ? DAMAGE_TYPES[idx].scorch : 0; }
  const isGrand       = klaiveSubMode.includes('grand');
  const isKlaiveUnfin = klaiveSubMode.includes('unfinished');
  const klaiveModeLabelMap = {
    unfinished:       'Unfinished Klaive',
    finished:         'Klaive',
    grand_unfinished: 'Unfinished Grand Klaive',
    grand:            'Grand Klaive',
  };
  const klaiveFinalAtt = isKlaiveUnfin ? 3 : Math.max(1,
    5
    + pCost(klaivePower1) + kPCost(klaiveP1Pass, klaiveP1DmgType)
    + (klaiveB2Type1 === 'power' ? pCost(klaiveP1b) : kPCost(klaiveP1bPass, klaiveP1bDmgType))
    + kSCost(klaiveScorch1)
    + (isGrand
        ? pCost(klaivePower2) + kPCost(klaiveP2Pass, klaiveP2DmgType)
          + (klaiveB2Type2 === 'power' ? pCost(klaiveP2b) : kPCost(klaiveP2bPass, klaiveP2bDmgType))
          + kSCost(klaiveScorch2)
        : 0)
    - klaiveBanAtt - (isGrand ? klaiveBan2Att : 0) - klaiveOptAtt
  );
  const klaiveTagCount = isKlaiveUnfin ? 1 : isGrand ? 3 : 2;

  const passiveOptions = getPassiveOptions(itemType);

  const scorchConflict = useMemo(() => {
    if (scorchType === null) return false;
    const lbl = DAMAGE_TYPES[scorchType]?.label;
    return [passiveDmgType, passive2DmgType, passiveArmorType, passive2ArmorType]
      .filter(v => v !== null)
      .some(v => DAMAGE_TYPES[v]?.label === lbl);
  }, [scorchType, passiveDmgType, passive2DmgType, passiveArmorType, passive2ArmorType]);

  const breakdown = useMemo(() => {
    const lines = [];
    let total = 0;

    function addPower(slot, label) {
      if (!slot.power) return;
      if (slot.restriction) { lines.push({ label: `${label}: ${slot.power.name} (RESTRICTED — excluded)`, value: 0, warn: true }); return; }
      const lvl = slot.level ?? 1;
      const base = lvl === 1 ? 2 : lvl === 2 ? 4 : 6;
      lines.push({ label: `${label}: ${slot.power.name} (Level ${lvl})`, value: base });
      total += base;
      if (!slot.notAvailable) {
        if (slot.corrupted) {
          if (isTainted) lines.push({ label: '  Corrupted/Thorn — Tainted overrides', value: 0 });
          else { lines.push({ label: '  Corrupted/Dark Arcanos/Shadow Thorn', value: 2 }); total += 2; }
        } else if (slot.rare) {
          lines.push({ label: '  Rare in faction', value: 1 }); total += 1;
        }
      } else {
        lines.push({ label: '  Not available for this faction', value: 2 }); total += 2;
      }
    }

    addPower(slot1, 'Power');

    function addPassive(pKey, dmgIdx, armorIdx, label) {
      if (pKey === 'none') return;
      const opt = passiveOptions.find(o => o.key === pKey);
      if (opt && opt.cost > 0) { lines.push({ label: `${label}: ${opt.label}`, value: opt.cost }); total += opt.cost; }
      if (dmgIdx !== null && DAMAGE_TYPES[dmgIdx] && itemType === 'weapon') {
        const dt = DAMAGE_TYPES[dmgIdx];
        lines.push({ label: `${label}: ${dt.label} Damage Type`, value: dt.weapon }); total += dt.weapon;
      }
      if (armorIdx !== null && DAMAGE_TYPES[armorIdx] && itemType === 'armor') {
        const dt = DAMAGE_TYPES[armorIdx];
        lines.push({ label: `${label}: ${dt.label} Type Armor`, value: dt.armor }); total += dt.armor;
      }
    }

    addPassive(passiveKey, passiveDmgType, passiveArmorType, 'Passive Trait');
    if (benefit2Type === 'power') addPower(slot2, '2nd Power');
    else if (benefit2Type === 'passive') addPassive(passive2Key, passive2DmgType, passive2ArmorType, '2nd Benefit');

    if (isTainted) { lines.push({ label: 'Item is Tainted', value: -4 }); total -= 4; }

    if (scorchType !== null && DAMAGE_TYPES[scorchType]?.scorch !== null) {
      const dt = DAMAGE_TYPES[scorchType];
      lines.push({ label: `Scorch: ${dt.label}`, value: dt.scorch }); total += dt.scorch;
    }

    if (flawIndex >= 0 && FLAWS[flawIndex]) {
      const flaw = FLAWS[flawIndex];
      let red = flaw.reduction;
      if (flaw.hasX) red = flawXValue;
      if (flaw.hasVG) red = flawVGChoice === 'Gnosis (Shifter)' ? 4 : 2;
      if (flaw.stRange) {
        lines.push({ label: `Flaw: ${flaw.label} (ST decides: -${flaw.stRange})`, value: 0, warn: true });
      } else if (typeof red === 'number' && red !== 0) {
        lines.push({ label: `Flaw: ${flaw.label}`, value: -red }); total -= red;
      }
    }

    if (stMod !== 0) { lines.push({ label: 'ST Free Modifier', value: stMod }); total += stMod; }

    return { lines, total, finalAtt: Math.max(1, total) };
  }, [slot1, slot2, passiveKey, passiveDmgType, passiveArmorType, benefit2Type, passive2Key, passive2DmgType, passive2ArmorType, isTainted, scorchType, flawIndex, flawXValue, flawVGChoice, stMod, itemType, passiveOptions]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm" onClick={onBack}>← Back</button>
          <h1 className="text-2xl font-bold text-amber-400">⚔️ Magic Item Wizard</h1>
          <span className="text-xs bg-amber-900 text-amber-200 px-2 py-1 rounded">2026 Draft Rules</span>
        </div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setKlaiveMode(false)}
            className={`px-4 py-1.5 rounded text-sm font-semibold ${!klaiveMode ? 'bg-amber-700 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
          >Magic Item</button>
          <button onClick={() => setKlaiveMode(true)}
            className={`px-4 py-1.5 rounded text-sm font-semibold ${klaiveMode ? 'bg-amber-700 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
          >⚔ Klaive</button>
        </div>
        {klaiveMode && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(klaiveModeLabelMap).map(([id, label]) => (
                <button key={id} onClick={() => { setKlaiveSubMode(id); setKlaivePower1(blankSlot()); setKlaivePower2(blankSlot()); setKlaiveBanFlaw(''); setKlaiveBan2Flaw(''); setKlaiveOptFlaw(-1); setKlaiveBanAtt(1); setKlaiveBan2Att(1); setKlaiveOptAtt(0); setKlaiveP1Pass('none'); setKlaiveP1DmgType(null); setKlaiveB2Type1('none'); setKlaiveP1b(blankSlot()); setKlaiveP1bPass('none'); setKlaiveP1bDmgType(null); setKlaiveScorch1(null); setKlaiveP2Pass('none'); setKlaiveP2DmgType(null); setKlaiveB2Type2('none'); setKlaiveP2b(blankSlot()); setKlaiveP2bPass('none'); setKlaiveP2bDmgType(null); setKlaiveScorch2(null); }}
                  className={`py-2 text-sm rounded font-medium ${klaiveSubMode === id ? 'bg-amber-700 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'}`}
                >{label}</button>
              ))}
            </div>
            <Section title="Klaive Info">
              <Label>Klaive Name</Label>
              <input className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
                placeholder="e.g. Moonbane" value={klaiveName} onChange={e => setKlaiveName(e.target.value)} />
            </Section>
            {isKlaiveUnfin ? (
              <Section title="Unfinished Klaive — Fixed Stats">
                <div className="space-y-1.5 text-sm">
                  <div className="text-gray-300">Weapon: <span className="text-white">Silver {isGrand ? '2H' : '1H'}</span></div>
                  <div className="text-gray-300">Energy: <span className="text-white">Gnosis</span></div>
                  <div className="text-gray-300">Att: <span className="text-white font-bold">3</span></div>
                  <div className="text-gray-300">Properties: <span className="text-white">Relic</span></div>
                  <div className="text-gray-300">Tags: <span className="text-white">1 tag (Klaive Tag)</span></div>
                  <p className="text-xs text-amber-400 pt-1">Requires ST approval and character attunement before becoming a finished Klaive.</p>
                </div>
              </Section>
            ) : (
              <>
                <Section title="Bound Spirit(s)">
                  <div className="space-y-3">
                    <div>
                      <Label>{isGrand ? 'Spirit 1 Name (Greater Jaggling)' : 'Spirit Name'}</Label>
                      <input className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
                        placeholder="Spirit name" value={klaiveSpiritName} onChange={e => setKlaiveSpiritName(e.target.value)} />
                    </div>
                    {isGrand && (
                      <div>
                        <Label>Spirit 2 Name <span className="text-amber-400">(Greater Jaggling — War Spirit)</span></Label>
                        <input className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
                          placeholder="2nd spirit name" value={klaiveSpiritName2} onChange={e => setKlaiveSpiritName2(e.target.value)} />
                      </div>
                    )}
                  </div>
                </Section>
                <Section title={isGrand ? 'Spirit 1 — Steps 2–5' : 'Steps 2–5'}>
                  <div className="space-y-4">
                    <div>
                      <Label>Step 2 — Power (optional)</Label>
                      {klaivePower1.power ? (
                        <div className={`mt-1 flex items-center justify-between text-xs px-2 py-1 rounded ${klaivePower1.restriction ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
                          <span>{klaivePower1.power.name} (Lv{klaivePower1.level ?? 1}) +{pCost(klaivePower1)} att{klaivePower1.restriction ? ` — ${RESTRICTION_MSG[klaivePower1.restriction] || klaivePower1.restriction}` : ''}</span>
                          <button onClick={() => { setKlaivePower1(blankSlot()); setKlaiveShowP1(false); }} className="ml-2 text-gray-500 hover:text-white">✕</button>
                        </div>
                      ) : klaiveShowP1 ? (
                        <PowerSearch onSelect={p => { selectKlaivePower(setKlaivePower1, p); setKlaiveShowP1(false); }} />
                      ) : (
                        <button onClick={() => setKlaiveShowP1(true)} className="mt-1 text-sm text-amber-400 hover:text-amber-300 underline">+ Select power…</button>
                      )}
                    </div>
                    <div>
                      <Label>Step 3 — Passive Trait (optional)</Label>
                      <p className="text-xs text-gray-400 mb-2">Weapon deals Agg damage.</p>
                      <select value={klaiveP1Pass} onChange={e => setKlaiveP1Pass(e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none">
                        {KLAIVE_PASSIVES.map(o => <option key={o.key} value={o.key}>{o.label}{o.cost > 0 ? ` (+${o.cost})` : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Step 4 — 2nd Benefit (optional)</Label>
                      <select value={klaiveB2Type1} onChange={e => { setKlaiveB2Type1(e.target.value); setKlaiveP1b(blankSlot()); setKlaiveP1bPass('none'); setKlaiveP1bDmgType(null); }} className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none mb-2">
                        <option value="none">None</option>
                        <option value="power">Add a Power</option>
                      </select>
                      {klaiveB2Type1 === 'power' && (
                        <>
                          <PowerSearch onSelect={p => selectKlaivePower(setKlaiveP1b, p)} />
                          {klaiveP1b.power && (
                            <div className={`mt-1 flex items-center justify-between text-xs px-2 py-1 rounded ${klaiveP1b.restriction ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
                              <span>{klaiveP1b.power.name} (Lv{klaiveP1b.level ?? 1}) +{pCost(klaiveP1b)} att</span>
                              <button onClick={() => setKlaiveP1b(blankSlot())} className="ml-2 text-gray-500 hover:text-white">✕</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      <Label>Step 5 — Scorch (optional)</Label>
                      <select value={klaiveScorch1 ?? ''} onChange={e => setKlaiveScorch1(e.target.value === '' ? null : parseInt(e.target.value))} className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none">
                        <option value="">None</option>
                        {DAMAGE_TYPES.filter(dt => dt.scorch !== null).map(dt => (
                          <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} Scorch ({dt.scorch})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Section>
                {isGrand && (
                  <Section title="Spirit 2 — Steps 2–5">
                    <div className="space-y-4">
                      <div>
                        <Label>Step 2 — Power (optional)</Label>
                        {klaivePower2.power ? (
                          <div className={`mt-1 flex items-center justify-between text-xs px-2 py-1 rounded ${klaivePower2.restriction ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
                            <span>{klaivePower2.power.name} (Lv{klaivePower2.level ?? 1}) +{pCost(klaivePower2)} att{klaivePower2.restriction ? ` — ${RESTRICTION_MSG[klaivePower2.restriction] || klaivePower2.restriction}` : ''}</span>
                            <button onClick={() => { setKlaivePower2(blankSlot()); setKlaiveShowP2(false); }} className="ml-2 text-gray-500 hover:text-white">✕</button>
                          </div>
                        ) : klaiveShowP2 ? (
                          <PowerSearch onSelect={p => { selectKlaivePower(setKlaivePower2, p); setKlaiveShowP2(false); }} />
                        ) : (
                          <button onClick={() => setKlaiveShowP2(true)} className="mt-1 text-sm text-amber-400 hover:text-amber-300 underline">+ Select power…</button>
                        )}
                      </div>
                      <div>
                        <Label>Step 3 — Passive Trait (optional)</Label>
                        <p className="text-xs text-gray-400 mb-2">Weapon deals Agg damage.</p>
                        <select value={klaiveP2Pass} onChange={e => setKlaiveP2Pass(e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none">
                          {KLAIVE_PASSIVES.map(o => <option key={o.key} value={o.key}>{o.label}{o.cost > 0 ? ` (+${o.cost})` : ''}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Step 4 — 2nd Benefit (optional)</Label>
                        <select value={klaiveB2Type2} onChange={e => { setKlaiveB2Type2(e.target.value); setKlaiveP2b(blankSlot()); setKlaiveP2bPass('none'); setKlaiveP2bDmgType(null); }} className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none mb-2">
                          <option value="none">None</option>
                          <option value="power">Add a Power</option>
                        </select>
                        {klaiveB2Type2 === 'power' && (
                          <>
                            <PowerSearch onSelect={p => selectKlaivePower(setKlaiveP2b, p)} />
                            {klaiveP2b.power && (
                              <div className={`mt-1 flex items-center justify-between text-xs px-2 py-1 rounded ${klaiveP2b.restriction ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
                                <span>{klaiveP2b.power.name} (Lv{klaiveP2b.level ?? 1}) +{pCost(klaiveP2b)} att</span>
                                <button onClick={() => setKlaiveP2b(blankSlot())} className="ml-2 text-gray-500 hover:text-white">✕</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div>
                        <Label>Step 5 — Scorch (optional)</Label>
                        <select value={klaiveScorch2 ?? ''} onChange={e => setKlaiveScorch2(e.target.value === '' ? null : parseInt(e.target.value))} className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none">
                          <option value="">None</option>
                          {DAMAGE_TYPES.filter(dt => dt.scorch !== null).map(dt => (
                            <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} Scorch ({dt.scorch})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Section>
                )}
                <Section title="Mandatory Flaws">
                  <p className="text-xs text-gray-400 mb-3">Both flaws are required. Gnosis −2 while attuned is a feature, not a flaw.</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Ban Flaw — Spirit 1 <span className="text-red-400">*</span></Label>
                      <input className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
                        placeholder="Describe the ban condition" value={klaiveBanFlaw} onChange={e => setKlaiveBanFlaw(e.target.value)} />
                      <Label>Att Reduction</Label>
                      <div className="flex gap-1 mt-1">
                        {[0,1,2,3,4].map(n => (
                          <button key={n} onClick={() => setKlaiveBanAtt(n)}
                            className={`flex-1 py-1.5 text-sm rounded font-bold ${klaiveBanAtt === n ? 'bg-orange-700 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                          >−{n}</button>
                        ))}
                      </div>
                    </div>
                    {isGrand && (
                      <div className="pt-2 border-t border-gray-700">
                        <Label>Ban Flaw — Spirit 2 <span className="text-red-400">*</span></Label>
                        <input className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
                          placeholder="Describe the ban condition" value={klaiveBan2Flaw} onChange={e => setKlaiveBan2Flaw(e.target.value)} />
                        <Label>Att Reduction</Label>
                        <div className="flex gap-1 mt-1">
                          {[0,1,2,3,4].map(n => (
                            <button key={n} onClick={() => setKlaiveBan2Att(n)}
                              className={`flex-1 py-1.5 text-sm rounded font-bold ${klaiveBan2Att === n ? 'bg-orange-700 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                            >−{n}</button>
                          ))}
                        </div>
                        <p className="text-xs text-amber-400 mt-1">Breaking either ban causes both spirits to reject the character.</p>
                      </div>
                    )}
                  </div>
                </Section>
                <Section title="Optional 3rd Flaw (non-Ban)">
                  <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
                    value={klaiveOptFlaw} onChange={e => { const i = parseInt(e.target.value); setKlaiveOptFlaw(i); if (i >= 0 && FLAWS[i]?.reduction !== null && !FLAWS[i]?.hasX && !FLAWS[i]?.stRange && !FLAWS[i]?.hasVG) setKlaiveOptAtt(FLAWS[i].reduction); else setKlaiveOptAtt(0); }}>
                    <option value={-1}>None</option>
                    {FLAWS.map((f, i) => {
                      const redStr = f.stRange ? `-(ST: ${f.stRange})` : f.hasX ? '-X' : f.hasVG ? '-2/-4' : f.reduction !== null ? `-${f.reduction}` : '';
                      return <option key={i} value={i}>{f.label} ({redStr}){f.energyNote ? ` — ${f.energyNote}` : ''}</option>;
                    })}
                  </select>
                  {klaiveOptFlaw >= 0 && (FLAWS[klaiveOptFlaw]?.hasX || FLAWS[klaiveOptFlaw]?.stRange || FLAWS[klaiveOptFlaw]?.hasVG) && (
                    <>
                      <Label>Att Reduction</Label>
                      <div className="flex gap-1 mt-1">
                        {[0,1,2,3,4].map(n => (
                          <button key={n} onClick={() => setKlaiveOptAtt(n)}
                            className={`flex-1 py-1.5 text-sm rounded font-bold ${klaiveOptAtt === n ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                          >−{n}</button>
                        ))}
                      </div>
                    </>
                  )}
                </Section>
                <Section title="Total Attunement">
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-sm"><span>Base (Klaive)</span><span className="font-mono text-amber-300">+5</span></div>
                    {klaivePower1.power && !klaivePower1.restriction && <div className="flex justify-between text-sm"><span>{isGrand ? 'S1 ' : ''}Power: {klaivePower1.power.name}</span><span className="font-mono text-amber-300">+{pCost(klaivePower1)}</span></div>}
                    {kPCost(klaiveP1Pass, klaiveP1DmgType) > 0 && <div className="flex justify-between text-sm"><span>{isGrand ? 'S1 ' : ''}Passive</span><span className="font-mono text-amber-300">+{kPCost(klaiveP1Pass, klaiveP1DmgType)}</span></div>}
                    {klaiveB2Type1 === 'power' && klaiveP1b.power && !klaiveP1b.restriction && <div className="flex justify-between text-sm"><span>{isGrand ? 'S1 ' : ''}2nd Power: {klaiveP1b.power.name}</span><span className="font-mono text-amber-300">+{pCost(klaiveP1b)}</span></div>}
                    {klaiveB2Type1 === 'passive' && kPCost(klaiveP1bPass, klaiveP1bDmgType) > 0 && <div className="flex justify-between text-sm"><span>{isGrand ? 'S1 ' : ''}2nd Passive</span><span className="font-mono text-amber-300">+{kPCost(klaiveP1bPass, klaiveP1bDmgType)}</span></div>}
                    {klaiveScorch1 !== null && kSCost(klaiveScorch1) !== 0 && <div className="flex justify-between text-sm"><span>{isGrand ? 'S1 ' : ''}Scorch: {DAMAGE_TYPES[klaiveScorch1]?.label}</span><span className={`font-mono ${kSCost(klaiveScorch1) < 0 ? 'text-green-400' : 'text-amber-300'}`}>{kSCost(klaiveScorch1)}</span></div>}
                    {isGrand && klaivePower2.power && !klaivePower2.restriction && <div className="flex justify-between text-sm"><span>S2 Power: {klaivePower2.power.name}</span><span className="font-mono text-amber-300">+{pCost(klaivePower2)}</span></div>}
                    {isGrand && kPCost(klaiveP2Pass, klaiveP2DmgType) > 0 && <div className="flex justify-between text-sm"><span>S2 Passive</span><span className="font-mono text-amber-300">+{kPCost(klaiveP2Pass, klaiveP2DmgType)}</span></div>}
                    {isGrand && klaiveB2Type2 === 'power' && klaiveP2b.power && !klaiveP2b.restriction && <div className="flex justify-between text-sm"><span>S2 2nd Power: {klaiveP2b.power.name}</span><span className="font-mono text-amber-300">+{pCost(klaiveP2b)}</span></div>}
                    {isGrand && klaiveB2Type2 === 'passive' && kPCost(klaiveP2bPass, klaiveP2bDmgType) > 0 && <div className="flex justify-between text-sm"><span>S2 2nd Passive</span><span className="font-mono text-amber-300">+{kPCost(klaiveP2bPass, klaiveP2bDmgType)}</span></div>}
                    {isGrand && klaiveScorch2 !== null && kSCost(klaiveScorch2) !== 0 && <div className="flex justify-between text-sm"><span>S2 Scorch: {DAMAGE_TYPES[klaiveScorch2]?.label}</span><span className={`font-mono ${kSCost(klaiveScorch2) < 0 ? 'text-green-400' : 'text-amber-300'}`}>{kSCost(klaiveScorch2)}</span></div>}
                    {klaiveBanAtt > 0 && <div className="flex justify-between text-sm"><span>− Ban flaw (Spirit 1)</span><span className="font-mono text-green-400">−{klaiveBanAtt}</span></div>}
                    {isGrand && klaiveBan2Att > 0 && <div className="flex justify-between text-sm"><span>− Ban flaw (Spirit 2)</span><span className="font-mono text-green-400">−{klaiveBan2Att}</span></div>}
                    {klaiveOptFlaw >= 0 && klaiveOptAtt > 0 && <div className="flex justify-between text-sm"><span>− {FLAWS[klaiveOptFlaw]?.label ?? 'Optional flaw'}</span><span className="font-mono text-green-400">−{klaiveOptAtt}</span></div>}
                  </div>
                  <div className="border-t border-gray-600 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold">Final Attunement Cost</span>
                    <span className={`text-3xl font-black ${klaiveFinalAtt >= 10 ? 'text-red-400' : klaiveFinalAtt >= 6 ? 'text-amber-300' : 'text-green-400'}`}>{klaiveFinalAtt}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Tags: {klaiveTagCount} {klaiveTagCount === 1 ? '(Klaive Tag)' : isGrand ? '(Grand Klaive Tag + 2× Klaive Spirit Tag)' : '(Klaive Tag + Klaive Spirit Tag)'}</p>
                  {!isKlaiveUnfin && (
                    <KlaiveTagPreview
                      subMode={klaiveSubMode} name={klaiveName}
                      spiritName1={klaiveSpiritName} spiritName2={klaiveSpiritName2}
                      power1={klaivePower1} p1Pass={klaiveP1Pass} b2Type1={klaiveB2Type1} p1b={klaiveP1b} scorch1={klaiveScorch1}
                      power2={klaivePower2} p2Pass={klaiveP2Pass} b2Type2={klaiveB2Type2} p2b={klaiveP2b} scorch2={klaiveScorch2}
                      banFlaw={klaiveBanFlaw} ban2Flaw={klaiveBan2Flaw}
                      optFlawIdx={klaiveOptFlaw} attunement={klaiveFinalAtt}
                    />
                  )}
                </Section>
              </>
            )}
          </div>
        )}
        {!klaiveMode && (
        <div className="space-y-4">

          <Section title="Item Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <Label>Item Name (optional)</Label>
                <input className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
                  placeholder="e.g. Blade of Eternity" value={itemName} onChange={e => setItemName(e.target.value)} />
              </div>
              <div>
                <Label>Item Type</Label>
                <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
                  value={itemType}
                  onChange={e => { setItemType(e.target.value); setPassiveKey('none'); setPassive2Key('none'); setPassiveDmgType(null); setPassiveArmorType(null); setPassive2DmgType(null); setPassive2ArmorType(null); }}>
                  <option value="weapon">Weapon</option>
                  <option value="armor">Armor</option>
                  <option value="accessory">Accessory</option>
                  <option value="talisman">Talisman</option>
                  <option value="custom">Custom Item</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-amber-400" checked={isTainted} onChange={e => setIsTainted(e.target.checked)} />
                <span className="text-sm">Tainted <span className="text-gray-400">(-4)</span></span>
              </label>
            </div>
          </Section>

          <Section title="Step 1 — Select Energy">
            <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
              value={energyType} onChange={e => setEnergyType(e.target.value)}>
              {ENERGY_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            {!FACTION_CODE[energyType] && (
              <p className="text-xs text-amber-300 mt-1">⚠ No faction matched — power availability auto-detection skipped.</p>
            )}
          </Section>

          <Section title="Step 2 — Select Power (optional)">
            <p className="text-xs text-gray-400 mb-3">Cannot select Fundamental-only, NPC-Only, or "Not intended for items" powers. Leave blank for no power (Base Cost = 0).</p>
            <PowerSlotRow slot={slot1} label="Power" onSelect={p => selectPower(1, p)} onClear={() => setSlot1(blankSlot())} />
          </Section>

          <Section title="Step 3 — Select Passive Trait (optional)">
            {passiveOptions.length <= 1 ? (
              <p className="text-gray-400 text-sm">No passive traits for this item type.</p>
            ) : (
              <>
                <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none mb-3"
                  value={passiveKey} onChange={e => setPassiveKey(e.target.value)}>
                  {passiveOptions.map(o => <option key={o.key} value={o.key}>{o.label}{o.cost > 0 ? ` (+${o.cost})` : ''}</option>)}
                </select>
                {itemType === 'weapon' && (
                  <DmgTypeSelect label="Damage Type (once per item)" value={passiveDmgType} onChange={setPassiveDmgType} mode="weapon" />
                )}
                {itemType === 'armor' && (
                  <DmgTypeSelect label="<Type> Armor (once per item)" value={passiveArmorType} onChange={setPassiveArmorType} mode="armor" />
                )}
              </>
            )}
          </Section>

          <Section title="Step 4 — 2nd Benefit (optional)">
            <p className="text-xs text-gray-400 mb-3">Max two total selections (Power+Power, Power+Passive, or Passive+Passive).</p>
            <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none mb-3"
              value={benefit2Type}
              onChange={e => { setBenefit2Type(e.target.value); setSlot2(blankSlot()); setPassive2Key('none'); setPassive2DmgType(null); setPassive2ArmorType(null); }}>
              <option value="none">None</option>
              <option value="power">Add a Power</option>
              {passiveOptions.length > 1 && <option value="passive">Add a Passive Trait</option>}
            </select>
            {benefit2Type === 'power' && (
              <PowerSlotRow slot={slot2} label="2nd Power" onSelect={p => selectPower(2, p)} onClear={() => setSlot2(blankSlot())} />
            )}
            {benefit2Type === 'passive' && passiveOptions.length > 1 && (
              <>
                <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none mb-3"
                  value={passive2Key} onChange={e => setPassive2Key(e.target.value)}>
                  {passiveOptions.map(o => <option key={o.key} value={o.key}>{o.label}{o.cost > 0 ? ` (+${o.cost})` : ''}</option>)}
                </select>
                {itemType === 'weapon' && (
                  <DmgTypeSelect label="Damage Type (2nd benefit)" value={passive2DmgType} onChange={setPassive2DmgType} mode="weapon" />
                )}
                {itemType === 'armor' && (
                  <DmgTypeSelect label="<Type> Armor (2nd benefit)" value={passive2ArmorType} onChange={setPassive2ArmorType} mode="armor" />
                )}
              </>
            )}
          </Section>

          <Section title="Step 5 — Scorch (optional)">
            <p className="text-xs text-gray-400 mb-2">Cannot combine &lt;Type&gt; Armor and Scorch for the same type.</p>
            <select
              className={`w-full bg-gray-700 text-white px-3 py-2 rounded border ${scorchConflict ? 'border-red-500' : 'border-gray-600'} focus:border-amber-400 focus:outline-none`}
              value={scorchType ?? ''} onChange={e => setSCorchType(e.target.value === '' ? null : parseInt(e.target.value))}>
              <option value="">None</option>
              {DAMAGE_TYPES.filter(dt => dt.scorch !== null).map((dt) => (
                <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} Scorch ({dt.scorch})</option>
              ))}
            </select>
            {scorchConflict && <p className="text-red-400 text-xs mt-1">⛔ Conflict: same type used for armor and scorch.</p>}
          </Section>

          <Section title="Step 6 — Flaw (optional)">
            <p className="text-xs text-gray-400 mb-2">One unique flaw. Always active on attuned characters even when not carrying item.</p>
            <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
              value={flawIndex} onChange={e => setFlawIndex(parseInt(e.target.value))}>
              <option value={-1}>None</option>
              {FLAWS.map((f, i) => {
                let redStr = f.stRange ? `-(ST: ${f.stRange})` : f.hasX ? '-X' : f.hasVG ? '-2/-4' : f.reduction !== null ? `-${f.reduction}` : '';
                return <option key={i} value={i}>{f.label} ({redStr}){f.energyNote ? ` — ${f.energyNote}` : ''}</option>;
              })}
            </select>
            {flawIndex >= 0 && FLAWS[flawIndex]?.hasX && (
              <div className="mt-2 flex items-center gap-3">
                <Label>X — Max Health reduction amount</Label>
                <input type="number" min={1} max={10}
                  className="w-20 bg-gray-700 text-white px-2 py-1 rounded border border-gray-600"
                  value={flawXValue} onChange={e => setFlawXValue(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
            )}
            {flawIndex >= 0 && FLAWS[flawIndex]?.hasVG && (
              <div className="mt-2">
                <Label>Energy Type for Cannot Frenzy</Label>
                <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                  value={flawVGChoice} onChange={e => setFlawVGChoice(e.target.value)}>
                  <option value="Vitae (Vampire)">Vitae (Vampire) — -2</option>
                  <option value="Gnosis (Shifter)">Gnosis (Shifter) — -4</option>
                </select>
              </div>
            )}
            {flawIndex >= 0 && FLAWS[flawIndex]?.stRange && (
              <p className="text-amber-300 text-xs mt-1">⚠ Reduction is ST's discretion ({FLAWS[flawIndex].stRange}). Use Step 7 to adjust manually.</p>
            )}
          </Section>

          <Section title="Step 7 — ST Free Modifier">
            <div className="flex items-center gap-4">
              <input type="range" min={-5} max={5} step={1} value={stMod}
                onChange={e => setStMod(parseInt(e.target.value))} className="flex-1 accent-amber-400" />
              <span className={`text-xl font-bold w-12 text-center ${stMod < 0 ? 'text-green-400' : stMod > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                {stMod > 0 ? `+${stMod}` : stMod}
              </span>
            </div>
          </Section>

          <Section title="Step 8 — Total Value">
            <div className="space-y-1 mb-4">
              {breakdown.lines.map((l, i) => (
                <div key={i} className={`flex justify-between text-sm ${l.warn ? 'text-amber-300' : ''}`}>
                  <span>{l.label}</span>
                  <span className={`font-mono ${l.value > 0 ? 'text-amber-300' : l.value < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {l.value > 0 ? `+${l.value}` : l.value === 0 ? '—' : l.value}
                  </span>
                </div>
              ))}
              {breakdown.lines.length === 0 && <p className="text-gray-500 text-sm">No selections yet.</p>}
            </div>
            <div className="border-t border-gray-600 pt-3 flex justify-between">
              <span className="text-gray-400">Calculated Total</span>
              <span className="font-mono text-gray-400">{breakdown.total}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-lg font-bold">Final Attunement Cost</span>
              <span className={`text-3xl font-black ${breakdown.finalAtt >= 10 ? 'text-red-400' : breakdown.finalAtt >= 6 ? 'text-amber-300' : 'text-green-400'}`}>
                {breakdown.finalAtt}
              </span>
            </div>
            {breakdown.total < 1 && <p className="text-xs text-amber-400 mt-1">⚠ Raw total {breakdown.total}; minimum attunement is 1.</p>}
            <TagPreview
              itemName={itemName} itemType={itemType} energyType={energyType}
              attunement={breakdown.finalAtt} isTainted={isTainted}
              isKlaive={false} klaiveGrand={false} isKlaiveUnfinished={false}
              slot1={slot1} slot2={slot2} benefit2Type={benefit2Type}
              passiveKey={passiveKey} passiveDmgType={passiveDmgType} passiveArmorType={passiveArmorType}
              passive2Key={passive2Key} passive2DmgType={passive2DmgType} passive2ArmorType={passive2ArmorType}
              scorchType={scorchType} flawIndex={flawIndex} flawXValue={flawXValue}
              passiveOptions={passiveOptions}
            />
          </Section>
        </div>
        )}
      </div>
    </div>
  );
}

function PowerSlotRow({ slot, label, onSelect, onClear }) {
  return (
    <div className="bg-gray-750 rounded p-3 border border-gray-700 space-y-2">
      <Label>{label}</Label>
      <PowerSearch onSelect={onSelect} />
      {slot.power && (
        <div className="flex items-start justify-between gap-2 mt-1">
          <div className="text-sm">
            {slot.restriction ? (
              <span className="text-red-400">⛔ {RESTRICTION_MSG[slot.restriction]}</span>
            ) : (
              <div>
                <span className="font-semibold text-white">{slot.power.name}</span>
                <span className="text-gray-400 text-xs ml-2">{slot.power.sources}</span>
                <div className="text-xs text-gray-400 mt-0.5">
                  {slot.notAvailable
                    ? <span className="text-amber-300">Not available for this faction (+2)</span>
                    : <>Level {slot.level ?? '?'}
                        {slot.rare && <span className="text-amber-400 ml-2">Rare (+1)</span>}
                        {slot.corrupted && <span className="text-red-400 ml-2">Corrupted/Thorn (+2 unless Tainted)</span>}
                      </>
                  }
                </div>
              </div>
            )}
          </div>
          <button className="text-xs text-red-400 hover:text-red-300 shrink-0" onClick={onClear}>Clear</button>
        </div>
      )}
    </div>
  );
}

function DmgTypeSelect({ label, value, onChange, mode, excludeAgg }) {
  const options = DAMAGE_TYPES.filter(dt => (mode === 'weapon' ? dt.weapon !== null : dt.armor !== null) && (!excludeAgg || dt.label !== 'Agg'));
  return (
    <div>
      <Label>{label}</Label>
      <select
        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
        value={value ?? ''} onChange={e => onChange(e.target.value === '' ? null : parseInt(e.target.value))}>
        <option value="">None</option>
        {options.map(dt => {
          const origIdx = DAMAGE_TYPES.indexOf(dt);
          const cost = mode === 'weapon' ? dt.weapon : dt.armor;
          return <option key={dt.label} value={origIdx}>{dt.label} (+{cost})</option>;
        })}
      </select>
    </div>
  );
}

function KlaiveTagPreview({ subMode, name, spiritName1, spiritName2, power1, p1Pass, b2Type1, p1b, scorch1, power2, p2Pass, b2Type2, p2b, scorch2, banFlaw, ban2Flaw, optFlawIdx, attunement }) {
  const isGrand = subMode.includes('grand');
  const isUnfin = subMode.includes('unfinished');
  const typeLabel = { unfinished: 'Unfinished Klaive', finished: 'Klaive', grand_unfinished: 'Unfinished Grand Klaive', grand: 'Grand Klaive' }[subMode] ?? 'Klaive';

  const spiritLines = (power, pPass, b2Type, p2bSlot, scorch, spiritName, prefix) => {
    const out = [];
    if (spiritName) out.push(`Spirit: ${spiritName}`);
    if (power?.power && !power.restriction) out.push(`${prefix}Power: ${power.power.name}`);
    const pLabel = KLAIVE_PASSIVES.find(o => o.key === pPass)?.label;
    if (pPass !== 'none' && pLabel) out.push(`${prefix}Trait: ${pLabel}`);
    if (b2Type === 'power' && p2bSlot?.power && !p2bSlot.restriction) out.push(`${prefix}2nd Power: ${p2bSlot.power.name}`);
    if (scorch !== null && DAMAGE_TYPES[scorch]) out.push(`${prefix}Scorch: ${DAMAGE_TYPES[scorch].label}`);
    return out;
  };

  const lines = [];
  if (isUnfin) {
    if (spiritName1) lines.push(`Spirit: ${spiritName1}`);
    lines.push('Silver 1H Melee Weapon');
    lines.push('Relic');
  } else {
    lines.push(...spiritLines(power1, p1Pass, b2Type1, p1b, scorch1, spiritName1, isGrand ? 'S1 ' : ''));
    if (isGrand) lines.push(...spiritLines(power2, p2Pass, b2Type2, p2b, scorch2, spiritName2, 'S2 '));
    lines.push('Agg Damage · 1H Melee Weapon');
    if (banFlaw) lines.push(`Ban (S1): ${banFlaw}`);
    if (isGrand && ban2Flaw) lines.push(`Ban (S2): ${ban2Flaw}`);
    if (optFlawIdx >= 0 && FLAWS[optFlawIdx]) lines.push(`Flaw: ${FLAWS[optFlawIdx].label}`);
    lines.push('Gnosis \u22122 while attuned');
  }

  return (
    <div className="mt-6 rounded-lg overflow-hidden shadow-xl border-2 border-[#2d4a1e] font-serif">
      <div className="bg-[#2d4a1e] px-4 pt-3 pb-2.5 text-center">
        <div className="text-white font-black text-lg tracking-wide uppercase leading-tight">{name || '[ Klaive Name ]'}</div>
      </div>
      <div className="bg-[#e8d5b0] px-4 py-1.5 text-center border-b border-[#b89060]">
        <span className="text-[#2d4a1e] text-xs font-bold uppercase tracking-widest">{typeLabel}</span>
        <span className="text-[#8b6914] text-xs mx-2">&middot;</span>
        <span className="text-[#2d4a1e] text-xs uppercase tracking-wider">Gnosis (Shifter)</span>
      </div>
      <div className="bg-[#fdf6e3] px-4 py-3">
        {lines.length === 0
          ? <div className="text-[#9a7a4a] text-xs text-center italic">(no properties selected)</div>
          : <div className="space-y-1.5">
              {lines.map((l, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-900">
                  <span className="text-[#2d6b14] shrink-0 mt-0.5">&#9670;</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
        }
      </div>
      <div className="bg-[#e8d5b0] border-t border-[#b89060] px-4 py-2.5 flex items-center justify-between">
        <span className="text-[#2d4a1e] text-xs uppercase tracking-widest font-bold">Attunement</span>
        <span className={`font-black text-2xl leading-none ${attunement >= 10 ? 'text-red-700' : attunement >= 6 ? 'text-amber-800' : 'text-green-700'}`}>{attunement}</span>
      </div>
    </div>
  );
}

function TagPreview({ itemName, itemType, energyType, attunement, isTainted, isKlaive, klaiveGrand, isKlaiveUnfinished, slot1, slot2, benefit2Type, passiveKey, passiveDmgType, passiveArmorType, passive2Key, passive2DmgType, passive2ArmorType, scorchType, flawIndex, flawXValue, passiveOptions }) {
  const lines = [];
  if (slot1.power && !slot1.restriction) lines.push(`Power: ${slot1.power.name}`);
  const p1 = passiveOptions.find(o => o.key === passiveKey);
  if (p1 && p1.key !== 'none') {
    let t = `Trait: ${p1.label}`;
    if (passiveDmgType !== null && DAMAGE_TYPES[passiveDmgType]) t += ` (${DAMAGE_TYPES[passiveDmgType].label})`;
    if (passiveArmorType !== null && DAMAGE_TYPES[passiveArmorType]) t += ` ${DAMAGE_TYPES[passiveArmorType].label} Armor`;
    lines.push(t);
  }
  if (benefit2Type === 'power' && slot2.power && !slot2.restriction) lines.push(`Power: ${slot2.power.name}`);
  if (benefit2Type === 'passive') {
    const p2 = passiveOptions.find(o => o.key === passive2Key);
    if (p2 && p2.key !== 'none') {
      let t = `Trait: ${p2.label}`;
      if (passive2DmgType !== null && DAMAGE_TYPES[passive2DmgType]) t += ` (${DAMAGE_TYPES[passive2DmgType].label})`;
      if (passive2ArmorType !== null && DAMAGE_TYPES[passive2ArmorType]) t += ` ${DAMAGE_TYPES[passive2ArmorType].label} Armor`;
      lines.push(t);
    }
  }
  if (isKlaive) lines.push('Agg Damage');
  if (scorchType !== null && DAMAGE_TYPES[scorchType]) lines.push(`Scorch: ${DAMAGE_TYPES[scorchType].label}`);
  if (flawIndex >= 0 && FLAWS[flawIndex]) lines.push(`Flaw: ${FLAWS[flawIndex].label.replace('X', flawXValue)}`);

  return (
    <div className="mt-6 rounded-lg overflow-hidden shadow-xl border-2 border-gray-800 font-serif">
      <div className="bg-[#5c1a0a] px-4 pt-3 pb-2.5 text-center">
        <div className="text-white font-black text-lg tracking-wide uppercase leading-tight">{itemName || '[ Item Name ]'}</div>
      </div>
      <div className="bg-[#e8d5b0] px-4 py-1.5 text-center border-b border-[#b89060]">
        <span className="text-[#5c1a0a] text-xs font-bold uppercase tracking-widest">{itemType}</span>
        <span className="text-[#8b6914] text-xs mx-2">·</span>
        <span className="text-[#5c1a0a] text-xs uppercase tracking-wider">{energyType}</span>
      </div>
      {isTainted && (
        <div className="bg-[#fdf6e3] px-4 py-1.5 flex justify-center border-b border-[#c9a96e]/40">
          <span className="text-xs bg-red-100 border border-red-400 text-red-700 px-2 py-0.5 rounded font-bold">⚠ TAINTED</span>
        </div>
      )}
      <div className="bg-[#fdf6e3] px-4 py-3">
        {lines.length === 0
          ? <div className="text-[#9a7a4a] text-xs text-center italic">(no properties selected)</div>
          : <div className="space-y-1.5">
              {lines.map((l, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-900">
                  <span className="text-[#7a200d] shrink-0 mt-0.5">◆</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
        }
      </div>
      <div className="bg-[#e8d5b0] border-t border-[#b89060] px-4 py-2.5 flex items-center justify-between">
        <span className="text-[#5c1a0a] text-xs uppercase tracking-widest font-bold">Attunement</span>
        <span className={`font-black text-2xl leading-none ${attunement >= 10 ? 'text-red-700' : attunement >= 6 ? 'text-amber-800' : 'text-green-700'}`}>{attunement}</span>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h2 className="text-base font-bold text-amber-400 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">{children}</p>;
}
