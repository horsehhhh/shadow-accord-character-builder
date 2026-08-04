import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, BookOpen, Zap, Users, DollarSign, Volume2, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

function PowerIndex({ onBack, embedded = false }) {
  const [powers, setPowers] = useState([]);
  const [showLegend, setShowLegend] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(true);

  // Hardcoded powers data from the player_powers_guide.md
  const powersData = useMemo(() => [
    {
      name: "AGGRAVATED 1",
      type: "DAMAGE",
      sources: "S3 V3 W3",
      cost: "1 Energy",
      call: "\"Agg 1\"",
      description: "Throw a packet that does 1 aggravated damage.",
      searchableText: "aggravated damage packet throw 1 energy"
    },
    {
      name: "AGGRAVATED CLAWS",
      type: "DAMAGE",
      sources: "V3",
      cost: "1 Energy",
      call: "\"Agg <Number>\"",
      description: "Add the \"Agg\" <type> to a single natural weapon attack.",
      searchableText: "aggravated claws natural weapon attack add type"
    },
    {
      name: "AMARANTH",
      type: "COUNTED TOUCH",
      sources: "V",
      cost: "None",
      call: "\"Amaranth 1, Amaranth 2, Amaranth 3\"",
      description: "This power may only be activated after successfully using Paralyzing Bite or Draining on a Vampire with 0 Vitae. Other targets state \"No Effect\". During the Amaranth, the target remains paralyzed per the power Paralyze.\n\nBegin an \"Amaranth 1, Amaranth 2, Amaranth 3\" call. After the \"Amaranth 3\" call, the target may spend 1 Willpower to resist, calling \"Resist\". If they do, you must immediately begin the call again at \"Amaranth 1\". You cannot willingly stop using this power once you have started.\n\nIf the target does not resist, they immediately become Dead and go OOG. They cannot be played again (e.g. even with the Lost Soul merit).",
      searchableText: "amaranth vampire paralyzing bite draining vitae counted touch dead willpower resist"
    },
    {
      name: "APPEAR",
      type: "SELF",
      sources: "W2",
      cost: "1 Energy",
      call: "\"Realm\", \"Umbra\"",
      description: "You enter the Realm for 10 minutes. You cannot use Paralyzing Touch or spend Energy, except to Regenerate. You may return to the Umbra at no cost at any time by stating \"Umbra\".",
      searchableText: "appear realm umbra wraith 10 minutes paralyzing touch energy regenerate"
    },
    {
      name: "AVERT",
      type: "MENTAL",
      sources: "H1 S1",
      cost: "1 Energy",
      call: "\"Avert\"",
      description: "Hold out your hand with your palm facing the target. Alternatively, hold out a non-boffer, non-shield item. The target may not advance towards you while you're within 10 feet of the target. The target may not attack you. Only one target may be Averted by you at any time.\n\nThis power may be used from the Realm on a target in the Umbra that you can see in-game by adding the \"Breach\" meta call.\n\nThis power ends immediately when you lower your hand.",
      searchableText: "avert mental hand palm target advance attack 10 feet breach umbrella realm"
    },
    {
      name: "AVOIDANCE",
      type: "SELF",
      sources: "K3 H3 S2 V2 W3",
      cost: "1 Willpower",
      call: "\"Realm\"",
      description: "Resist a single damage attack and any Meta calls associated with it.",
      searchableText: "avoidance resist damage attack meta calls willpower"
    },
    {
      name: "BALEFIRE",
      type: "DAMAGE",
      sources: "Sc3 Vr3 Vc",
      cost: "2 Energy",
      call: "\"Tainted Agg 4\"",
      description: "Throw a packet that does 4 aggravated damage and Taints the target.",
      searchableText: "balefire tainted aggravated damage 4 packet throw taints corrupt"
    },
    {
      name: "BEAST MIND",
      type: "MENTAL",
      sources: "H1 S2 V1",
      cost: "1 Energy",
      call: "\"Beast Mind\" and \"predator\" or \"prey\"",
      description: "The target must roleplay as an animal that is either a predator or prey based on the sig call used. The target may not use language; whether verbal, written, or telepathic.",
      searchableText: "beast mind animal predator prey roleplay language verbal written telepathic"
    },
    {
      name: "BESTIAL FRENZY",
      type: "SELF",
      sources: "S, V",
      cost: "1 Virtue",
      call: "None",
      description: "You enter a Frenzy.",
      searchableText: "bestial frenzy enter virtue"
    },
    {
      name: "BESTIAL HEALING",
      type: "SELF",
      sources: "S",
      cost: "1 Virtue",
      call: "None",
      description: "You cannot use this power if unable to Frenzy (e.g. if affected by Disquiet). You may only use this power immediately upon reaching 0 Health. You gain 1 Health (not exceeding your maximum), remain in your current realm, and enter a Frenzy that cannot be directed (e.g. even with Frenzy Control).",
      searchableText: "bestial healing frenzy disquiet 0 health gain maximum virtue"
    },
    {
      name: "BLACK ICHOR",
      type: "OTHER",
      sources: "Vr1",
      cost: "None",
      call: "None",
      description: "Receive one Vitae Poison tag at each Check-In.",
      searchableText: "black ichor vitae poison tag check-in vampire rare"
    },
    {
      name: "BLOOD BUFF",
      type: "SELF",
      sources: "V",
      cost: "2 Energy",
      call: "None",
      description: "Gain Augment 1 for 60 seconds. Different sources of Augment stack with one another.",
      searchableText: "blood buff augment 60 seconds stack vampire"
    },
    {
      name: "BODY WRACK",
      type: "STATUS",
      sources: "H2 Hc2 S2 Vr2 Vc2",
      cost: "1 Energy",
      call: "\"Body Wrack\"",
      description: "The target must roleplay being in intense pain. The target may only move at a slow walk. The target may only make boffer attacks.\n*Breachable Umbra → Realm*",
      searchableText: "body wrack intense pain slow walk boffer attacks status breachable umbra realm"
    },
    {
      name: "BRITTLE BONES",
      type: "STATUS",
      sources: "Hc3 Vc3 Wt",
      cost: "2 Energy",
      call: "\"Brittle Bones\"",
      description: "Any <type> damage the target takes is treated as though it is <Agg>.",
      searchableText: "brittle bones damage type treated aggravated status corrupt"
    },
    {
      name: "BRUTAL STRIKE",
      type: "DAMAGE <META>",
      sources: "K3 S3 V3 Wt",
      cost: "2 Energy",
      call: "\"Brutal <Number>\"",
      description: "Add the \"Brutal\" Meta call to a single weapon attack. Brutal attacks are considered successful and cause damage even if blocked.",
      searchableText: "brutal strike meta weapon attack successful damage blocked"
    },
    {
      name: "CLAWED FORM",
      type: "MASK",
      sources: "Hr2 V1",
      cost: "None",
      call: "None",
      description: "You may use claw natural weapons. You may also put on a mask determined by the power source.",
      searchableText: "clawed form mask claw natural weapons"
    },
    {
      name: "CLEANSE",
      type: "TOUCH",
      sources: "K2 H2",
      cost: "2 Energy",
      call: "\"Cleanse Taint\"",
      description: "The target is cleansed of Taint.",
      searchableText: "cleanse taint touch remove corruption"
    },
    {
      name: "CLOAK",
      type: "SELF",
      sources: "H2 Sr1 V1 W1 Wc1",
      cost: "1 Energy",
      call: "\"Cloak\"",
      description: "You cannot use this power within 10 seconds of having made an attack. Spread your hand out in front of your face. You are Cloaked and are no longer visible in-game.\n\nThis power ends if you speak in-game (except through Telepathy), make distinct noises, touch an object or person, attack, are targeted by a power with the \"Cloak Sight\" or \"Mass\" meta call, or no longer have your hand splayed in front of your face.",
      searchableText: "cloak invisible hand face attack speak telepathy noises touch cloak sight mass"
    },
    {
      name: "CLOAK GATHERING",
      type: "TOUCH",
      sources: "Hc1 Sc2 V3 Wt",
      cost: "1 Energy",
      call: "\"Cloak Gathering\"",
      description: "You may use the Cloak power. While doing so, you may touch a target person or object to Cloak them as per the Cloak power. Cloak ends for the target if you are no longer touching the target or if you become uncloaked.",
      searchableText: "cloak gathering touch target person object cloak power"
    },
    {
      name: "CLOAK SIGHT",
      type: "PASSIVE",
      sources: "H3 S3 V3 W3",
      cost: "None",
      call: "\"Cloak Sight\"",
      description: "You can see characters that are Cloaked, and can target them with powers after making the sig call.",
      searchableText: "cloak sight see cloaked characters target powers passive"
    },
    {
      name: "COGNIZANCE",
      type: "PASSIVE",
      sources: "W1",
      cost: "None",
      call: "\"No Effect\"",
      description: "You are immune to the Daze and Dreamshape powers.",
      searchableText: "cognizance immune daze dreamshape passive wraith"
    },
    {
      name: "CONDITIONING",
      type: "OTHER <META>",
      sources: "Hc3 V3 W3",
      cost: "4 Energy",
      call: "\"Unresistable <Mental>\"",
      description: "You must have a conversation with a target for at least 60 consecutive seconds directly before using this power. You may add the \"Unresistable\" Meta call onto one Mental power against that target, unless the power uses the \"Mass\" meta call.",
      searchableText: "conditioning conversation 60 seconds unresistable mental meta mass"
    },
    {
      name: "CONFUSION",
      type: "MENTAL",
      sources: "H1 S1 Sc1 V1 W1",
      cost: "1 Energy",
      call: "\"Confusion\"",
      description: "The target loses all personal knowledge and does not know who they are, who anyone else is, or the context for what is happening around them. They may still attack and defend themself as normal. When this power ends, the target loses all memories that took place while under this power.\n*Breachable Umbra → Realm*",
      searchableText: "confusion personal knowledge identity context memories attack defend breachable umbra realm"
    },
    {
      name: "CONTROL BODY",
      type: "MENTAL",
      sources: "W2",
      cost: "1 Energy",
      call: "\"Breach Control Body <command>\"",
      description: "You must be in the Umbra and your target must be in the Realm to use this power. The target must obey the stated command, which can be one of: \"Sit\", \"Stay\", \"Grovel\", \"Babble\", or \"Walk\".",
      searchableText: "control body breach umbra realm command sit stay grovel babble walk"
    },
    {
      name: "CONTROL VOICE",
      type: "TOUCH",
      sources: "W1",
      cost: "1 Energy",
      call: "\"Breach Control Voice\"",
      description: "You must be in the Umbra and your target must be in the Realm to use this power. The target must speak aloud anything you whisper to them for as long as you are touching them.",
      searchableText: "control voice breach umbra realm speak whisper touching"
    },
    {
      name: "CORRUPTED POWERS",
      type: "PASSIVE",
      sources: "Sc2",
      cost: "None",
      call: "None",
      description: "You may teach any power tree you know (even a Learned tree) as a Corrupted power.",
      searchableText: "corrupted powers teach power tree learned sorcerer corrupt"
    },
    {
      name: "CRAVING",
      type: "TOUCH <CONDITION>",
      sources: "W3",
      cost: "1 Energy",
      call: "\"Condition: Craving <three word description>\"",
      description: "The target's primary desire becomes the description spoken. This condition ends as soon as they satisfy this desire once.",
      searchableText: "craving condition primary desire description satisfy once touch"
    },
    {
      name: "DARK WEAPON",
      type: "DAMAGE <TYPE>",
      sources: "W3c",
      cost: "1 Energy",
      call: "\"Dark <Number>\"",
      description: "Add the \"Dark\" <type> to a single weapon attack. This may not be used with natural weapons.",
      searchableText: "dark weapon damage type single attack natural weapons wraith corrupt"
    },
    {
      name: "DAZE",
      type: "TOUCH",
      sources: "K3 Hr3 Sr3 Vr3 W3",
      cost: "1 Energy",
      call: "\"Daze\"",
      description: "The target is put into a deep slumber that is difficult to awaken from. While asleep, they have no memory of things happening around them.\n\nThe target will not awaken from soft noises, distant sounds, or gentle touches (they should be generous). However, taking damage, being attacked, getting shaken or jostled, loud noises, etc. will wake the target. If left alone for 10 minutes, they may choose to wake up on their own.\n*Breachable Umbra → Realm*",
      searchableText: "daze deep slumber sleep memory awaken noises touches damage attacked shaken jostled 10 minutes breachable umbra realm"
    },
    {
      name: "DECAY",
      type: "DAMAGE",
      sources: "Hc3 Sc3 V3 Wt",
      cost: "1 Energy",
      call: "\"Decay\", \"Agg 1\"",
      description: "Touch a target. After every 10 seconds, say \"Agg 1\" to cause one aggravated damage to them. Each point of damage counts as a separate attack. A target who is Dying or Dead immediately dies and turns to ash (goes OOG) when damaged.\n\nThis power ends if you stop touching the target or move your feet.",
      searchableText: "decay touch 10 seconds aggravated damage separate attack dying dead ash feet"
    },
    {
      name: "DERANGE",
      type: "MENTAL",
      sources: "Hc2 Sc2 V3 Vc2",
      cost: "1 Energy",
      call: "\"Derange <derangement>\"",
      description: "The target must roleplay as if they have the stated derangement, which must be one present on your character sheet.",
      searchableText: "derange roleplay derangement character sheet mental"
    },
    {
      name: "DESPAIR",
      type: "TOUCH <CONDITION>",
      sources: "K3 Wt",
      cost: "1 Energy",
      call: "\"Condition: Despair, do not regain willpower\"",
      description: "The target does not regain willpower at sunrise.",
      searchableText: "despair condition regain willpower sunrise touch"
    },
    {
      name: "DETECT CONDITION",
      type: "SENSORY",
      sources: "K3",
      cost: "None",
      call: "\"Detect Condition\"",
      description: "Touch the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if they are currently affected by a condition.",
      searchableText: "detect condition touch 10 seconds yes no affected sensory"
    },
    {
      name: "DETECT DEAD",
      type: "SENSORY",
      sources: "K2",
      cost: "None",
      call: "\"Detect Dead\"",
      description: "Touch the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if they are currently Dead.",
      searchableText: "detect dead touch 10 seconds yes no currently sensory"
    },
    {
      name: "DETECT DYING",
      type: "SENSORY",
      sources: "K2",
      cost: "None",
      call: "\"Detect Dying\"",
      description: "Touch the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if they are currently Dying.",
      searchableText: "detect dying touch 10 seconds yes no currently sensory"
    },
    {
      name: "DETECT FETTER",
      type: "SENSORY",
      sources: "H2 W2",
      cost: "1 Energy",
      call: "\"Detect Fetter\" or \"Detect Fetter <item>\"",
      description: "Touch the target for 10 seconds. The target responds \"No Effect\" if they are not a Wraith. Otherwise, they must OOG describe one of their Fetters and where they saw it last. If an item is stated, they must describe their Fetter that best matches it.",
      searchableText: "detect fetter touch 10 seconds wraith describe item matches sensory"
    },
    {
      name: "DETECT INCAPACITATED",
      type: "SENSORY",
      sources: "K2",
      cost: "None",
      call: "\"Detect Incapacitated\"",
      description: "Touch the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if they are currently Incapacitated.",
      searchableText: "detect incapacitated touch 10 seconds yes no currently sensory"
    },
    {
      name: "DETECT TAINT",
      type: "SENSORY",
      sources: "H1 S1 Sc1 W1 Wc1",
      cost: "None",
      call: "\"Detect Taint\"",
      description: "Touch the target for 10 seconds (If appropriate for your character, you may sniff the Target from within touching distance for 10 seconds instead). They must answer OOG \"yes\" or \"no\" if they are currently Tainted.\n\nYou can also determine if an item or Node is Tainted by reading the item tag. This power does not grant you any other IG knowledge from reading the tag.",
      searchableText: "detect taint touch sniff 10 seconds yes no tainted item node tag knowledge sensory"
    },
    {
      name: "DEVOUR",
      type: "COUNTED TOUCH",
      sources: "W2, Wc2",
      cost: "None",
      call: "\"Devouring 1, Devouring 2, Devouring 3\"",
      description: "This power may only be activated after successfully using Paralyzing Touch or Health Exchange on a Wraith with 0 Health. Other targets state \"No Effect\". During the Devouring, the target remains paralyzed per the power Paralyze.\n\nBegin a \"Devouring 1, Devouring 2, Devouring 3\" call. After the \"Devouring 3\" call, the target may spend 1 Willpower to resist, calling \"Resist\". If they do, you may immediately begin the call again at \"Devouring 1\".",
      searchableText: "devour counted touch paralyzing health exchange wraith 0 health devouring willpower resist"
    },
    {
      name: "DISABLE",
      type: "STATUS",
      sources: "H3 Hc3 S3 Sc3 W3",
      cost: "2 Energy",
      call: "\"Disable\"",
      description: "The target cannot expend Energy for any reason.",
      searchableText: "disable expend energy status"
    },
    {
      name: "DISARM",
      type: "DAMAGE <META>",
      sources: "K3 H3 S1 V1",
      cost: "1 Energy",
      call: "\"Disarm <Number>\"",
      description: "Add the \"Disarm\" Meta call to a single weapon attack. Unless resisted, the target must drop any non-natural weapon used to block the attack.",
      searchableText: "disarm meta weapon attack resisted drop non-natural block"
    },
    {
      name: "DISEMBODIED",
      type: "SELF",
      sources: "S2 W1",
      cost: "None",
      call: "\"Vocalize <speech>\"",
      description: "You may speak across the Gauntlet at any volume and be heard. You may also touch a target in the Realm from the Umbra and have them feel it (cross your fingers and say \"you feel this\").",
      searchableText: "disembodied speak gauntlet volume heard touch realm umbra feel fingers"
    },
    {
      name: "DISQUIET",
      type: "MENTAL",
      sources: "H2 V2 W2",
      cost: "1 Energy",
      call: "\"Disquiet\"",
      description: "The target immediately exits Frenzy and Catharsis and cannot re-enter either.",
      searchableText: "disquiet exits frenzy catharsis re-enter mental"
    },
    {
      name: "DRAINING",
      type: "COUNTED TOUCH",
      sources: "Sr, V",
      cost: "None",
      call: "\"Draining 1, Draining 2, Draining 3, etc.\" and \"Aggravated End Drain\"",
      description: "This power may only be activated after successfully using Test Faction on the target you are draining from. During the Draining, the target remains paralyzed per the power Paralyze if you initiated the drain with Paralyzing Bite.\n\nFor every call of \"Draining\", the target loses 1 Health (or 1 Energy if the target is a Vampire) and you gain 1 or 2 Energy as per the blood effects table. The target should inform you when the pool you are draining from becomes empty, and may roleplay slumping over, if appropriate.",
      searchableText: "draining counted touch test faction paralyze paralyzing bite health energy vampire blood effects table"
    },
    {
      name: "DREAMSHAPE",
      type: "TOUCH <CONDITION>",
      sources: "Hr2 Hc2 S2 V2 Vc2 W2",
      cost: "2 Energy",
      call: "\"Condition: Dreamshape <dream> <action> <non-plural noun>\"",
      description: "The target must be Incapacitated or asleep (asleep OOG or with the Daze power). If the target is asleep OOG, leave a 3x5 card with the call written down.\n\nThe target has the described dream. When they awake, they immediately carry out the stated action to the best of their ability. The condition ends once the action has been performed one time. The target may attack and defend themself as normal. This power may not be used to cause a target to physically harm themself.\n*Breachable Umbra → Realm*",
      searchableText: "dreamshape incapacitated asleep daze 3x5 card dream awake action performed harm breachable umbra realm"
    },
    {
      name: "ENDURE",
      type: "PASSIVE",
      sources: "H1 V1",
      cost: "None",
      call: "None",
      description: "You take exposure damage every 60 seconds instead of every 10 seconds.",
      searchableText: "endure exposure damage 60 seconds 10 seconds passive"
    },
    {
      name: "ENHANCED BLOOD BUFF",
      type: "SELF",
      sources: "M",
      cost: "3 Energy",
      call: "None",
      description: "Gain Augment 1 for 10 minutes. Different sources of Augment stack with one another, except that this power does not stack with Blood Buff.",
      searchableText: "enhanced blood buff augment 10 minutes stack merit"
    },
    {
      name: "ENTRANCEMENT",
      type: "MENTAL",
      sources: "Hr3 Hc2 Sr2 V2 Wc2",
      cost: "1 Energy",
      call: "\"Entrancement\"",
      description: "The target behaves as though they have a Blood Bond to you for the duration of this power. The Burden ends if you attack the target. The target may spend Willpower to resist this power even though they normally could not while under a Blood Bond.",
      searchableText: "entrancement blood bond burden attack resist willpower blood bond mental"
    },
    {
      name: "ESCAPE",
      type: "SELF",
      sources: "M",
      cost: "None",
      call: "\"Escape\"",
      description: "Spend 60 uninterrupted seconds fiddling with a lock, ropes, or chains to activate this power. You slip free from any Restraints and can open any lock keeping you trapped inside a building or other space. You must immediately exit through and close any such locked door behind you.",
      searchableText: "escape 60 seconds lock ropes chains restraints building space door merit"
    },
    {
      name: "EXORCISM",
      type: "MENTAL",
      sources: "H3",
      cost: "1 Energy",
      call: "\"Breach Mass Exorcism\"",
      description: "You must be in the Realm to use this power. All targets in the Umbra end any Possession and move at least ten feet away from you. The targets may not advance towards you unless you are at least 10 feet from them. While under the effects of this power, the target(s) may not attack you. This power does not affect characters in the Realm.",
      searchableText: "exorcism breach mass realm umbra possession ten feet advance attack"
    },
    {
      name: "EXPEL CORPUS",
      type: "SELF",
      sources: "W2 Wc2",
      cost: "None",
      call: "\"Expel Corpus\"",
      description: "Lose one Health. This power may not be used to reduce your Health below 1 (i.e to Incapacitated). Typically, this power is used to prepare for a Devouring.",
      searchableText: "expel corpus lose health incapacitated devouring wraith"
    },
    {
      name: "FABRICATE ARMOR",
      type: "OTHER",
      sources: "H2 Hc2 S2 V2 W3",
      cost: "1 Energy",
      call: "\"Fabricate Armor 4\"",
      description: "Spend 60 uninterrupted seconds roleplaying building invisible armor on the target before activating this power. You may target yourself with this power.\n\nThe target receives 4 additional armor points that do not require a phys-rep. These armor points are the first to be used when the target is struck for damage. A character may only have one fabricated suit of armor at any time; additional uses of this power only refill the fabricated armor to a maximum of 4 armor.",
      searchableText: "fabricate armor 60 seconds building invisible target 4 armor points phys-rep struck damage"
    },
    {
      name: "FAST HEALING",
      type: "PASSIVE",
      sources: "Hc1 S1 Wc1",
      cost: "None",
      call: "None",
      description: "Your Regeneration Rate is increased by 1.",
      searchableText: "fast healing regeneration rate increased passive"
    },
    {
      name: "FETTER CONSUMPTION",
      type: "TOUCH",
      sources: "H2 W2",
      cost: "1 Energy",
      call: "\"Breach Fetter Consumption\"",
      description: "Touch a Fetter and remove the Fetter tag (if a character is the Fetter, ask them for the tag). Characters who are Fetters may resist by spending 1 Willpower as usual.\n\nThe Fetter is destroyed. Inform the owner of the Fetter OOG as soon as possible that it has been destroyed. They receive no IG information as to who destroyed it. Tags from Fetters destroyed with this power may be exchanged for blank Fetter tags at Check-In.",
      searchableText: "fetter consumption touch remove tag character resist willpower destroyed owner check-in"
    },
    {
      name: "FETTER CREATION",
      type: "TOUCH",
      sources: "W1",
      cost: "1 Energy",
      call: "\"Breach Fetter Creation\"",
      description: "Touch an item at least 3 inches in length or a Human, Vampire, or Shifter for 10 seconds to turn it into a Fetter for any Wraith. If making a Fetter for another Wraith, you must be holding their hand along with the item or person. If the non-Wraith target is not a Human, Vampire, or Shifter, they state \"No Effect\". Afterwards, fill out a Fetter tag and attach it to the item or give it to the non-Wraith.\n\nYou receive one Fetter tag each Check-In.",
      searchableText: "fetter creation touch item 3 inches 10 seconds wraith holding hand tag check-in"
    },
    {
      name: "FETTER HEALING",
      type: "SELF",
      sources: "W",
      cost: "None",
      call: "None",
      description: "Your Regeneration Rate is increased by 1 while touching any Fetter(s) that belong to you (even if you cannot otherwise affect the Fetter by touching it).",
      searchableText: "fetter healing regeneration rate touching belong wraith"
    },
    {
      name: "FIRE 2",
      type: "DAMAGE",
      sources: "Hr1 S2 V1",
      cost: "1 Energy",
      call: "\"Fire 2\"",
      description: "Throw a packet that does 2 <Fire> damage.",
      searchableText: "fire 2 throw packet damage"
    },
    {
      name: "FIRE 4",
      type: "DAMAGE",
      sources: "S3 V3",
      cost: "2 Energy",
      call: "\"Fire 4\"",
      description: "Throw a packet that does 4 <Fire> damage.",
      searchableText: "fire 4 throw packet damage"
    },
    {
      name: "FIRE WEAPON",
      type: "DAMAGE <TYPE>",
      sources: "Sr2 V2",
      cost: "1 Energy",
      call: "\"Fire <Number>\"",
      description: "Add the \"Fire\" <type> to a single weapon attack. This may not be used with natural weapons.",
      searchableText: "fire weapon add type single attack natural weapons"
    },
    {
      name: "FORGETFUL MIND",
      type: "TOUCH",
      sources: "H1 Hc1 S1 Sr1 V1 W1",
      cost: "1 Energy",
      call: "\"Forgetful Mind\"",
      description: "The target loses the last 10 minutes of character knowledge and can never recover those memories.",
      searchableText: "forgetful mind loses 10 minutes character knowledge recover memories touch"
    },
    {
      name: "FORM OF VAPOR",
      type: "MASK",
      sources: "Hc3 S3 Sr3 V3 Wc3",
      cost: "None",
      call: "\"Form of Vapor\", \"Resist\", or \"No Effect\"",
      description: "You cannot use this power within 10 seconds of making an attack. You may put on a silver or black full-face mask.\n\nWhile wearing this mask, you may resist damage for 1 Energy, are immune to Status powers and Counted Touch actions and may pass through locked doors (by immediately opening, entering, and then closing them). You may not make any attacks, or block with boffers. You may not interact with objects, bodies, or open doors. Any object on your person becomes a part of your form and may not be removed or interacted with while in Form of Vapor.",
      searchableText: "form vapor mask silver black full-face resist damage immune status counted touch locked doors attacks boffers interact objects"
    },
    {
      name: "FRENZY CONTROL",
      type: "SELF",
      sources: "H3 S3 V3 Wt",
      cost: "1 Willpower",
      call: "\"Frenzy\" or \"No Effect\"",
      description: "You may activate this power to enter a Frenzy without losing Virtue. If you opt for an Attack Frenzy, you may choose which character(s) to attack first. If none of your original targets are present you must then attack the nearest character.\n\nYou are also immune to \"Induce Frenzy\" and all other effects that would force you to Frenzy against your will.",
      searchableText: "frenzy control activate virtue attack choose characters targets nearest immune induce force will"
    },
    {
      name: "GAUNTLET WALK",
      type: "SELF",
      sources: "Hc3 S3",
      cost: "1 Energy",
      call: "\"Umbra\" or \"Realm\" as your destination",
      description: "You cannot use this power within 10 seconds of making an attack. Travel from the Realm to the Umbra or from the Umbra to the Realm.",
      searchableText: "gauntlet walk umbra realm destination travel attack corrupt shifter"
    },
    {
      name: "GUIDANCE",
      type: "OTHER",
      sources: "K1",
      cost: "None",
      call: "\"Guidance Unresistable <Power>\"",
      description: "Spend 60 uninterrupted seconds roleplaying a profound interpersonal interaction with a willing target before activating this power. The target takes the effect of the chosen power as determined by this power's source. This effect is delivered per the chosen power (e.g. as a Mental, a Touch, etc.).",
      searchableText: "guidance 60 seconds profound interpersonal interaction willing target chosen power effect delivered skill"
    },
    {
      name: "HALLUCINATION",
      type: "MENTAL",
      sources: "M Hr1 Hc1 Sr1 Wt",
      cost: "1 Energy",
      call: "\"Hallucination <three word description>\"",
      description: "The target has a hallucination fitting the description.",
      searchableText: "hallucination three word description mental"
    },
    {
      name: "HASTY ESCAPE",
      type: "SELF",
      sources: "Hr3 S3 Sr3 V3 W3",
      cost: "4 Energy",
      call: "\"Hasty Escape\" or \"No Effect\"",
      description: "Cross your arms over your chest and leave the area as quickly as possible. You cannot return until this power ends. Until then, you cannot make attacks or activate powers, and are immune to attacks, though this power does not end effects already active on you.\n\nThis power ends once you have moved 60 feet away from where you activated it or 60 seconds pass, whichever happens sooner.",
      searchableText: "hasty escape cross arms chest leave area return attacks activate powers immune 60 feet 60 seconds"
    },
    {
      name: "HEAL SELF",
      type: "SELF",
      sources: "H1",
      cost: "None",
      call: "None",
      description: "Roleplay prayer or meditation. While doing so, you may convert 1 Energy to 1 Health every second. This does not stack with Regeneration.",
      searchableText: "heal self prayer meditation convert energy health second stack regeneration human"
    },
    {
      name: "HEALING TOUCH",
      type: "TOUCH",
      sources: "H1 S1 Vr1 Wt",
      cost: "1 Energy",
      call: "\"Healing Touch 4\"",
      description: "The target gains 4 Health, not to exceed their maximum Health.",
      searchableText: "healing touch gains 4 health maximum"
    },
    {
      name: "HEALTH EXCHANGE",
      type: "COUNTED TOUCH",
      sources: "W2 Wc2",
      cost: "None",
      call: "\"Giving Health\" or \"Draining Health\"",
      description: "You may use the Paralyzing Touch power. Health Exchange may only be activated after successfully using Paralyzing Touch on a target. During the Exchange, the target remains paralyzed per the power Paralyze.\n\nYou may choose to either give the target Health or drain their Health. For every call of \"Giving Health 1, Giving Health 2, etc.\" the target gains 1 Health and you lose 1 Health. For every call of \"Draining Health 1, Draining Health 2, etc.\" the target loses 1 Health and you gain 1 Health.",
      searchableText: "health exchange paralyzing touch paralyzed choose give drain gains loses wraith"
    },
    {
      name: "HELLBORN INVESTITURE",
      type: "PASSIVE",
      sources: "Vr2",
      cost: "None",
      call: "None",
      description: "You have <Fire> armor (<Fire> no longer Scorches you).",
      searchableText: "hellborn investiture fire armor scorches vampire rare passive"
    },
    {
      name: "HERO'S STAND",
      type: "SELF",
      sources: "S3 Wt",
      cost: "None",
      call: "\"Resist\" or \"No Effect\"",
      description: "Plant one foot in place. For the next 10 minutes you are immune to damage attacks and you may resist Status attacks for 1 Energy.\n\nAt the end of 10 minutes, or if you lift your foot for any reason, you immediately drop to 0 Health.",
      searchableText: "hero's stand plant foot 10 minutes immune damage resist status energy lift drop 0 health"
    },
    {
      name: "HIDDEN TAINT",
      type: "PASSIVE",
      sources: "Sc3 Wc3",
      cost: "None",
      call: "None",
      description: "You always answer \"no\" to Detect Taint. You may always pass through a Ward Against the Wyrm. If you have the Taint power, you may choose whether to use it.",
      searchableText: "hidden taint answer no detect pass ward against wyrm choose use passive corrupt"
    },
    {
      name: "HIDE OF THE WYRM",
      type: "PASSIVE",
      sources: "Sc1",
      cost: "None",
      call: "None",
      description: "Your maximum Health is increased by 2.",
      searchableText: "hide wyrm maximum health increased 2 sorcerer corrupt passive"
    },
    {
      name: "HORRID REALITY",
      type: "MENTAL",
      sources: "Hc3 S2 Sc2 Vc3 Wt",
      cost: "1 Energy",
      call: "\"Horrid Reality <three word description>\"",
      description: "The target must roleplay as though they are dying in the way described. They cannot make attacks.",
      searchableText: "horrid reality roleplay dying described attacks mental"
    },
    {
      name: "HYPNOTISM",
      type: "MENTAL",
      sources: "M H3",
      cost: "1 Energy",
      call: "\"Hypnotism\"",
      description: "You must spend 60 uninterrupted seconds performing hypnotic roleplay engaging the target, as described in this power's source directly before you activate this power.\n\nThe target enters a trance and will do nothing but truthfully answer any question you ask them per character knowledge. All events that take place while under the effects of this power are removed from their character knowledge.\n\nThis power ends early if you stop your hypnotic roleplay or if any other Interruption occurs for you or your target.",
      searchableText: "hypnotism 60 seconds hypnotic roleplay trance truthfully answer question character knowledge events removed interruption"
    },
    {
      name: "IMITATE",
      type: "MASK",
      sources: "Vr2 W2",
      cost: "1 Energy",
      call: "\"Imitate\"",
      description: "Spend 10 seconds molding the face of a target. The target can be yourself.\n\nPut a transformation mask of your choice on the target, or remove a mask that has been put on them with this power. This power can also be used to add or remove prosthetics and makeup (with the player's OOG consent), but may not be used to remove Makeup Requirements.\n\nThe target can remove any mask or makeup given to them through this power after 10 minutes.",
      searchableText: "imitate 10 seconds molding face target transformation mask remove prosthetics makeup consent requirements 10 minutes"
    },
    {
      name: "INDUCE CATHARSIS",
      type: "TOUCH",
      sources: "Wc3",
      cost: "1 Energy",
      call: "\"Induce Catharsis\"",
      description: "If the target is a Wraith, they enter Catharsis and gain 1 Angst. This has no effect if they are already in Catharsis.",
      searchableText: "induce catharsis wraith enter gain angst already wraith corrupt touch"
    },
    {
      name: "INDUCE FRENZY",
      type: "TOUCH",
      sources: "H2 Sc3 V2",
      cost: "1 Energy",
      call: "\"Induce Frenzy\"",
      description: "The target enters an Attack Frenzy.",
      searchableText: "induce frenzy target enters attack touch"
    },
    {
      name: "INDUCE SIN",
      type: "MENTAL",
      sources: "Hr2 Sc2 W2",
      cost: "1 Energy",
      call: "\"Induce Sin <Sin>\"",
      description: "The sin you name must be one of the seven deadly sins (envy, greed, gluttony, lust, pride, sloth, or wrath). The target becomes obsessed with that sin and seeks to indulge in it. Characters with a matching Demonic Vice cannot resist this power.\n*Breachable Umbra → Realm*",
      searchableText: "induce sin seven deadly envy greed gluttony lust pride sloth wrath obsessed indulge demonic vice resist breachable umbra realm"
    },
    {
      name: "INSIGHT",
      type: "TOUCH",
      sources: "Hc2 S1 V1 W1",
      cost: "1 Energy",
      call: "\"Insight <questions>\"",
      description: "The target must be Dying. Targets who are not Dying call \"No Effect\".\n\nThe target must answer any questions you ask truthfully per character knowledge. Both the questions and the answers are spoken in-game. Silver Tongue does not bypass this power.\n\nYou may ask as many questions as you like with a single use of this power. The power ends when the target becomes Dead, you stop touching them, or you are Interrupted.\n*Breachable Umbra → Realm*",
      searchableText: "insight dying target answer questions truthfully character knowledge spoken silver tongue dead touching interrupted breachable umbra realm"
    },
    {
      name: "LEECH OF FEAR",
      type: "PASSIVE",
      sources: "Vc3",
      cost: "None",
      call: "None",
      description: "Each time you use the Dreamshape power on a target, your maximum Energy is increased by one for the remainder of the event, to a maximum of 10 more Energy. This bonus can only be received once per target per event.",
      searchableText: "leech fear dreamshape maximum energy increased remainder event bonus once target vampire corrupt passive"
    },
    {
      name: "LIGHT WEAPON",
      type: "DAMAGE <TYPE>",
      sources: "Vr3",
      cost: "1 Energy",
      call: "\"Light <Number>\"",
      description: "Add the \"Light\" <type> to a single weapon attack. This may not be used with natural weapons.",
      searchableText: "light weapon add type single attack natural weapons vampire rare"
    },
    {
      name: "MAJESTY",
      type: "MENTAL",
      sources: "Hr3 V3 Wt",
      cost: "2 Energy",
      call: "\"Mass Entrancement\"",
      description: "All targets behave as though they are Blood Bound to you for the duration of this power. The Burden ends for an individual target if you attack them. Targets may spend Willpower to resist this power even though they normally could not while under a Blood Bond.",
      searchableText: "majesty mass entrancement targets blood bound burden duration blood bond individual attack willpower resist"
    },
    {
      name: "MASK OF A THOUSAND FACES",
      type: "MASK",
      sources: "Hr2 Sr2 V2",
      cost: "None",
      call: "None",
      description: "You may put on any Transformation mask you desire. You may disregard any Makeup Requirements. You may Disguise yourself without a face covering, or wearing a second layer of garb, as though adopting a new identity (not as any existing PC or NPC). You may wear a different set of garb.",
      searchableText: "mask thousand faces transformation desire disregard makeup requirements disguise face covering second layer garb identity existing"
    },
    {
      name: "MASS TAUNT",
      type: "MENTAL",
      sources: "Wt",
      cost: "2 Energy",
      call: "\"Mass Taunt\"",
      description: "Insult the characters around you. They must attack you to the best of their ability as long as they can see you. This power ends early if you fall to the ground.",
      searchableText: "mass taunt insult characters attack ability see fall ground wraith thorn"
    },
    {
      name: "MATERIALIZE",
      type: "SELF",
      sources: "W3",
      cost: "1 Willpower",
      call: "\"Realm\", \"Umbra\"",
      description: "Touch a Fetter belonging to you and enter the Realm. You have full use of your powers.\n\nThis power ends 1 hour after the last time you touched a Fetter belonging to you. You can also choose to end this power at any time. When the power ends, you return to the Umbra.",
      searchableText: "materialize touch fetter belonging realm full powers 1 hour last touched choose end return umbra wraith"
    },
    {
      name: "MEDICINE",
      type: "TOUCH",
      sources: "K1",
      cost: "None",
      call: "\"Medicine <Number>\"",
      description: "You must spend 60 uninterrupted seconds roleplaying tending to a target's wounds with an appropriate, tagged medical tool prop before you activate this power.\n\nThe target's current Health is raised to the number called (as determined by this power's source), not exceeding their maximum Health.\n\nVampires, Wraiths, Gorgons, and Spirits cannot be healed by Medicine and call \"No Effect\" instead.",
      searchableText: "medicine 60 seconds tending wounds tagged medical tool prop current health raised maximum vampires wraiths gorgons spirits healed skill"
    },
    {
      name: "MEDICINE 2",
      type: "TOUCH",
      sources: "Medicine Skill 1",
      cost: "None",
      call: "\"Medicine 2\"",
      description: "You must spend 60 uninterrupted seconds roleplaying tending to a target's wounds with an appropriate, tagged medical tool prop before you activate this power.\n\nThe target's current Health is raised to 2, not exceeding their maximum Health.\n\nVampires, Wraiths, Gorgons, and Spirits cannot be healed by Medicine and call \"No Effect\" instead.",
      searchableText: "medicine 2 skill 60 seconds tending wounds tagged medical tool prop current health raised vampires wraiths gorgons spirits healed"
    },
    {
      name: "MEDICINE 4",
      type: "TOUCH",
      sources: "Medicine Skill 2",
      cost: "None",
      call: "\"Medicine 4\"",
      description: "You must spend 60 uninterrupted seconds roleplaying tending to a target's wounds with an appropriate, tagged medical tool prop before you activate this power.\n\nThe target's current Health is raised to 4, not exceeding their maximum Health.\n\nVampires, Wraiths, Gorgons, and Spirits cannot be healed by Medicine and call \"No Effect\" instead.",
      searchableText: "medicine 4 skill 60 seconds tending wounds tagged medical tool prop current health raised vampires wraiths gorgons spirits healed"
    },
    {
      name: "MEDICINE 6",
      type: "TOUCH",
      sources: "Medicine Skill 3",
      cost: "None",
      call: "\"Medicine 6\"",
      description: "You must spend 60 uninterrupted seconds roleplaying tending to a target's wounds with an appropriate, tagged medical tool prop before you activate this power.\n\nThe target's current Health is raised to 6, not exceeding their maximum Health.\n\nVampires, Wraiths, Gorgons, and Spirits cannot be healed by Medicine and call \"No Effect\" instead.",
      searchableText: "medicine 6 skill 60 seconds tending wounds tagged medical tool prop current health raised vampires wraiths gorgons spirits healed"
    },
    {
      name: "MEDITATE",
      type: "TOUCH",
      sources: "M K2 Hr2 S2",
      cost: "1 Energy",
      call: "\"Meditate\"",
      description: "The target must spend 60 uninterrupted seconds roleplaying meditation to be affected by this power.\n\nThe target may resist the next Mental attack for free and takes the identity of the caster as in-game knowledge. This protection is still expended even if the target chooses not to resist the Mental.",
      searchableText: "meditate 60 seconds meditation affected resist mental attack free identity caster knowledge protection expended"
    },
    {
      name: "MELD",
      type: "SELF",
      sources: "Sr3 V2 Wc2 Wt",
      cost: "4 Energy",
      call: "\"Meld\"",
      description: "You must spend 10 uninterrupted seconds touching the ground to activate this power.\n\nGo OOG for a minimum of 1 hour. You may sleep in the OOG area or play NPCs. To return to game you must return to the area you used this power and make the call again.",
      searchableText: "meld 10 seconds touching ground oog minimum 1 hour sleep area play npcs return game area call"
    },
    {
      name: "MIGHT",
      type: "PASSIVE",
      sources: "H2 Hc3 S2 V2 W2",
      cost: "None",
      call: "None",
      description: "You gain Augment 1. Different sources of Augment stack with one another.",
      searchableText: "might gain augment stack sources passive"
    },
    {
      name: "MIMIC",
      type: "TOUCH",
      sources: "S3 Wt",
      cost: "1 Energy",
      call: "\"Mimic <Energy type> <Power>\"",
      description: "The target must have the stated Energy type and the stated power on their character sheet. The power cannot be Corrupted or Dormant. If any of these requirements are not true they state \"No Effect\". If they Resist this power, you must assume IG failed because they did not meet the requirements.\n\nYou count as having the chosen power on your character sheet for the next 10 minutes, except for meeting ritual requirements. You cannot use Mimic again until these 10 minutes pass.",
      searchableText: "mimic energy type power character sheet corrupted dormant requirements resist failed chosen count 10 minutes ritual"
    },
    {
      name: "MONSTERS",
      type: "MENTAL",
      sources: "Hc1 Sr2 Vc1 W2",
      cost: "1 Energy",
      call: "\"Monsters\"",
      description: "The target believes every character they see is a horrible monster out to kill them.",
      searchableText: "monsters believes character horrible monster kill mental"
    },
    {
      name: "MOVE OBJECT",
      type: "OTHER",
      sources: "W1",
      cost: "None",
      call: "None",
      description: "You may touch and move any object in the Realm as long as it remains in contact with something else in the Realm. You cannot make attacks with the object, but can fling it (be safe) or use it to touch a person.",
      searchableText: "move object touch realm contact attacks fling safe person wraith"
    },
    {
      name: "OBEDIENCE",
      type: "MENTAL",
      sources: "H3 S3 V2 W3",
      cost: "1 Energy",
      call: "\"Obedience <command>\" (command spoken IG)",
      description: "You must speak the command part of the sig call IG. The command must be an action or an action and a targeted noun.\n\nThe target must immediately obey the command to the best of their ability. They may attack and defend themself as normal, unless prohibited by the command. This power may not be used to cause a target to do something that the target knows will cause them to directly take damage.\n\nThis power early ends when the command is obeyed once.",
      searchableText: "obedience command spoken action targeted noun immediately obey ability attack defend prohibited damage obeyed mental"
    },
    {
      name: "PARALYZE",
      type: "STATUS",
      sources: "H3 Hc2 S3 V3 Wt",
      cost: "2 Energy",
      call: "\"Paralyze\"",
      description: "The target is held in total paralysis, unable to speak or do anything else other than use Regeneration. They are aware of what is happening around them. This power ends early if the target is attacked or damaged (remember that Paralyzing Bite and Touch do not count as attacks).",
      searchableText: "paralyze held total paralysis speak regeneration aware happening attacked damaged paralyzing bite touch status"
    },
    {
      name: "PARALYZING BITE",
      type: "COUNTED TOUCH",
      sources: "Sr, V",
      cost: "None",
      call: "\"Biting 1, Biting 2, Biting 3, Paralyzing Bite\"",
      description: "Place your hand on the target's shoulder and begin the count, making no more than one call per second. The call can be interrupted, including by the target moving away from you, attacking you, or using another power on you. This power does not count as an attack.\n\nIf you successfully complete the count, the target is now Paralyzed per the power. This ends unless you proceed with draining (i.e. Test Faction and Draining).",
      searchableText: "paralyzing bite hand shoulder count one call second interrupted moving attacking power complete paralyzed draining test faction counted touch"
    },
    {
      name: "PARALYZING TOUCH",
      type: "COUNTED TOUCH",
      sources: "W1, Wc2",
      cost: "None",
      call: "\"Tapping 1, Tapping 2, Tapping 3, Paralyzing Touch\"",
      description: "Place your hand on the target's shoulder and begin the count, making no more than one call per second. The call can be interrupted, including by the target moving away from you, attacking you, or using another power on you. This power does not count as an attack.\n\nIf you successfully complete the count, the target is now Paralyzed per the power. This ends unless you proceed with draining (i.e. Health Exchange or Pathos Exchange)",
      searchableText: "paralyzing touch tapping hand shoulder count one call second interrupted moving attacking complete paralyzed health exchange pathos exchange counted touch wraith"
    },
    {
      name: "PASSION",
      type: "MENTAL",
      sources: "K1 Hr3 S3 V3 W2",
      cost: "1 Energy",
      call: "\"Passion <emotion>\" or \"Passion <emotion> for <object or person>\"",
      description: "The target feels the stated emotion, towards the stated person or object (if specified).\n*Breachable Umbra → Realm*",
      searchableText: "passion emotion person object specified breachable umbra realm mental"
    },
    {
      name: "PATHOS EXCHANGE",
      type: "COUNTED TOUCH",
      sources: "W1",
      cost: "None",
      call: "\"Giving Pathos,\" or \"Draining Pathos\"",
      description: "You may use the Paralyzing Touch power. Pathos Exchange may only be activated after successfully using Paralyzing Touch on a target. During the Exchange, the target remains paralyzed per the power Paralyze.\n\nYou may choose to either give the target Pathos or drain their Pathos. For every call of \"Giving Pathos 1, Giving Pathos 2, etc.\" the target gains 1 Pathos and you lose 1 Pathos. For every call of \"Draining Pathos 1, Draining Pathos 2, etc.\" the target loses 1 Pathos and you gain 1 Pathos. Targets without Pathos call \"No Effect\" and the power ends.",
      searchableText: "pathos exchange paralyzing touch paralyzed choose give drain giving pathos draining gains loses counted touch wraith"
    },
    {
      name: "PATHOS INVESTMENT",
      type: "OTHER",
      sources: "W3",
      cost: "None",
      call: "None",
      description: "Receive two Bottled Pathos tags at each Check-In.",
      searchableText: "pathos investment receive two bottled tags check-in wraith"
    },
    {
      name: "PENCE FROM HEAVEN",
      type: "OTHER",
      sources: "H1 Hr1 S1",
      cost: "None",
      call: "None",
      description: "Receive 6 copper at each Check-In.",
      searchableText: "pence heaven receive 6 copper check-in human shifter"
    },
    {
      name: "POISON IMMUNITY",
      type: "PASSIVE",
      sources: "S",
      cost: "None",
      call: "None",
      description: "You are immune to poisons and the Venom power.",
      searchableText: "poison immunity immune poisons venom shifter passive"
    },
    {
      name: "PORTAL WALK",
      type: "SELF",
      sources: "W",
      cost: "None",
      call: "\"Portal Walk\"",
      description: "Open, walk through, and immediately close a locked door (such that no one can follow you).",
      searchableText: "portal walk open walk through immediately close locked door follow wraith"
    },
    {
      name: "POSSESSION",
      type: "MENTAL",
      sources: "ST Power",
      cost: "1 Energy",
      call: "\"Breach Possession\"",
      description: "ST Power only — no longer available to player characters.\n\nYou must be in the Umbra and the target must be in the Realm. Roleplay puppetting the target for 10 seconds then place your hands on the target's shoulders.\n\nThe target may only perform actions that you instruct them to do. The target may not activate any powers but retains the use of any passive powers. You may direct the target to use your powers by spending the appropriate cost yourself and having the target perform any associated actions. You and the player of the target character should work together to maintain hand-on-shoulder contact.",
      searchableText: "possession breach umbra realm roleplay puppetting 10 seconds hands shoulders perform actions instruct activate powers passive direct spending cost associated actions player character hand-on-shoulder contact st power"
    },
    {
      name: "PUPPET CONTROL",
      type: "MENTAL",
      sources: "W3",
      cost: "1 Energy",
      call: "\"Breach Puppetry: [Command]\"",
      description: "You must be in the Umbra and the target must be in the Realm. The command part of the sig call is OOG. The command must be an action or an action and a targeted noun described in no more than 10 seconds of speech. The action should specify what the target does (a verb), and if relevant, include the method, tool, or location needed to complete it. If you include a duration or condition (such as \"until X happens\"), the target must continue the action until that condition is met. Otherwise, the command ends after the target fulfills it once.\n\nThe target must immediately obey the command to the best of their ability. They may attack and defend themselves as normal, unless prohibited by the command. This power may be used to cause a target to do something that the target knows will cause them to directly take damage.\n\nThis power ends early when the command is obeyed to its fullest once.\n\nNote: This power can never be made Unresistable (example: via Conditioning).\n\nExamples:\n• \"Breach Puppetry: Kill your Friend\" — Target must attack their friend and will continue trying to take them to the dead state.\n• \"Breach Puppetry: Go stand in a Fireplace\" — Target walks to a fireplace, stands for 1 second taking exposure damage, then the command is fulfilled.\n• \"Breach Puppetry: Go stand in the Fireplace in [Place] until you die\" — Target must remain in the fireplace until they drop to 0 Health.",
      searchableText: "puppet control breach puppetry umbra realm command action verb condition duration obey attack defend unresistable conditioning"
    },
    {
      name: "POWERFUL FORM",
      type: "MASK",
      sources: "Hr2 Vr2 Vr3 W3",
      cost: "None",
      call: "None",
      description: "You may put on a mask as described by this power's source. While wearing any power mask, you gain Augment 1. Different sources of Augment stack with one another.",
      searchableText: "powerful form mask power source wearing augment stack mask"
    },
    {
      name: "RANGED 2",
      type: "DAMAGE",
      sources: "Hr2 Hc2 S2 V2 W2",
      cost: "None",
      call: "\"<Type> 2\"",
      description: "Throw a packet that does 2 <type> damage, where <type> is indicated by the power's source.",
      searchableText: "ranged 2 throw packet damage type indicated source"
    },
    {
      name: "RANGED 4",
      type: "DAMAGE",
      sources: "Vr3 W3",
      cost: "1 Energy",
      call: "\"<Type> 4\"",
      description: "Throw a packet that does 4 <type> damage, where <type> is indicated by the power's source.",
      searchableText: "ranged 4 throw packet damage type indicated source"
    },
    {
      name: "RAZOR CLAWS",
      type: "DAMAGE",
      sources: "V1 Vr1 S1 Sr1",
      cost: "1 Energy",
      call: "None",
      description: "Gain Augment 1 for a single swing made with natural weapons. Different sources of Augment stack with one another.",
      searchableText: "razor claws gain augment single swing natural weapons stack"
    },
    {
      name: "READ MAGIC",
      type: "PASSIVE",
      sources: "H2",
      cost: "None",
      call: "None",
      description: "You may read the rules portion of any ritual scroll or item tag and take the information in-game.",
      searchableText: "read magic rules portion ritual scroll item tag information in-game human passive"
    },
    {
      name: "REALM GRASP",
      type: "SELF",
      sources: "S1 W1",
      cost: "1 Energy",
      call: "\"Breach\"",
      description: "Pick up an object in the Realm.",
      searchableText: "realm grasp pick object realm breach shifter wraith"
    },
    {
      name: "RELEASE SPIRIT",
      type: "TOUCH",
      sources: "S1",
      cost: "None",
      call: "\"Release Spirit\"",
      description: "Roleplay honoring a Dying Spirit for 10 seconds. If the target is not a Spirit in the Dying state, the power fails and they should respond \"No Effect\".\n\nThe Spirit immediately becomes Dead and dissipates (goes OOG). You gain 1 Willpower, up to your maximum.",
      searchableText: "release spirit roleplay honoring dying 10 seconds spirit dying state fails dead dissipates oog gain willpower maximum shifter touch"
    },
    {
      name: "REND THE LIFEWEB",
      type: "OTHER",
      sources: "Wc2",
      cost: "1 Energy",
      call: "\"Rend the Lifeweb\"",
      description: "Attach a green Tainted Fetter tag to a Fetter prop, next to its Fetter tag. This cannot be done to characters that are Fetters. This tag is permanent until the Fetter is destroyed.\n\nEvery time the owner of the Fetter sees the \"Tainted Fetter\" tag, they become Tainted.\n\nYou receive as many Tainted Fetter tags as you want each Check-In.",
      searchableText: "rend lifeweb attach green tainted fetter tag prop permanent destroyed owner sees become tainted check-in wraith corrupt"
    },
    {
      name: "RESILIENCE",
      type: "SELF",
      sources: "H2 S2 V2 W2",
      cost: "1 Willpower",
      call: "\"Resist\"",
      description: "Resist a single Status attack, ending its effect.",
      searchableText: "resilience resist single status attack ending effect willpower"
    },
    {
      name: "RESIST GAUNTLET",
      type: "SELF",
      sources: "H1",
      cost: "1 Willpower",
      call: "\"Resist\"",
      description: "Resist a single attack with the \"Breach\" Meta call.",
      searchableText: "resist gauntlet single attack breach meta call willpower human"
    },
    {
      name: "RESIST POISON",
      type: "SELF",
      sources: "K3",
      cost: "1 Willpower",
      call: "\"Resist\"",
      description: "Resist any effect that would cause you to gain a poison condition.",
      searchableText: "resist poison effect gain poison condition willpower skill"
    },
    {
      name: "RESIST TAINT",
      type: "SELF",
      sources: "H3 S3",
      cost: "1 Willpower",
      call: "\"Resist Taint\"",
      description: "You are aware of when you become Tainted (you can hear the \"Tainted\" portion of calls directed towards you IG). After roleplaying resisting Taint for 60 seconds, you can use this power to cleanse yourself of Taint.",
      searchableText: "resist taint aware become tainted hear portion calls directed roleplaying resisting 60 seconds cleanse willpower human shifter"
    },
    {
      name: "REVERSE MIMIC",
      type: "TOUCH",
      sources: "M",
      cost: "1 Energy",
      call: "\"Grant Power <Power>\"",
      description: "Bestow a power from your character sheet onto a target, who may use the given power for the next 10 minutes. The granted power may not be used to meet ritual requirements. The target must pay any costs needed to use the power. A target may have multiple powers granted to them at the same time. This power may not grant powers with the Legendary or NPC Only tag.",
      searchableText: "reverse mimic bestow power character sheet target 10 minutes granted ritual requirements pay costs multiple legendary npc only tag merit touch"
    },
    {
      name: "REVIVE",
      type: "TOUCH",
      sources: "H3 Vr3 Wt",
      cost: "1 Willpower",
      call: "\"Revive\"",
      description: "Spend 1 minute meditating while touching the target. A Dying target has their current and maximum Health set to 1. A target that is not Dying is healed 1 point of aggravated damage and gains 1 Health, not to exceed their maximum Health.",
      searchableText: "revive 1 minute meditating touching dying current maximum health set healed aggravated damage gains exceed willpower touch"
    },
    {
      name: "ROOT",
      type: "STATUS",
      sources: "K2 Hr1 S2 V1 W3",
      cost: "1 Energy",
      call: "\"Root\"",
      description: "The target is unable to move either foot. This power ends early if the target is damaged.\n*Breachable Umbra → Realm*",
      searchableText: "root unable move either foot ends early damaged breachable umbra realm status"
    },
    {
      name: "SANCTUARY",
      type: "MENTAL",
      sources: "K3 H3 W3",
      cost: "1 Energy",
      call: "\"Mass Sanctuary\"",
      description: "Tainted targets may not advance towards you while you're within 10 feet of them. Tainted targets may not attack you. Targets who are not Tainted call \"No Effect\".",
      searchableText: "sanctuary mass tainted targets advance 10 feet attack not tainted no effect mental"
    },
    {
      name: "SCION OF EVIL",
      type: "PASSIVE",
      sources: "Hc1 Sc1 Vc1 Wc1",
      cost: "None",
      call: "\"No Effect\", \"Resist\"",
      description: "You may call \"No Effect\" to the Sanctuary power. You may resist the Subjugate power as normal even if you are permanently Tainted.",
      searchableText: "scion evil no effect sanctuary resist subjugate normal permanently tainted corrupt passive"
    },
    {
      name: "SECRET ANGST",
      type: "SELF",
      sources: "Wc3",
      cost: "None",
      call: "None",
      description: "You are aware IG of any effect that would force you to reveal your Angst, and the caster of any such power. You may then respond with any Angst rating between 1 and 10.\n\nYou may always pass through a Ward Against Oblivion regardless of your Angst rating.",
      searchableText: "secret angst aware effect force reveal caster respond rating between 1 10 pass ward against oblivion regardless wraith corrupt"
    },
    {
      name: "SENSE AMARANTH",
      type: "SENSORY",
      sources: "H2 V1",
      cost: "None",
      call: "\"Sense Amaranth\"",
      description: "Stare at the target for 10 seconds. They must answer OOG the number of times they have committed amaranth. Non-Vampires respond \"Zero\".",
      searchableText: "sense amaranth stare 10 seconds answer oog number times committed amaranth non-vampires zero sensory"
    },
    {
      name: "SENSE ANGST",
      type: "SENSORY",
      sources: "W1 Wc1",
      cost: "None",
      call: "\"Sense Angst\"",
      description: "Stare at the target for 10 seconds. They must answer OOG with their current Angst rating. Targets without Angst call \"No Effect\".",
      searchableText: "sense angst stare 10 seconds answer oog current angst rating without no effect sensory wraith"
    },
    {
      name: "SENSE CONFIDENCE",
      type: "SENSORY",
      sources: "H3 W",
      cost: "1 Energy",
      call: "\"Sense Willpower\"",
      description: "Stare at the target for 10 seconds. They must answer OOG with their current Willpower.",
      searchableText: "sense confidence stare 10 seconds answer oog current willpower sensory"
    },
    {
      name: "SENSE DEMON",
      type: "SENSORY",
      sources: "H2 Hc1 Hr1 Vc1",
      cost: "None",
      call: "\"Sense Demon Vice\"",
      description: "Stare at the target for 10 seconds. They must answer OOG their Demonic Vice, or \"No Effect\" if they do not have one.",
      searchableText: "sense demon stare 10 seconds answer oog demonic vice no effect sensory"
    },
    {
      name: "SENSE DESIRE",
      type: "SENSORY",
      sources: "H3 Vr1 W1",
      cost: "None",
      call: "\"Sense Desire\"",
      description: "Stare at the target for 10 seconds. They must state OOG their character's greatest current desire and offer enough clarification that the caster understands the desire itself, though not necessarily the rationale behind it.",
      searchableText: "sense desire stare 10 seconds state oog character greatest current desire clarification caster understands rationale sensory"
    },
    {
      name: "SENSE EMOTION",
      type: "SENSORY",
      sources: "V1 W",
      cost: "None",
      call: "\"Sense Emotion\"",
      description: "Stare at the target for 10 seconds. They must answer OOG with their character's greatest current emotional state and offer enough clarification that the caster understands the emotion itself, though not necessarily the rationale behind it.",
      searchableText: "sense emotion stare 10 seconds answer oog character greatest current emotional state clarification caster understands rationale sensory"
    },
    {
      name: "SENSE ESSENCE",
      type: "SENSORY",
      sources: "H1",
      cost: "None",
      call: "\"Sense Essence\"",
      description: "Stare at the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if their current Energy type is Essence.",
      searchableText: "sense essence stare 10 seconds answer oog yes no current energy type essence human sensory"
    },
    {
      name: "SENSE FETTER",
      type: "SENSORY",
      sources: "H1 W1 Wc1",
      cost: "None",
      call: "\"Sense Fetter\"",
      description: "Stare at the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if they are carrying any Fetters or are themselves a Fetter. If the target is a Fetter, they must also state OOG the name of the character they are a Fetter for.\n\nAdditionally, you may read Fetter item tags and take that information in-game.",
      searchableText: "sense fetter stare 10 seconds answer oog yes no carrying fetters themselves fetter state name character read item tags information in-game sensory"
    },
    {
      name: "SENSE GNOSIS",
      type: "SENSORY",
      sources: "S1",
      cost: "None",
      call: "\"Sense Gnosis\"",
      description: "Stare at the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if their current Energy type is Gnosis.",
      searchableText: "sense gnosis stare 10 seconds answer oog yes no current energy type gnosis shifter sensory"
    },
    {
      name: "SENSE HEALTH",
      type: "SENSORY",
      sources: "K1, Vr1",
      cost: "None",
      call: "\"Sense Health\"",
      description: "Stare at the target for 10 seconds. They must answer OOG with their current Health.",
      searchableText: "sense health stare 10 seconds answer oog current health sensory skill vampire rare"
    },
    {
      name: "SENSE ITEM",
      type: "SENSORY",
      sources: "H1 S1 V1 W1",
      cost: "None",
      call: "\"Sense Item\"",
      description: "Stare at the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if they are carrying any magical items that require Attunement or which are marked Talisman (except Talismans that are just Relics and have no other power).\n\nAdditionally, you may read any item tag and take the information in-game.",
      searchableText: "sense item stare 10 seconds answer oog yes no carrying magical items attunement marked talisman relics power read item tag information in-game sensory"
    },
    {
      name: "SENSE LIVING",
      type: "SENSORY",
      sources: "Wf",
      cost: "None",
      call: "\"Sense Living\"",
      description: "Stare at the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if their faction is Living.\n\nNote: This power is fooled by Pale Aura (the target answers as if Living regardless of their true faction).",
      searchableText: "sense living stare 10 seconds answer oog yes no living unliving faction pale aura fooled wraith fundamental sensory"
    },
    {
      name: "SENSE MAXIMUM HEALTH",
      type: "SENSORY",
      sources: "Vr1 Wf",
      cost: "1 Energy",
      call: "\"Sense Maximum Health\"",
      description: "Stare at the target for 10 seconds. They must answer OOG with their current maximum Health.",
      searchableText: "sense maximum health stare 10 seconds answer oog current maximum health vampire rare wraith fundamental sensory"
    },
    {
      name: "SENSE MENTAL",
      type: "SENSORY",
      sources: "Vr1",
      cost: "None",
      call: "\"Sense Mental\"",
      description: "Stare at the target for 10 seconds. They must answer OOG if they are currently affected by a Mental power.",
      searchableText: "sense mental stare 10 seconds answer oog currently affected mental power vampire rare sensory"
    },
    {
      name: "SENSE PATHOS",
      type: "SENSORY",
      sources: "W1",
      cost: "None",
      call: "\"Sense Pathos\"",
      description: "Stare at the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if their current Energy type is Pathos.",
      searchableText: "sense pathos stare 10 seconds answer oog yes no current energy type pathos wraith sensory"
    },
    {
      name: "SENSE RANK",
      type: "SENSORY",
      sources: "M H2",
      cost: "None",
      call: "\"Sense Rank\"",
      description: "Stare at the target for 10 seconds. They must state OOG their Rank per their character sheet. The target may choose to use Garou or Fera Ranks as appropriate. Non-shifters call \"No Effect\".",
      searchableText: "sense rank stare 10 seconds state oog rank character sheet choose garou fera ranks appropriate non-shifters no effect merit human sensory"
    },
    {
      name: "SENSE SHADOW",
      type: "SENSORY",
      sources: "H1 W1 Wc1",
      cost: "None",
      call: "\"Sense Shadow Archetype\"",
      description: "Stare at the target for 10 seconds. They must answer OOG with their Shadow Archetype. Targets without a Shadow call \"No Effect\".",
      searchableText: "sense shadow stare 10 seconds answer oog shadow archetype without no effect human wraith sensory"
    },
    {
      name: "SENSE SPIRIT",
      type: "SENSORY",
      sources: "H1 Hc1 S1 Vc1",
      cost: "None",
      call: "\"Sense Spirit\"",
      description: "Stare at the target for 10 seconds. They must answer OOG their Spirit power level, or \"Claimed\" if they have any Claimed subfaction active. Other targets call \"No Effect\".",
      searchableText: "sense spirit stare 10 seconds answer oog spirit power level claimed subfaction active other targets no effect sensory"
    },
    {
      name: "SENSE VITAE",
      type: "SENSORY",
      sources: "V1",
      cost: "None",
      call: "\"Sense Vitae\"",
      description: "Stare at the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if their current Energy type is Vitae.",
      searchableText: "sense vitae stare 10 seconds answer oog yes no current energy type vitae vampire sensory"
    },
    {
      name: "SERENITY",
      type: "TOUCH",
      sources: "H2 S2 Vr2",
      cost: "1 Energy",
      call: "\"Serenity\"",
      description: "The target immediately exits Frenzy and/or Catharsis, and any Status and Mental effects active on them end.",
      searchableText: "serenity immediately exits frenzy catharsis status mental effects active end touch"
    },
    {
      name: "SHADOW COAX",
      type: "TOUCH",
      sources: "W2",
      cost: "1 Energy",
      call: "\"Shadow Coax\"",
      description: "If the target is a Wraith, they must play their Shadow for as long as you touch them. If the target is a Specter, they must instead play their Psyche. In either situation, they cannot use Touch or Counted Touch powers. This power does not induce Catharsis or affect the target's Angst.\n\nIf the target is not a Wraith or a Specter, they call \"No Effect\".",
      searchableText: "shadow coax wraith play shadow touch specter psyche counted touch powers induce catharsis affect angst no effect"
    },
    {
      name: "SHATTER",
      type: "OTHER",
      sources: "H1 S1 V1 W2",
      cost: "1 Energy",
      call: "\"SHATTER!\" (shouted)",
      description: "Roleplay breaking an object for 10 seconds while touching it with both hands. You must then shout the sig call as loud as you safely can.\n\nRemove and destroy the item tag. If used on Restraints, free yourself from them. This power cannot destroy Wards.\n*Breachable Umbra → Realm*",
      searchableText: "shatter roleplay breaking object 10 seconds touching both hands shout sig call loud safely remove destroy item tag restraints free wards breachable umbra realm"
    },
    {
      name: "SILENCE",
      type: "STATUS",
      sources: "Hr1 Hc1 S1 V1 Vr1 Vc1",
      cost: "1 Energy",
      call: "\"Silence\"",
      description: "The target cannot speak and may only make soft mumbling sounds.",
      searchableText: "silence cannot speak soft mumbling sounds status"
    },
    {
      name: "SILVER ARMOR",
      type: "PASSIVE",
      sources: "S3",
      cost: "None",
      call: "None",
      description: "You have <Silver> armor (<Silver> no longer Scorches you).",
      searchableText: "silver armor scorches passive shifter"
    },
    {
      name: "SILVER CLAWS",
      type: "DAMAGE <TYPE>",
      sources: "S3",
      cost: "1 Energy",
      call: "\"Silver <Number>\"",
      description: "Add the \"Silver\" <type> to a single natural weapon attack.",
      searchableText: "silver claws add type single natural weapon attack shifter"
    },
    {
      name: "SILVER TONGUE",
      type: "PASSIVE",
      sources: "Hr3 Wt",
      cost: "None",
      call: "None",
      description: "You may lie in-character, ignoring any restrictions and negative effects of truth-telling powers, items, merits, skills, and rituals, except the Insight power.",
      searchableText: "silver tongue lie in-character ignoring restrictions negative effects truth-telling powers items merits skills rituals insight passive"
    },
    {
      name: "SMELL FEAR",
      type: "PASSIVE",
      sources: "Sc1 Wt",
      cost: "None",
      call: "None",
      description: "You know in-game whenever the Detect Taint power is used on you.",
      searchableText: "smell fear know in-game whenever detect taint power used passive sorcerer corrupt wraith thorn"
    },
    {
      name: "SNARL",
      type: "MENTAL",
      sources: "Hr1 Hc1 S1 V1",
      cost: "1 Energy",
      call: "\"Snarl\"",
      description: "The target must stay where they are and roleplay deference to you. They cannot attack you.\n\nThis power ends early if you move out of Mental range of the target, use this power on another target, or if the target is attacked.",
      searchableText: "snarl stay roleplay deference attack ends early mental range another target attacked"
    },
    {
      name: "SONG OF RAGE",
      type: "MENTAL",
      sources: "S3",
      cost: "1 Energy",
      call: "\"Song of Rage\"",
      description: "Shout a warcry. The target may enter a Frenzy at any time without losing Virtue. When they do, they choose a single character to attack first. Once that character falls to the ground the target Frenzies as normal and must attack the nearest character.\n\nDuring this Frenzy, the target also gains Augment 1. Different sources of Augment stack with one another.",
      searchableText: "song rage shout warcry target enter frenzy time losing virtue choose single character attack first falls ground frenzies normal nearest augment stack shifter"
    },
    {
      name: "STEP SIDEWAYS",
      type: "SELF",
      sources: "S",
      cost: "None",
      call: "None",
      description: "You must have at least 1 Energy to use this power.\n\nUnless you are within 10 feet of a Gaian Node, spend 60 uninterrupted seconds meditating. Travel from the Realm to the Umbra or from the Umbra to the Realm.",
      searchableText: "step sideways energy 10 feet gaian node 60 uninterrupted seconds meditating travel realm umbra shifter"
    },
    {
      name: "STONEHAND PUNCH",
      type: "DAMAGE",
      sources: "W1",
      cost: "1 Energy",
      call: "\"Breach 1\"",
      description: "Make a single attack with a brawl boffer that does 1 damage and can affect targets in either realm.",
      searchableText: "stonehand punch single attack brawl boffer 1 damage affect targets either realm breach wraith"
    },
    {
      name: "SUBJUGATE",
      type: "MENTAL",
      sources: "Hc3 Sc3 Vc3 Wc3",
      cost: "1 Energy",
      call: "\"Subjugate\"",
      description: "If the target is Tainted, they must follow all your commands to the best of their ability. If they are permanently Tainted this power is Unresistable.\n\nIf the target is not Tainted, they call \"No Effect\".",
      searchableText: "subjugate tainted follow commands ability permanently unresistable not tainted no effect corrupt mental"
    },
    {
      name: "TAINT",
      type: "PASSIVE",
      sources: "Hc1 Sc1 Vc1 Wc1",
      cost: "None",
      call: "\"Tainted\"",
      description: "You must add the Tainted <Meta> call to all attacks.",
      searchableText: "taint tainted meta call attacks corrupt passive"
    },
    {
      name: "TAUNT",
      type: "MENTAL",
      sources: "H1 S1 Wt",
      cost: "1 Energy",
      call: "\"Taunt\"",
      description: "Insult the target. They must attack you to the best of their ability as long as they can see you. This power ends early if you fall to the ground.",
      searchableText: "taunt insult target attack ability see ends early fall ground mental"
    },
    {
      name: "TELEPATHY",
      type: "OTHER",
      sources: "H2 Hc2 S2 V2 W2 Wc2",
      cost: "None",
      call: "\"Telepathy\"",
      description: "Hold two fingers to your temple and whisper to a target you can see who is within Mental range. These whispered words are heard only in the target's mind. The target may hold two fingers to their temple to respond. This power ends if either of you remove your fingers from your temples or if you move outside of Mental range of each other.\n\nUsing Telepathy does not count as an attack. This can be used across the Gauntlet by adding the \"Breach\" meta call.\n\nYou may also hear in-game any words spoken by other characters who are using this power, without placing your fingers on your temple.",
      searchableText: "telepathy hold two fingers temple whisper target mental range not attack breach gauntlet whispered words heard mind respond remove outside hear in-game spoken characters placing"
    },
    {
      name: "TEMPORARY ANGST",
      type: "SELF",
      sources: "W",
      cost: "None",
      call: "None",
      description: "You become Tainted.",
      searchableText: "temporary angst become tainted wraith"
    },
    {
      name: "TENTACLES",
      type: "SELF",
      sources: "Hc1 V1",
      cost: "None",
      call: "None",
      description: "You may use tentacle natural weapons.",
      searchableText: "tentacles use tentacle natural weapons corrupt vampire"
    },
    {
      name: "TERROR",
      type: "MENTAL",
      sources: "Hc2 S3 Sc3 V2 Vc2 Wt",
      cost: "1 Energy",
      call: "\"Terror\"",
      description: "The target is terrified of you and must make all possible attempts to break line of sight of you.",
      searchableText: "terror terrified target make possible attempts break line sight mental"
    },
    {
      name: "TEST FACTION",
      type: "SENSORY",
      sources: "Sr, V",
      cost: "None",
      call: "\"Test Faction\"",
      description: "This power can only be activated on a target affected by your Paralyzing Bite or that you are touching and have completed a cutting call against.\n\nThe target must answer with their Faction as it appears on their character sheet. You may then use Draining on them.",
      searchableText: "test faction activated target affected paralyzing bite touching completed cutting call answer faction character sheet draining sensory shifter rare vampire"
    },
    {
      name: "TEST GENERATION",
      type: "SENSORY",
      sources: "V1",
      cost: "1 Energy",
      call: "\"Test Generation\"",
      description: "Consume at least 1 point of a target's Vitae. The target must state OOG their generation. Targets that are not Vampires call \"No Effect\".",
      searchableText: "test generation consume 1 point target vitae state oog generation not vampires no effect vampire sensory"
    },
    {
      name: "TEST BLOOD BOND",
      type: "SENSORY",
      sources: "V1",
      cost: "None",
      call: "\"Test Blood Bond\"",
      description: "Consume at least 1 point of the target's blood or Vitae. The target must answer OOG \"yes\" or \"no\" if they are currently under the effect of a Blood Bond.",
      searchableText: "test blood bond consume 1 point target blood vitae answer oog yes no currently under effect blood bond vampire sensory"
    },
    {
      name: "TEST VITAE",
      type: "SENSORY",
      sources: "H, V",
      cost: "None",
      call: "\"Test Vitae\"",
      description: "Consume at least 1 point of a target's blood or Vitae. The target must answer OOG \"yes\" or \"no\" if their current Energy type is Vitae.",
      searchableText: "test vitae consume 1 point target blood vitae answer oog yes no current energy type vitae human vampire sensory"
    },
    {
      name: "TOTEMIC FORM",
      type: "MASK",
      sources: "Sc2",
      cost: "None",
      call: "None",
      description: "You may put on a mask that represents your patron. While wearing any transformation mask you gain Augment 1. Different sources of Augment stack with one another.",
      searchableText: "totemic form mask represents patron wearing transformation augment stack sorcerer corrupt"
    },
    {
      name: "TOUGHNESS",
      type: "PASSIVE",
      sources: "Hr3 Hc3 S3 V3 Wc3",
      cost: "None",
      call: "None",
      description: "Your maximum Health is increased by 4.",
      searchableText: "toughness maximum health increased 4 passive"
    },
    {
      name: "TRUE FORM",
      type: "MENTAL",
      sources: "Hr2 Hc1 S2 Wt",
      cost: "1 Energy",
      call: "\"True Form\"",
      description: "The target must remove any transformation mask they are currently wearing and cease using the Cloak power. The target may not wear any transformation masks, activate any Mask powers, or use the Cloak power.",
      searchableText: "true form remove transformation mask wearing cease cloak power wear activate mental"
    },
    {
      name: "UMBRA DRAIN",
      type: "PASSIVE",
      sources: "Vr3",
      cost: "None",
      call: "\"Breach\"",
      description: "While in the Realm, you may add the \"Breach\" meta call to any Counted Touch power. You must have a way to see a target to touch them across the Gauntlet.",
      searchableText: "umbra drain realm add breach meta call counted touch power way see target touch gauntlet vampire rare passive"
    },
    {
      name: "UMBRA SIGHT",
      type: "PASSIVE",
      sources: "H2 Hr3 Hc2 S2 Vr2 Vc2 W",
      cost: "None",
      call: "\"Breach\"",
      description: "You can see characters and landmarks that are in the Umbra while you are in the Realm.",
      searchableText: "umbra sight see characters landmarks umbra realm passive"
    },
    {
      name: "UMBRA STRIKE",
      type: "SELF",
      sources: "H3 S3",
      cost: "1 Energy",
      call: "\"Breach <attack call>\"",
      description: "While in the Realm, you may make a Damage, Status or Mental attack on a target you can see IG in the Umbra.",
      searchableText: "umbra strike realm make damage status mental attack target see umbra human shifter"
    },
    {
      name: "VENGEANCE OF SAMIEL",
      type: "PASSIVE",
      sources: "Vr3",
      cost: "None",
      call: "None",
      description: "You gain Augment 1. Different sources of Augment stack with one another.",
      searchableText: "vengeance samiel gain augment stack sources vampire rare passive"
    },
    {
      name: "VENOM",
      type: "STATUS",
      sources: "Hr1 Hc2 S2 Sr2 V2 Vc2",
      cost: "2 Energy",
      call: "\"Venom\"",
      description: "The target must roleplay being ill and may not make any attacks.",
      searchableText: "venom roleplay being ill attacks status"
    },
    {
      name: "VENOM BLOOD",
      type: "PASSIVE",
      sources: "Sr",
      cost: "None",
      call: "\"Unresistable Venom\"",
      description: "You must call \"Unresistable Venom\" immediately after someone ends a \"Draining\" or \"Draining Health\" (i.e. from Health Exchange) call against you. The target is affected by the Venom Status.",
      searchableText: "venom blood call unresistable venom immediately after someone ends draining health exchange target affected venom status shifter rare passive"
    },
    {
      name: "VENOMOUS BITE",
      type: "PASSIVE",
      sources: "Vr",
      cost: "None",
      call: "\"Unresistable Venom\"",
      description: "You must call \"Unresistable Venom\" immediately after ending a use of Draining. The target is affected by the Venom Status.",
      searchableText: "venomous bite call unresistable venom immediately after ending draining target affected venom status vampire rare passive"
    },
    {
      name: "VISIONS",
      type: "OTHER",
      sources: "Hr1 Hc1 V2 W2",
      cost: "None",
      call: "None",
      description: "You receive a prophecy at Check-In. This power is cumulative with the Oracle merit.",
      searchableText: "visions receive prophecy check-in cumulative oracle merit"
    },
    {
      name: "WAR FORM",
      type: "MASK",
      sources: "S",
      cost: "None",
      call: "None",
      description: "You must have at least 1 Energy to use this power.\n\nYou may use the Powerful Form power, with a mask that represents your Tribe. While doing so, you may use claw boffers.",
      searchableText: "war form energy powerful form mask represents tribe claw boffers shifter"
    },
    {
      name: "WEAPONRY",
      type: "OTHER",
      sources: "Vr1 W1",
      cost: "1 Energy",
      call: "\"Weaponry\"",
      description: "Spend 10 seconds reshaping a target's limb(s) into claws and/or tentacles and place an appropriate boffer into their hand(s). You may be the target of this power; if so, it costs no Energy and is immediate.\n\nThe target of this power may use the claw and/or tentacle boffer(s) you placed in their hands until they release them OOG. If the target is unwilling, they cannot remove them for 10 minutes.",
      searchableText: "weaponry 10 seconds reshaping target limbs claws tentacles place appropriate boffer hands target costs energy immediate use release oog unwilling remove 10 minutes vampire rare wraith"
    },
    {
      name: "WITHER",
      type: "STATUS",
      sources: "Hr2 Hc1 S1 V1 Vc1 W2",
      cost: "None",
      call: "\"Wither\"",
      description: "The target's maximum damage with boffer attacks is reduced by one, to a limit of 1 damage.\n*Breachable Umbra → Realm*",
      searchableText: "wither maximum damage boffer attacks reduced one limit 1 damage breachable umbra realm status"
    },
    {
      name: "WITHSTAND",
      type: "SELF",
      sources: "K2 H1 Sr1 V1 W1",
      cost: "1 Energy",
      call: "\"Withstand\"",
      description: "Remove the <type> from a damage attack that hits you or from exposure damage. You still lose current Health from exposure damage. This power does not work against the aggravated damage from Draining.",
      searchableText: "withstand remove type damage attack hits exposure still lose current health aggravated draining"
    },
    {
      name: "WOADLING",
      type: "TOUCH",
      sources: "S2",
      cost: "1 Energy",
      call: "\"Woadling\"",
      description: "Paint a blue Gaian symbol at least 3 inches across somewhere visible on the target's skin. The target may resist the next Status attack that hits them at no cost. Each use of the power requires a new symbol to be drawn on the target.",
      searchableText: "woadling paint blue gaian symbol 3 inches across visible target skin resist next status attack hits no cost use requires new symbol drawn shifter touch"
    },
    {
      name: "WOUNDING LIES",
      type: "MENTAL",
      sources: "S2 Wt",
      cost: "1 Energy",
      call: "\"Wounding Lies\"",
      description: "Each time the target makes an untruthful statement per character knowledge, they suffer one aggravated damage that cannot be resisted or soaked by armor. The target must cry out in pain if they take damage from this power.",
      searchableText: "wounding lies time target makes untruthful statement character knowledge suffer one aggravated damage resisted soaked armor cry out pain take damage shifter wraith thorn mental"
    },
    // ── ST / Charm Powers (source prefix C) ──────────────────────────────────
    {
      name: "ABSOLUTION",
      type: "TOUCH",
      sources: "C",
      cost: "5 Energy",
      call: "\"Absolution\"",
      description: "Legendary, NPC Only. Place your hand on the target's head and pray for 60 Uninterrupted seconds. Demons or characters with a Demon Patron drop to 0 Maximum Health. Vampires, Wraiths, Shifters and Fae drop to 0 Health. If the target is Claimed or possessed (via the Possession power), these effects end immediately. The target is also cleansed as per the Cleanse power.",
      searchableText: "absolution touch legendary npc demon patron maximum health vampire wraith shifter fae claimed possession cleanse charm"
    },
    {
      name: "ABSORB FETISH",
      type: "SELF",
      sources: "C2",
      cost: "None",
      call: "\"Absorb Fetish\"",
      description: "Spend 60 Uninterrupted seconds with both hands holding a Fetish. Remove the Fetish Tag. Gain Energy equal to double the Fetish's Attunement. If there is no Attunement, you gain 4 Energy.",
      searchableText: "absorb fetish self 60 seconds hands holding fetish tag energy attunement charm"
    },
    {
      name: "ABSORB MAGIC",
      type: "SELF",
      sources: "C3",
      cost: "None",
      call: "\"Absorb Magic\"",
      description: "Spend 60 Uninterrupted seconds with both hands holding a magic item. Remove the item Tag. Gain Energy equal to double the magical item's Attunement. If there is no Attunement, you gain 4 Energy.",
      searchableText: "absorb magic self 60 seconds hands magic item tag energy attunement charm"
    },
    {
      name: "AGGRAVATED 4",
      type: "DAMAGE",
      sources: "C3",
      cost: "2 Energy",
      call: "\"Agg 4\"",
      description: "Throw a packet that does 4 Aggravated damage.",
      searchableText: "aggravated 4 damage packet throw 2 energy charm"
    },
    {
      name: "APOCALYPTIC FORM",
      type: "MASK",
      sources: "C",
      cost: "None",
      call: "None",
      description: "Legendary, NPC Only, Demon Only. You have a makeup requirement of wearing a Demon Mask or prosthetics. This cannot be suppressed by True Form, but can be hidden by Mask of a Thousand Faces. You may also use claw natural weapons.",
      searchableText: "apocalyptic form mask legendary npc demon mask prosthetics true form mask thousand faces claws charm"
    },
    {
      name: "<TYPE> ATTACK",
      type: "PASSIVE",
      sources: "C3",
      cost: "None",
      call: "\"<Type><Damage>\"",
      description: "NPC Only. Add <type> to damage calls using natural weapons, where <type> is indicated by the power's source. You must use this <type> when making damage calls with natural weapons.",
      searchableText: "type attack passive npc natural weapons damage calls charm"
    },
    {
      name: "BANISH DEMON",
      type: "TOUCH",
      sources: "C3",
      cost: "3 Willpower",
      call: "\"Banish Demon\"",
      description: "NPC Only. If the target is a Demon they immediately go OOG as though they were Dead. If the target is not a Demon, they call \"No Effect\".",
      searchableText: "banish demon touch npc willpower dead no effect charm"
    },
    {
      name: "BARTER PATHOS",
      type: "TOUCH",
      sources: "C1",
      cost: "1 Energy",
      call: "\"Barter Pathos\", \"Granting <X> Pathos\" or \"Taking <X> Pathos\"",
      description: "NPC Only. Shake hands with a willing target. You gain or lose the stated amount of Pathos. Pathos exchanged this way cannot exceed your maximum or the target's maximum Energy pool. Targets who don't have Pathos call \"No Effect\".",
      searchableText: "barter pathos touch npc shake hands willing target gain lose maximum energy no effect charm"
    },
    {
      name: "BESTOW PATRON",
      type: "OTHER",
      sources: "C3",
      cost: "None",
      call: "\"Bestow Patron <Patron>\"",
      description: "NPC Only. You must state the name of your Patron, if you have one. The target may choose to take that Patron as their own and record it on their character sheet. If the target already has a Patron, the new Patron replaces the previous one.",
      searchableText: "bestow patron other npc patron name character sheet replace charm"
    },
    {
      name: "BESTOW POWER <POWER>",
      type: "TOUCH",
      sources: "C",
      cost: "1 Energy",
      call: "\"Bestow Power <Power>, <Duration>\"",
      description: "Legendary, NPC Only. The target may use the stated power for the stated duration, as though it was on their character sheet. Duration options: \"for a single use\", \"three times\", \"until sunset\", \"until sunrise\", \"until the next full/new moon\", or \"as long as you are tainted this weekend/this moon\". The target cannot use the power to cast rituals or to teach. Only one Bestowed power at a time; subsequent Bestowings overwrite previous ones.",
      searchableText: "bestow power touch legendary npc duration single use sunset sunrise moon tainted teach rituals charm"
    },
    {
      name: "BLAST",
      type: "DAMAGE",
      sources: "C2",
      cost: "1 Energy",
      call: "\"<Type> <Damage>\"",
      description: "NPC Only. Throw a packet of the specified <type> for your full damage amount.",
      searchableText: "blast damage npc packet type full damage charm"
    },
    {
      name: "BLOOD SUCKING",
      type: "COUNTED TOUCH",
      sources: "C2",
      cost: "None",
      call: "\"Biting 1, Biting 2, Biting 3, Paralyzing Bite\"",
      description: "NPC Only. You may bite and drain Health as per the rules for Vampires (using the powers Paralyzing Bite, Test Faction, and Draining). Health or Energy drained becomes Energy.",
      searchableText: "blood sucking counted touch npc bite drain health vampire paralyzing bite test faction draining energy charm"
    },
    {
      name: "BREAK ATTUNEMENT",
      type: "TOUCH",
      sources: "C3",
      cost: "3 Energy",
      call: "\"Break Attunement\"",
      description: "NPC Only. For the rest of the event, the target cannot activate any items attuned to them at the time this power was used on them (they may still attune to new items).",
      searchableText: "break attunement touch npc event items attuned activate new charm"
    },
    {
      name: "BREACH (ST)",
      type: "SELF",
      sources: "C3",
      cost: "1 Energy",
      call: "\"Breach <attack call>\"",
      description: "While in the Umbra, you may make a Status or Mental attack on a target in the Realm.",
      searchableText: "breach self umbra status mental attack realm charm"
    },
    {
      name: "CANNOT TEACH",
      type: "PASSIVE",
      sources: "C1",
      cost: "None",
      call: "None",
      description: "NPC Only. You cannot teach Power Trees or Skills.",
      searchableText: "cannot teach passive npc power trees skills charm"
    },
    {
      name: "CHAMELEON",
      type: "SELF",
      sources: "C3",
      cost: "2 Energy",
      call: "None",
      description: "NPC Only. As a passive effect without spending Energy, you know when a Sensory power is used on you and what question was asked. You may spend 2 Energy when a Sensory power is used on you to give a false answer. False answers given must still be valid responses to the Sensory power used.",
      searchableText: "chameleon self npc sensory power false answer passive energy charm"
    },
    {
      name: "CLAWS",
      type: "SELF",
      sources: "C1",
      cost: "None",
      call: "None",
      description: "NPC Only. You may use claw natural weapons.",
      searchableText: "claws self npc natural weapons charm"
    },
    {
      name: "<TYPE> CLAWS",
      type: "DAMAGE",
      sources: "C2",
      cost: "1 Energy",
      call: "\"<Type> <Damage>\"",
      description: "NPC Only. Add the <Type> onto a single natural weapon attack, where <Type> is indicated by the power source.",
      searchableText: "type claws damage npc natural weapon attack type source charm"
    },
    {
      name: "CONDUIT",
      type: "SELF",
      sources: "C2",
      cost: "None",
      call: "None",
      description: "NPC Only. Spend 60 Uninterrupted seconds meditating at a Node, then gain the Energy listed on the Node. As a passive effect, you can see Nodes in the Umbra, even without Umbra Sight.",
      searchableText: "conduit self npc node meditate energy umbra sight passive charm"
    },
    {
      name: "CRAFT",
      type: "SELF",
      sources: "C3",
      cost: "3 Energy",
      call: "None",
      description: "NPC Only. Spend 60 Uninterrupted seconds roleplaying with an appropriate prop, then attach an Item tag to the prop. Creates magic items in-game without a ritual.",
      searchableText: "craft self npc roleplay prop item tag magic items ritual charm"
    },
    {
      name: "DARK KNOWLEDGE <CORRUPTED TREE TYPE>",
      type: "SELF",
      sources: "C3",
      cost: "None",
      call: "None",
      description: "NPC Only. Choose one: Fallen Paths, Dark Arcanoi, Dark Thaumaturgy, or Wyrm Gifts. You may teach those trees.",
      searchableText: "dark knowledge corrupted tree type self npc fallen paths dark arcanoi thaumaturgy wyrm gifts teach charm"
    },
    {
      name: "DIVINE POTENCY",
      type: "PASSIVE",
      sources: "C",
      cost: "None",
      call: "None",
      description: "Legendary, NPC Only, Demon Only. You gain Augment determined by your Demonic Vice. Gluttony/Lust/Sloth: Augment 2. Envy/Greed/Pride: Augment 3. Wrath: Augment 4. Different sources of Augment stack.",
      searchableText: "divine potency passive legendary npc demon augment vice gluttony lust sloth envy greed pride wrath charm"
    },
    {
      name: "DRAIN THE EARTH",
      type: "SELF",
      sources: "C1",
      cost: "None",
      call: "None",
      description: "Spend 60 Uninterrupted seconds meditating at a Gaian node, then gain 2 Energy. May only do this at each node once per event. As a passive effect, you can see Nodes in the Umbra even without Umbra Sight.",
      searchableText: "drain earth self gaian node meditate energy once event umbra sight passive charm"
    },
    {
      name: "EMPATH",
      type: "SELF",
      sources: "C2",
      cost: "None",
      call: "None",
      description: "NPC Only. Spend 60 Uninterrupted seconds meditating at a Haunt, then gain the Energy listed on the card. May only do this at each Haunt once per event. Can see Haunts in the Umbra as a passive effect.",
      searchableText: "empath self npc haunt meditate energy once event umbra passive charm"
    },
    {
      name: "EMPOWER WEAPON",
      type: "SELF",
      sources: "C2",
      cost: "3 Energy",
      call: "None",
      description: "NPC Only. Spend 60 Uninterrupted seconds meditating with a non-natural weapon. You may deal 1 additional damage with that weapon for the rest of the event.",
      searchableText: "empower weapon self npc meditate non-natural weapon additional damage event charm"
    },
    {
      name: "ENCHANT WEAPON",
      type: "OTHER",
      sources: "C3",
      cost: "2 Energy",
      call: "\"Enchant Weapon\"",
      description: "NPC Only. Meditate with a martial weapon for at least 10 seconds, then attach an Enchanted Weapon tag to that weapon.",
      searchableText: "enchant weapon other npc meditate martial weapon enchanted weapon tag charm"
    },
    {
      name: "ENERGY EXCHANGE",
      type: "COUNTED TOUCH",
      sources: "C3",
      cost: "None",
      call: "\"Breach\", \"Giving Energy,\" or \"Draining Energy\"",
      description: "NPC Only. May use Paralyzing Touch (optionally with Breach meta call). After successfully using Paralyzing Touch, choose to give or drain the target's Energy. For every \"Giving Energy\" call the target gains 1 Energy and you lose 1; for every \"Draining Energy\" call the target loses 1 and you gain 1. Your target becomes Tainted if you are, and vice versa.",
      searchableText: "energy exchange counted touch npc paralyzing touch breach giving draining energy tainted charm"
    },
    {
      name: "FALSE MEMORY",
      type: "TOUCH",
      sources: "C3",
      cost: "3 Energy",
      call: "\"Condition: False Memory <description>\"",
      description: "NPC Only. Have a conversation for at least 60 Uninterrupted consecutive seconds immediately before using this power. Describe a short memory (two sentences max). The target cannot distinguish it from their own memories. If the condition is removed, they still remember it as an errant idea.",
      searchableText: "false memory touch npc condition 60 seconds conversation implanted memory two sentences charm"
    },
    {
      name: "FLUID FORM",
      type: "MASK",
      sources: "C1",
      cost: "None",
      call: "None",
      description: "NPC Only. You may put on or take off any Transformation mask.",
      searchableText: "fluid form mask npc transformation mask charm"
    },
    {
      name: "FORTITUDE (ST)",
      type: "PASSIVE",
      sources: "C3",
      cost: "None",
      call: "None",
      description: "NPC Only. Your Maximum Health is increased by 4.",
      searchableText: "fortitude passive npc maximum health increased 4 charm"
    },
    {
      name: "FREE SPIRIT",
      type: "PASSIVE",
      sources: "C3",
      cost: "None",
      call: "\"No Effect\"",
      description: "NPC Only. You are immune to the Rite of the Fetishcraft ritual.",
      searchableText: "free spirit passive npc immune rite fetishcraft ritual charm"
    },
    {
      name: "GAIAN CLEANSE",
      type: "TOUCH",
      sources: "C2",
      cost: "1 Energy",
      call: "\"Cleanse Taint\"",
      description: "NPC Only. The target is cleansed of Taint.",
      searchableText: "gaian cleanse touch npc taint cleanse charm"
    },
    {
      name: "GIVE ENERGY",
      type: "TOUCH",
      sources: "C3",
      cost: "<X> Energy",
      call: "\"Giving <X> Energy\"",
      description: "NPC Only. The target gains the number of Energy called, not exceeding their maximum Energy. This transfers Taint.",
      searchableText: "give energy touch npc maximum taint transfer charm"
    },
    {
      name: "GRACE",
      type: "TOUCH",
      sources: "C",
      cost: "5 Energy",
      call: "\"Grace, heal all Agg\"",
      description: "Legendary, NPC Only. The target is healed of all Aggravated damage. Their Current Health is unchanged.",
      searchableText: "grace touch legendary npc heal all aggravated damage current health unchanged charm"
    },
    {
      name: "GRANT ENERGY",
      type: "PASSIVE",
      sources: "C1",
      cost: "None",
      call: "\"Grant Energy 4\"",
      description: "NPC Only. The target must have just successfully used Release Spirit on you. The target receives 4 Energy in addition to the 1 Willpower they receive for Release Spirit. This power may be purchased multiple times, each purchase increasing the Energy granted by 4.",
      searchableText: "grant energy passive npc release spirit willpower multiple times charm"
    },
    {
      name: "GRANT POWER <POWER>",
      type: "TOUCH",
      sources: "C",
      cost: "1 Energy",
      call: "\"Grant <Power>\"",
      description: "Legendary, NPC Only. The target may use the stated power as though it was on their character sheet. The target cannot use it to cast rituals or to teach. The target must pay any costs needed. Multiple powers may be Granted simultaneously (unlike Bestow Power).",
      searchableText: "grant power touch legendary npc character sheet rituals teach multiple charm"
    },
    {
      name: "HARDENED",
      type: "SELF",
      sources: "C",
      cost: "1 Energy",
      call: "\"Resist\"",
      description: "Legendary, NPC Only. Resist a single Status attack.",
      searchableText: "hardened self legendary npc resist status attack charm"
    },
    {
      name: "HEALING TOUCH 10",
      type: "TOUCH",
      sources: "C",
      cost: "2 Energy",
      call: "\"Healing Touch 10\"",
      description: "Legendary, NPC Only. The target gains 10 Health, not to exceed their Maximum Health.",
      searchableText: "healing touch 10 touch legendary npc health maximum charm"
    },
    {
      name: "IMBUE CURIO",
      type: "OTHER",
      sources: "C3",
      cost: "2 Energy",
      call: "\"Imbue\"",
      description: "NPC Only. Meditate with an object for at least 10 seconds, then attach an Imbued Curio tag to that object.",
      searchableText: "imbue curio other npc meditate object imbued curio tag charm"
    },
    {
      name: "<TYPE> IMMUNITY",
      type: "PASSIVE",
      sources: "C2",
      cost: "None",
      call: "\"No Effect\"",
      description: "NPC Only. You are immune to damage of the specified <type>. The <type> cannot be regular damage (i.e. <Iron>). Cannot be used to grant immunity to a type you are Scorched by.",
      searchableText: "type immunity passive npc damage immune scorched no effect charm"
    },
    {
      name: "INDOMITABLE",
      type: "SELF",
      sources: "C",
      cost: "2 Energy",
      call: "\"Resist\"",
      description: "Legendary, NPC Only. Immediately resist a Mental attack. Cannot use this power to resist Mentals after they have taken effect.",
      searchableText: "indomitable self legendary npc resist mental attack charm"
    },
    {
      name: "LEGENDARY AVOIDANCE",
      type: "SELF",
      sources: "C",
      cost: "2 Energy",
      call: "\"Resist\"",
      description: "Legendary, NPC Only. Resist a single damage attack and any Meta calls associated with it.",
      searchableText: "legendary avoidance self npc resist damage attack meta calls charm"
    },
    {
      name: "LEGENDARY STRENGTH <NUMBER>",
      type: "PASSIVE",
      sources: "C",
      cost: "None",
      call: "None",
      description: "Legendary, NPC Only. You gain Augment <Number>, where Number is defined by the power. Different sources of Augment stack. Total Augment cannot exceed 9.",
      searchableText: "legendary strength passive npc augment number stack maximum 9 charm"
    },
    {
      name: "MANIPULATE GLADE",
      type: "OTHER",
      sources: "C2",
      cost: "4-14 Energy",
      call: "None",
      description: "NPC Only. Hang a temporary Glade tag at an appropriate location; its value is half the Energy spent (rounded down). Lasts for the Event. Only one temporary Glade at a time. May also spend twice the value of a Glade to close it for that event.",
      searchableText: "manipulate glade other npc temporary glade tag energy event close charm"
    },
    {
      name: "MASS CONFUSION",
      type: "MENTAL",
      sources: "C3",
      cost: "3 Energy",
      call: "\"(Breach) Mass Confusion\"",
      description: "All targets are affected by the power Confusion. May be used from the Umbra to the Realm by adding \"Breach\" before the call.",
      searchableText: "mass confusion mental 3 energy breach umbra realm all targets charm"
    },
    {
      name: "MASS DERANGE",
      type: "MENTAL",
      sources: "C3",
      cost: "3 Energy",
      call: "\"Mass Derange <Derangement>\"",
      description: "All targets are affected by the power Derange. The Derangement selected must be one that is present on your character sheet.",
      searchableText: "mass derange mental 3 energy all targets derangement character sheet charm"
    },
    {
      name: "MASS <MENTAL>",
      type: "MENTAL",
      sources: "C",
      cost: "2 Energy",
      call: "\"Mass <Mental>\"",
      description: "Legendary, NPC Only. Add the \"Mass\" call to one use of the Mental specified in the power source. Mass powers can never be Unresistable. Cannot be used with: Avert, Control Voice, Hypnotism, or any mental that already calls \"Mass\".",
      searchableText: "mass mental legendary npc 2 energy unresistable avert control voice hypnotism charm"
    },
    {
      name: "NATURAL ARMOR",
      type: "PASSIVE",
      sources: "C2",
      cost: "None",
      call: "None",
      description: "A pool of 4 armor points which refreshes each sunrise. These armor points do not require a phys-rep and are added to any other armor you have except those gained from this power. Used before any other armor and not regained until the next sunrise.",
      searchableText: "natural armor passive 4 armor points sunrise phys-rep stack charm"
    },
    {
      name: "OCCULT ACCLIMATION <ENERGY TYPE>",
      type: "PASSIVE",
      sources: "C2",
      cost: "None",
      call: "None",
      description: "Not intended for items. Choose an Energy type. You may attune to and use items that require this Energy type as though you had the required Energy type.",
      searchableText: "occult acclimation energy type passive attune items required charm"
    },
    {
      name: "OCCULT MASTERY <RITUAL TYPE>",
      type: "PASSIVE",
      sources: "C3",
      cost: "None",
      call: "None",
      description: "Not intended for items. Choose one: Mystic, Glyph, Blood, or Arcanos. You may read and use these rituals as if you have the required Energy type and Power Tree requirements, unless the ritual is marked \"Faction Locked\". You must still possess powers used as part of the casting instructions. Requires Rituals skill.",
      searchableText: "occult mastery ritual type passive mystic glyph blood arcanos faction locked energy power tree rituals skill charm"
    },
    {
      name: "OMNISCIENCE",
      type: "PASSIVE",
      sources: "C",
      cost: "None",
      call: "None",
      description: "Legendary, NPC Only. You hear all OOG sig calls, knowing what powers are used, who their casters and targets are, and whether or not they are resisted.",
      searchableText: "omniscience passive legendary npc oog sig calls powers casters targets resisted charm"
    },
    {
      name: "PASS WARD",
      type: "SELF",
      sources: "C",
      cost: "5 Energy",
      call: "None",
      description: "Legendary, NPC Only. Meditate for 30 seconds before a ward. You may pass through it a single time as if it were not there.",
      searchableText: "pass ward self legendary npc meditate 30 seconds ward charm"
    },
    {
      name: "PATTERN SENSE",
      type: "PASSIVE",
      sources: "C3",
      cost: "None",
      call: "None",
      description: "Not intended for items. You hear all OOG sig calls used against you, knowing what powers are used and their casters. You hear \"Resist\" calls against powers and attacks made by you.",
      searchableText: "pattern sense passive oog sig calls powers casters resist charm"
    },
    {
      name: "POISON",
      type: "SELF",
      sources: "C2",
      cost: "1 Energy",
      call: "None",
      description: "NPC Only. Affix a poison tag to a food or drink container prop without needing to use a vial prop to pour the poison in.",
      searchableText: "poison self npc poison tag food drink container prop vial charm"
    },
    {
      name: "PORTAL MASTERY",
      type: "SELF",
      sources: "C1",
      cost: "1 Energy",
      call: "\"Portal Mastery\"",
      description: "Open or close a locked door.",
      searchableText: "portal mastery self open close locked door charm"
    },
    {
      name: "PURIFY (ST)",
      type: "TOUCH",
      sources: "C2",
      cost: "1 Willpower",
      call: "\"Purify\"",
      description: "The target immediately exits Frenzy and every condition affecting the target ends. Note: this power was removed from PC trees in 2019; kept as ST power for items still in use.",
      searchableText: "purify touch willpower frenzy condition end st item charm"
    },
    {
      name: "Q: AUTUMN'S CHAMPION",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Unresistable Daze\" and \"Mass Disquiet\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Unresistable Daze and Mass Disquiet at no cost.",
      searchableText: "autumn champion self legendary npc quintessence unresistable daze mass disquiet 10 minutes charm"
    },
    {
      name: "Q: CALL TO ADVENTURE",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass Craving\" and \"Mass Meditate\"",
      description: "Legendary, NPC Only. Spend 10 minutes telling a story to activate. For the next 10 minutes, gain and may use Mass Craving and Mass Meditate at no cost.",
      searchableText: "call adventure self legendary npc quintessence story mass craving meditate 10 minutes charm"
    },
    {
      name: "Q: CALL BACK THE SPIRITS",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass Heal 8\" and \"Mass Revive\"",
      description: "Legendary, NPC Only. For the next 10 minutes, concentrate for 10 seconds to call \"Mass Heal 8\" at no cost. Concentrate for 60 seconds to call \"Mass Revive\" at no cost, ending this power early.",
      searchableText: "call back spirits self legendary npc quintessence mass heal 8 revive 10 minutes charm"
    },
    {
      name: "Q: COMMANDING VOICE",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass Obedience\" and \"Conditioning\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Mass Obedience and Conditioning at no cost.",
      searchableText: "commanding voice self legendary npc quintessence mass obedience conditioning 10 minutes charm"
    },
    {
      name: "Q: CONTROL CROWD",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass Induce Frenzy\" and \"Mass Serenity\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Mass Induce Frenzy and Mass Serenity at no cost.",
      searchableText: "control crowd self legendary npc quintessence mass induce frenzy serenity 10 minutes charm"
    },
    {
      name: "Q: CONTROL FREAK",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass Obedience\" and \"Unresistable Obedience\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain Mass Obedience at no cost. Also gain Unresistable Obedience on any Demon or target with a Demon Patron at no cost (must know in-game they are a Demon/have Patron).",
      searchableText: "control freak self legendary npc quintessence mass obedience unresistable demon patron 10 minutes charm"
    },
    {
      name: "Q: DISTANT WAILS",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Tainted Brittle Bones\" and \"Tainted Derange <Derangement>\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Tainted Brittle Bones and Tainted Derange at no cost. Any Derangement selected must be present on your character sheet.",
      searchableText: "distant wails self legendary npc quintessence tainted brittle bones derange derangement 10 minutes charm"
    },
    {
      name: "Q: EMPOWER SELF",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "None",
      description: "Legendary, NPC Only. For the next 10 minutes, you may replace the numeric call of all damage powers, melee attacks, and healing powers with your current Quintessence.",
      searchableText: "empower self legendary npc quintessence damage melee healing numeric call 10 minutes charm"
    },
    {
      name: "Q: ENHANCE CONSCIOUSNESS",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"No Effect\" and \"Restore 2 Willpower\"",
      description: "Legendary, NPC Only. All Mental powers and Despair end on you and Willpower is fully refreshed. For the next 10 minutes, immune to Mental powers and may touch characters to \"Restore 2 Willpower\" once per target at no cost.",
      searchableText: "enhance consciousness legendary npc quintessence mental despair willpower immune restore 10 minutes charm"
    },
    {
      name: "Q: ESSENCE FONT",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Restore Essence\"",
      description: "Legendary, NPC Only. Your Essence is fully refreshed. For the next 10 minutes, gain and may use Restore Essence at no cost, and use any packet-throwing powers at no cost.",
      searchableText: "essence font legendary npc quintessence restore essence refreshed packet powers 10 minutes charm"
    },
    {
      name: "Q: FEAR ME",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass Taunt\" and \"Mass Terror\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Mass Taunt and Mass Terror at no cost.",
      searchableText: "fear me legendary npc quintessence mass taunt terror 10 minutes charm"
    },
    {
      name: "Q: FRENZIED WARRIOR",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"No Effect\" and \"Brutal <Number>\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain all mechanical benefits and immunities of Frenzy but may still act rationally and use powers. Also gain the Brutal Strike power at normal cost.",
      searchableText: "frenzied warrior legendary npc quintessence frenzy benefits immunities rational brutal strike 10 minutes charm"
    },
    {
      name: "Q: GOD'S GRACE",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Grace, heal all Agg\" and \"Mass Serenity\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Grace and Mass Serenity at no cost.",
      searchableText: "god grace legendary npc quintessence grace heal aggravated mass serenity 10 minutes charm"
    },
    {
      name: "Q: INFERNAL TORMENT",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Tainted Body Wrack\" and \"Tainted Decay\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Tainted Body Wrack and Tainted Decay at no cost.",
      searchableText: "infernal torment legendary npc quintessence tainted body wrack decay 10 minutes charm"
    },
    {
      name: "Q: KNOW THE TRUTH",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass True Form\", \"Grant Power (Umbra Sight)\", \"Grant Power (Cloak Sight)\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Mass True Form, Grant Power (Umbra Sight), and Grant Power (Cloak Sight) at no cost.",
      searchableText: "know truth legendary npc quintessence mass true form grant power umbra sight cloak sight 10 minutes charm"
    },
    {
      name: "Q: MANIPULATE CRAY",
      type: "OTHER",
      sources: "C",
      cost: "1-5 Quintessence",
      call: "None",
      description: "Legendary, NPC Only. Requires 3+ maximum Quintessence. Hang a temporary Cray tag at an appropriate location equal to Quintessence spent. Lasts the Event. Only one temporary Cray at a time. May spend half a Cray's value (rounded up) to close it for the event.",
      searchableText: "manipulate cray other legendary npc quintessence temporary cray tag event close charm"
    },
    {
      name: "Q: MASTER OF CORRUPTION",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass Induce Sin <Sin>\" and \"Mass Derange <Derangement>\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Mass Induce Sin and Mass Derange at no cost. Derangement selected must be present on your character sheet.",
      searchableText: "master corruption legendary npc quintessence mass induce sin derange derangement 10 minutes charm"
    },
    {
      name: "Q: MASTER OF DREAMS",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Daze\", \"Mass Daze\", and \"Dreamshape\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Daze, Mass Daze, and Dreamshape at no cost.",
      searchableText: "master dreams legendary npc quintessence daze mass dreamshape 10 minutes charm"
    },
    {
      name: "Q: MASTER OF HELL",
      type: "SELF",
      sources: "C",
      cost: "1 Virtue and <X> Quintessence",
      call: "\"Bind Demon\"",
      description: "Legendary, NPC Only. Must be at ST camp to activate. Summon a Demon and create a temporary body for it via Possession. Demon power determined by Quintessence spent. Must follow your commands but may subvert or tempt you. Ends if you become Incapacitated, have no Quintessence, or go OOG.",
      searchableText: "master hell legendary npc virtue quintessence bind demon summon st camp possession commands incapacitated charm"
    },
    {
      name: "Q: MASTER OF ILLUSION",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass Monsters\" and \"Mass Horrid Reality <description>\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Mass Monsters and Mass Horrid Reality at no cost.",
      searchableText: "master illusion legendary npc quintessence mass monsters horrid reality 10 minutes charm"
    },
    {
      name: "Q: OUT OF TOUCH",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Cloak\" and \"No Effect\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Cloak at no cost. While Cloaked, immune to melee attacks.",
      searchableText: "out of touch legendary npc quintessence cloak immune melee attacks 10 minutes charm"
    },
    {
      name: "Q: PERFECT BODY",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"No Effect\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain a Regeneration Rate of 3 or your current Quintessence (whichever is higher). Can regenerate without concentrating and are immune to damage calls.",
      searchableText: "perfect body legendary npc quintessence regeneration rate immune damage calls concentrate 10 minutes charm"
    },
    {
      name: "Q: RATIONALIZE",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass Status Disable\" and \"No Effect\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Mass Status Disable at no cost. Also immune to packet powers.",
      searchableText: "rationalize legendary npc quintessence mass status disable immune packet powers 10 minutes charm"
    },
    {
      name: "Q: RAW POWER",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"<Damage>\"",
      description: "Legendary, NPC Only. For the next 10 minutes, your boffer and packet damage becomes either 6 or twice your current Quintessence, whichever is higher.",
      searchableText: "raw power legendary npc quintessence boffer packet damage 6 twice 10 minutes charm"
    },
    {
      name: "Q: REFORM",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Reform\"",
      description: "Legendary, NPC Only. Spend 60 seconds totally still (may be Cloaked or in either Realm). Go OOG for at least 4 hours. When you return, current and Maximum Health are fully restored.",
      searchableText: "reform legendary npc quintessence still cloaked realm oog 4 hours health restored charm"
    },
    {
      name: "Q: RIGHT HAND OF GOD",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Mass Entrancement\" and \"Unresistable Absolution\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Majesty and Unresistable Absolution at no cost.",
      searchableText: "right hand god legendary npc quintessence mass entrancement majesty unresistable absolution 10 minutes charm"
    },
    {
      name: "Q: SECRET IDENTITY",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "None",
      description: "Legendary, NPC Only. Must be at ST camp. Create a second character sheet as a non-Mage Human, Shifter, Vampire, or Wraith. Switch character sheets and play with the new sheet. Must be at ST camp to deactivate and return to original sheet.",
      searchableText: "secret identity legendary npc quintessence second character sheet human shifter vampire wraith st camp charm"
    },
    {
      name: "Q: SPRING'S BOUNTY",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Fabricate Armor 10\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Fabricate Armor at no cost creating 10 armor points. Also may spend any amount of Energy to instantly heal the same amount of Aggravated damage.",
      searchableText: "spring bounty legendary npc quintessence fabricate armor 10 energy heal aggravated 10 minutes charm"
    },
    {
      name: "Q: SUMMER'S FURY",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Fire <Damage>\"",
      description: "Legendary, NPC Only. Double Maximum Health and fully restore Current Health. For the next 10 minutes, add Fire <type> to all damage attacks. After 10 minutes, Maximum Health returns to normal.",
      searchableText: "summer fury legendary npc quintessence double maximum health fire damage attacks 10 minutes charm"
    },
    {
      name: "Q: TOUCH OF DEATH",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Agg <Damage>\"",
      description: "Legendary, NPC Only. For the next 10 minutes, add Agg <Type> to all damage attacks. Packet powers have no cost during this time.",
      searchableText: "touch of death legendary npc quintessence agg aggravated damage packet powers 10 minutes charm"
    },
    {
      name: "Q: UNCHAINED",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"No Effect\"",
      description: "Legendary, NPC Only. End any Mental, Status, and/or Touch effect(s) on yourself. For the next 10 minutes, immune to all Mental, Status, and Touch powers.",
      searchableText: "unchained legendary npc quintessence end mental status touch immune 10 minutes charm"
    },
    {
      name: "Q: UNDYING",
      type: "OTHER",
      sources: "C",
      cost: "2 Virtue and 1 Quintessence",
      call: "None",
      description: "Legendary, NPC Only. May use the Zombi Ritual without casting time or components. Also, if Dead or Dying, may spend 2 Virtue and 1 Quintessence to go OOG then return at the edge of game with 1 Health and 1 Energy.",
      searchableText: "undying legendary npc virtue quintessence zombi ritual dead dying return health energy charm"
    },
    {
      name: "Q: VOICE OF MALFEAS",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Tainted Induce Sin <Sin>\" and \"Mass Subjugate\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Tainted Induce Sin and Mass Subjugate at no cost.",
      searchableText: "voice malfeas legendary npc quintessence tainted induce sin mass subjugate 10 minutes charm"
    },
    {
      name: "Q: WINTER'S TOUCH",
      type: "SELF",
      sources: "C",
      cost: "1 Quintessence",
      call: "\"Unresistable Brittle Bones\" and \"Ice 4\"",
      description: "Legendary, NPC Only. For the next 10 minutes, gain and may use Unresistable Brittle Bones and Ranged 4 <Ice> at no cost.",
      searchableText: "winter touch legendary npc quintessence unresistable brittle bones ranged 4 ice 10 minutes charm"
    },
    {
      name: "READ / WRITE INFERNAL TEXT",
      type: "SELF",
      sources: "C3",
      cost: "3 Energy",
      call: "None",
      description: "Receive one Infernal Text tag at Check-In (free). May attach the Infernal Text tag to a paper after writing/drawing on it and paying the cost. The Derangement selected must be present on your character sheet. You are immune to the effects of any document with an Infernal Text tag.",
      searchableText: "read write infernal text self 3 energy check-in tag paper derangement immune document charm"
    },
    {
      name: "RESTORE ESSENCE",
      type: "TOUCH",
      sources: "C",
      cost: "5 Energy",
      call: "\"Restore Essence\"",
      description: "Legendary, NPC Only. If the target's current Energy type is Essence, they regain Energy up to their maximum.",
      searchableText: "restore essence touch legendary npc energy essence maximum charm"
    },
    {
      name: "RITUAL MASTER",
      type: "PASSIVE",
      sources: "C",
      cost: "None",
      call: "None",
      description: "Legendary, NPC Only. If you have Rituals 3, you may cast Legendary Potency rituals that you meet the other casting requirements for.",
      searchableText: "ritual master passive legendary npc rituals 3 legendary potency charm"
    },
    {
      name: "<TYPE> SCORCHED",
      type: "PASSIVE",
      sources: "C1",
      cost: "None",
      call: "None",
      description: "You take Aggravated damage from the specified <type>. If already Scorched by that type or cannot take Aggravated damage, double the damage from all attacks of that <type>. Also take Exposure damage from contact with the <type>. If the <type> is <Light>, gain Sunsickness from sun exposure instead of Exposure damage.",
      searchableText: "type scorched passive aggravated damage exposure sunsickness light double charm"
    },
    {
      name: "SENSE FACTION",
      type: "SENSORY",
      sources: "C1",
      cost: "None",
      call: "\"Sense Faction\"",
      description: "Stare at the target for 10 seconds. They must answer OOG with their Faction.",
      searchableText: "sense faction sensory 10 seconds oog faction charm"
    },
    {
      name: "SENSE FAE OATH",
      type: "SENSORY",
      sources: "C2",
      cost: "None",
      call: "\"Sense Fae Oath\"",
      description: "Stare at the target for 10 seconds. Ask one or both: \"Do you have any Fae Oaths or bargains?\" or \"Have you broken any Fae Oaths or bargains this weekend?\". Target must answer OOG truthfully.",
      searchableText: "sense fae oath sensory 10 seconds oog fae oaths bargains broken weekend charm"
    },
    {
      name: "SENSE PATRON",
      type: "SENSORY",
      sources: "C3",
      cost: "None",
      call: "\"Sense Patron\"",
      description: "NPC Only. Stare at the target for 10 seconds. They must answer OOG with their Patron, or \"No Effect\" if they do not have one.",
      searchableText: "sense patron sensory npc 10 seconds oog patron no effect charm"
    },
    {
      name: "SENSE POWER",
      type: "SENSORY",
      sources: "C1",
      cost: "1 Energy",
      call: "\"Sense Power <Power>\"",
      description: "Stare at the target for 10 seconds. They must answer OOG \"yes\" or \"no\" if the stated power is listed on their character sheet. Powers gained through Mimic or magical items are not powers on the character's sheet.",
      searchableText: "sense power sensory 10 seconds oog yes no character sheet mimic magic items charm"
    },
    {
      name: "SENSE <SUBFACTION>",
      type: "SENSORY",
      sources: "C",
      cost: "None",
      call: "\"Sense <subfaction>\"",
      description: "Legendary, NPC Only. Stare at the target for 10 seconds. They must answer OOG with their requested subfaction, or \"No Effect\" if they do not have such a subfaction. Examples: Sense Auspice, Sense Changing Breed, Sense Claimed Type, Sense Clan, Sense Fae Court, Sense Fellowship, Sense Guild, Sense Legion, Sense Spectre.",
      searchableText: "sense subfaction sensory legendary npc 10 seconds oog auspice clan fellowship guild legion spectre charm"
    },
    {
      name: "SENSE TORMENT",
      type: "SENSORY",
      sources: "C1",
      cost: "None",
      call: "\"Sense Torment\"",
      description: "Stare at the target for 10 seconds. They must answer OOG their current Torment rating. Targets without a Torment rating call \"No Effect\".",
      searchableText: "sense torment sensory 10 seconds oog torment rating no effect charm"
    },
    {
      name: "SENSE TRIBE",
      type: "SENSORY",
      sources: "C3",
      cost: "None",
      call: "\"Sense Tribe\"",
      description: "NPC Only. Stare at the target for 10 seconds. They answer OOG with their Tribe (Garou/Kinfolk), changing breed (Fera/Fera Kinfolk), \"Ronin\" if Ronin, or \"No Effect\" otherwise.",
      searchableText: "sense tribe sensory npc 10 seconds oog garou kinfolk fera ronin no effect charm"
    },
    {
      name: "SENSE VIRTUE",
      type: "SENSORY",
      sources: "C1",
      cost: "None",
      call: "\"Sense Virtue\"",
      description: "Stare at the target for 10 seconds. They must answer OOG their current Virtue rating (numeric value only, not the type).",
      searchableText: "sense virtue sensory 10 seconds oog virtue rating numeric charm"
    },
    {
      name: "SHARED MEMORY",
      type: "PASSIVE",
      sources: "C",
      cost: "None",
      call: "None",
      description: "Legendary, NPC Only. Your character knowledge is shared with all other spirits of the same kind, even if you die.",
      searchableText: "shared memory passive legendary npc character knowledge spirits same kind die charm"
    },
    {
      name: "SHIFT REALM",
      type: "SELF",
      sources: "C3",
      cost: "None",
      call: "None",
      description: "Spend 60 Uninterrupted seconds concentrating. Travel from the Realm to the Umbra or from the Umbra to the Realm.",
      searchableText: "shift realm self 60 seconds concentrating realm umbra travel charm"
    },
    {
      name: "SHOW / HIDE MEIN",
      type: "SELF",
      sources: "C3",
      cost: "None",
      call: "None",
      description: "NPC Only, Fae Only. Put on or take off masks, prosthetics, and other optional costuming representing your Mein. Shift into or out of your Mein form.",
      searchableText: "show hide mein self npc fae masks prosthetics costuming mein form charm"
    },
    {
      name: "SHUNT",
      type: "TOUCH",
      sources: "C3",
      cost: "1 Energy",
      call: "\"Breach Shunt\"",
      description: "NPC Only. The target falls from the Realm into the Umbra or from the Umbra into the Realm. You must provide the target a white headband to force them into the Umbra.",
      searchableText: "shunt touch npc breach realm umbra white headband charm"
    },
    {
      name: "STRENGTH (ST)",
      type: "PASSIVE",
      sources: "C2",
      cost: "None",
      call: "None",
      description: "You gain Augment 1. Different sources of Augment stack with one another.",
      searchableText: "strength passive augment 1 stack charm"
    },
    {
      name: "TEACH TREE <POWER TREE>",
      type: "PASSIVE",
      sources: "C1",
      cost: "None",
      call: "None",
      description: "NPC Only, Spirit Only. You may teach the appropriate Power Tree to characters of the appropriate Faction. You must have at least one power from said Tree. All other rules around Teaching and Learning are normal.",
      searchableText: "teach tree power tree passive npc spirit faction appropriate teaching learning charm"
    },
    {
      name: "TOUGH FORM",
      type: "MASK",
      sources: "C2",
      cost: "None",
      call: "\"Resist\"",
      description: "NPC Only. While wearing any transformation mask you may resist Status attacks for 1 Energy. Note: removed from PC trees in 2023; kept as ST power for items still in use.",
      searchableText: "tough form mask npc transformation resist status energy st item charm"
    },
    {
      name: "VIGOR",
      type: "PASSIVE",
      sources: "C1",
      cost: "None",
      call: "None",
      description: "Your Regeneration Rate is increased by 1.",
      searchableText: "vigor passive regeneration rate increased 1 charm"
    },
    {
      name: "WYRM'S HERALD",
      type: "PASSIVE",
      sources: "C3",
      cost: "None",
      call: "\"No Effect\"",
      description: "You are immune to the Subjugate and Sanctuary powers.",
      searchableText: "wyrm herald passive immune subjugate sanctuary no effect charm"
    }
  ], []);

  useEffect(() => {
    setPowers(powersData);
    setIsLoading(false);
  }, [powersData]);

  // Get unique sources and types for filters
  const uniqueSources = useMemo(() => {
    const sources = new Set();
    powers.forEach(power => {
      power.sources.split(' ').forEach(source => sources.add(source));
    });
    return Array.from(sources).sort();
  }, [powers]);

  const uniqueTypes = useMemo(() => {
    const types = new Set();
    powers.forEach(power => types.add(power.type));
    return Array.from(types).sort();
  }, [powers]);

  // Filter and sort powers
  const filteredPowers = useMemo(() => {
    let filtered = powers.filter(power => {
      const searchMatch = searchTerm === '' || 
        power.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        power.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        power.sources.toLowerCase().includes(searchTerm.toLowerCase()) ||
        power.call.toLowerCase().includes(searchTerm.toLowerCase()) ||
        power.searchableText.toLowerCase().includes(searchTerm.toLowerCase());
      
      const sourceMatch = sourceFilter === '' || power.sources.includes(sourceFilter);
      const typeMatch = typeFilter === '' || power.type === typeFilter;
      
      return searchMatch && sourceMatch && typeMatch;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'cost':
          return a.cost.localeCompare(b.cost);
        default:
          return 0;
      }
    });

    return filtered;
  }, [powers, searchTerm, sourceFilter, typeFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading Power Index...</div>
      </div>
    );
  }

  const containerClass = embedded 
    ? "text-white" 
    : "min-h-screen bg-gray-900 text-white p-4";
  
  const contentClass = embedded 
    ? "" 
    : "max-w-7xl mx-auto";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className={embedded ? "mb-4" : "mb-6"}>
          {!embedded && (
            <div className="flex items-center gap-4 mb-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Menu
                </button>
              )}
            </div>
          )}
          <h1 className={`${embedded ? "text-xl" : "text-3xl"} font-bold mb-2 flex items-center gap-2`}>
            <BookOpen className={`${embedded ? "w-6 h-6" : "w-8 h-8"}`} />
            {embedded ? "Power Index" : "Shadow Accord Power Index"}
          </h1>
          <p className="text-gray-400">
            {embedded ? "Quick reference for all player powers" : "Searchable database of all player powers from the rulebook"}
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className={`bg-gray-800 p-4 rounded-lg ${embedded ? "mb-4" : "mb-6"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search powers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Source Filter */}
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">All Sources</option>
                <option value="C">C — All Charm Powers (ST rulebook)</option>
                <option value="C1">C1 — Charm Level 1</option>
                <option value="C2">C2 — Charm Level 2</option>
                <option value="C3">C3 — Charm Level 3</option>
                {uniqueSources.filter(s => !/^C\d?$/.test(s)).map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
                <option value="cost">Sort by Cost</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-400">
            Showing {filteredPowers.length} of {powers.length} powers
          </div>
        </div>

        {/* Source Code Legend */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-4">
          <button
            onClick={() => setShowLegend(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <span>Source Code Legend (e.g. H1, Vc2, Sr3…)</span>
            {showLegend ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showLegend && (
            <div className="px-4 pb-4 border-t border-gray-700 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-blue-300 border-b border-blue-900 pb-1 mb-2">Factions</h5>
                  <ul className="space-y-1 text-gray-300">
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">H</span> — Human (Faithful, Sorcerer)</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">S</span> — Shifter Gift</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">V</span> — Vampire Discipline</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">W</span> — Wraith Arcanoi</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-blue-300 border-b border-blue-900 pb-1 mb-2">Modifiers</h5>
                  <ul className="space-y-1 text-gray-300">
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">r</span> — Rare tree</li>
                    <li><span className="font-mono text-red-300 bg-gray-700 px-1 rounded">c</span> — Corrupt / Dark Arcanoi</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">f</span> — Fundamental Power</li>
                    <li><span className="font-mono text-yellow-300 bg-gray-700 px-1 rounded">1/2/3</span> — Level in the tree</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-blue-300 border-b border-blue-900 pb-1 mb-2">Other Sources</h5>
                  <ul className="space-y-1 text-gray-300">
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">Wt</span> — Wraith (Specter) Thorn</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">K</span> — Skill Power</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">M</span> — Merit Power</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">C</span> — Charm Power (ST rulebook)</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-blue-300 border-b border-blue-900 pb-1 mb-2">Example</h5>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    <span className="font-mono text-white">Hr1 Hc1 S1 V1 Vr1 Vc1</span> means the power appears at level 1 in a Human rare tree, a Human corrupt tree, a Shifter tree, a standard Vampire discipline, a Vampire rare tree, and a Vampire corrupt tree.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Power List */}
        <div className="grid gap-4">
          {filteredPowers.map((power, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex flex-wrap items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-400 mb-2">
                  {power.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">
                    {power.type}
                  </span>
                  {power.sources.split(' ').map((source, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-600 text-gray-200 text-xs rounded-full">
                      {source}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-sm">
                    <strong>Cost:</strong> {power.cost}
                  </span>
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Volume2 className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">
                    <strong>Call:</strong> {power.call}
                  </span>
                </div>
              </div>

              <div className="text-gray-300 text-sm leading-relaxed">
                {power.description.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredPowers.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">No powers found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PowerIndex;
