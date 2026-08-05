import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import { powersData } from '../data/powersData';

const ST_PASSWORD = '1234!';

// Damage type table (Damage Type Attunements proposal, voted 2026)
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

const ENERGY_TYPES = [
  'Vitae (Vampire)',
  'Gnosis (Shifter)',
  'Pathos (Wraith)',
  'Essence (Human / Sorcerer)',
  'Quintessence',
];

const FACTION_CODE = {
  'Vitae (Vampire)':            'V',
  'Gnosis (Shifter)':           'S',
  'Pathos (Wraith)':            'W',
  'Essence (Human / Sorcerer)': 'H',
};

const ITEM_TYPES = [
  { value: 'weapon',    label: 'Magic Weapon' },
  { value: 'armor',     label: 'Magic Armor' },
  { value: 'accessory', label: 'Magic Accessory' },
  { value: 'talisman',  label: 'Talisman' },
  { value: 'custom',    label: 'Custom Item' },
];

// Benefit list for 2025 rules (uses new damage type table)
const ALL_BENEFITS = [
  { value: 'power_1',  label: 'Level 1 Power',    cost: 2,    types: ['weapon','armor','accessory','talisman','custom'] },
  { value: 'power_2',  label: 'Level 2 Power',    cost: 4,    types: ['weapon','armor','accessory','talisman','custom'] },
  { value: 'power_3',  label: 'Level 3 Power',    cost: 6,    types: ['weapon','armor','accessory','talisman','custom'] },
  { value: 'dmg_1',    label: '+1 Damage',         cost: 4,    types: ['weapon'] },
  { value: 'dmg_2',    label: '+2 Damage',         cost: 6,    types: ['weapon'] },
  { value: 'dmg_type', label: 'Damage <Type>',     cost: null, types: ['weapon'] },
  { value: 'arm_2',    label: '+2 Armor Points',   cost: 2,    types: ['armor'] },
  { value: 'arm_4',    label: '+4 Armor Points',   cost: 4,    types: ['armor'] },
  { value: 'arm_type', label: '<Type> Armor',      cost: null, types: ['armor'] },
  { value: 'hp_1',     label: '+1 Maximum Health', cost: 1,    types: ['accessory'] },
  { value: 'hp_2',     label: '+2 Maximum Health', cost: 2,    types: ['accessory'] },
];

const BENEFIT_GROUP = {
  dmg_1: 'dmg_bonus', dmg_2: 'dmg_bonus',
  dmg_type: 'dmg_type',
  arm_2: 'arm_bonus', arm_4: 'arm_bonus',
  arm_type: 'arm_type',
  hp_1: 'hp_bonus', hp_2: 'hp_bonus',
};

const RESTRICTION_MSG = {
  'npc-only':                  'NPC-Only — cannot be placed on items.',
  'not-for-items':             'Not intended for items per rulebook.',
  'fundamental-or-merit-only': 'Fundamental / Merit-only — cannot be placed on items.',
};

// Old flaws table (2025 rules — free-form reduction, ST judgment)
const FLAWS = [
  'Your Augment is reduced by 1',
  'Your Regeneration Rate is reduced by 1',
  'Your Maximum Health is reduced by X',
  'Your Maximum Health is reduced to X',
  'You cannot speak (per the power Silence)',
  'You cannot lie',
  'You cannot run',
  'You cannot Frenzy for any reason',
  'You have the Fragile flaw (all damage is Agg)',
  'You have Sunsickness (as per Vampire weakness)',
  'You have Demonic Vice <Vice>',
  'You cannot spend Virtue as Willpower while Tainted',
  'You are Realmbound / Umbrabound',
  'You cannot enter a building without being invited inside',
  'The item cannot be removed except by another Character',
  '[Wraith only] You immediately enter Catharsis; cannot end voluntarily',
  '[Wraith only] You cannot be forced out of Catharsis',
  '[Wraith only] Your Angst reads as 4 higher (max 10)',
  '[Vampire only] You have the clan curse of [Clan]',
  '[Vampire only] Your Amaranth Count reads as X',
  '[Vampire only] Your Generation reads as 2 lower',
  '[Vampire only] Cannot consume more than 3 Vitae in a single Draining',
  '[Shifter only] Always in Homid Form',
  '[Shifter only] Always in Crinos',
  '[Shifter only] Your claws are always out',
  '[Shifter only] Cannot Step Sideways',
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
  if (!power) return { level: null, notAvailable: false, rare: false, corrupted: false };
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
  const notAvailable = factionCode ? !tokens.some(t => t.startsWith(factionCode)) : false;
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
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded max-h-60 overflow-y-auto shadow-xl">
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

function blankBenefit() {
  return { type: '', slot: blankSlot(), typeIdx: null };
}

export default function MagicItemWizardClassic({ onBack }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput]   = useState('');
  const [pwError, setPwError]   = useState('');
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-8 w-full max-w-sm shadow-2xl border border-gray-700">
          <div className="flex flex-col items-center mb-6 gap-3">
            <Lock className="text-amber-400" size={40} />
            <h2 className="text-xl font-bold">ST Magic Item Wizard</h2>
            <p className="text-gray-400 text-sm text-center">Restricted to Storytellers — 2025 Rules</p>
          </div>
          <input type="password" autoFocus
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none mb-3"
            placeholder="Password" value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { if (pwInput === ST_PASSWORD) setUnlocked(true); else { setPwError('Incorrect password.'); setPwInput(''); } }
              if (e.key === 'Escape') onBack();
            }}
          />
          {pwError && <p className="text-red-400 text-sm mb-3">{pwError}</p>}
          <div className="flex gap-2">
            <button className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded font-semibold"
              onClick={() => { if (pwInput === ST_PASSWORD) setUnlocked(true); else { setPwError('Incorrect password.'); setPwInput(''); } }}>Unlock</button>
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
  const [isRelic, setIsRelic]         = useState(false);
  const [isArtifact, setIsArtifact]   = useState(false);
  const [isTainted, setIsTainted]     = useState(false);
  const [b1, setB1] = useState(blankBenefit());
  const [b2, setB2] = useState(blankBenefit());
  const [scorchIdx, setSCorchIdx]   = useState(null);
  const [flawIndex, setFlawIndex]   = useState(-1);
  const [flawReduction, setFlawReduction] = useState(0);
  const [stMod, setStMod]           = useState(0);

  // Re-run auto-detect when energy type changes
  useEffect(() => {
    if (b1.slot.power) { const d = detectModifiers(b1.slot.power, energyType); setB1(prev => ({ ...prev, slot: { ...prev.slot, ...d } })); }
    if (b2.slot.power) { const d = detectModifiers(b2.slot.power, energyType); setB2(prev => ({ ...prev, slot: { ...prev.slot, ...d } })); }
  }, [energyType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset invalid benefits when item type changes
  useEffect(() => {
    const valid = b => !b.type || ALL_BENEFITS.find(x => x.value === b.type && x.types.includes(itemType));
    if (!valid(b1)) setB1(blankBenefit());
    if (!valid(b2)) setB2(blankBenefit());
  }, [itemType]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectPower(setBn, power) {
    const restriction = getPowerRestriction(power);
    const mods = detectModifiers(power, energyType);
    setBn(prev => ({
      ...prev,
      type: restriction ? prev.type : `power_${mods.level ?? 1}`,
      slot: { power, restriction, ...mods },
    }));
  }

  function updateSlotFlag(setBn, field, val) {
    setBn(prev => ({ ...prev, slot: { ...prev.slot, [field]: val } }));
  }

  function updatePowerLevel(setBn, type) {
    setBn(prev => ({ ...prev, type }));
  }

  // Scorch conflict: can't have same type for armor and scorch
  const scorchConflict = useMemo(() => {
    if (scorchIdx === null) return false;
    const lbl = DAMAGE_TYPES[scorchIdx]?.label;
    const b1Lbl = b1.type === 'arm_type' && b1.typeIdx !== null ? DAMAGE_TYPES[b1.typeIdx]?.label : null;
    const b2Lbl = b2.type === 'arm_type' && b2.typeIdx !== null ? DAMAGE_TYPES[b2.typeIdx]?.label : null;
    return lbl === b1Lbl || lbl === b2Lbl;
  }, [scorchIdx, b1, b2]);

  const breakdown = useMemo(() => {
    const lines = [];
    let total = 0;

    function addBenefit(b, label) {
      if (!b.type) return;
      if (b.type === 'dmg_type') {
        if (b.typeIdx === null || !DAMAGE_TYPES[b.typeIdx]) return;
        const dt = DAMAGE_TYPES[b.typeIdx];
        lines.push({ label: `${label}: ${dt.label} Damage Type`, value: dt.weapon });
        total += dt.weapon;
      } else if (b.type === 'arm_type') {
        if (b.typeIdx === null || !DAMAGE_TYPES[b.typeIdx] || DAMAGE_TYPES[b.typeIdx].armor === null) return;
        const dt = DAMAGE_TYPES[b.typeIdx];
        lines.push({ label: `${label}: ${dt.label} Type Armor`, value: dt.armor });
        total += dt.armor;
      } else if (b.type.startsWith('power')) {
        if (b.slot.restriction) { lines.push({ label: `${label}: ${b.slot.power?.name} (RESTRICTED — excluded)`, value: 0, warn: true }); return; }
        if (!b.slot.power) return;
        const lvl = b.slot.level ?? 1;
        const base = lvl === 1 ? 2 : lvl === 2 ? 4 : 6;
        lines.push({ label: `${label}: ${b.slot.power.name} (Level ${lvl})`, value: base });
        total += base;
        if (b.slot.notAvailable) { lines.push({ label: '  Not available for this faction', value: 2 }); total += 2; }
        else if (b.slot.corrupted) {
          if (isTainted) lines.push({ label: '  Corrupted/Dark Arcanoi — Tainted overrides', value: 0 });
          else { lines.push({ label: '  Corrupted/Dark Arcanoi', value: 2 }); total += 2; }
        } else if (b.slot.rare) { lines.push({ label: '  Rare in faction', value: 1 }); total += 1; }
      } else {
        const bDef = ALL_BENEFITS.find(x => x.value === b.type);
        if (bDef?.cost) { lines.push({ label: `${label}: ${bDef.label}`, value: bDef.cost }); total += bDef.cost; }
      }
    }

    addBenefit(b1, 'Benefit 1');
    addBenefit(b2, 'Benefit 2');

    if (isRelic && !isArtifact) { lines.push({ label: 'Relic', value: 1 }); total += 1; }
    if (isTainted) { lines.push({ label: 'Tainted', value: -4 }); total -= 4; }

    if (scorchIdx !== null && DAMAGE_TYPES[scorchIdx]?.scorch !== null) {
      const dt = DAMAGE_TYPES[scorchIdx];
      lines.push({ label: `Scorch: ${dt.label}`, value: dt.scorch }); total += dt.scorch;
    }

    if (flawIndex >= 0 && flawReduction !== 0) {
      lines.push({ label: `Flaw: ${FLAWS[flawIndex]}`, value: -flawReduction }); total -= flawReduction;
    }

    if (stMod !== 0) { lines.push({ label: 'ST Free Modifier', value: stMod }); total += stMod; }

    return { lines, total, finalAtt: Math.max(1, total) };
  }, [b1, b2, isRelic, isArtifact, isTainted, scorchIdx, flawIndex, flawReduction, stMod]);

  function getBenefitOptions(otherB) {
    const og = otherB?.type ? BENEFIT_GROUP[otherB.type] : null;
    return ALL_BENEFITS.filter(o => o.types.includes(itemType) && !(og && BENEFIT_GROUP[o.value] === og));
  }

  function renderBenefitBlock(b, setB, label, otherB) {
    const isPower = b.type.startsWith('power');
    const isDmgType = b.type === 'dmg_type';
    const isArmType = b.type === 'arm_type';

    return (
      <Section title={label}>
        <select
          className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
          value={b.type}
          onChange={e => setB({ ...blankBenefit(), type: e.target.value })}
        >
          <option value="">— None —</option>
          {getBenefitOptions(otherB).map(o => (
            <option key={o.value} value={o.value}>{o.label}{o.cost !== null ? ` (+${o.cost})` : ' (see type)'}</option>
          ))}
        </select>

        {(isDmgType || isArmType) && (
          <div className="mt-2">
            <Label>Select Type</Label>
            <select
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
              value={b.typeIdx ?? ''}
              onChange={e => setB(prev => ({ ...prev, typeIdx: e.target.value === '' ? null : parseInt(e.target.value) }))}
            >
              <option value="">— Select Type —</option>
              {DAMAGE_TYPES.filter(dt => isDmgType ? dt.weapon !== null : dt.armor !== null).map(dt => {
                const origIdx = DAMAGE_TYPES.indexOf(dt);
                const cost = isDmgType ? dt.weapon : dt.armor;
                return <option key={dt.label} value={origIdx}>{dt.label} (+{cost})</option>;
              })}
            </select>
          </div>
        )}

        {isPower && (
          <div className="mt-2 space-y-2">
            <Label>Power</Label>
            <PowerSearch onSelect={p => selectPower(setB, p)} />
            {b.slot.power && (
              <div className="mt-1">
                {b.slot.restriction ? (
                  <p className="text-red-400 text-sm">⛔ {RESTRICTION_MSG[b.slot.restriction]}</p>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-semibold text-white">{b.slot.power.name}</span>
                      <span className="text-gray-400 text-xs ml-2">{b.slot.power.sources}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {[['notAvailable','Not available (+2)'],['rare','Rare (+1)'],['corrupted','Corrupted (+2)']].map(([id, lbl]) => (
                        <label key={id} className={`flex items-start gap-1 p-1.5 rounded border cursor-pointer ${b.slot[id] ? 'bg-yellow-900 border-yellow-600 text-yellow-200' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                          <input type="checkbox" className="mt-0.5 shrink-0 accent-amber-400" checked={!!b.slot[id]} onChange={e => updateSlotFlag(setB, id, e.target.checked)} />
                          {lbl}
                        </label>
                      ))}
                    </div>
                    <div>
                      <Label>Power Level</Label>
                      <select
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
                        value={b.type}
                        onChange={e => updatePowerLevel(setB, e.target.value)}
                      >
                        <option value="power_1">Level 1 (+2)</option>
                        <option value="power_2">Level 2 (+4)</option>
                        <option value="power_3">Level 3 (+6)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm" onClick={onBack}>← Back</button>
          <h1 className="text-2xl font-bold text-amber-400">⚔️ Magic Item Wizard</h1>
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">2025 Rules</span>
        </div>
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
                  value={itemType} onChange={e => setItemType(e.target.value)}>
                  {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Energy Type</Label>
              <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none"
                value={energyType} onChange={e => setEnergyType(e.target.value)}>
                {ENERGY_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {[['Relic (+1)', isRelic, setIsRelic], ['Artifact (no Relic bonus)', isArtifact, setIsArtifact], ['Tainted (-4)', isTainted, setIsTainted]].map(([lbl, val, set]) => (
                <label key={lbl} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" className="accent-amber-400" checked={val} onChange={e => set(e.target.checked)} />
                  <span>{lbl}</span>
                </label>
              ))}
            </div>
          </Section>

          {renderBenefitBlock(b1, setB1, 'Benefit 1', b2)}
          {renderBenefitBlock(b2, setB2, 'Benefit 2', b1)}

          <Section title="Scorch (optional)">
            <p className="text-xs text-gray-400 mb-2">Cannot have &lt;Type&gt; Armor and Scorch for the same type.</p>
            <select
              className={`w-full bg-gray-700 text-white px-3 py-2 rounded border ${scorchConflict ? 'border-red-500' : 'border-gray-600'} focus:border-amber-400 focus:outline-none`}
              value={scorchIdx ?? ''} onChange={e => setSCorchIdx(e.target.value === '' ? null : parseInt(e.target.value))}>
              <option value="">None</option>
              {DAMAGE_TYPES.filter(dt => dt.scorch !== null).map((dt) => (
                <option key={dt.label} value={DAMAGE_TYPES.indexOf(dt)}>{dt.label} Scorch ({dt.scorch})</option>
              ))}
            </select>
            {scorchConflict && <p className="text-red-400 text-xs mt-1">⛔ Conflict: same type used for armor and scorch.</p>}
          </Section>

          <Section title="Flaw (optional)">
            <p className="text-xs text-gray-400 mb-2">One unique flaw, -4 to -0 attunement reduction (ST judgment).</p>
            <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-amber-400 focus:outline-none mb-3"
              value={flawIndex} onChange={e => setFlawIndex(parseInt(e.target.value))}>
              <option value={-1}>None</option>
              {FLAWS.map((f, i) => <option key={i} value={i}>{f}</option>)}
            </select>
            {flawIndex >= 0 && (
              <div className="flex items-center gap-3">
                <Label>Attunement Reduction (ST judgment, 0–4)</Label>
                <input type="number" min={0} max={4}
                  className="w-20 bg-gray-700 text-white px-2 py-1 rounded border border-gray-600"
                  value={flawReduction} onChange={e => setFlawReduction(Math.min(4, Math.max(0, parseInt(e.target.value) || 0)))} />
              </div>
            )}
          </Section>

          <Section title="ST Free Modifier">
            <div className="flex items-center gap-4">
              <input type="range" min={-5} max={5} step={1} value={stMod}
                onChange={e => setStMod(parseInt(e.target.value))} className="flex-1 accent-amber-400" />
              <span className={`text-xl font-bold w-12 text-center ${stMod < 0 ? 'text-green-400' : stMod > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                {stMod > 0 ? `+${stMod}` : stMod}
              </span>
            </div>
          </Section>

          <Section title="Total Attunement">
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
              attunement={breakdown.finalAtt} isRelic={isRelic} isArtifact={isArtifact} isTainted={isTainted}
              b1={b1} b2={b2} scorchIdx={scorchIdx} flawIndex={flawIndex}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function TagPreview({ itemName, itemType, energyType, attunement, isRelic, isArtifact, isTainted, b1, b2, scorchIdx, flawIndex }) {
  const lines = [];
  function addLine(b) {
    if (!b.type) return;
    if (b.type === 'dmg_type' && b.typeIdx !== null && DAMAGE_TYPES[b.typeIdx]) lines.push(`${DAMAGE_TYPES[b.typeIdx].label} Damage`);
    else if (b.type === 'arm_type' && b.typeIdx !== null && DAMAGE_TYPES[b.typeIdx]) lines.push(`${DAMAGE_TYPES[b.typeIdx].label} Armor`);
    else if (b.type.startsWith('power') && b.slot.power && !b.slot.restriction) lines.push(`Power: ${b.slot.power.name}`);
    else { const bDef = ALL_BENEFITS.find(x => x.value === b.type); if (bDef) lines.push(bDef.label); }
  }
  addLine(b1);
  addLine(b2);
  if (scorchIdx !== null && DAMAGE_TYPES[scorchIdx]) lines.push(`Scorch: ${DAMAGE_TYPES[scorchIdx].label}`);
  if (flawIndex >= 0 && FLAWS[flawIndex]) lines.push(`Flaw: ${FLAWS[flawIndex]}`);

  return (
    <div className="mt-6 rounded-xl overflow-hidden shadow-2xl font-mono" style={{ border: '2px solid #78350f' }}>
      <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
      <div className="bg-gradient-to-b from-amber-950 to-stone-950">
        <div className="px-5 pt-4 pb-2.5 text-center border-b border-amber-900/60">
          <div className="text-amber-100 font-black text-lg tracking-widest uppercase leading-tight">{itemName || '[ Item Name ]'}</div>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <span className="text-amber-500 text-xs uppercase tracking-widest">{itemType}</span>
            <span className="text-amber-800 text-xs">·</span>
            <span className="text-amber-400 text-xs">{energyType}</span>
          </div>
          {(isRelic || isArtifact || isTainted) && (
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              {isArtifact && <span className="text-xs bg-purple-950 border border-purple-700 text-purple-300 px-2 py-0.5 rounded font-bold">Artifact</span>}
              {!isArtifact && isRelic && <span className="text-xs bg-blue-950 border border-blue-700 text-blue-300 px-2 py-0.5 rounded">Relic</span>}
              {isTainted && <span className="text-xs bg-red-950 border border-red-700 text-red-400 px-2 py-0.5 rounded font-bold">⚠ TAINTED</span>}
            </div>
          )}
        </div>
        <div className="px-5 py-3 min-h-12">
          {lines.length === 0
            ? <div className="text-amber-800 text-xs text-center italic">(no properties selected)</div>
            : <div className="space-y-1.5">
                {lines.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-100">
                    <span className="text-amber-700 shrink-0 mt-0.5">◆</span>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
          }
        </div>
        <div className="border-t border-amber-900/60 px-5 py-2.5 flex items-center justify-between bg-black/20">
          <span className="text-amber-600 text-xs uppercase tracking-widest font-semibold">Attunement</span>
          <span className={`font-black text-2xl leading-none ${attunement >= 10 ? 'text-red-400' : attunement >= 6 ? 'text-amber-300' : 'text-green-400'}`}>{attunement}</span>
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
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
