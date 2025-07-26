import React from 'react';
import { Trash2, ArrowLeft } from 'lucide-react';

const CharacterManagement = ({ characters, onSelectCharacter, onBack, onDeleteCharacter }) => {
  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4 p-2 bg-gray-700 text-white rounded">
        <ArrowLeft size={20} /> Back to Menu
      </button>
      <h2 className="text-2xl font-bold mb-4">Manage Characters</h2>
      {
        characters.length === 0 ? (
          <p>No characters created yet. Go back to the main menu to create one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character, index) => (
              <div key={character.id} className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col">
                <h3 className="text-xl font-semibold mb-2">{character.name}</h3>
                <p className="text-gray-400">Player: {character.player}</p>
                <p className="text-gray-400">Faction: {character.faction}</p>
                <p className="text-gray-400">XP: {character.totalXP}</p>
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => onSelectCharacter(index)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    View Sheet
                  </button>
                  <button
                    onClick={() => onDeleteCharacter(character.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
};

export default CharacterManagement;