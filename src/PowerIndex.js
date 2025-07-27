import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, BookOpen, Zap, Users, DollarSign, Volume2, ArrowLeft } from 'lucide-react';

function PowerIndex({ onBack, embedded = false }) {
  const [powers, setPowers] = useState([]);
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
      description: "The target behaves as though they are Oathed to you. The power ends if you attack the target. The target may choose to resist this power even though they are under an Oath.",
      searchableText: "entrancement oathed attack resist oath mental"
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
      description: "Each time you use the Dreamshape power on a target, your maximum Energy is increased by one for the remainder of the event. This bonus can only be received once per target per event.",
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
      description: "All targets behave as though they are Oathed to you for the duration of this power. The Oath ends for an individual target if you attack them. Targets may spend Willpower to resist this power even though they are under an Oath.",
      searchableText: "majesty mass entrancement targets oathed duration oath individual attack willpower resist"
    },
    {
      name: "MASK OF A THOUSAND FACES",
      type: "MASK",
      sources: "Hr2 Sr2 V2",
      cost: "None",
      call: "None",
      description: "You may put on any Transformation mask you desire. You may disregard any Makeup Requirements. You may Disguise yourself without a face covering, as though adopting a new identity (not as any existing PC or NPC).",
      searchableText: "mask thousand faces transformation desire disregard makeup requirements disguise face covering identity existing"
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
      sources: "W3",
      cost: "1 Energy",
      call: "\"Breach Possession\"",
      description: "You must be in the Umbra and the target must be in the Realm. Roleplay puppetting the target for 10 seconds then place your hands on the target's shoulders.\n\nThe target may only perform actions that you instruct them to do. The target may not activate any powers but retains the use of any passive powers. You may direct the target to use your powers by spending the appropriate cost yourself and having the target perform any associated actions. You and the player of the target character should work together to maintain hand-on-shoulder contact.",
      searchableText: "possession breach umbra realm roleplay puppetting 10 seconds hands shoulders perform actions instruct activate powers passive direct spending cost associated actions player character hand-on-shoulder contact"
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
      name: "SENSE MAXIMUM HEALTH",
      type: "SENSORY",
      sources: "Vr1",
      cost: "1 Energy",
      call: "\"Sense Maximum Health\"",
      description: "Stare at the target for 10 seconds. They must answer OOG with their current maximum Health.",
      searchableText: "sense maximum health stare 10 seconds answer oog current maximum health vampire rare sensory"
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
      description: "Roleplay breaking an object for 10 seconds while touching it with both hands. You must then shout the sig call, loud enough that if you were in a two-story building, anyone else inside could hear you.\n\nRemove and destroy the item tag. If used on Restraints, free yourself from them. This power cannot destroy Wards.\n*Breachable Umbra → Realm*",
      searchableText: "shatter roleplay breaking object 10 seconds touching both hands shout sig call loud two-story building anyone inside hear remove destroy item tag restraints free wards breachable umbra realm"
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
      description: "Hold two fingers to your temple and whisper to a target you can see who is within Mental range. This can be used across the Gauntlet. These whispered words are heard only in the target's mind. The target may hold two fingers to their temple to respond. This power ends if either of you remove your fingers from your temples or if you move outside of Mental range of each other.\n\nYou may also hear in-game any words spoken by other characters who are using this power, without placing your fingers on your temple.",
      searchableText: "telepathy hold two fingers temple whisper target mental range gauntlet whispered words heard mind respond remove outside hear in-game spoken characters placing"
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
      name: "TEST OATH",
      type: "SENSORY",
      sources: "V1",
      cost: "None",
      call: "\"Test Blood Oath\"",
      description: "Consume at least 1 point of a target's blood or Vitae. The target must answer OOG \"yes\" or \"no\" if they are currently under the effect of a Blood Oath.",
      searchableText: "test oath consume 1 point target blood vitae answer oog yes no currently under effect blood oath vampire sensory"
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
                {uniqueSources.map(source => (
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
