import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, BookOpen, Zap, Users, DollarSign, Volume2, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { powersData } from './data/powersData';

function PowerIndex({ onBack, embedded = false }) {
  const [powers, setPowers] = useState([]);
  const [showLegend, setShowLegend] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(true);


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
                <option value="C">C â€” All Charm Powers (ST rulebook)</option>
                <option value="C1">C1 â€” Charm Level 1</option>
                <option value="C2">C2 â€” Charm Level 2</option>
                <option value="C3">C3 â€” Charm Level 3</option>
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
            <span>Source Code Legend (e.g. H1, Vc2, Sr3â€¦)</span>
            {showLegend ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showLegend && (
            <div className="px-4 pb-4 border-t border-gray-700 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-blue-300 border-b border-blue-900 pb-1 mb-2">Factions</h5>
                  <ul className="space-y-1 text-gray-300">
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">H</span> â€” Human (Faithful, Sorcerer)</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">S</span> â€” Shifter Gift</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">V</span> â€” Vampire Discipline</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">W</span> â€” Wraith Arcanoi</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-blue-300 border-b border-blue-900 pb-1 mb-2">Modifiers</h5>
                  <ul className="space-y-1 text-gray-300">
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">r</span> â€” Rare tree</li>
                    <li><span className="font-mono text-red-300 bg-gray-700 px-1 rounded">c</span> â€” Corrupt / Dark Arcanoi</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">f</span> â€” Fundamental Power</li>
                    <li><span className="font-mono text-yellow-300 bg-gray-700 px-1 rounded">1/2/3</span> â€” Level in the tree</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-blue-300 border-b border-blue-900 pb-1 mb-2">Other Sources</h5>
                  <ul className="space-y-1 text-gray-300">
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">Wt</span> â€” Wraith (Specter) Thorn</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">K</span> â€” Skill Power</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">M</span> â€” Merit Power</li>
                    <li><span className="font-mono text-white bg-gray-700 px-1 rounded">C</span> â€” Charm Power (ST rulebook)</li>
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
