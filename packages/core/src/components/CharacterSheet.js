import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, ArrowLeft, Plus, Minus } from 'lucide-react';
import { gameData } from '../data/gameData';
import { canAdvanceAtCheckIn, canReduce, calculateReductionRefund, advanceCharacter, reduceCharacter } from '../services/characterService';

const CharacterSheet = ({
  character,
  onBack,
  xpAdjustment,
  setXpAdjustment,
  showXpDropdown,
  setShowXpDropdown,
  selectedXpActivities,
  setSelectedXpActivities,
  showCheckInDropdown,
  setShowCheckInDropdown,
  selectedCheckInActivities,
  setSelectedCheckInActivities,
  gameData,
  setCharacters
}) => {
  // XP Tracking State
  const [xpAdjustmentLocal, setXpAdjustmentLocal] = useState({
    amount: 0,
    reason: '',
    type: 'gain' // 'gain' or 'loss'
  });

  // Common XP Activities State
  const [showXpDropdownLocal, setShowXpDropdownLocal] = useState(false);
  const [selectedXpActivitiesLocal, setSelectedXpActivitiesLocal] = useState([]);
  const [showCheckInDropdownLocal, setShowCheckInDropdownLocal] = useState(false);
  const [selectedCheckInActivitiesLocal, setSelectedCheckInActivitiesLocal] = useState([]);

  const commonXpActivities = [
    { name: 'Bathrooms', xp: 3 },
    { name: 'Set up', xp: 1 },
    { name: 'Load Truck', xp: 1 },
    { name: 'Unload Truck', xp: 1 },
    { name: 'Teardown', xp: 1 }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showXpDropdownLocal && !event.target.closest('.xp-dropdown')) {
        setShowXpDropdownLocal(false);
      }
      if (showCheckInDropdownLocal && !event.target.closest('.checkin-dropdown')) {
        setShowCheckInDropdownLocal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showXpDropdownLocal, showCheckInDropdownLocal]);

  const handleAdvanceCharacter = async (activity) => {
    if (!character) return;

    const advanceResult = await advanceCharacter(character, activity);

    if (advanceResult && advanceResult.success) {
      // Update the character in the characters array
      setCharacters(prevCharacters => {
        return prevCharacters.map(char => {
          if (char.id === character.id) {
            return advanceResult.updatedCharacter;
          } else {
            return char;
          }
        });
      });

      alert(advanceResult.message);
    } else {
      alert(advanceResult.message || 'Failed to advance character.');
    }
  };

  const handleReduceCharacter = async (activity) => {
    if (!character) return;

    const reduceResult = await reduceCharacter(character, activity);

    if (reduceResult && reduceResult.success) {
      // Update the character in the characters array
      setCharacters(prevCharacters => {
        return prevCharacters.map(char => {
          if (char.id === character.id) {
            return reduceResult.updatedCharacter;
          } else {
            return char;
          }
        });
      });

      alert(reduceResult.message);
    } else {
      alert(reduceResult.message || 'Failed to reduce character.');
    }
  };

  if (!character) {
    return <div>No character selected.</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-4xl mx-auto px-2 py-4 sm:px-4 sm:py-6">
        <button onClick={onBack} className="mb-4 inline-flex items-center">
          <ArrowLeft className="mr-2" size={20} />
          Back to Menu
        </button>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {character.name}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {character.player} - {character.faction} ({character.subfaction})
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{character.name}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Player</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{character.player}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Faction</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{character.faction}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Subfaction</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{character.subfaction}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Total XP</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{character.totalXP}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* XP Adjustment Section */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">Adjust XP</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* XP Adjustment Type */}
            <div>
              <label htmlFor="xpType" className="block text-sm font-medium text-gray-700">Type</label>
              <select
                id="xpType"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={xpAdjustmentLocal.type}
                onChange={(e) => setXpAdjustmentLocal({ ...xpAdjustmentLocal, type: e.target.value })}
              >
                <option value="gain">Gain</option>
                <option value="loss">Loss</option>
              </select>
            </div>

            {/* XP Amount */}
            <div>
              <label htmlFor="xpAmount" className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                id="xpAmount"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={xpAdjustmentLocal.amount}
                onChange={(e) => setXpAdjustmentLocal({ ...xpAdjustmentLocal, amount: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            {/* XP Reason */}
            <div>
              <label htmlFor="xpReason" className="block text-sm font-medium text-gray-700">Reason</label>
              <input
                type="text"
                id="xpReason"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={xpAdjustmentLocal.reason}
                onChange={(e) => setXpAdjustmentLocal({ ...xpAdjustmentLocal, reason: e.target.value })}
              />
            </div>
          </div>

          {/* Apply XP Adjustment Button */}
          <button
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => {
              // Implement XP adjustment logic here
            }}
          >
            Apply Adjustment
          </button>
        </div>

        {/* Common XP Activities Section */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">Common XP Activities</h4>
          <div className="relative xp-dropdown">
            <button
              onClick={() => setShowXpDropdownLocal(!showXpDropdownLocal)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Add XP for Activity
            </button>
            {showXpDropdownLocal && (
              <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  {commonXpActivities.map((activity) => (
                    <a
                      key={activity.name}
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      role="menuitem"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedXpActivitiesLocal([...selectedXpActivitiesLocal, activity]);
                        setShowXpDropdownLocal(false);
                      }}
                    >
                      {activity.name} (+{activity.xp} XP)
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected XP Activities */}
          {selectedXpActivitiesLocal.length > 0 && (
            <div className="mt-4">
              <h5 className="text-md font-semibold">Selected Activities:</h5>
              <ul className="list-disc pl-5">
                {selectedXpActivitiesLocal.map((activity, index) => (
                  <li key={index} className="flex items-center justify-between py-2 border-b border-gray-200">
                    {activity.name} (+{activity.xp} XP)
                    <button
                      onClick={() => {
                        setSelectedXpActivitiesLocal(selectedXpActivitiesLocal.filter((_, i) => i !== index));
                      }}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Check-In Activities Section */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">Check-In Activities</h4>
          <div className="relative checkin-dropdown">
            <button
              onClick={() => setShowCheckInDropdownLocal(!showCheckInDropdownLocal)}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Add Check-In Activity
            </button>
            {showCheckInDropdownLocal && (
              <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  {gameData && gameData.checkInActivities && gameData.checkInActivities.map((activity) => {
                    const canAdvance = canAdvanceAtCheckIn(character, activity);
                    return (
                      <a
                        key={activity.name}
                        href="#"
                        className={`block px-4 py-2 text-sm ${canAdvance ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-400 cursor-not-allowed'}`}
                        role="menuitem"
                        onClick={(e) => {
                          e.preventDefault();
                          if (canAdvance) {
                            setSelectedCheckInActivitiesLocal([...selectedCheckInActivitiesLocal, activity]);
                            setShowCheckInDropdownLocal(false);
                          }
                        }}
                      >
                        {activity.name} (+{activity.xp} XP)
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected Check-In Activities */}
          {selectedCheckInActivitiesLocal.length > 0 && (
            <div className="mt-4">
              <h5 className="text-md font-semibold">Selected Check-In Activities:</h5>
              <ul className="list-disc pl-5">
                {selectedCheckInActivitiesLocal.map((activity, index) => {
                  const canAdvance = canAdvanceAtCheckIn(character, activity);
                  const canReduceActivity = canReduce(character, activity);
                  const reductionRefund = calculateReductionRefund(character, activity);

                  return (
                    <li key={index} className="flex items-center justify-between py-2 border-b border-gray-200">
                      <div>
                        {activity.name} (+{activity.xp} XP)
                        {canReduceActivity && (
                          <span className="ml-2 text-green-600">Refund: {reductionRefund} XP</span>
                        )}
                      </div>
                      <div>
                        {canAdvance && (
                          <button
                            onClick={() => handleAdvanceCharacter(activity)}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline mr-2"
                          >
                            Advance
                          </button>
                        )}
                        {canReduceActivity && (
                          <button
                            onClick={() => handleReduceCharacter(activity)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                          >
                            Reduce
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedCheckInActivitiesLocal(selectedCheckInActivitiesLocal.filter((_, i) => i !== index));
                          }}
                          className="text-red-600 hover:text-red-800 focus:outline-none"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;