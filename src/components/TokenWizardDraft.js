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

// ── 2026 item rules constants ─────────────────────────────────────────────────
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
};

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
  'npc-only':                  '⛔ NPC-Only — cannot be placed on items.',
  'not-for-items':             '⛔ Not intended for items per rulebook.',
  'fundamental-or-merit-only': '⛔ Fundamental / Merit-only — cannot be placed on items.',
};

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

const RITUAL_COSTS  = { simple: 1, complex: 2, expert: 3, cryptic: 10 };
const RITUAL_LABELS = { simple: 'Simple / Public', complex: 'Complex / Guarded', expert: 'Expert / Secret', cryptic: 'Cryptic' };

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
        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none text-sm"
        placeholder="Search powers…"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (results.length > 0 || !query.trim()) && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded max-h-52 overflow-y-auto shadow-xl">
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
                {restriction && <span className="ml-2 text-xs">⛔</span>}
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

function TagPreview2026({ itemName, itemType, energyType, finalAtt, tokenCost, isKlaive, klaiveGrand, isKlaiveUnfinished, isTainted, slot1, slot2, benefit2Type, passiveKey, passiveDmgType, passiveArmorType, passive2Key, passive2DmgType, passive2ArmorType, scorchType }) {
  const passiveOptions = getPassiveOptions(itemType);
  const lines = [];
  if (isKlaive) {
    lines.push(isKlaiveUnfinished ? '⚠ Unfinished Klaive — requires char attunement' : (klaiveGrand ? 'Grand Klaive' : 'Klaive'));
    lines.push('Agg Damage');
  }
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
  if (scorchType !== null && DAMAGE_TYPES[scorchType]) lines.push(`Scorch: ${DAMAGE_TYPES[scorchType].label}`);
  if (isTainted) lines.push('TAINTED');

  return (
    <div className="mt-4 rounded-lg overflow-hidden shadow-xl border-2 border-gray-800 font-serif">
      <div className="bg-[#5c1a0a] px-4 pt-3 pb-2.5 text-center">
        <div className="text-white font-black text-base tracking-wide uppercase">{itemName || '[ Item Name ]'}</div>
      </div>
      <div className="bg-[#e8d5b0] px-4 py-1.5 text-center border-b border-[#b89060]">
        <span className="text-[#5c1a0a] text-xs font-bold uppercase tracking-widest">{itemType.charAt(0).toUpperCase() + itemType.slice(1)}</span>
        <span className="text-[#8b6914] text-xs mx-2">·</span>
        <span className="text-[#5c1a0a] text-xs uppercase tracking-wider">{energyType || '—'}</span>
      </div>
      {isTainted && (
        <div className="bg-[#fdf6e3] px-4 py-1 flex justify-center border-b border-[#c9a96e]/40">
          <span className="text-xs bg-red-100 border border-red-400 text-red-700 px-2 py-0.5 rounded font-bold">⚠ TAINTED</span>
        </div>
      )}
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

// ── 2026 Item sub-builder (no flaws for compensation items) ───────────────────
function ItemBuilder2026({ energyType: parentEnergy, inp, lbl, onCalc }) {
  const [itemName, setItemName]   = useState('');
  const [itemType, setItemType]   = useState('weapon');
  const [energyType, setEnergyType] = useState(parentEnergy || 'Vitae (Vampire)');
  const [isTainted, setIsTainted] = useState(false);
  const [slot1, setSlot1]         = useState(blankSlot());
  const [passiveKey, setPassiveKey]         = useState('none');
  const [passiveDmgType, setPassiveDmgType] = useState(null);
  const [passiveArmorType, setPassiveArmorType] = useState(null);
  const [benefit2Type, setBenefit2Type]     = useState('none');
  const [slot2, setSlot2]                   = useState(blankSlot());
  const [passive2Key, setPassive2Key]       = useState('none');
  const [passive2DmgType, setPassive2DmgType]     = useState(null);
  const [passive2ArmorType, setPassive2ArmorType] = useState(null);
  const [scorchType, setSCorchType]   = useState(null);
  const [adjX, setAdjX]               = useState(0);
  const [adjY, setAdjY]               = useState(0);

  // Sync energy type from parent character selection
  useEffect(() => { if (parentEnergy) setEnergyType(parentEnergy); }, [parentEnergy]);

  useEffect(() => {
    if (slot1.power) { const d = detectModifiers(slot1.power, energyType); setSlot1(s => ({ ...s, ...d })); }
    if (slot2.power) { const d = detectModifiers(slot2.power, energyType); setSlot2(s => ({ ...s, ...d })); }
  }, [energyType]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectPower(n, power) {
    const s = { power, restriction: getPowerRestriction(power), ...detectModifiers(power, energyType) };
    if (n === 1) setSlot1(s); else setSlot2(s);
  }

  const passiveOptions = getPassiveOptions(itemType);

  const baseAtt = useMemo(() => {
    let total = 0;
    function addPower(slot) {
      if (!slot.power || slot.restriction) return;
      const lvl = slot.level ?? 1;
      total += lvl === 1 ? 2 : lvl === 2 ? 4 : 6;
      if (!slot.notAvailable) {
        if (slot.corrupted && !isTainted) total += 2;
        else if (slot.rare) total += 1;
      } else {
        total += 2;
      }
    }
    addPower(slot1);
    function addPassive(pKey, dmgIdx, armorIdx) {
      if (pKey === 'none') return;
      const opt = passiveOptions.find(o => o.key === pKey);
      if (opt) total += opt.cost;
      if (dmgIdx !== null && DAMAGE_TYPES[dmgIdx] && itemType === 'weapon') total += DAMAGE_TYPES[dmgIdx].weapon;
      if (armorIdx !== null && DAMAGE_TYPES[armorIdx] && itemType === 'armor') total += DAMAGE_TYPES[armorIdx].armor ?? 0;
    }
    addPassive(passiveKey, passiveDmgType, passiveArmorType);
    if (benefit2Type === 'power') addPower(slot2);
    else if (benefit2Type === 'passive') addPassive(passive2Key, passive2DmgType, passive2ArmorType);
    if (isTainted) total -= 4;
    if (scorchType !== null && DAMAGE_TYPES[scorchType]?.scorch !== null) total += DAMAGE_TYPES[scorchType].scorch;
    return total;
  }, [slot1, slot2, passiveKey, passiveDmgType, passiveArmorType, benefit2Type, passive2Key, passive2DmgType, passive2ArmorType, isTainted, scorchType, itemType, passiveOptions]);

  const finalAtt  = Math.max(1, baseAtt + adjY - adjX);
  const tokenCost = Math.max(1, (baseAtt - adjY) + adjX);

  useEffect(() => {
    onCalc({ itemName, itemType, energyType, baseAtt, adjX, adjY, finalAtt, tokenCost, isTainted, slot1, slot2 });
  }, [itemName, itemType, energyType, baseAtt, adjX, adjY, finalAtt, tokenCost, isTainted, slot1, slot2]); // eslint-disable-line react-hooks/exhaustive-deps

  const scorchConflict = useMemo(() => {
    if (scorchType === null) return false;
    const lbl = DAMAGE_TYPES[scorchType]?.label;
    return [passiveDmgType, passive2DmgType, passiveArmorType, passive2ArmorType]
      .filter(v => v !== null).some(v => DAMAGE_TYPES[v]?.label === lbl);
  }, [scorchType, passiveDmgType, passive2DmgType, passiveArmorType, passive2ArmorType]);

  const sel = `${inp} mb-2`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lbl}>Item Name</label>
          <input className={inp} placeholder="Item name" value={itemName} onChange={e => setItemName(e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Item Type</label>
          <select className={inp} value={itemType}
            onChange={e => { setItemType(e.target.value); setPassiveKey('none'); setPassive2Key('none'); setPassiveDmgType(null); setPassiveArmorType(null); setPassive2DmgType(null); setPassive2ArmorType(null); }}>
            <option value="weapon">Weapon</option>
            <option value="armor">Armor</option>
            <option value="accessory">Accessory</option>
            <option value="talisman">Talisman</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <div>
        <label className={lbl}>Step 1 — Energy Type</label>
        <select className={inp} value={energyType} onChange={e => setEnergyType(e.target.value)}>
          {ENERGY_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" className="accent-yellow-500" checked={isTainted} onChange={e => setIsTainted(e.target.checked)} />
          Tainted (-4)
        </label>
      </div>

      {/* Step 2 power */}
      <div>
        <label className={lbl}>Step 2 — Power (optional)</label>
        <PowerSearch onSelect={p => selectPower(1, p)} />
        {slot1.power && (
          <div className="mt-1 text-xs">
            {slot1.restriction
              ? <span className="text-red-400">{RESTRICTION_MSG[slot1.restriction]}</span>
              : <span className="text-gray-400">{slot1.power.name} — Level {slot1.level ?? '?'}{slot1.rare ? ' • Rare' : ''}{slot1.corrupted ? ' • Corrupted' : ''}{slot1.notAvailable ? ' • Not available (+2)' : ''}</span>
            }
          </div>
        )}
        {slot1.power && <button className="text-xs text-red-400 mt-1" onClick={() => setSlot1(blankSlot())}>Clear</button>}
      </div>

      {/* Step 3 passive */}
      {passiveOptions.length > 1 && (
        <div>
          <label className={lbl}>Step 3 — Passive Trait (optional)</label>
          <select className={sel} value={passiveKey} onChange={e => setPassiveKey(e.target.value)}>
            {passiveOptions.map(o => <option key={o.key} value={o.key}>{o.label}{o.cost > 0 ? ` (+${o.cost})` : ''}</option>)}
          </select>
          {itemType === 'weapon' && (
            <select className={inp} value={passiveDmgType ?? ''} onChange={e => setPassiveDmgType(e.target.value === '' ? null : parseInt(e.target.value))}>
              <option value="">No Damage Type</option>
              {DAMAGE_TYPES.filter(dt => dt.weapon !== null).map(dt => (
                <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} (+{dt.armor})</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Step 4 second benefit */}
      <div>
        <label className={lbl}>Step 4 — 2nd Benefit (optional)</label>
        <select className={sel} value={benefit2Type}
          onChange={e => { setBenefit2Type(e.target.value); setSlot2(blankSlot()); setPassive2Key('none'); setPassive2DmgType(null); setPassive2ArmorType(null); }}>
          <option value="none">None</option>
          <option value="power">Add a Power</option>
          {passiveOptions.length > 1 && <option value="passive">Add a Passive Trait</option>}
        </select>
        {benefit2Type === 'power' && (
          <>
            <PowerSearch onSelect={p => selectPower(2, p)} />
            {slot2.power && (
              <div className="mt-1 text-xs">
                {slot2.restriction
                  ? <span className="text-red-400">{RESTRICTION_MSG[slot2.restriction]}</span>
                  : <span className="text-gray-400">{slot2.power.name} — Level {slot2.level ?? '?'}{slot2.rare ? ' • Rare' : ''}{slot2.corrupted ? ' • Corrupted' : ''}{slot2.notAvailable ? ' • Not available (+2)' : ''}</span>
                }
              </div>
            )}
            {slot2.power && <button className="text-xs text-red-400 mt-1" onClick={() => setSlot2(blankSlot())}>Clear</button>}
          </>
        )}
        {benefit2Type === 'passive' && passiveOptions.length > 1 && (
          <>
            <select className={sel} value={passive2Key} onChange={e => setPassive2Key(e.target.value)}>
              {passiveOptions.map(o => <option key={o.key} value={o.key}>{o.label}{o.cost > 0 ? ` (+${o.cost})` : ''}</option>)}
            </select>
            {itemType === 'weapon' && (
              <select className={inp} value={passive2DmgType ?? ''} onChange={e => setPassive2DmgType(e.target.value === '' ? null : parseInt(e.target.value))}>
                <option value="">No Damage Type</option>
                {DAMAGE_TYPES.filter(dt => dt.weapon !== null).map(dt => (
                  <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} (+{dt.weapon})</option>
                ))}
              </select>
            )}
            {itemType === 'armor' && (
              <select className={inp} value={passive2ArmorType ?? ''} onChange={e => setPassive2ArmorType(e.target.value === '' ? null : parseInt(e.target.value))}>
                <option value="">No Type Armor</option>
                {DAMAGE_TYPES.filter(dt => dt.armor !== null).map(dt => (
                  <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} (+{dt.armor})</option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* Step 5 scorch */}
      <div>
        <label className={lbl}>Step 5 — Scorch (optional)</label>
        <select
          className={`${inp}${scorchConflict ? ' border-red-500' : ''}`}
          value={scorchType ?? ''} onChange={e => setSCorchType(e.target.value === '' ? null : parseInt(e.target.value))}>
          <option value="">None</option>
          {DAMAGE_TYPES.filter(dt => dt.scorch !== null).map(dt => (
            <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} Scorch ({dt.scorch})</option>
          ))}
        </select>
        {scorchConflict && <p className="text-red-400 text-xs mt-1">⛔ Conflict: same type for armor and scorch.</p>}
      </div>

      {/* Attunement adjusters */}
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
      <p className="text-xs text-amber-400">⚠ No flaws on compensation items. Story required for XO.</p>
      <TagPreview2026
        itemName={itemName} itemType={itemType} energyType={energyType}
        finalAtt={finalAtt} tokenCost={tokenCost}
        isKlaive={false} klaiveGrand={false} isKlaiveUnfinished={false}
        isTainted={isTainted} slot1={slot1} slot2={slot2}
        benefit2Type={benefit2Type}
        passiveKey={passiveKey} passiveDmgType={passiveDmgType} passiveArmorType={passiveArmorType}
        passive2Key={passive2Key} passive2DmgType={passive2DmgType} passive2ArmorType={passive2ArmorType}
        scorchType={scorchType}
      />
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

const TokenWizardDraft = ({ onBack, powerTrees = [], skills = [] }) => {
  const [unlocked, setUnlocked] = useState(isTrustedUser);
  const [pwInput, setPwInput]   = useState('');
  const [pwError, setPwError]   = useState(false);

  const [charName, setCharName]       = useState('');
  const [energyType, setEnergyType]   = useState('');
  const [totalTokens, setTotalTokens] = useState(30);
  const [activeTab, setActiveTab]     = useState('xp');

  const [xpTokens, setXpTokens]         = useState(1);
  const [silverTokens, setSilverTokens] = useState(1);
  const [teachMode, setTeachMode]            = useState('power');
  const [teachSkillName, setTeachSkillName]   = useState('');
  const [teachEnergyType, setTeachEnergyType] = useState('');
  const [teachTreeId, setTeachTreeId]         = useState('');
  const [teachLevel, setTeachLevel]           = useState(1);
  const [ritualName, setRitualName]     = useState('');
  const [ritualType, setRitualType]     = useState('simple');
  const [ritualDouble, setRitualDouble] = useState(false);
  const [itemCalc, setItemCalc]         = useState(null);

  // Klaive builder state
  const [klaiveSubMode, setKlaiveSubMode]       = useState('unfinished');
  const [klaiveName, setKlaiveName]             = useState('');
  const [klaiveSpiritName, setKlaiveSpiritName] = useState('');
  const [klaiveSpiritName2, setKlaiveSpiritName2] = useState('');
  const [klaivePower1, setKlaivePower1]         = useState(blankSlot());
  const [klaivePower2, setKlaivePower2]         = useState(blankSlot());
  const [klaiveBanFlaw, setKlaiveBanFlaw]       = useState('');
  const [klaiveBanAtt, setKlaiveBanAtt]         = useState(1);
  const [klaiveBan2Flaw, setKlaiveBan2Flaw]     = useState('');
  const [klaiveBan2Att, setKlaiveBan2Att]       = useState(1);
  const [klaiveOptFlaw, setKlaiveOptFlaw]       = useState(-1);
  const [klaiveOptAtt, setKlaiveOptAtt]         = useState(0);
  // Per-spirit steps 3–5 state
  const [klaiveP1Pass, setKlaiveP1Pass]         = useState('none');
  const [klaiveP1DmgType, setKlaiveP1DmgType]   = useState(null);
  const [klaiveB2Type1, setKlaiveB2Type1]       = useState('none');
  const [klaiveP1b, setKlaiveP1b]               = useState(blankSlot());
  const [klaiveP1bPass, setKlaiveP1bPass]       = useState('none');
  const [klaiveP1bDmgType, setKlaiveP1bDmgType] = useState(null);
  const [klaiveScorch1, setKlaiveScorch1]       = useState(null);
  const [klaiveP2Pass, setKlaiveP2Pass]         = useState('none');
  const [klaiveP2DmgType, setKlaiveP2DmgType]   = useState(null);
  const [klaiveB2Type2, setKlaiveB2Type2]       = useState('none');
  const [klaiveP2b, setKlaiveP2b]               = useState(blankSlot());
  const [klaiveP2bPass, setKlaiveP2bPass]       = useState('none');
  const [klaiveP2bDmgType, setKlaiveP2bDmgType] = useState(null);
  const [klaiveScorch2, setKlaiveScorch2]       = useState(null);
  const [klaiveShowP1, setKlaiveShowP1]         = useState(false);
  const [klaiveShowP2, setKlaiveShowP2]         = useState(false);

  const [cart, setCart] = useState([]);
  const nextId = useRef(1);

  const addToCart    = item => setCart(c => [...c, { ...item, id: nextId.current++ }]);
  const removeFromCart = id => setCart(c => c.filter(x => x.id !== id));

  const totalSpent = cart.reduce((s, x) => s + x.tokens, 0);
  const remaining  = totalTokens - totalSpent;

  if (!unlocked) {
    const tryUnlock = () => { if (pwInput === ST_PASSWORD) { sessionStorage.setItem('stSessionUnlocked', 'true'); setUnlocked(true); } else setPwError(true); };
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 w-80 shadow-xl text-center">
          <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-1">Token Reward Calculator</h2>
          <p className="text-gray-400 text-sm mb-1">2026 Draft Rules</p>
          <p className="text-gray-500 text-xs mb-5">Storyteller access required</p>
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

  const inp = "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500";
  const lbl = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1";
  const sec = "bg-gray-800 border border-gray-700 rounded-lg p-5 space-y-4";

  const ritualBaseCost  = RITUAL_COSTS[ritualType] || 1;
  const ritualFinalCost = ritualDouble ? ritualBaseCost * 2 : ritualBaseCost;

  const tabs = [
    { id: 'xp',     label: 'XP' },
    { id: 'silver', label: 'Silver' },
    { id: 'teach',  label: 'Teaching' },
    { id: 'ritual', label: 'Ritual' },
    { id: 'item',   label: 'Magic Item' },
    { id: 'klaive', label: '⚔ Klaive' },
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
              <input type="number" min={1} value={silverTokens} onChange={e => setSilverTokens(Math.max(1, Number(e.target.value)))} className={inp} />
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
              ×2 modifier
            </label>
            <div className="bg-gray-900 rounded p-3 text-sm flex justify-between border border-gray-600">
              <span className="text-gray-300">{RITUAL_LABELS[ritualType]}{ritualDouble ? ' ×2' : ''}</span>
              <span className="font-bold text-green-300">{ritualFinalCost} token{ritualFinalCost > 1 ? 's' : ''}</span>
            </div>
            {ritualType === 'cryptic' && <p className="text-xs text-amber-400">⚠ Story must be written and provided to XO for Cryptic rituals.</p>}
            <button onClick={() => { if (!ritualName.trim()) return; addToCart({ type: 'ritual', tokens: ritualFinalCost, label: `${RITUAL_LABELS[ritualType]}: ${ritualName}`, detail: `${ritualFinalCost} token${ritualFinalCost > 1 ? 's' : ''}${ritualDouble ? ' (×2)' : ''}` }); setRitualName(''); setRitualDouble(false); }}
              className="w-full py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded font-semibold">
              Add to Cart
            </button>
          </div>
        );

      case 'item':
        return (
          <div className="space-y-4">
            <ItemBuilder2026 energyType={energyType} inp={inp} lbl={lbl} onCalc={setItemCalc} />
            <button
              disabled={!itemCalc || itemCalc.tokenCost <= 0}
              onClick={() => {
                if (!itemCalc) return;
                const et = itemCalc.energyType || energyType || 'Energy Type TBD';
                const desc = `${itemCalc.itemName || 'Unnamed Item'} — Att ${itemCalc.finalAtt} (${et})`;
                const powerLines = [itemCalc.slot1, itemCalc.slot2]
                  .filter(s => s?.power && !s.restriction)
                  .map(s => s.power.name);
                addToCart({
                  type: 'item',
                  tokens: itemCalc.tokenCost,
                  label: desc,
                  detail: `Base att ${itemCalc.baseAtt}${itemCalc.adjX ? ` −${itemCalc.adjX} att` : ''}${itemCalc.adjY ? ` +${itemCalc.adjY} att` : ''}${powerLines.length ? ` | ${powerLines.join(', ')}` : ''}`,
                });
              }}
              className="w-full py-2 bg-orange-700 hover:bg-orange-600 disabled:opacity-40 text-white text-sm rounded font-semibold">
              Add to Cart
            </button>
          </div>
        );

      case 'klaive': {
        const isGrand      = klaiveSubMode.includes('grand');
        const isUnfinished = klaiveSubMode.includes('unfinished');
        const modeLabelMap = {
          unfinished:       'Unfinished Klaive',
          finished:         'Klaive',
          grand_unfinished: 'Unfinished Grand Klaive',
          grand:            'Grand Klaive',
        };
        const KLAIVE_ENERGY = 'Gnosis (Shifter)';
        const selectKlaivePower = (setter, power) => {
          if (!power) { setter(blankSlot()); return; }
          setter({ power, restriction: getPowerRestriction(power), ...detectModifiers(power, KLAIVE_ENERGY) });
        };
        const pCost = slot => {
          if (!slot?.power || slot.restriction) return 0;
          const lvl = slot.level ?? 1;
          let c = lvl === 1 ? 2 : lvl === 2 ? 4 : 6;
          if (!slot.notAvailable) { if (slot.corrupted) c += 2; else if (slot.rare) c += 1; }
          else c += 2;
          return c;
        };
        const KLAIVE_PASSIVES = [
          { key: 'none',  label: 'None',      cost: 0 },
          { key: 'dmg_1', label: '+1 Damage', cost: 4 },
          { key: 'dmg_2', label: '+2 Damage', cost: 6 },
        ];
        const kPCost = (pKey, dmgIdx) => {
          const base = KLAIVE_PASSIVES.find(o => o.key === pKey)?.cost ?? 0;
          const dt = dmgIdx !== null && DAMAGE_TYPES[dmgIdx] ? DAMAGE_TYPES[dmgIdx].weapon : 0;
          return base + dt;
        };
        const kSCost = idx => (idx !== null && DAMAGE_TYPES[idx]?.scorch != null) ? DAMAGE_TYPES[idx].scorch : 0;
        const klaiveFinalAtt = isUnfinished ? 3 : Math.max(1,
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
        const klaiveTokenCost = isUnfinished ? 3 : klaiveFinalAtt;
        const klaiveTagCount  = isUnfinished ? 1 : isGrand ? 3 : 2;
        const canAddKlaive = !!klaiveName.trim() && (isUnfinished || (
          !!klaiveSpiritName.trim() && !!klaiveBanFlaw.trim() &&
          (!isGrand || (!!klaiveSpiritName2.trim() && !!klaiveBan2Flaw.trim()))
        ));
        const resetKlaive = () => {
          setKlaiveName(''); setKlaiveSpiritName(''); setKlaiveSpiritName2('');
          setKlaivePower1(blankSlot()); setKlaivePower2(blankSlot());
          setKlaiveBanFlaw(''); setKlaiveBanAtt(1);
          setKlaiveBan2Flaw(''); setKlaiveBan2Att(1);
          setKlaiveOptFlaw(-1); setKlaiveOptAtt(0);
          setKlaiveP1Pass('none'); setKlaiveP1DmgType(null); setKlaiveB2Type1('none'); setKlaiveP1b(blankSlot()); setKlaiveP1bPass('none'); setKlaiveP1bDmgType(null); setKlaiveScorch1(null);
          setKlaiveP2Pass('none'); setKlaiveP2DmgType(null); setKlaiveB2Type2('none'); setKlaiveP2b(blankSlot()); setKlaiveP2bPass('none'); setKlaiveP2bDmgType(null); setKlaiveScorch2(null);
          setKlaiveShowP1(false); setKlaiveShowP2(false);
        };
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(modeLabelMap).map(([id, label]) => (
                <button key={id} onClick={() => { setKlaiveSubMode(id); setKlaivePower1(blankSlot()); setKlaivePower2(blankSlot()); setKlaiveBanFlaw(''); setKlaiveBan2Flaw(''); setKlaiveOptFlaw(-1); setKlaiveBanAtt(1); setKlaiveBan2Att(1); setKlaiveOptAtt(0); setKlaiveP1Pass('none'); setKlaiveP1DmgType(null); setKlaiveB2Type1('none'); setKlaiveP1b(blankSlot()); setKlaiveP1bPass('none'); setKlaiveP1bDmgType(null); setKlaiveScorch1(null); setKlaiveP2Pass('none'); setKlaiveP2DmgType(null); setKlaiveB2Type2('none'); setKlaiveP2b(blankSlot()); setKlaiveP2bPass('none'); setKlaiveP2bDmgType(null); setKlaiveScorch2(null); setKlaiveShowP1(false); setKlaiveShowP2(false); }}
                  className={`py-2 text-sm rounded font-medium ${klaiveSubMode === id ? 'bg-amber-700 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                >{label}</button>
              ))}
            </div>

            <div>
              <label className={lbl}>Klaive Name</label>
              <input type="text" placeholder="e.g. Moonbane" value={klaiveName} onChange={e => setKlaiveName(e.target.value)} className={inp} />
            </div>

            {isUnfinished ? (
              <div className="bg-gray-900 border border-amber-800 rounded-lg p-4 space-y-1.5 text-sm">
                <div className="text-amber-300 font-semibold">{isGrand ? 'Grand Klaive' : 'Klaive'} — Unfinished</div>
                <div className="text-gray-300">Weapon: <span className="text-white">Silver {isGrand ? '2H' : '1H'}</span></div>
                <div className="text-gray-300">Energy: <span className="text-white">Gnosis</span></div>
                <div className="text-gray-300">Att: <span className="text-white font-bold">3</span></div>
                <div className="text-gray-300">Properties: <span className="text-white">Relic</span></div>
                <div className="text-gray-300">Tags: <span className="text-white">1 tag (Klaive Tag)</span></div>
                <p className="text-xs text-amber-400 pt-1">Requires ST approval and character attunement before becoming a finished Klaive.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={lbl}>Bound Spirit Name {isGrand ? '(Spirit 1 — Greater Jaggling)' : ''}</label>
                  <input type="text" placeholder="Spirit name" value={klaiveSpiritName} onChange={e => setKlaiveSpiritName(e.target.value)} className={inp} />
                </div>
                {isGrand && (
                  <div>
                    <label className={lbl}>Spirit 2 Name <span className="text-amber-400">(Greater Jaggling — War Spirit)</span></label>
                    <input type="text" placeholder="2nd spirit name" value={klaiveSpiritName2} onChange={e => setKlaiveSpiritName2(e.target.value)} className={inp} />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="font-semibold text-amber-300 text-sm">{isGrand ? 'Spirit 1 — Steps 2–5' : 'Steps 2–5'}</div>
                  <div>
                    <label className={lbl}>Step 2 — Power (optional)</label>
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
                    <label className={lbl}>Step 3 — Passive Trait (optional)</label>
                    <select value={klaiveP1Pass} onChange={e => setKlaiveP1Pass(e.target.value)} className={inp + ' mb-2'}>
                      {KLAIVE_PASSIVES.map(o => <option key={o.key} value={o.key}>{o.label}{o.cost > 0 ? ` (+${o.cost})` : ''}</option>)}
                    </select>
                    <label className={lbl}>Damage Type (weapon)</label>
                    <select value={klaiveP1DmgType ?? ''} onChange={e => setKlaiveP1DmgType(e.target.value === '' ? null : parseInt(e.target.value))} className={inp}>
                      <option value="">None</option>
                      {DAMAGE_TYPES.filter(dt => dt.weapon !== null && dt.label !== 'Agg').map(dt => <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} (+{dt.weapon})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Step 4 — 2nd Benefit (optional)</label>
                    <select value={klaiveB2Type1} onChange={e => { setKlaiveB2Type1(e.target.value); setKlaiveP1b(blankSlot()); setKlaiveP1bPass('none'); setKlaiveP1bDmgType(null); }} className={inp + ' mb-2'}>
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
                    <label className={lbl}>Step 5 — Scorch (optional)</label>
                    <select value={klaiveScorch1 ?? ''} onChange={e => setKlaiveScorch1(e.target.value === '' ? null : parseInt(e.target.value))} className={inp}>
                      <option value="">None</option>
                      {DAMAGE_TYPES.filter(dt => dt.scorch !== null).map(dt => <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} Scorch ({dt.scorch})</option>)}
                    </select>
                  </div>
                </div>

                {isGrand && (
                  <div className="space-y-3 pt-3 border-t border-gray-700">
                    <div className="font-semibold text-amber-300 text-sm">Spirit 2 — Steps 2–5</div>
                    <div>
                      <label className={lbl}>Step 2 — Power (optional)</label>
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
                      <label className={lbl}>Step 3 — Passive Trait (optional)</label>
                      <select value={klaiveP2Pass} onChange={e => setKlaiveP2Pass(e.target.value)} className={inp + ' mb-2'}>
                        {KLAIVE_PASSIVES.map(o => <option key={o.key} value={o.key}>{o.label}{o.cost > 0 ? ` (+${o.cost})` : ''}</option>)}
                      </select>
                      <label className={lbl}>Damage Type (weapon)</label>
                      <select value={klaiveP2DmgType ?? ''} onChange={e => setKlaiveP2DmgType(e.target.value === '' ? null : parseInt(e.target.value))} className={inp}>
                        <option value="">None</option>
                        {DAMAGE_TYPES.filter(dt => dt.weapon !== null && dt.label !== 'Agg').map(dt => <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} (+{dt.weapon})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Step 4 — 2nd Benefit (optional)</label>
                      <select value={klaiveB2Type2} onChange={e => { setKlaiveB2Type2(e.target.value); setKlaiveP2b(blankSlot()); setKlaiveP2bPass('none'); setKlaiveP2bDmgType(null); }} className={inp + ' mb-2'}>
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
                      <label className={lbl}>Step 5 — Scorch (optional)</label>
                      <select value={klaiveScorch2 ?? ''} onChange={e => setKlaiveScorch2(e.target.value === '' ? null : parseInt(e.target.value))} className={inp}>
                        <option value="">None</option>
                        {DAMAGE_TYPES.filter(dt => dt.scorch !== null).map(dt => <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} Scorch ({dt.scorch})</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="bg-gray-900 border border-orange-800 rounded-lg p-3 space-y-3">
                  <div className="text-xs text-orange-300 font-semibold uppercase tracking-wide">Mandatory Flaws</div>
                  <div className="space-y-2">
                    <label className={lbl}>Ban Flaw — Spirit 1 <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="Describe the ban condition" value={klaiveBanFlaw} onChange={e => setKlaiveBanFlaw(e.target.value)} className={inp} />
                    <label className={lbl}>Att Reduction</label>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map(n => (
                        <button key={n} onClick={() => setKlaiveBanAtt(n)}
                          className={`flex-1 py-1.5 text-sm rounded font-bold ${klaiveBanAtt === n ? 'bg-orange-700 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                        >−{n}</button>
                      ))}
                    </div>
                  </div>
                  {isGrand && (
                    <div className="space-y-2 pt-2 border-t border-gray-700">
                      <label className={lbl}>Ban Flaw — Spirit 2 <span className="text-red-400">*</span></label>
                      <input type="text" placeholder="Describe the ban condition" value={klaiveBan2Flaw} onChange={e => setKlaiveBan2Flaw(e.target.value)} className={inp} />
                      <label className={lbl}>Att Reduction</label>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map(n => (
                          <button key={n} onClick={() => setKlaiveBan2Att(n)}
                            className={`flex-1 py-1.5 text-sm rounded font-bold ${klaiveBan2Att === n ? 'bg-orange-700 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                          >−{n}</button>
                        ))}
                      </div>
                      <p className="text-xs text-amber-400">Breaking either ban causes both spirits to reject the character.</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">Gnosis −2 while attuned is a feature, not a flaw — not counted in attunement cost.</p>
                </div>

                <div>
                  <label className={lbl}>Optional 3rd Flaw <span className="text-gray-500">(non-Ban)</span></label>
                  <select value={klaiveOptFlaw} onChange={e => { const i = parseInt(e.target.value); setKlaiveOptFlaw(i); if (i >= 0 && FLAWS[i]?.reduction !== null && !FLAWS[i]?.hasX && !FLAWS[i]?.stRange && !FLAWS[i]?.hasVG) setKlaiveOptAtt(FLAWS[i].reduction); else setKlaiveOptAtt(0); }} className={inp}>
                    <option value={-1}>None</option>
                    {FLAWS.map((f, idx) => {
                      const redStr = f.stRange ? `-(ST: ${f.stRange})` : f.hasX ? '-X' : f.hasVG ? '-2/-4' : f.reduction !== null ? `-${f.reduction}` : '';
                      return <option key={idx} value={idx}>{f.label} ({redStr}){f.energyNote ? ` — ${f.energyNote}` : ''}</option>;
                    })}
                  </select>
                  {klaiveOptFlaw >= 0 && (FLAWS[klaiveOptFlaw]?.hasX || FLAWS[klaiveOptFlaw]?.stRange || FLAWS[klaiveOptFlaw]?.hasVG) && (
                    <>
                      <label className={lbl + ' mt-2'}>Att Reduction</label>
                      <div className="flex gap-1 mt-1">
                        {[0, 1, 2, 3, 4].map(n => (
                          <button key={n} onClick={() => setKlaiveOptAtt(n)}
                            className={`flex-1 py-1.5 text-sm rounded font-bold ${klaiveOptAtt === n ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                          >−{n}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-gray-900 rounded-lg p-3 text-sm space-y-1 border border-gray-700">
                  <div className="text-gray-400 font-semibold text-xs uppercase tracking-wide mb-2">Att Breakdown</div>
                  <div className="flex justify-between"><span className="text-gray-400">Base (Klaive)</span><span className="text-white">5</span></div>
                  {klaivePower1.power && !klaivePower1.restriction && <div className="flex justify-between"><span className="text-gray-400">{isGrand ? 'S1 ' : ''}Power: {klaivePower1.power.name}</span><span className="text-green-300">+{pCost(klaivePower1)}</span></div>}
                  {kPCost(klaiveP1Pass, klaiveP1DmgType) > 0 && <div className="flex justify-between"><span className="text-gray-400">{isGrand ? 'S1 ' : ''}Passive</span><span className="text-green-300">+{kPCost(klaiveP1Pass, klaiveP1DmgType)}</span></div>}
                  {klaiveB2Type1 === 'power' && klaiveP1b.power && !klaiveP1b.restriction && <div className="flex justify-between"><span className="text-gray-400">{isGrand ? 'S1 ' : ''}2nd Power: {klaiveP1b.power.name}</span><span className="text-green-300">+{pCost(klaiveP1b)}</span></div>}
                  {klaiveB2Type1 === 'passive' && kPCost(klaiveP1bPass, klaiveP1bDmgType) > 0 && <div className="flex justify-between"><span className="text-gray-400">{isGrand ? 'S1 ' : ''}2nd Passive</span><span className="text-green-300">+{kPCost(klaiveP1bPass, klaiveP1bDmgType)}</span></div>}
                  {klaiveScorch1 !== null && kSCost(klaiveScorch1) !== 0 && <div className="flex justify-between"><span className="text-gray-400">{isGrand ? 'S1 ' : ''}Scorch: {DAMAGE_TYPES[klaiveScorch1]?.label}</span><span className={kSCost(klaiveScorch1) < 0 ? 'text-red-300' : 'text-green-300'}>{kSCost(klaiveScorch1)}</span></div>}
                  {isGrand && klaivePower2.power && !klaivePower2.restriction && <div className="flex justify-between"><span className="text-gray-400">S2 Power: {klaivePower2.power.name}</span><span className="text-green-300">+{pCost(klaivePower2)}</span></div>}
                  {isGrand && kPCost(klaiveP2Pass, klaiveP2DmgType) > 0 && <div className="flex justify-between"><span className="text-gray-400">S2 Passive</span><span className="text-green-300">+{kPCost(klaiveP2Pass, klaiveP2DmgType)}</span></div>}
                  {isGrand && klaiveB2Type2 === 'power' && klaiveP2b.power && !klaiveP2b.restriction && <div className="flex justify-between"><span className="text-gray-400">S2 2nd Power: {klaiveP2b.power.name}</span><span className="text-green-300">+{pCost(klaiveP2b)}</span></div>}
                  {isGrand && klaiveB2Type2 === 'passive' && kPCost(klaiveP2bPass, klaiveP2bDmgType) > 0 && <div className="flex justify-between"><span className="text-gray-400">S2 2nd Passive</span><span className="text-green-300">+{kPCost(klaiveP2bPass, klaiveP2bDmgType)}</span></div>}
                  {isGrand && klaiveScorch2 !== null && kSCost(klaiveScorch2) !== 0 && <div className="flex justify-between"><span className="text-gray-400">S2 Scorch: {DAMAGE_TYPES[klaiveScorch2]?.label}</span><span className={kSCost(klaiveScorch2) < 0 ? 'text-red-300' : 'text-green-300'}>{kSCost(klaiveScorch2)}</span></div>}
                  {klaiveBanAtt > 0 && <div className="flex justify-between"><span className="text-gray-400">− Ban (Spirit 1)</span><span className="text-red-300">−{klaiveBanAtt}</span></div>}
                  {isGrand && klaiveBan2Att > 0 && <div className="flex justify-between"><span className="text-gray-400">− Ban (Spirit 2)</span><span className="text-red-300">−{klaiveBan2Att}</span></div>}
                  {klaiveOptFlaw >= 0 && klaiveOptAtt > 0 && <div className="flex justify-between"><span className="text-gray-400">− {FLAWS[klaiveOptFlaw]?.label ?? 'Optional flaw'}</span><span className="text-red-300">−{klaiveOptAtt}</span></div>}
                  <div className="flex justify-between border-t border-gray-700 pt-1 mt-1 font-bold">
                    <span className="text-white">Final Att</span><span className="text-amber-300">{klaiveFinalAtt}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-900 rounded p-3 text-sm flex justify-between border border-gray-600">
              <span className="text-gray-300 truncate mr-2">{modeLabelMap[klaiveSubMode]}{klaiveName ? `: ${klaiveName}` : ''} — {klaiveTagCount} tag{klaiveTagCount > 1 ? 's' : ''}</span>
              <span className="font-bold text-amber-300 shrink-0">{klaiveTokenCost} token{klaiveTokenCost !== 1 ? 's' : ''}</span>
            </div>

            <button
              disabled={!canAddKlaive}
              onClick={() => {
                if (!canAddKlaive) return;
                const typeLabel = modeLabelMap[klaiveSubMode];
                const detail = isUnfinished
                  ? `Silver ${isGrand ? '2H' : '1H'}, Gnosis, Att 3, Relic — 1 tag`
                  : [
                      `${isGrand ? '2H' : '1H'} Agg, Gnosis, Att ${klaiveFinalAtt}`,
                      `Spirit: ${klaiveSpiritName}`,
                      isGrand && `Spirit 2: ${klaiveSpiritName2}`,
                      klaivePower1.power && `S1 Power: ${klaivePower1.power.name}`,
                      kPCost(klaiveP1Pass, klaiveP1DmgType) > 0 && `S1 Passive: +${kPCost(klaiveP1Pass, klaiveP1DmgType)}`,
                      klaiveB2Type1 === 'power' && klaiveP1b.power && `S1 2nd Power: ${klaiveP1b.power.name}`,
                      klaiveScorch1 !== null && `S1 Scorch: ${DAMAGE_TYPES[klaiveScorch1]?.label}`,
                      isGrand && klaivePower2.power && `S2 Power: ${klaivePower2.power.name}`,
                      isGrand && kPCost(klaiveP2Pass, klaiveP2DmgType) > 0 && `S2 Passive: +${kPCost(klaiveP2Pass, klaiveP2DmgType)}`,
                      isGrand && klaiveB2Type2 === 'power' && klaiveP2b.power && `S2 2nd Power: ${klaiveP2b.power.name}`,
                      isGrand && klaiveScorch2 !== null && `S2 Scorch: ${DAMAGE_TYPES[klaiveScorch2]?.label}`,
                      `Ban: ${klaiveBanFlaw} (−${klaiveBanAtt})`,
                      isGrand && `Ban 2: ${klaiveBan2Flaw} (−${klaiveBan2Att})`,
                      klaiveOptFlaw >= 0 && `Flaw: ${FLAWS[klaiveOptFlaw]?.label} (−${klaiveOptAtt})`,
                      `Gnosis −2 attuned`,
                      `${klaiveTagCount} tags`,
                    ].filter(Boolean).join(' | ');
                addToCart({ type: 'item', tokens: klaiveTokenCost, label: `${typeLabel}: ${klaiveName}`, detail });
                resetKlaive();
              }}
              className="w-full py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded font-semibold"
            >Add to Cart</button>
          </div>
        );
      }

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">← Back</button>
        <Coins className="w-5 h-5 text-yellow-400" />
        <h1 className="text-lg font-bold text-yellow-400 mr-auto">Token Reward Calculator</h1>
        <span className="text-xs bg-amber-900 text-amber-200 px-2 py-1 rounded">2026 Draft</span>
        <span className="text-xs text-gray-500">🔓 ST Mode</span>
      </div>

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: Input */}
        <div className="space-y-5">
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
              <p className="text-xs text-gray-500 mt-1">Standard: 30 tokens per drop. Adjust for carryover.</p>
            </div>
          </div>

          <div className={sec}>
            <h2 className="font-bold text-yellow-300 text-sm uppercase tracking-wide">Add Spend</h2>
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

        {/* RIGHT: Cart + Summary */}
        <div className="space-y-5">
          <div className={sec}>
            <h2 className="font-bold text-yellow-300 text-sm uppercase tracking-wide">Cart</h2>
            {cart.length === 0
              ? <p className="text-gray-500 text-sm">No spends added yet.</p>
              : (
                <ul className="space-y-2">
                  {cart.map(item => (
                    <li key={item.id} className="flex items-start justify-between gap-2 bg-gray-900 rounded p-2 border border-gray-700">
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.detail}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-yellow-300 text-sm">{item.tokens}t</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </div>

          <div className={sec}>
            <h2 className="font-bold text-yellow-300 text-sm uppercase tracking-wide">Summary{charName ? ` — ${charName}` : ''}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Available</span><span className="font-mono text-white">{totalTokens}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Spent</span><span className="font-mono text-orange-300">{totalSpent}</span></div>
              <div className={`flex justify-between border-t border-gray-700 pt-2 font-bold text-base ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                <span>Remaining</span><span>{remaining}</span>
              </div>
            </div>
            {remaining < 0 && (
              <p className="text-red-400 text-xs mt-1">⚠ Over budget by {Math.abs(remaining)} token{Math.abs(remaining) > 1 ? 's' : ''}.</p>
            )}
            <div className="mt-3 pt-3 border-t border-gray-700 space-y-1 text-xs text-amber-300">
              {cart.some(x => x.type === 'ritual' && x.label.toLowerCase().includes('cryptic')) && <p>⚠ Cryptic ritual — story required for XO.</p>}
              {cart.some(x => x.type === 'teach' && x.isST) && <p>⚠ ST NPC teaching — story required for XO.</p>}
              {cart.some(x => x.type === 'item') && <p>⚠ Magic item — story required for XO.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenWizardDraft;
