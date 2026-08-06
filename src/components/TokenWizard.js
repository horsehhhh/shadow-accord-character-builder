import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lock, Coins } from 'lucide-react';
import { powersData } from '../data/powersData';

const ST_PASSWORD = '1234!';

const isTrustedUser = () => {
  if (sessionStorage.getItem('stSessionUnlocked') === 'true') return true;
  try {
    const stEmail = localStorage.getItem('stEmail');
    if (!stEmail) return false;
    return JSON.parse(localStorage.getItem('user'))?.email === stEmail;
  } catch { return false; }
};

// Damage type table (voted Damage Type Attunements proposal, 2026)
const DAMAGE_TYPES = [
  { label: 'Agg',       weapon: 5, armor: null },
  { label: 'Fire',      weapon: 4, armor: 4    },
  { label: 'Blood',     weapon: 3, armor: 3    },
  { label: 'Dark',      weapon: 3, armor: 3    },
  { label: 'Light',     weapon: 3, armor: 3    },
  { label: 'Silver',    weapon: 3, armor: 3    },
  { label: 'Wolfsbane', weapon: 3, armor: 3    },
  { label: 'Gold',      weapon: 2, armor: 2    },
  { label: 'Holy',      weapon: 2, armor: 2    },
  { label: 'Iron',      weapon: 2, armor: 2    },
  { label: 'Other',     weapon: 1, armor: 1    },
];

// ── Shared item calculation constants ─────────────────────────────────────────
const BENEFIT_COST = {
  power_1: 2, power_2: 4, power_3: 6,
  dmg_1: 4, dmg_2: 6,
  arm_2: 2, arm_4: 4,
  hp_1: 1, hp_2: 2,
  // dmg_type and arm_type costs are looked up from DAMAGE_TYPES by typeIdx
};

const BENEFIT_GROUP = {
  dmg_1: 'dmg_bonus', dmg_2: 'dmg_bonus',
  dmg_type: 'dmg_type',
  arm_2: 'arm_bonus', arm_4: 'arm_bonus',
  arm_type: 'arm_type',
  hp_1: 'hp_bonus', hp_2: 'hp_bonus',
};

const ALL_BENEFITS = [
  { value: 'power_1',  label: 'Level 1 Power',      cost: 2, types: ['weapon','armor','accessory','talisman','custom'] },
  { value: 'power_2',  label: 'Level 2 Power',      cost: 4, types: ['weapon','armor','accessory','talisman','custom'] },
  { value: 'power_3',  label: 'Level 3 Power',      cost: 6, types: ['weapon','armor','accessory','talisman','custom'] },
  { value: 'dmg_1',    label: '+1 Damage',           cost: 4, types: ['weapon'] },
  { value: 'dmg_2',    label: '+2 Damage',           cost: 6, types: ['weapon'] },
  { value: 'dmg_type', label: 'Damage <Type>',       cost: null, types: ['weapon'] },
  { value: 'arm_2',    label: '+2 Armor Points',     cost: 2, types: ['armor'] },
  { value: 'arm_4',    label: '+4 Armor Points',     cost: 4, types: ['armor'] },
  { value: 'arm_type', label: '<Type> Armor',        cost: null, types: ['armor'] },
  { value: 'hp_1',     label: '+1 Maximum Health',   cost: 1, types: ['accessory'] },
  { value: 'hp_2',     label: '+2 Maximum Health',   cost: 2, types: ['accessory'] },
];

const ITEM_TYPES = [
  { value: 'weapon',    label: 'Magic Weapon' },
  { value: 'armor',     label: 'Magic Armor' },
  { value: 'accessory', label: 'Magic Accessory' },
  { value: 'talisman',  label: 'Talisman' },
  { value: 'custom',    label: 'Custom Item' },
];

const ENERGY_TYPES = [
  'Vitae (Vampire)',
  'Gnosis (Shifter)',
  'Pathos (Wraith)',
  'Essence (Human / Sorcerer)',
  'Vitality',
];

const FACTION_CODE = {
  'Vitae (Vampire)':            'V',
  'Gnosis (Shifter)':           'S',
  'Pathos (Wraith)':            'W',
  'Essence (Human / Sorcerer)': 'H',
  'Vitality':                   'H',
};

const RITUAL_COSTS   = { simple: 1, complex: 2, expert: 3, cryptic: 10 };
const RITUAL_LABELS  = { simple: 'Simple / Public', complex: 'Complex / Guarded', expert: 'Expert / Secret', cryptic: 'Cryptic' };

const RESTRICTION_MSG = {
  'npc-only':                  '⛔ NPC-Only — cannot be placed on items.',
  'not-for-items':             '⛔ Not intended for items per rulebook.',
  'fundamental-or-merit-only': '⛔ Fundamental / Merit-only — cannot be placed on items.',
};

// ── Pure helpers (same logic as MagicItemWizard) ──────────────────────────────
function getPowerRestriction(power) {
  if (!power) return null;
  if (/NPC Only/i.test(power.description))              return 'npc-only';
  if (/Not intended for items/i.test(power.description)) return 'not-for-items';
  const tokens = power.sources.split(' ');
  if (tokens.every(t => t === 'M' || /^[A-Z][A-Z]?f\d*$/.test(t))) return 'fundamental-or-merit-only';
  return null;
}

function detectModifiers(power, energyType) {
  if (!power) return { level: null, notAvailable: false, rare: false, corrupted: false };
  const tokens = power.sources.split(' ');
  const fc = FACTION_CODE[energyType] || null;
  const levelTokens = tokens.filter(t => /^[VSHWK]/.test(t) && !/^C/.test(t));
  const nums = levelTokens.map(t => { const m = t.match(/\d+/); return m ? parseInt(m[0]) : null; }).filter(Boolean);
  const level = nums.length ? Math.min(...nums) : null;
  if (!fc) return { level, notAvailable: false, rare: false, corrupted: false };
  const fTokens = tokens.filter(t => t.startsWith(fc) || (fc === 'W' && t === 'Wt'));
  return {
    level,
    notAvailable: fTokens.length === 0,
    rare:         fTokens.some(t => /[A-Z]r\d/.test(t)),
    corrupted:    fTokens.some(t => /[A-Z]c\d/.test(t) || t === 'Wt'),
  };
}

function calcBaseAttunement(b1, b2, isRelic, isArtifact, isTainted) {
  let t = 0;
  const addBenefit = b => {
    if (!b.type || b.powerRestriction) return;
    if (b.type === 'dmg_type') {
      t += b.typeIdx !== null && DAMAGE_TYPES[b.typeIdx] ? DAMAGE_TYPES[b.typeIdx].weapon : 0;
    } else if (b.type === 'arm_type') {
      t += b.typeIdx !== null && DAMAGE_TYPES[b.typeIdx] ? (DAMAGE_TYPES[b.typeIdx].armor ?? 0) : 0;
    } else {
      t += BENEFIT_COST[b.type] || 0;
    }
    if (b.type.startsWith('power')) {
      if (b.notAvailable) t += 2;
      if (b.rare) t += 1;
      if (b.corrupted && !isTainted) t += 2;
    }
  };
  addBenefit(b1);
  addBenefit(b2);
  if (isRelic && !isArtifact) t += 1;
  if (isTainted) t -= 4;
  return Math.max(1, t);
}

const isPower   = t => t && t.startsWith('power');
const needsType = t => t === 'dmg_type' || t === 'arm_type';
const blankB    = () => ({ type: '', powerName: '', powerSources: '', powerRestriction: null, typeIdx: null, notAvailable: false, rare: false, corrupted: false, autoDetected: false });

// ── Power search dropdown (same as MagicItemWizard) ───────────────────────────
function PowerSearch({ value, sources, restriction, onSelect, energyType, inp }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return powersData.filter(p => p.name.toLowerCase().includes(q)).slice(0, 14);
  }, [query]);

  const handleSelect = p => {
    const r = getPowerRestriction(p);
    onSelect(p, r, detectModifiers(p, energyType));
    setQuery(p.name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <input type="text" placeholder="Search power…" value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { if (query) setOpen(true); }}
        className={inp + (restriction ? ' !border-red-500' : value && !restriction ? ' !border-green-700' : '')}
      />
      {value && !restriction && sources && <div className="text-xs text-gray-500 mt-1 font-mono">{sources}</div>}
      {open && matches.length > 0 && (
        <ul className="absolute z-30 w-full bg-gray-800 border border-gray-600 rounded-md shadow-xl mt-1 max-h-56 overflow-y-auto">
          {matches.map(p => {
            const r = getPowerRestriction(p);
            return (
              <li key={p.name} onMouseDown={() => handleSelect(p)}
                className={`px-3 py-2 text-sm cursor-pointer flex justify-between gap-2 ${r ? 'text-red-400 hover:bg-red-900/30' : 'text-white hover:bg-gray-700'}`}>
                <span className="truncate">{p.name}</span>
                <span className="text-xs text-gray-500 shrink-0">{p.sources}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Item sub-builder (no flaws) ───────────────────────────────────────────────
function ItemBuilder({ energyType, inp, lbl, onCalc }) {
  const [itemName, setItemName]   = useState('');
  const [itemType, setItemType]   = useState('accessory');
  const [isRelic, setIsRelic]     = useState(false);
  const [isArtifact, setIsArtifact] = useState(false);
  const [isTainted, setIsTainted] = useState(false);
  const [b1, setB1] = useState(blankB());
  const [b2, setB2] = useState(blankB());
  const [adjX, setAdjX] = useState(0); // lower attunement X (costs +X tokens)
  const [adjY, setAdjY] = useState(0); // raise attunement Y (saves Y tokens)

  const baseAtt  = calcBaseAttunement(b1, b2, isRelic, isArtifact, isTainted);
  const finalAtt = Math.max(1, baseAtt + adjY - adjX);
  const tokenCost = Math.max(1, (baseAtt - adjY) + adjX);

  // Notify parent of current values
  useEffect(() => { onCalc({ itemName, itemType, b1, b2, baseAtt, adjX, adjY, finalAtt, tokenCost, isRelic, isArtifact, isTainted }); },
    [itemName, itemType, b1, b2, baseAtt, adjX, adjY, finalAtt, tokenCost, isRelic, isArtifact, isTainted]); // eslint-disable-line react-hooks/exhaustive-deps

  const getOptions = otherB => {
    const og = otherB?.type ? BENEFIT_GROUP[otherB.type] : null;
    return ALL_BENEFITS.filter(o => o.types.includes(itemType) && !(og && BENEFIT_GROUP[o.value] === og));
  };

  const updateB = (setter, field, val) => setter(prev => ({ ...prev, [field]: val }));

  const handlePowerSelect = (setter, curType) => (p, restriction, mods) => {
    const lt = mods.level ? `power_${mods.level}` : (isPower(curType) ? curType : 'power_1');
    setter(prev => ({
      ...prev, type: restriction ? prev.type : lt,
      powerName: p.name, powerSources: p.sources, powerRestriction: restriction,
      notAvailable: restriction ? false : mods.notAvailable,
      rare:         restriction ? false : mods.rare,
      corrupted:    restriction ? false : mods.corrupted,
      autoDetected: !restriction,
    }));
  };

  useEffect(() => {
    const invalid = b => b.type && !ALL_BENEFITS.find(x => x.value === b.type && x.types.includes(itemType));
    if (invalid(b1)) setB1(blankB());
    if (invalid(b2)) setB2(blankB());
  }, [itemType]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderBenefit = (b, setB, idx, other) => (
    <div className="space-y-2">
      <label className={lbl}>Benefit {idx}</label>
      <select value={b.type} onChange={e => setB({ ...blankB(), type: e.target.value })} className={inp}>
        <option value="">— None —</option>
        {getOptions(other).map(o => <option key={o.value} value={o.value}>{o.label}{o.cost !== null ? ` (${o.cost})` : ' (see type)'}</option>)}
      </select>
      {isPower(b.type) && (
        <>
          <PowerSearch value={b.powerName} sources={b.powerSources} restriction={b.powerRestriction}
            energyType={energyType} onSelect={handlePowerSelect(setB, b.type)} inp={inp} />
          {b.powerRestriction && <div className="text-red-400 text-xs">{RESTRICTION_MSG[b.powerRestriction]}</div>}
          {!b.powerRestriction && b.powerName && (
            <>
              {b.autoDetected && <p className="text-xs text-green-400">✓ Auto-detected modifiers</p>}
              <div className="grid grid-cols-3 gap-1 text-xs">
                {[['notAvailable','Not available (+2)'],['rare','Rare (+1)'],['corrupted','Corrupt (+2 if not Tainted)']].map(([id, label]) => (
                  <label key={id} className={`flex items-start gap-1 p-1.5 rounded border cursor-pointer ${b[id] ? 'bg-yellow-900 border-yellow-600 text-yellow-200' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                    <input type="checkbox" className="mt-0.5 shrink-0" checked={b[id]} onChange={e => updateB(setB, id, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
              <select value={b.type} onChange={e => updateB(setB, 'type', e.target.value)} className={inp}>
                <option value="power_1">Level 1 (cost 2)</option>
                <option value="power_2">Level 2 (cost 4)</option>
                <option value="power_3">Level 3 (cost 6)</option>
              </select>
            </>
          )}
        </>
      )}
      {needsType(b.type) && (
        <div>
          <select
            value={b.typeIdx ?? ''}
            onChange={e => updateB(setB, 'typeIdx', e.target.value === '' ? null : parseInt(e.target.value))}
            className={inp}
          >
            <option value="">— Select Type —</option>
            {DAMAGE_TYPES.filter(dt => b.type === 'arm_type' ? dt.armor !== null : true).map((dt, i) => {
              const cost = b.type === 'arm_type' ? dt.armor : dt.weapon;
              return <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} (+{cost})</option>;
            })}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Item Name</label>
        <input type="text" placeholder="Item name" value={itemName} onChange={e => setItemName(e.target.value)} className={inp} />
      </div>
      <div>
        <label className={lbl}>Item Type</label>
        <select value={itemType} onChange={e => setItemType(e.target.value)} className={inp}>
          {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="flex gap-4 text-sm flex-wrap">
        {[['Relic (+1)', isRelic, setIsRelic],['Artifact (no Relic bonus)', isArtifact, setIsArtifact],['Tainted (-4)', isTainted, setIsTainted]].map(([label, val, set]) => (
          <label key={label} className="flex items-center gap-2 cursor-pointer text-gray-300">
            <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="accent-yellow-500" />{label}
          </label>
        ))}
      </div>
      {renderBenefit(b1, setB1, 1, b2)}
      <hr className="border-gray-700" />
      {renderBenefit(b2, setB2, 2, b1)}

      {/* Attunement adjustment */}
      <div className="bg-gray-900 rounded p-3 space-y-3 border border-gray-600">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Base Attunement</span>
          <span className="font-mono text-white">{baseAtt}</span>
        </div>
        <div>
          <label className={lbl}>Lower attunement by {adjX} (pay +{adjX} tokens)</label>
          <input type="range" min={0} max={5} value={adjX} onChange={e => setAdjX(Number(e.target.value))} className="w-full accent-yellow-500" />
          <div className="flex justify-between text-xs text-gray-500"><span>0</span><span>5</span></div>
        </div>
        <div>
          <label className={lbl}>Raise attunement by {adjY} (save {adjY} tokens)</label>
          <input type="range" min={0} max={5} value={adjY} onChange={e => setAdjY(Number(e.target.value))} className="w-full accent-yellow-500" />
          <div className="flex justify-between text-xs text-gray-500"><span>0</span><span>5</span></div>
        </div>
        <div className="flex justify-between text-sm pt-1 border-t border-gray-700">
          <span className="text-gray-300">Final tag attunement</span>
          <span className="font-bold text-white">{finalAtt}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Token cost</span>
          <span className="font-bold text-yellow-300 text-lg">{tokenCost} tokens</span>
        </div>
      </div>
      <p className="text-xs text-amber-400">⚠ No flaws allowed on compensation items. Story required for XO.</p>
      <TagPreview
        itemName={itemName} itemType={itemType} energyType={energyType}
        finalAtt={finalAtt} tokenCost={tokenCost}
        isRelic={isRelic} isArtifact={isArtifact} isTainted={isTainted}
        b1={b1} b2={b2}
      />
    </div>
  );
}

function TagPreview({ itemName, itemType, energyType, finalAtt, tokenCost, isRelic, isArtifact, isTainted, b1, b2 }) {
  const lines = [];
  function descBenefit(b) {
    if (!b.type) return null;
    if (b.type === 'dmg_type' && b.typeIdx !== null && DAMAGE_TYPES[b.typeIdx]) return `${DAMAGE_TYPES[b.typeIdx].label} Damage`;
    if (b.type === 'arm_type' && b.typeIdx !== null && DAMAGE_TYPES[b.typeIdx]) return `${DAMAGE_TYPES[b.typeIdx].label} Armor`;
    if (b.type.startsWith('power') && b.powerName && !b.powerRestriction) return `Power: ${b.powerName}`;
    const def = ALL_BENEFITS.find(x => x.value === b.type);
    return def ? def.label : null;
  }
  const l1 = descBenefit(b1); if (l1) lines.push(l1);
  const l2 = descBenefit(b2); if (l2) lines.push(l2);
  if (isRelic && !isArtifact) lines.push('Relic');
  if (isArtifact) lines.push('Artifact');
  if (isTainted) lines.push('TAINTED');

  return (
    <div className="mt-4 rounded-lg overflow-hidden shadow-xl border-2 border-gray-800 font-serif">
      <div className="bg-[#5c1a0a] px-4 pt-3 pb-2.5 text-center">
        <div className="text-white font-black text-base tracking-wide uppercase">{itemName || '[ Item Name ]'}</div>
      </div>
      <div className="bg-[#e8d5b0] px-4 py-1.5 text-center border-b border-[#b89060]">
        <span className="text-[#5c1a0a] text-xs font-bold uppercase tracking-widest">{ITEM_TYPES.find(t => t.value === itemType)?.label || itemType}</span>
        <span className="text-[#8b6914] text-xs mx-2">·</span>
        <span className="text-[#5c1a0a] text-xs uppercase tracking-wider">{energyType || '—'}</span>
      </div>
      <div className="bg-[#fdf6e3] px-4 py-3">
        {lines.length === 0
          ? <div className="text-[#9a7a4a] text-xs text-center italic">(no selections)</div>
          : <ul className="space-y-1">{lines.map((l, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-900">
                <span className="text-[#7a200d] shrink-0">◆</span>
                <span>{l}</span>
              </li>
            ))}</ul>
        }
      </div>
      <div className="bg-[#e8d5b0] border-t border-[#b89060] px-4 py-2 flex justify-between items-center">
        <span className="text-[#5c1a0a] text-xs uppercase tracking-widest font-bold">Attunement: <span className={`font-black text-lg ${finalAtt >= 10 ? 'text-red-700' : finalAtt >= 6 ? 'text-amber-800' : 'text-green-700'}`}>{finalAtt}</span></span>
        <span className="text-[#5c1a0a] font-bold text-sm">{tokenCost} tokens</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
// ST-only and unlearnable tree IDs — mirrored from App.js
const ST_TEACH_ONLY = new Set(['nephandi','khan_gift','simba_gift','gurahl_gift','umfalla','mokole_gift','rokea_gift','abombwe','ogham','serpentis','spiritus','thaumaturgy_rego_viridi']);
const TEACH_UNLEARNABLE = new Set(['visceratika','mytherceria','nagah_gift']);
// per-energy filter: Vitality = commoner/faithful human trees; Essence = sorcerer trees
const TEACH_ENERGY_FILTER = {
  Vitae:    t => t.faction === 'vampire',
  Gnosis:   t => t.faction === 'shifter',
  Pathos:   t => t.faction === 'wraith',
  Essence:  t => t.faction === 'human' && ['sorcerer','fellowship','fallen_path'].includes(t.group),
  Vitality: t => t.faction === 'human' && ['talent','bounty'].includes(t.group),
};
const TEACH_GROUP_LABELS = {
  common:           'Common Disciplines',
  clan_innate:      'Clan Disciplines',
  thaumaturgy:      'Thaumaturgy Paths',
  dark_thaumaturgy: 'Dark Thaumaturgy',
  auspice:          'Auspice Gifts',
  breed:            'Breed Gifts',
  tribe_gift:       'Tribe Gifts',
  fera_gift:        'Fera Gifts',
  wyrm_gift:        'Wyrm Gifts',
  arcanos:          'Arcanoi',
  dark_arcanos:     'Dark Arcanoi',
  sorcerer:         'Sorcery',
  fellowship:       'Fellowships',
  fallen_path:      'Fallen Paths',
  talent:           'Talents',
  bounty:           'Bounties',
};
const TEACH_GROUP_ORDER = {
  Vitae:    ['common', 'clan_innate', 'thaumaturgy', 'dark_thaumaturgy'],
  Gnosis:   ['auspice', 'breed', 'tribe_gift', 'fera_gift', 'wyrm_gift'],
  Pathos:   ['arcanos', 'dark_arcanos'],
  Essence:  ['sorcerer', 'fellowship', 'fallen_path'],
  Vitality: ['talent', 'bounty'],
};

const TokenWizard = ({ onBack, powerTrees = [], skills = [] }) => {
  const [unlocked, setUnlocked] = useState(isTrustedUser);
  const [pwInput, setPwInput]   = useState('');
  const [pwError, setPwError]   = useState(false);

  const [charName, setCharName]       = useState('');
  const [energyType, setEnergyType]   = useState('');
  const [totalTokens, setTotalTokens] = useState(30);
  const [activeTab, setActiveTab]     = useState('xp');

  // Per-tab form state
  const [xpTokens, setXpTokens]         = useState(1);
  const [silverTokens, setSilverTokens] = useState(1);

  const [teachMode, setTeachMode]            = useState('power');
  const [teachSkillName, setTeachSkillName]   = useState('');
  const [teachEnergyType, setTeachEnergyType] = useState('');
  const [teachTreeId, setTeachTreeId]         = useState('');
  const [teachLevel, setTeachLevel]           = useState(1);

  const [ritualName, setRitualName]       = useState('');
  const [ritualType, setRitualType]       = useState('simple');
  const [ritualDouble, setRitualDouble]   = useState(false);

  const [itemCalc, setItemCalc] = useState(null); // from ItemBuilder onCalc

  // Cart
  const [cart, setCart] = useState([]);
  const nextId = useRef(1);

  const addToCart = (item) => { setCart(c => [...c, { ...item, id: nextId.current++ }]); };
  const removeFromCart = (id) => { setCart(c => c.filter(x => x.id !== id)); };

  const totalSpent   = cart.reduce((s, x) => s + x.tokens, 0);
  const remaining    = totalTokens - totalSpent;

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (!unlocked) {
    const tryUnlock = () => { if (pwInput === ST_PASSWORD) { sessionStorage.setItem('stSessionUnlocked', 'true'); setUnlocked(true); } else setPwError(true); };
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 w-80 shadow-xl text-center">
          <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-1">Token Reward Calculator</h2>
          <p className="text-gray-400 text-sm mb-5">Storyteller access required</p>
          <input type="password" autoFocus placeholder="ST Password" value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={e => { if (e.key === 'Enter') tryUnlock(); if (e.key === 'Escape') onBack(); }}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          {pwError && <p className="text-red-400 text-xs mb-2">Incorrect password.</p>}
          <div className="flex gap-2">
            <button onClick={onBack} className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded">Cancel</button>
            <button onClick={tryUnlock} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded font-semibold">Unlock</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inp = "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500";
  const lbl = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1";
  const sec = "bg-gray-800 border border-gray-700 rounded-lg p-5 space-y-4";

  // ── Ritual cost ─────────────────────────────────────────────────────────────
  const ritualBaseCost = RITUAL_COSTS[ritualType] || 1;
  const ritualFinalCost = ritualDouble ? ritualBaseCost * 2 : ritualBaseCost;

  // ── Tab content ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'xp',      label: 'XP' },
    { id: 'silver',  label: 'Silver' },
    { id: 'teach',   label: 'Teaching' },
    { id: 'ritual',  label: 'Ritual' },
    { id: 'item',    label: 'Magic Item' },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'xp':
        return (
          <div className="space-y-4">
            <div>
              <label className={lbl}>Tokens to spend on XP: {xpTokens} → {xpTokens * 3} XP</label>
              <input type="range" min={1} max={30} value={xpTokens} onChange={e => setXpTokens(Number(e.target.value))} className="w-full accent-yellow-500" />
              <div className="flex justify-between text-xs text-gray-500"><span>1 token (3 XP)</span><span>30 tokens (90 XP)</span></div>
            </div>
            <div className="bg-gray-900 rounded p-3 text-sm flex justify-between border border-gray-600">
              <span className="text-gray-300">{xpTokens} token{xpTokens > 1 ? 's' : ''}</span>
              <span className="font-bold text-blue-300">+{xpTokens * 3} XP</span>
            </div>
            <button onClick={() => addToCart({ type: 'xp', tokens: xpTokens, label: `${xpTokens * 3} XP`, detail: `${xpTokens} token${xpTokens > 1 ? 's' : ''}` })}
              className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded font-semibold">
              Add to Cart
            </button>
          </div>
        );

      case 'silver':
        return (
          <div className="space-y-4">
            <div>
              <label className={lbl}>Tokens → Silver (1:1)</label>
              <input type="number" min={1} max={totalTokens} value={silverTokens}
                onChange={e => setSilverTokens(Math.max(1, Number(e.target.value)))} className={inp} />
            </div>
            <div className="bg-gray-900 rounded p-3 text-sm flex justify-between border border-gray-600">
              <span className="text-gray-300">{silverTokens} token{silverTokens > 1 ? 's' : ''}</span>
              <span className="font-bold text-yellow-300">+{silverTokens} Silver</span>
            </div>
            <button onClick={() => addToCart({ type: 'silver', tokens: silverTokens, label: `${silverTokens} Silver`, detail: `${silverTokens} token${silverTokens > 1 ? 's' : ''}` })}
              className="w-full py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded font-semibold">
              Add to Cart
            </button>
          </div>
        );

      case 'teach': {
        const ENERGY_OPTS = ['Vitae', 'Gnosis', 'Pathos', 'Essence', 'Vitality'];
        const availableTrees = powerTrees.filter(t =>
          TEACH_ENERGY_FILTER[teachEnergyType]?.(t) && !TEACH_UNLEARNABLE.has(t.tree_id)
        ).sort((a, b) => {
          const aS = ST_TEACH_ONLY.has(a.tree_id) ? 1 : 0;
          const bS = ST_TEACH_ONLY.has(b.tree_id) ? 1 : 0;
          if (aS !== bS) return aS - bS;
          return a.tree_name.localeCompare(b.tree_name);
        });
        const selectedTree = availableTrees.find(t => t.tree_id === teachTreeId);
        const isSTTree = teachMode === 'power' && ST_TEACH_ONLY.has(teachTreeId);
        const teachTokens = teachMode === 'skill' ? 1 : (isSTTree ? 5 : 1);
        const previewLabel = teachMode === 'skill'
          ? (teachSkillName.trim() || '—')
          : selectedTree
            ? `${selectedTree.tree_name} Lv${teachLevel} (${selectedTree[`level${teachLevel}_powers`] || '—'})`
            : '—';
        const canAdd = teachMode === 'skill' ? !!teachSkillName.trim() : !!selectedTree;
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              {['power', 'skill'].map(m => (
                <button key={m} onClick={() => setTeachMode(m)}
                  className={`flex-1 py-1.5 text-sm rounded font-medium capitalize ${teachMode === m ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                >{m}</button>
              ))}
            </div>
            {teachMode === 'skill' ? (
              <div>
                <label className={lbl}>Skill</label>
                <select value={teachSkillName} onChange={e => setTeachSkillName(e.target.value)} className={inp}>
                  <option value="">Select skill…</option>
                  {skills.map(s => {
                    const label = s.skill_id === 'alchemy' ? 'Alchemy (Sorcerer only)'
                                : s.skill_id === 'holy_water' ? 'Holy Water (Human only)'
                                : s.skill_name;
                    return <option key={s.skill_id} value={s.skill_name}>{label}</option>;
                  })}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className={lbl}>Energy Type</label>
                  <select value={teachEnergyType}
                    onChange={e => { setTeachEnergyType(e.target.value); setTeachTreeId(''); }}
                    className={inp}>
                    <option value="">Select energy type…</option>
                    {ENERGY_OPTS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                {teachEnergyType && (() => {
                  const normalTrees = availableTrees.filter(t => !ST_TEACH_ONLY.has(t.tree_id));
                  const stTrees = availableTrees.filter(t => ST_TEACH_ONLY.has(t.tree_id));
                  const groupOrder = TEACH_GROUP_ORDER[teachEnergyType] || [];
                  const grouped = {};
                  normalTrees.forEach(t => { (grouped[t.group] ??= []).push(t); });
                  const orderedKeys = [
                    ...groupOrder.filter(g => grouped[g]),
                    ...Object.keys(grouped).filter(g => !groupOrder.includes(g)),
                  ];
                  return (
                    <div>
                      <label className={lbl}>Power Tree</label>
                      <select value={teachTreeId} onChange={e => setTeachTreeId(e.target.value)} className={inp}>
                        <option value="">Select tree…</option>
                        {orderedKeys.map(g => (
                          <optgroup key={g} label={TEACH_GROUP_LABELS[g] || g}>
                            {grouped[g].sort((a, b) => a.tree_name.localeCompare(b.tree_name)).map(t =>
                              <option key={t.tree_id} value={t.tree_id}>{t.tree_name}</option>
                            )}
                          </optgroup>
                        ))}
                        {stTrees.length > 0 && (
                          <optgroup label="── ST NPC Trees (5 tokens) ──">
                            {stTrees.sort((a, b) => a.tree_name.localeCompare(b.tree_name)).map(t =>
                              <option key={t.tree_id} value={t.tree_id}>[ST] {t.tree_name}</option>
                            )}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  );
                })()}
                {teachTreeId && (
                  <div>
                    <label className={lbl}>Level</label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(lvl => (
                        <button key={lvl} onClick={() => setTeachLevel(lvl)}
                          className={`flex-1 py-2 text-sm rounded font-bold ${teachLevel === lvl ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >{lvl}</button>
                      ))}
                    </div>
                    {selectedTree && (
                      <div className="text-xs text-gray-400 mt-1">{selectedTree[`level${teachLevel}_powers`]}</div>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="bg-gray-900 rounded p-3 text-sm flex justify-between border border-gray-600">
              <span className="text-gray-300 truncate mr-2">Teaching: {previewLabel}</span>
              <span className={`font-bold shrink-0 ${isSTTree ? 'text-amber-300' : 'text-purple-300'}`}>
                {teachTokens} token{teachTokens > 1 ? 's' : ''}
              </span>
            </div>
            {isSTTree && <p className="text-xs text-amber-400">⚠ ST NPC Tree — 5 tokens. Story required for XO.</p>}
            {teachMode === 'skill' && <p className="text-xs text-amber-400">⚠ Story required for XO explaining how training was acquired.</p>}
            <button
              disabled={!canAdd}
              onClick={() => {
                if (!canAdd) return;
                const finalLabel = teachMode === 'skill'
                  ? `Teaching: ${teachSkillName}`
                  : `Teaching: ${selectedTree.tree_name} Lv${teachLevel}${isSTTree ? ' [ST NPC]' : ''}`;
                addToCart({ type: 'teach', tokens: teachTokens, label: finalLabel, detail: `${teachTokens} token${teachTokens > 1 ? 's' : ''}`, isST: isSTTree });
                if (teachMode === 'skill') setTeachSkillName('');
                else { setTeachTreeId(''); setTeachLevel(1); }
              }}
              className="w-full py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded font-semibold"
            >Add to Cart</button>
          </div>
        );
      }

      case 'ritual':
        return (
          <div className="space-y-4">
            <div>
              <label className={lbl}>Ritual Name</label>
              <input type="text" placeholder="e.g. Rite of Cleansing" value={ritualName} onChange={e => setRitualName(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Complexity</label>
              <select value={ritualType} onChange={e => setRitualType(e.target.value)} className={inp}>
                {Object.entries(RITUAL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v} — {RITUAL_COSTS[k]} token{RITUAL_COSTS[k] > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
              <input type="checkbox" checked={ritualDouble} onChange={e => setRitualDouble(e.target.checked)} className="accent-yellow-500" />
              ×2 modifier (normally can't gain via check-in, or subfaction/Lore mismatch on Cryptic)
            </label>
            <div className="bg-gray-900 rounded p-3 text-sm flex justify-between border border-gray-600">
              <span className="text-gray-300">{RITUAL_LABELS[ritualType]}{ritualDouble ? ' ×2' : ''}</span>
              <span className="font-bold text-green-300">{ritualFinalCost} token{ritualFinalCost > 1 ? 's' : ''}</span>
            </div>
            {ritualType === 'cryptic' && (
              <p className="text-xs text-amber-400">⚠ Story must be written and provided to XO for Cryptic rituals.</p>
            )}
            <button onClick={() => { if (!ritualName.trim()) return; addToCart({ type: 'ritual', tokens: ritualFinalCost, label: `${RITUAL_LABELS[ritualType]}: ${ritualName}`, detail: `${ritualFinalCost} token${ritualFinalCost > 1 ? 's' : ''}${ritualDouble ? ' (×2)' : ''}` }); setRitualName(''); setRitualDouble(false); }}
              className="w-full py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded font-semibold">
              Add to Cart
            </button>
          </div>
        );

      case 'item':
        return (
          <div className="space-y-4">
            <ItemBuilder energyType={energyType} inp={inp} lbl={lbl} onCalc={setItemCalc} />
            <button
              disabled={!itemCalc || itemCalc.tokenCost <= 0}
              onClick={() => {
                if (!itemCalc) return;
                const benefitLines = [itemCalc.b1, itemCalc.b2].filter(b => b.type && !b.powerRestriction).map(b => {
                  if (isPower(b.type)) return `${b.powerName || '<Power>'} (Lv${b.type.split('_')[1]})`;
                  const bDef = ALL_BENEFITS.find(x => x.value === b.type);
      if ((b.type === 'dmg_type' || b.type === 'arm_type') && b.typeIdx !== null && DAMAGE_TYPES[b.typeIdx]) {
        return `${bDef?.label || b.type}: ${DAMAGE_TYPES[b.typeIdx].label}`;
      }
      return bDef?.label || b.type;
                });
                const desc = `${itemCalc.itemName || 'Unnamed Item'} — Att ${itemCalc.finalAtt} (${energyType || 'Energy Type TBD'})`;
                addToCart({
                  type: 'item',
                  tokens: itemCalc.tokenCost,
                  label: desc,
                  detail: `Base att ${itemCalc.baseAtt}${itemCalc.adjX ? ` −${itemCalc.adjX} att` : ''}${itemCalc.adjY ? ` +${itemCalc.adjY} att` : ''}${benefitLines.length ? ` | ${benefitLines.join(', ')}` : ''}`,
                });
              }}
              className="w-full py-2 bg-orange-700 hover:bg-orange-600 disabled:opacity-40 text-white text-sm rounded font-semibold">
              Add to Cart
            </button>
          </div>
        );

      default: return null;
    }
  };

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">← Back</button>
        <Coins className="w-5 h-5 text-yellow-400" />
        <h1 className="text-lg font-bold text-yellow-400 mr-auto">Token Reward Calculator</h1>
        <span className="text-xs text-gray-500">🔓 ST Mode</span>
      </div>

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: Input ───────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Character + token balance */}
          <div className={sec}>
            <h2 className="font-bold text-yellow-300 text-sm uppercase tracking-wide">Character & Token Balance</h2>
            <div>
              <label className={lbl}>Character Name</label>
              <input type="text" placeholder="Character name" value={charName} onChange={e => setCharName(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Energy Type (for item auto-detect)</label>
              <select value={energyType} onChange={e => setEnergyType(e.target.value)} className={inp}>
                <option value="">— Select Energy Type —</option>
                {ENERGY_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Tokens Available</label>
              <input type="number" min={1} max={300} value={totalTokens} onChange={e => setTotalTokens(Math.max(1, Number(e.target.value)))} className={inp} />
              <p className="text-xs text-gray-500 mt-1">Standard: 30 tokens per drop. Adjust if carrying over unspent tokens.</p>
            </div>
          </div>

          {/* Spend builder */}
          <div className={sec}>
            <h2 className="font-bold text-yellow-300 text-sm uppercase tracking-wide">Add Spend</h2>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 text-xs rounded font-semibold transition-colors ${activeTab === t.id ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="pt-1">{renderTab()}</div>
          </div>
        </div>

        {/* ── RIGHT: Cart + Summary ─────────────────────────────────────────── */}
        <div className="space-y-5 lg:sticky lg:top-16 lg:self-start">

          {/* Token balance bar */}
          <div className={sec}>
            <h2 className="font-bold text-yellow-300 text-sm uppercase tracking-wide">Token Summary</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-700 rounded p-3">
                <div className="text-2xl font-bold text-white">{totalTokens}</div>
                <div className="text-xs text-gray-400">Available</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-2xl font-bold text-red-400">{totalSpent}</div>
                <div className="text-xs text-gray-400">Spent</div>
              </div>
              <div className={`rounded p-3 ${remaining < 0 ? 'bg-red-900 border border-red-600' : 'bg-gray-700'}`}>
                <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-300' : 'text-green-300'}`}>{remaining}</div>
                <div className="text-xs text-gray-400">Remaining</div>
              </div>
            </div>
            {remaining < 0 && (
              <div className="bg-red-950 border border-red-700 rounded px-3 py-2 text-red-300 text-xs font-semibold">
                ⛔ Over budget by {Math.abs(remaining)} token{Math.abs(remaining) > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Cart items */}
          <div className={sec}>
            <h2 className="font-bold text-yellow-300 text-sm uppercase tracking-wide">
              Cart <span className="text-gray-500 font-normal">({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
            </h2>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm">No spends added yet.</p>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="bg-gray-700 rounded px-3 py-2 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.detail}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-yellow-300 font-bold text-sm">{item.tokens}t</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-400 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary by type */}
          {cart.length > 0 && (
            <div className={sec}>
              <h2 className="font-bold text-yellow-300 text-sm uppercase tracking-wide">Summary for {charName || 'Character'}</h2>
              {(() => {
                const xpTotal    = cart.filter(x => x.type === 'xp').reduce((s, x) => s + x.tokens * 3, 0);
                const silverTotal = cart.filter(x => x.type === 'silver').reduce((s, x) => s + x.tokens, 0);
                const teachings  = cart.filter(x => x.type === 'teach');
                const rituals    = cart.filter(x => x.type === 'ritual');
                const items      = cart.filter(x => x.type === 'item');
                return (
                  <div className="space-y-2 text-sm">
                    {xpTotal > 0    && <div className="flex justify-between"><span className="text-blue-300">XP gained</span><span className="font-bold">+{xpTotal} XP</span></div>}
                    {silverTotal > 0 && <div className="flex justify-between"><span className="text-yellow-300">Silver gained</span><span className="font-bold">+{silverTotal} Silver</span></div>}
                    {teachings.map(t => <div key={t.id} className="text-purple-300">✓ {t.label}</div>)}
                    {rituals.map(r => <div key={r.id} className="text-green-300">✓ {r.label}</div>)}
                    {items.map(i => <div key={i.id} className="text-orange-300">✓ {i.label}</div>)}
                    {(rituals.length > 0 || items.length > 0 || teachings.length > 0) && (
                      <p className="text-xs text-amber-400 pt-1">⚠ Story required for XO approval on rituals, items, and ST NPC teachings.</p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TokenWizard;
