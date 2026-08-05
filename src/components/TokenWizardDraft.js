import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lock, Coins } from 'lucide-react';
import { powersData } from '../data/powersData';

const ST_PASSWORD = '1234!';

// ── 2026 item rules constants ─────────────────────────────────────────────────
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
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded max-h-52 overflow-y-auto shadow-xl">
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
    <div className="mt-4 border-2 border-amber-700 rounded-lg bg-amber-950 p-4 font-mono text-sm shadow-inner">
      <div className="text-center text-amber-200 font-bold text-base mb-1 border-b border-amber-700 pb-1">
        {itemName || '[ Item Name ]'}
      </div>
      <div className="text-center text-amber-300 text-xs mb-3">
        {itemType.charAt(0).toUpperCase() + itemType.slice(1)} — {energyType || '—'}
      </div>
      {lines.length === 0
        ? <div className="text-amber-600 text-center text-xs">(no selections)</div>
        : <ul className="space-y-1">{lines.map((l, i) => <li key={i} className="text-amber-100">• {l}</li>)}</ul>
      }
      <div className="border-t border-amber-700 mt-3 pt-2 flex justify-between items-center">
        <span className="text-amber-400 font-bold">Attunement: {finalAtt}</span>
        <span className="text-yellow-300 font-bold">{tokenCost} tokens</span>
      </div>
      {isTainted && <div className="text-center text-red-400 font-bold text-xs mt-1">TAINTED</div>}
    </div>
  );
}

// ── 2026 Item sub-builder (no flaws for compensation items) ───────────────────
function ItemBuilder2026({ energyType: parentEnergy, inp, lbl, onCalc }) {
  const [itemName, setItemName]   = useState('');
  const [itemType, setItemType]   = useState('weapon');
  const [energyType, setEnergyType] = useState(parentEnergy || 'Vitae (Vampire)');
  const [isTainted, setIsTainted] = useState(false);
  const [isKlaive, setIsKlaive]   = useState(false);
  const [klaiveGrand, setKlaiveGrand] = useState(false);
  const [isKlaiveUnfinished, setIsKlaiveUnfinished] = useState(false);
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
    if (isKlaive) total += 5;
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
  }, [slot1, slot2, passiveKey, passiveDmgType, passiveArmorType, benefit2Type, passive2Key, passive2DmgType, passive2ArmorType, isTainted, isKlaive, scorchType, itemType, passiveOptions]);

  const finalAtt  = Math.max(1, baseAtt + adjY - adjX);
  const tokenCost = Math.max(1, (baseAtt - adjY) + adjX);

  useEffect(() => {
    onCalc({ itemName, itemType, energyType, baseAtt, adjX, adjY, finalAtt, tokenCost, isTainted, isKlaive, klaiveGrand, isKlaiveUnfinished, slot1, slot2 });
  }, [itemName, itemType, energyType, baseAtt, adjX, adjY, finalAtt, tokenCost, isTainted, isKlaive, klaiveGrand, isKlaiveUnfinished, slot1, slot2]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" className="accent-amber-400" checked={isKlaive}
            onChange={e => { setIsKlaive(e.target.checked); if (!e.target.checked) setKlaiveGrand(false); if (e.target.checked) setEnergyType('Gnosis (Shifter)'); }} />
          Klaive <span className="text-gray-500">(+5 base att, auto-sets Gnosis)</span>
        </label>
        {isKlaive && (
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" className="accent-amber-400" checked={klaiveGrand} onChange={e => setKlaiveGrand(e.target.checked)} />
            Grand Klaive
          </label>
        )}
        {isKlaive && (
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" className="accent-amber-400" checked={isKlaiveUnfinished} onChange={e => setIsKlaiveUnfinished(e.target.checked)} />
            Unfinished <span className="text-gray-500">(requires char attunement)</span>
          </label>
        )}
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
        isKlaive={isKlaive} klaiveGrand={klaiveGrand} isKlaiveUnfinished={isKlaiveUnfinished}
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
const TokenWizardDraft = ({ onBack }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput]   = useState('');
  const [pwError, setPwError]   = useState(false);

  const [charName, setCharName]       = useState('');
  const [energyType, setEnergyType]   = useState('');
  const [totalTokens, setTotalTokens] = useState(30);
  const [activeTab, setActiveTab]     = useState('xp');

  const [xpTokens, setXpTokens]         = useState(1);
  const [silverTokens, setSilverTokens] = useState(1);
  const [teachName, setTeachName]       = useState('');
  const [teachST, setTeachST]           = useState(false);
  const [ritualName, setRitualName]     = useState('');
  const [ritualType, setRitualType]     = useState('simple');
  const [ritualDouble, setRitualDouble] = useState(false);
  const [itemCalc, setItemCalc]         = useState(null);

  const [cart, setCart] = useState([]);
  const nextId = useRef(1);

  const addToCart    = item => setCart(c => [...c, { ...item, id: nextId.current++ }]);
  const removeFromCart = id => setCart(c => c.filter(x => x.id !== id));

  const totalSpent = cart.reduce((s, x) => s + x.tokens, 0);
  const remaining  = totalTokens - totalSpent;

  if (!unlocked) {
    const tryUnlock = () => { if (pwInput === ST_PASSWORD) setUnlocked(true); else setPwError(true); };
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

      case 'teach':
        return (
          <div className="space-y-4">
            <div>
              <label className={lbl}>Skill or Power Name</label>
              <input type="text" placeholder="e.g. Dominate, Melee 2" value={teachName} onChange={e => setTeachName(e.target.value)} className={inp} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
              <input type="checkbox" checked={teachST} onChange={e => setTeachST(e.target.checked)} className="accent-yellow-500" />
              From ST Rulebook (costs 5 tokens instead of 1)
            </label>
            <div className="bg-gray-900 rounded p-3 text-sm flex justify-between border border-gray-600">
              <span className="text-gray-300">Teaching: {teachName || '—'}</span>
              <span className="font-bold text-purple-300">{teachST ? 5 : 1} token{teachST ? 's' : ''}</span>
            </div>
            <p className="text-xs text-amber-400">⚠ Story must be written and provided to XO explaining how training was acquired.</p>
            <button onClick={() => { if (!teachName.trim()) return; addToCart({ type: 'teach', tokens: teachST ? 5 : 1, label: `Teaching: ${teachName}${teachST ? ' (ST Rulebook)' : ''}`, detail: `${teachST ? 5 : 1} token${teachST ? 's' : ''}` }); setTeachName(''); setTeachST(false); }}
              className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded font-semibold">
              Add to Cart
            </button>
          </div>
        );

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
                const klaivePart = itemCalc.isKlaive ? (itemCalc.isKlaiveUnfinished ? ' [Unfinished Klaive]' : itemCalc.klaiveGrand ? ' [Grand Klaive]' : ' [Klaive]') : '';
                const desc = `${itemCalc.itemName || 'Unnamed Item'}${klaivePart} — Att ${itemCalc.finalAtt} (${et})`;
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
              {cart.some(x => x.type === 'teach' && x.label.includes('ST Rulebook')) && <p>⚠ ST Rulebook teaching — story required for XO.</p>}
              {cart.some(x => x.type === 'item') && <p>⚠ Magic item — story required for XO.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenWizardDraft;
