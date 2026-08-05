import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Lock, Users } from 'lucide-react';
import { powersData } from '../data/powersData';

const ST_PASSWORD = '1234!';

// ── Faction templates ──────────────────────────────────────────────────────────
const FACTIONS = {
  vampire: {
    label: 'Vampire', energyType: 'Vitae',
    energyDefault: 15, energyMin: 10, energyMax: 45,
    virtue: 'Road', virtueDefault: 6,
    regenRate: 1,
    subfactionLabel: 'Clan',
    subfactions: ['Assamite','Baali','Brujah','Caitiff','Cappadocian','Gangrel','Gargoyle','Giovanni','Lamia','Lasombra','Malkavian','Nosferatu','Ravnos','Salubri (Healer)','Salubri (Warrior)','Toreador','Tremere','Tzimisce','Ventrue'],
    fundamentals: ['Amaranth','Bestial Frenzy','Blood Buff','Draining','Paralyzing Bite','Test Faction','Test Vitae'],
  },
  shifter: {
    label: 'Shifter', energyType: 'Gnosis',
    energyDefault: 15, energyMin: 10, energyMax: 20,
    virtue: 'Rage', virtueDefault: 7,
    regenRate: 2,
    subfactionLabel: 'Tribe / Fera',
    subfactions: ['Black Fury','Black Spiral Dancer','Bone Gnawer','Child of Gaia','Fenrir (Get of Fenris)','Fianna','Red Talon','Shadow Lord','Silent Strider','Silver Fang','Warder of Man','Ananasi','Bagheera','Bubasti','Ceilican','Corax','Fallen Fera','Ratkin','Swara'],
    fundamentals: ['Bestial Frenzy','Bestial Healing','Step Sideways','War Form'],
  },
  wraith: {
    label: 'Wraith', energyType: 'Pathos',
    energyDefault: 15, energyMin: 10, energyMax: 20,
    virtue: 'Angst', virtueDefault: 4,
    regenRate: 1,
    fundamentals: ['Fetter Healing','Portal Walk','Sense Emotion','Temporary Angst','Umbra Sight'],
  },
  human: {
    label: 'Human', energyType: 'Vitality',
    energyDefault: 12, energyMin: 10, energyMax: 15,
    virtue: 'Humanity', virtueDefault: 7,
    regenRate: 0,
    subfactionLabel: 'Subfaction',
    subfactions: ['Commoner','Faithful','Ghoul','Gifted Kinfolk','Sorcerer','Mage','Claimed (Drone)','Claimed (Gorgon)','Claimed (Fomori)'],
    fundamentals: [],
  },
  fae: {
    label: 'Fae', energyType: 'Mists',
    energyDefault: 20, energyMin: 10, energyMax: 45,
    virtue: 'Weaving', virtueDefault: 7,
    regenRate: 1,
    subfactionLabel: 'Court',
    fundamentals: ['Dreamshape','Gauntlet Walk','Portal Walk','Sense Faction','Sense Fae Oath','Show/Hide Mein'],
  },
  demon: {
    label: 'Demon', energyType: 'Faith',
    energyDefault: 100, energyMin: 70, energyMax: 170,
    virtue: 'Torment', virtueDefault: 10,
    regenRate: 0,
    isLegendary: true,
    fundamentals: ['Apocalyptic Form','Bestow Patron','Bestow Power','Cloak Sight','Dark Knowledge <Fallen Paths>','Dark Knowledge <Dark Thaumaturgy>','Divine Potency','Induce Sin','Omniscience','Sense Confidence','Sense Demon','Sense Item','Sense Patron','Sense Torment','Sense Virtue','Umbra Sight'],
  },
  plasmic: {
    label: 'Plasmic', energyType: 'Quintessence',
    energyDefault: 15, energyMin: 5, energyMax: 30,
    virtue: 'Gnosis', virtueDefault: 7,
    regenRate: 0,
    fundamentals: [],
  },
  spirit: {
    label: 'Spirit', energyType: 'Quintessence',
    energyDefault: 15, energyMin: 5, energyMax: 30,
    virtue: 'Gnosis', virtueDefault: 7,
    regenRate: 0,
    fundamentals: [],
  },
  zombie: {
    label: 'Zombie', energyType: 'None',
    energyDefault: 0, energyMin: 0, energyMax: 0,
    virtue: 'None', virtueDefault: 0,
    regenRate: 0,
    fundamentals: ['Toughness'],
  },
  monster: {
    label: 'Monster', energyType: 'Unknown',
    energyDefault: 0, energyMin: 0, energyMax: 170,
    virtue: 'None', virtueDefault: 0,
    regenRate: 0,
    subfactionLabel: 'Monster Type',
    subfactions: ['Fright', 'Horror', 'Terror', 'Legend'],
    fundamentals: [],
  },
};

const MONSTER_TYPES = {
  Fright: { health: '10',    energy: '0–15 (or 20–30)',   wpRange: '1–3',  powers: '0–4',      immunities: '0–2', augmentRange: '0–2' },
  Horror: { health: '10–20', energy: '0–20 (or 20–40)',   wpRange: '2–5',  powers: '1–8',      immunities: '0–3', augmentRange: '0–4' },
  Terror: { health: '10–40', energy: '0–40 (or 40–80)',   wpRange: '3–8',  powers: '1–16',     immunities: '0–4', augmentRange: '0–6' },
  Legend: { health: '10–80', energy: '0–80 (or 100–170)', wpRange: '4–10', powers: 'No limit', immunities: 'No limit', augmentRange: '0–9', isLegendary: true },
};

const SCORCH_DAMAGE_TYPES = ['Agg','Fire','Blood','Dark','Light','Silver','Wolfsbane','Gold','Holy','Iron','Water','Other'];

const HUMAN_SUBFACTION_OVERRIDES = {
  'Ghoul':          { energyType: 'Vitae',  regenRate: 1, extraFundamentals: ['Test Vitae'] },
  'Gifted Kinfolk': { energyType: 'Gnosis', regenRate: 0, extraFundamentals: [] },
  'Sorcerer':       { energyType: 'Essence',regenRate: 0, extraFundamentals: [] },
  'Mage':           { energyType: 'Essence',regenRate: 0, extraFundamentals: ['Cloak Sight','Gauntlet Walk','Read Magic','Sense Essence','Sense Faction','Sense Item','Telepathy','Umbra Sight','Q: Empower Self'], isLegendary: true },
  'Claimed (Drone)':  { regenRate: 3, extraFundamentals: ['Sense Spirit'], isPermatainted: true },
  'Claimed (Gorgon)': { regenRate: 0, extraFundamentals: ['Sense Spirit'], isPermatainted: true },
  'Claimed (Fomori)': { regenRate: 0, extraFundamentals: ['Sense Spirit'], isPermatainted: true },
};

const GENERATION_TABLE = [
  { gen: 13, label: '13th (Neonate)',     energy: 15 },
  { gen: 12, label: '12th (Neonate)',     energy: 15 },
  { gen: 11, label: '11th (Ancilla)',     energy: 15 },
  { gen: 10, label: '10th (Ancilla)',     energy: 15 },
  { gen:  9, label: '9th (Elder)',        energy: 20 },
  { gen:  8, label: '8th (Elder)',        energy: 25 },
  { gen:  7, label: '7th (Methuselah)',   energy: 35 },
  { gen:  6, label: '6th (Methuselah)',   energy: 45 },
];

const WRAITH_LEGIONS = ['Iron Legion','Skeletal Legion','Grim Legion','Penitent Legion','Emerald Legion','Silent Legion','Legion of Paupers','Legion of Fate','Renegades','Heretics','No Legion'];
const WRAITH_GUILDS  = ['Artificers','Masquers','Pardoners','Usurers','Chanteurs','Harbingers','Oracles','Sandmen','Haunters','Monitors','Spooks','Proctors','Puppeteers','Alchemists','Mnemoi','Solicitors','Enfant','No Guild'];
const SHIFTER_BREEDS  = ['Homid','Lupus','Metis','Other'];
const SHIFTER_AUSPICES = ['Ragabash','Theurge','Philodox','Galliard','Ahroun','Other'];

// ── Power search ──────────────────────────────────────────────────────────────
function PowerSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return powersData.filter(p => p.searchableText.includes(q)).slice(0, 40);
  }, [query]);

  return (
    <div ref={ref} className="relative">
      <input
        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-400 focus:outline-none text-sm"
        placeholder="Search powers (including NPC-Only)…"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded max-h-52 overflow-y-auto shadow-xl">
          {results.map(p => (
            <button key={p.name}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 text-white"
              onClick={() => { onSelect(p); setQuery(''); setOpen(false); }}>
              <span className="font-medium">{p.name}</span>
              <span className="text-gray-400 ml-2 text-xs">{p.sources}</span>
              {/NPC Only/i.test(p.description) && <span className="ml-2 text-xs text-yellow-400">[NPC]</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dot rating display ─────────────────────────────────────────────────────────
function Dots({ n }) {
  return <span className="tracking-tight">{Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < n ? 'text-white' : 'text-gray-600'}>●</span>
  ))}</span>;
}

// ── NPC Card helpers ──────────────────────────────────────────────────────────
function StatRow({ label, value, accent }) {
  return (
    <tr className="border-b border-gray-800 last:border-0">
      <td className="px-3 py-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide w-28 align-top">{label}</td>
      <td className={`px-3 py-1.5 text-xs ${accent ? 'text-amber-300 font-bold' : 'text-white'}`}>{value}</td>
    </tr>
  );
}

function CardSection({ title, color = 'text-purple-400', children }) {
  return (
    <div className="px-3 py-2.5 border-b border-gray-800 last:border-0">
      <div className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${color}`}>{title}</div>
      {children}
    </div>
  );
}

function PowerRow({ power }) {
  return (
    <div className="text-xs text-gray-200 flex items-baseline gap-2">
      <Dots n={power.level} />
      <span>{power.name}</span>
      {power.sources && <span className="text-gray-500">[{power.sources}]</span>}
    </div>
  );
}

// ── NPC Card preview ──────────────────────────────────────────────────────────
function NPCCard({ npc, resolvedFaction }) {
  const {
    name, title, faction, subfaction, isLegendary, isPermatainted,
    energy, energyType, willpower, virtue, virtueValue, regenRate,
    powers, fundamentals, skills, merits, notes,
    generation, road, amaranth,
    breed, auspice, rank,
    legion, guild, passions, shadowArchetype, thorn,
    lineage, court, echoes,
    trueName, celestialName, appellation, demonicVice,
    extraField1, extraField2,
    monsterHealth, isRealmbound, isHealthAsEnergy, monsterAugment,
    scorchTypes, immunities, weaknesses, senseFaction,
  } = npc;

  const innate     = powers.filter(p => p.cat === 'innate');
  const learned    = powers.filter(p => p.cat === 'learned');
  const additional = powers.filter(p => p.cat === 'additional');

  const fLabel = resolvedFaction?.label || faction;

  const factionSpecifics = [];
  if (faction === 'vampire') {
    const genRow = GENERATION_TABLE.find(g => g.gen === Number(generation));
    if (genRow) factionSpecifics.push(`Generation: ${genRow.label}`);
    if (road) factionSpecifics.push(`Road: ${road}`);
    if (amaranth > 0) factionSpecifics.push(`Amaranth: ${amaranth}`);
  } else if (faction === 'shifter') {
    if (breed) factionSpecifics.push(`Breed: ${breed}`);
    if (auspice) factionSpecifics.push(`Auspice: ${auspice}`);
    if (rank) factionSpecifics.push(`Rank: ${rank}`);
  } else if (faction === 'wraith') {
    if (legion && legion !== 'No Legion') factionSpecifics.push(`Legion: ${legion}`);
    if (guild && guild !== 'No Guild') factionSpecifics.push(`Guild: ${guild}`);
    if (passions) factionSpecifics.push(`Passions: ${passions}`);
    if (shadowArchetype) factionSpecifics.push(`Shadow: ${shadowArchetype}${thorn ? ` — Thorn: ${thorn}` : ''}`);
  } else if (faction === 'fae') {
    if (lineage) factionSpecifics.push(`Lineage: ${lineage}`);
    if (court) factionSpecifics.push(`Court: ${court}`);
    if (echoes) factionSpecifics.push(`Echoes: ${echoes}`);
  } else if (faction === 'demon') {
    if (trueName) factionSpecifics.push(`True Name: ${trueName}`);
    if (celestialName) factionSpecifics.push(`Celestial Name: ${celestialName}`);
    if (appellation) factionSpecifics.push(`Appellation: ${appellation}`);
    if (demonicVice) factionSpecifics.push(`Vice: ${demonicVice}`);
  } else if (faction === 'plasmic' || faction === 'spirit') {
    if (extraField1) factionSpecifics.push(`Type: ${extraField1}`);
    if (extraField2) factionSpecifics.push(extraField2);
  } else if (faction === 'monster') {
    factionSpecifics.push(isRealmbound
      ? 'Realmbound. Goes to Dead if forced into the Umbra.'
      : 'Umbrabound. Goes to Dead if forced into the Realm.');
    if (isHealthAsEnergy) factionSpecifics.push('Spend Health as Energy.');
    if (senseFaction) factionSpecifics.push(`Call "no effect" to ${senseFaction} Sense Health or any healing powers/skills.`);
  }

  return (
    <div className="border-2 border-purple-700 rounded-lg bg-gray-950 shadow-xl overflow-hidden print:shadow-none text-sm">

      {/* ── Header ── */}
      <div className="bg-purple-950 border-b-2 border-purple-800 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-white font-black text-xl tracking-tight leading-none">{name || '[ NPC Name ]'}</div>
            {title && <div className="text-purple-300 text-sm italic mt-1">{title}</div>}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {isLegendary && <span className="text-xs bg-yellow-900 border border-yellow-700 text-yellow-300 px-2 py-0.5 rounded font-bold whitespace-nowrap">⚑ LEGENDARY</span>}
            {isPermatainted && <span className="text-xs bg-red-900 border border-red-700 text-red-300 px-2 py-0.5 rounded whitespace-nowrap">☠ PERMATAINTED</span>}
            <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded">NPC</span>
          </div>
        </div>
      </div>

      {/* ── Stats table ── */}
      <table className="w-full border-b border-gray-800">
        <tbody>
          <StatRow label="Faction" value={fLabel} />
          {subfaction && <StatRow label="Sub-Faction" value={subfaction} />}
          {energyType !== 'None' && <StatRow label="Energy" value={`${energy} (${energyType})`} />}
          <StatRow label="Willpower" value={willpower} />
          <StatRow label="Virtue" value={virtue !== 'None' ? `${virtueValue} (${virtue})` : 'N/A'} />
          {regenRate > 0 && <StatRow label="Regen Rate" value={regenRate} />}
          {faction === 'monster' && <StatRow label="Health" value={monsterHealth} accent />}
          {faction === 'monster' && monsterAugment > 0 && <StatRow label="Augment" value={monsterAugment} />}
          {faction === 'vampire' && generation && (
            <StatRow label="Generation" value={GENERATION_TABLE.find(g => g.gen === Number(generation))?.label || generation} />
          )}
        </tbody>
      </table>

      {/* ── Monster: Scorch / Immunities / Weaknesses ── */}
      {faction === 'monster' && (scorchTypes?.length > 0 || immunities?.some(im => im.text) || weaknesses?.some(w => w.text)) && (
        <table className="w-full border-b border-gray-800">
          <tbody>
            {scorchTypes?.length > 0 && (
              <tr className="border-b border-gray-800 last:border-0">
                <td className="px-3 py-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide w-28 align-top">Scorch</td>
                <td className="px-3 py-1.5 text-xs text-orange-300">{scorchTypes.join(', ')}</td>
              </tr>
            )}
            {immunities?.some(im => im.text) && (
              <tr className="border-b border-gray-800 last:border-0">
                <td className="px-3 py-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide align-top">Immunities</td>
                <td className="px-3 py-1.5 text-xs text-cyan-300">
                  <div className="space-y-0.5">
                    {immunities.filter(im => im.text).map((im, i) => (
                      <div key={i}>{im.text}{im.condition ? <span className="text-gray-400"> (unless: {im.condition})</span> : ''}</div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
            {weaknesses?.some(w => w.text) && (
              <tr className="border-b border-gray-800 last:border-0">
                <td className="px-3 py-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide align-top">Weaknesses</td>
                <td className="px-3 py-1.5 text-xs text-red-300">
                  <div className="space-y-0.5">
                    {weaknesses.filter(w => w.text).map((w, i) => (
                      <div key={i}>{w.text}{w.condition ? <span className="text-gray-400"> (when: {w.condition})</span> : ''}</div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* ── Content sections ── */}
      <div>
        {factionSpecifics.length > 0 && (
          <CardSection title="Faction Specifics">
            <div className="space-y-0.5">
              {factionSpecifics.map((line, i) => <div key={i} className="text-gray-200 text-xs">{line}</div>)}
            </div>
          </CardSection>
        )}

        {fundamentals.filter(Boolean).length > 0 && (
          <CardSection title="Fundamental Powers" color="text-purple-300">
            <div className="space-y-0.5">
              {fundamentals.filter(Boolean).map((f, i) => <div key={i} className="text-gray-200 text-xs">{f}</div>)}
            </div>
          </CardSection>
        )}

        {innate.length > 0 && (
          <CardSection title="Innate Tree Powers" color="text-green-400">
            <div className="space-y-0.5">{innate.map((p, i) => <PowerRow key={i} power={p} />)}</div>
          </CardSection>
        )}

        {learned.length > 0 && (
          <CardSection title="Learned Powers" color="text-blue-400">
            <div className="space-y-0.5">{learned.map((p, i) => <PowerRow key={i} power={p} />)}</div>
          </CardSection>
        )}

        {additional.length > 0 && (
          <CardSection title="Additional Powers" color="text-amber-400">
            <div className="space-y-0.5">{additional.map((p, i) => <PowerRow key={i} power={p} />)}</div>
          </CardSection>
        )}

        {skills.some(s => s.name) && (
          <CardSection title="Skills" color="text-gray-300">
            <div className="flex flex-wrap gap-x-5 gap-y-0.5">
              {skills.filter(s => s.name).map((s, i) => (
                <span key={i} className="text-xs text-gray-200">{s.name} <Dots n={s.dots} /></span>
              ))}
            </div>
          </CardSection>
        )}

        {merits.some(m => m.trim()) && (
          <CardSection title="Merits" color="text-gray-300">
            <div className="space-y-0.5">
              {merits.filter(m => m.trim()).map((m, i) => <div key={i} className="text-xs text-gray-200">{m}</div>)}
            </div>
          </CardSection>
        )}

        {notes && (
          <CardSection title="Notes" color="text-gray-400">
            <p className="text-xs text-gray-300 whitespace-pre-wrap italic">{notes}</p>
          </CardSection>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const NPCCreator = ({ onBack }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput]   = useState('');
  const [pwError, setPwError]   = useState(false);

  // Identity
  const [name, setName]               = useState('');
  const [title, setTitle]             = useState('');
  const [faction, setFaction]         = useState('vampire');
  const [subfaction, setSubfaction]   = useState('');
  const [isLegendary, setIsLegendary] = useState(false);

  // Stats
  const [energy, setEnergy]           = useState(15);
  const [energyType, setEnergyType]   = useState('Vitae');
  const [willpower, setWillpower]     = useState(6);
  const [virtue, setVirtue]           = useState('Road');
  const [virtueValue, setVirtueValue] = useState(6);
  const [regenRate, setRegenRate]     = useState(1);

  // Vampire extras
  const [generation, setGeneration] = useState(10);
  const [road, setRoad]             = useState('Road of Humanity');
  const [amaranth, setAmaranth]     = useState(0);

  // Shifter extras
  const [breed, setBreed]     = useState('Homid');
  const [auspice, setAuspice] = useState('Ahroun');
  const [rank, setRank]       = useState(1);

  // Wraith extras
  const [legion, setLegion]                 = useState('No Legion');
  const [guild, setGuild]                   = useState('No Guild');
  const [passions, setPassions]             = useState('');
  const [shadowArchetype, setShadowArchetype] = useState('');
  const [thorn, setThorn]                   = useState('');

  // Fae extras
  const [lineage, setLineage] = useState('');
  const [court, setCourt]     = useState('');
  const [echoes, setEchoes]   = useState('');

  // Demon extras
  const [trueName, setTrueName]           = useState('');
  const [celestialName, setCelestialName] = useState('');
  const [appellation, setAppellation]     = useState('');
  const [demonicVice, setDemonicVice]     = useState('');

  // Plasmic/Spirit
  const [extraField1, setExtraField1] = useState('');
  const [extraField2, setExtraField2] = useState('');

  // Monster extras
  const [monsterHealth, setMonsterHealth]       = useState(10);
  const [isRealmbound, setIsRealmbound]         = useState(true);
  const [isHealthAsEnergy, setIsHealthAsEnergy] = useState(false);
  const [monsterAugment, setMonsterAugment]     = useState(1);
  const [scorchTypes, setScorchTypes]           = useState(['Fire']);
  const [newScorchType, setNewScorchType]       = useState('Fire');
  const [immunities, setImmunities]             = useState([{ text: '', condition: '' }]);
  const [weaknesses, setWeaknesses]             = useState([{ text: '', condition: '' }]);
  const [senseFaction, setSenseFaction]         = useState('Monster');

  // Powers
  const [powers, setPowers]         = useState([]);
  const [fundamentals, setFundamentals] = useState([]);
  const [newPowerCat, setNewPowerCat] = useState('innate');
  const [newPowerLevel, setNewPowerLevel] = useState(1);
  const [freeformPower, setFreeformPower] = useState('');

  // Skills
  const [skills, setSkills] = useState([{ name: '', dots: 1 }]);

  // Merits + notes
  const [merits, setMerits]   = useState(['']);
  const [notes, setNotes]     = useState('');
  const [isPermatainted, setIsPermatainted] = useState(false);

  const nextPowerId = useRef(1);

  // Apply faction template when faction changes
  useEffect(() => {
    const tmpl = FACTIONS[faction];
    if (!tmpl) return;
    setEnergyType(tmpl.energyType);
    setEnergy(tmpl.energyDefault);
    setVirtue(tmpl.virtue);
    setVirtueValue(tmpl.virtueDefault);
    setRegenRate(tmpl.regenRate);
    setIsLegendary(!!tmpl.isLegendary);
    setSubfaction('');
    setFundamentals([...tmpl.fundamentals]);
    if (faction === 'monster') { setScorchTypes(['Fire']); setMonsterHealth(10); setMonsterAugment(1); setSenseFaction('Monster'); setIsRealmbound(true); setIsHealthAsEnergy(false); }
  }, [faction]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply human subfaction overrides
  useEffect(() => {
    if (faction !== 'human') return;
    const tmpl = FACTIONS.human;
    const override = HUMAN_SUBFACTION_OVERRIDES[subfaction] || {};
    setEnergyType(override.energyType || tmpl.energyType);
    setRegenRate(override.regenRate ?? tmpl.regenRate);
    setIsLegendary(!!override.isLegendary);
    setIsPermatainted(!!override.isPermatainted);
    const base = [...tmpl.fundamentals];
    const extra = override.extraFundamentals || [];
    setFundamentals([...base, ...extra]);
  }, [subfaction, faction]);

  // Auto-set energy from vampire generation
  useEffect(() => {
    if (faction !== 'vampire') return;
    const row = GENERATION_TABLE.find(g => g.gen === Number(generation));
    if (row) setEnergy(row.energy);
  }, [generation, faction]);

  // Auto-set Legendary + Umbra Sight fundamentals for monster type/realm changes
  useEffect(() => {
    if (faction !== 'monster') return;
    if (MONSTER_TYPES[subfaction]?.isLegendary) setIsLegendary(true);
    setFundamentals(prev => {
      const base = prev.filter(f => f !== 'Umbra Sight');
      return isRealmbound ? base : [...base, 'Umbra Sight'];
    });
  }, [subfaction, isRealmbound, faction]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedFaction = FACTIONS[faction];

  const npcData = {
    name, title, faction, subfaction, isLegendary, isPermatainted,
    energy, energyType, willpower, virtue, virtueValue, regenRate,
    powers, fundamentals,
    skills, merits, notes,
    generation, road, amaranth,
    breed, auspice, rank,
    legion, guild, passions, shadowArchetype, thorn,
    lineage, court, echoes,
    trueName, celestialName, appellation, demonicVice,
    extraField1, extraField2,
    monsterHealth, isRealmbound, isHealthAsEnergy, monsterAugment,
    scorchTypes, immunities, weaknesses, senseFaction,
  };

  if (!unlocked) {
    const tryUnlock = () => { if (pwInput === ST_PASSWORD) setUnlocked(true); else setPwError(true); };
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 w-80 shadow-xl text-center">
          <Lock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-1">NPC Creator</h2>
          <p className="text-gray-500 text-xs mb-5">Storyteller access required</p>
          <input type="password" autoFocus placeholder="ST Password" value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={e => { if (e.key === 'Enter') tryUnlock(); if (e.key === 'Escape') onBack(); }}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {pwError && <p className="text-red-400 text-xs mb-2">Incorrect password.</p>}
          <div className="flex gap-2">
            <button onClick={onBack} className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded">Cancel</button>
            <button onClick={tryUnlock} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded font-semibold">Unlock</button>
          </div>
        </div>
      </div>
    );
  }

  const inp = "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
  const lbl = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1";
  const sec = "bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3";

  const addPower = (p) => {
    setPowers(prev => [...prev, {
      id: nextPowerId.current++,
      name: p.name,
      sources: p.sources || '',
      cat: newPowerCat,
      level: newPowerLevel,
      isNpcOnly: /NPC Only/i.test(p.description || ''),
    }]);
  };

  const addFreeformPower = () => {
    if (!freeformPower.trim()) return;
    setPowers(prev => [...prev, {
      id: nextPowerId.current++,
      name: freeformPower.trim(),
      sources: '',
      cat: newPowerCat,
      level: newPowerLevel,
      isNpcOnly: false,
    }]);
    setFreeformPower('');
  };

  const removeSkillRow = idx => setSkills(s => s.filter((_, i) => i !== idx));
  const removeMeritRow = idx => setMerits(m => m.filter((_, i) => i !== idx));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">← Back</button>
        <Users className="w-5 h-5 text-purple-400" />
        <h1 className="text-lg font-bold text-purple-400 mr-auto">NPC Creator</h1>
        <span className="text-xs text-gray-500">🔓 ST Mode</span>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── LEFT: Form ─────────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Identity */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Identity</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className={lbl}>NPC Name</label>
                <input className={inp} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Title / Role</label>
                <input className={inp} placeholder="e.g. Prince of the City, Local Contact" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Faction</label>
                <select className={inp} value={faction} onChange={e => setFaction(e.target.value)}>
                  {Object.entries(FACTIONS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              {resolvedFaction?.subfactions && (
                <div>
                  <label className={lbl}>{resolvedFaction.subfactionLabel || 'Subfaction'}</label>
                  <select className={inp} value={subfaction} onChange={e => setSubfaction(e.target.value)}>
                    <option value="">— Select —</option>
                    {resolvedFaction.subfactions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              {faction === 'wraith' && (
                <>
                  <div>
                    <label className={lbl}>Legion</label>
                    <select className={inp} value={legion} onChange={e => setLegion(e.target.value)}>
                      {WRAITH_LEGIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Guild</label>
                    <select className={inp} value={guild} onChange={e => setGuild(e.target.value)}>
                      {WRAITH_GUILDS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-purple-400" checked={isLegendary} onChange={e => setIsLegendary(e.target.checked)} />
                Legendary
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-red-500" checked={isPermatainted} onChange={e => setIsPermatainted(e.target.checked)} />
                Permatainted
              </label>
            </div>
          </div>

          {/* Stats */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Stats</h2>
            <div className="grid grid-cols-2 gap-2">
              {faction !== 'zombie' && (
                <>
                  <div>
                    <label className={lbl}>Energy Type</label>
                    <input className={inp} value={energyType} onChange={e => setEnergyType(e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Energy {resolvedFaction && `(${resolvedFaction.energyMin}–${resolvedFaction.energyMax})`}</label>
                    <input type="number" className={inp} min={resolvedFaction?.energyMin ?? 0} max={resolvedFaction?.energyMax ?? 999} value={energy} onChange={e => setEnergy(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className={lbl}>Willpower (1–10)</label>
                    <input type="number" className={inp} min={1} max={10} value={willpower} onChange={e => setWillpower(Number(e.target.value))} />
                  </div>
                </>
              )}
              {resolvedFaction?.virtue !== 'None' && (
                <>
                  <div>
                    <label className={lbl}>Virtue Type</label>
                    <input className={inp} value={virtue} onChange={e => setVirtue(e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>{virtue || 'Virtue'} Value (1–10)</label>
                    <input type="number" className={inp} min={1} max={10} value={virtueValue} onChange={e => setVirtueValue(Number(e.target.value))} />
                  </div>
                </>
              )}
              <div>
                <label className={lbl}>Regeneration Rate</label>
                <input type="number" className={inp} min={0} max={10} value={regenRate} onChange={e => setRegenRate(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Faction-specific extras */}
          {faction === 'vampire' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Vampire Details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Generation</label>
                  <select className={inp} value={generation} onChange={e => setGeneration(Number(e.target.value))}>
                    {GENERATION_TABLE.map(g => <option key={g.gen} value={g.gen}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Amaranth Count</label>
                  <input type="number" className={inp} min={0} value={amaranth} onChange={e => setAmaranth(Number(e.target.value))} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Road</label>
                  <input className={inp} placeholder="Road of Humanity" value={road} onChange={e => setRoad(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {faction === 'shifter' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Shifter Details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Breed</label>
                  <select className={inp} value={breed} onChange={e => setBreed(e.target.value)}>
                    {SHIFTER_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Auspice</label>
                  <select className={inp} value={auspice} onChange={e => setAuspice(e.target.value)}>
                    {SHIFTER_AUSPICES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Rank (1–5)</label>
                  <input type="number" className={inp} min={1} max={5} value={rank} onChange={e => setRank(Number(e.target.value))} />
                </div>
              </div>
            </div>
          )}
          {faction === 'wraith' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Wraith Details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className={lbl}>Passions (comma-separated)</label>
                  <input className={inp} placeholder="e.g. Protect family, Avenge death" value={passions} onChange={e => setPassions(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Shadow Archetype</label>
                  <input className={inp} placeholder="e.g. The Tyrant" value={shadowArchetype} onChange={e => setShadowArchetype(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Thorn</label>
                  <input className={inp} placeholder="e.g. Phantom Pain" value={thorn} onChange={e => setThorn(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {faction === 'fae' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Fae Details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Lineage</label>
                  <input className={inp} placeholder="e.g. Sidhe, Pooka" value={lineage} onChange={e => setLineage(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Court</label>
                  <input className={inp} placeholder="e.g. Seelie, Unseelie" value={court} onChange={e => setCourt(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Echoes (comma-separated)</label>
                  <input className={inp} placeholder="e.g. Echo 1, Echo 2 (Prime)" value={echoes} onChange={e => setEchoes(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {faction === 'demon' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Demon Details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className={lbl}>True Name <span className="text-yellow-400">(⚠ keep secret)</span></label>
                  <input className={inp} placeholder="The demon's true name" value={trueName} onChange={e => setTrueName(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Celestial Name</label>
                  <input className={inp} value={celestialName} onChange={e => setCelestialName(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Appellation</label>
                  <input className={inp} placeholder="Common name/title" value={appellation} onChange={e => setAppellation(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Demonic Vice</label>
                  <input className={inp} placeholder="e.g. Wrath, Envy" value={demonicVice} onChange={e => setDemonicVice(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {(faction === 'plasmic' || faction === 'spirit') && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">{resolvedFaction?.label} Details</h2>
              <div>
                <label className={lbl}>Type / Classification</label>
                <input className={inp} placeholder="e.g. War Spirit, Ancestor" value={extraField1} onChange={e => setExtraField1(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Additional Notes</label>
                <input className={inp} value={extraField2} onChange={e => setExtraField2(e.target.value)} />
              </div>
            </div>
          )}
          {faction === 'monster' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Monster Details</h2>
              {subfaction && MONSTER_TYPES[subfaction] && (
                <div className="bg-gray-900 rounded border border-gray-700 p-2 text-xs space-y-0.5">
                  <div className="text-gray-300 font-semibold mb-1">{subfaction} reference ranges:</div>
                  {Object.entries(MONSTER_TYPES[subfaction]).filter(([k]) => k !== 'isLegendary').map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-gray-400">
                      <span className="w-28 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-white">{v}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Health</label>
                  <input type="number" className={inp} min={1} value={monsterHealth} onChange={e => setMonsterHealth(Number(e.target.value))} />
                </div>
                <div>
                  <label className={lbl}>Augment (0–9)</label>
                  <input type="number" className={inp} min={0} max={9} value={monsterAugment} onChange={e => setMonsterAugment(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className={lbl}>Realm Affinity</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="radio" className="accent-purple-400" checked={isRealmbound} onChange={() => setIsRealmbound(true)} />
                    Realmbound (physical world)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="radio" className="accent-purple-400" checked={!isRealmbound} onChange={() => setIsRealmbound(false)} />
                    Umbrabound (spirit world)
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" className="accent-purple-400" checked={isHealthAsEnergy} onChange={e => setIsHealthAsEnergy(e.target.checked)} />
                  Spend Health as Energy
                </label>
              </div>
              <div>
                <label className={lbl}>Sense Faction Response</label>
                <input className={inp} placeholder='e.g. Monster (for "no effect" call)' value={senseFaction} onChange={e => setSenseFaction(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Scorch Types</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {scorchTypes.map((t, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-orange-900 text-orange-200 px-2 py-0.5 rounded">
                      {t}
                      <button onClick={() => setScorchTypes(prev => prev.filter((_, j) => j !== i))} className="text-orange-400 hover:text-orange-200 ml-0.5">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select className={`${inp} flex-1`} value={newScorchType} onChange={e => setNewScorchType(e.target.value)}>
                    {SCORCH_DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => { if (!scorchTypes.includes(newScorchType)) setScorchTypes(prev => [...prev, newScorchType]); }}
                    className="bg-orange-800 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm shrink-0">Add</button>
                </div>
              </div>
              <div>
                <label className={lbl}>Immunities</label>
                <div className="space-y-2">
                  {immunities.map((im, i) => (
                    <div key={i} className="flex gap-2">
                      <input className={`${inp} flex-1`} placeholder="Immune to…" value={im.text}
                        onChange={e => setImmunities(prev => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
                      <input className={`${inp} flex-1`} placeholder="Unless…" value={im.condition}
                        onChange={e => setImmunities(prev => prev.map((x, j) => j === i ? { ...x, condition: e.target.value } : x))} />
                      {immunities.length > 1 && <button onClick={() => setImmunities(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm">✕</button>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setImmunities(prev => [...prev, { text: '', condition: '' }])}
                  className="text-xs text-purple-400 hover:text-purple-300 border border-purple-700 rounded px-2 py-1 mt-1">+ Add Immunity</button>
              </div>
              <div>
                <label className={lbl}>Weaknesses</label>
                <div className="space-y-2">
                  {weaknesses.map((w, i) => (
                    <div key={i} className="flex gap-2">
                      <input className={`${inp} flex-1`} placeholder="Weakness…" value={w.text}
                        onChange={e => setWeaknesses(prev => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
                      <input className={`${inp} flex-1`} placeholder="When…" value={w.condition}
                        onChange={e => setWeaknesses(prev => prev.map((x, j) => j === i ? { ...x, condition: e.target.value } : x))} />
                      {weaknesses.length > 1 && <button onClick={() => setWeaknesses(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm">✕</button>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setWeaknesses(prev => [...prev, { text: '', condition: '' }])}
                  className="text-xs text-purple-400 hover:text-purple-300 border border-purple-700 rounded px-2 py-1 mt-1">+ Add Weakness</button>
              </div>
            </div>
          )}

          {/* Fundamental Powers */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Fundamental Powers</h2>
            <p className="text-xs text-gray-500">Auto-populated from faction. Add or remove as needed.</p>
            <div className="space-y-1">
              {fundamentals.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${inp} flex-1`} value={f} onChange={e => setFundamentals(prev => prev.map((x, j) => j === i ? e.target.value : x))} />
                  <button onClick={() => setFundamentals(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => setFundamentals(prev => [...prev, ''])}
              className="text-xs text-purple-400 hover:text-purple-300 border border-purple-700 rounded px-2 py-1">
              + Add Fundamental
            </button>
          </div>

          {/* Powers */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Powers</h2>
            <p className="text-xs text-gray-500">NPCs may use NPC-Only powers. Search the database or enter freeform.</p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>Category</label>
                <select className={inp} value={newPowerCat} onChange={e => setNewPowerCat(e.target.value)}>
                  <option value="innate">Innate Tree</option>
                  <option value="learned">Learned</option>
                  <option value="additional">Additional / Other</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Level</label>
                <select className={inp} value={newPowerLevel} onChange={e => setNewPowerLevel(Number(e.target.value))}>
                  <option value={1}>● Level 1</option>
                  <option value={2}>●● Level 2</option>
                  <option value={3}>●●● Level 3</option>
                </select>
              </div>
            </div>
            <PowerSearch onSelect={addPower} />
            <div className="flex gap-2">
              <input className={`${inp} flex-1`} placeholder="Freeform / NPC-Only power name…"
                value={freeformPower} onChange={e => setFreeformPower(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addFreeformPower(); }}
              />
              <button onClick={addFreeformPower} className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm shrink-0">Add</button>
            </div>

            {powers.length > 0 && (
              <div className="space-y-1 mt-1 max-h-52 overflow-y-auto">
                {powers.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-gray-900 rounded px-2 py-1.5 text-sm">
                    <span className={`text-xs shrink-0 px-1.5 py-0.5 rounded ${p.cat === 'innate' ? 'bg-green-900 text-green-300' : p.cat === 'learned' ? 'bg-blue-900 text-blue-300' : 'bg-amber-900 text-amber-300'}`}>
                      {p.cat === 'innate' ? 'Inn' : p.cat === 'learned' ? 'Lrn' : 'Adl'}
                    </span>
                    <Dots n={p.level} />
                    <span className="flex-1 truncate text-gray-200">{p.name}</span>
                    {p.isNpcOnly && <span className="text-xs text-yellow-400 shrink-0">[NPC]</span>}
                    <select value={p.cat} onChange={e => setPowers(prev => prev.map(x => x.id === p.id ? { ...x, cat: e.target.value } : x))}
                      className="bg-gray-700 text-white text-xs rounded px-1 py-0.5 border border-gray-600 shrink-0">
                      <option value="innate">Innate</option>
                      <option value="learned">Learned</option>
                      <option value="additional">Additional</option>
                    </select>
                    <button onClick={() => setPowers(prev => prev.filter(x => x.id !== p.id))} className="text-red-400 hover:text-red-300 text-xs shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Skills</h2>
            <div className="space-y-2">
              {skills.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className={`${inp} flex-1`} placeholder="Skill name"
                    value={s.name} onChange={e => setSkills(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <select value={s.dots}
                    onChange={e => setSkills(prev => prev.map((x, j) => j === i ? { ...x, dots: Number(e.target.value) } : x))}
                    className="bg-gray-700 text-white text-sm rounded px-2 py-2 border border-gray-600 shrink-0">
                    {[1,2,3,4,5].map(d => <option key={d} value={d}>{['●','●●','●●●','●●●●','●●●●●'][d-1]}</option>)}
                  </select>
                  {skills.length > 1 && <button onClick={() => removeSkillRow(i)} className="text-red-400 hover:text-red-300 text-sm">✕</button>}
                </div>
              ))}
            </div>
            <button onClick={() => setSkills(prev => [...prev, { name: '', dots: 1 }])}
              className="text-xs text-purple-400 hover:text-purple-300 border border-purple-700 rounded px-2 py-1">
              + Add Skill
            </button>
          </div>

          {/* Merits */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Merits / Flaws</h2>
            <div className="space-y-2">
              {merits.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${inp} flex-1`} placeholder="Merit or flaw name"
                    value={m} onChange={e => setMerits(prev => prev.map((x, j) => j === i ? e.target.value : x))} />
                  {merits.length > 1 && <button onClick={() => removeMeritRow(i)} className="text-red-400 hover:text-red-300 text-sm">✕</button>}
                </div>
              ))}
            </div>
            <button onClick={() => setMerits(prev => [...prev, ''])}
              className="text-xs text-purple-400 hover:text-purple-300 border border-purple-700 rounded px-2 py-1">
              + Add Merit / Flaw
            </button>
          </div>

          {/* Notes */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">ST Notes</h2>
            <textarea className={`${inp} h-28 resize-none`}
              placeholder="Background, motivations, plot hooks, important IC knowledge, encounter notes…"
              value={notes} onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* ── RIGHT: NPC Card preview ──────────────────────────────────────── */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">NPC Card Preview</p>
          <NPCCard npc={npcData} resolvedFaction={resolvedFaction} />
          <p className="text-xs text-gray-600 mt-2 text-center">Use browser print (Ctrl+P) to print this card</p>
        </div>
      </div>
    </div>
  );
};

export default NPCCreator;
