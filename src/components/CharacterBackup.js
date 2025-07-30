import React from 'react';

const CharacterBackup = ({ characters }) => {
  const exportCharacters = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      version: "0.3.0",
      characters: characters
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shadow-accord-characters-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importCharacters = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        
        // Validate backup format
        if (backup.characters && Array.isArray(backup.characters)) {
          // Save to localStorage
          const currentData = JSON.parse(localStorage.getItem('shadowAccordPhase8') || '{}');
          currentData.characters = backup.characters;
          localStorage.setItem('shadowAccordPhase8', JSON.stringify(currentData));
          
          alert(`Successfully imported ${backup.characters.length} characters from ${backup.exportDate}`);
          window.location.reload(); // Refresh to show imported characters
        } else {
          alert('Invalid backup file format');
        }
      } catch (error) {
        alert('Error reading backup file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', margin: '10px', borderRadius: '5px' }}>
      <h3>Character Backup</h3>
      <p>Your characters are automatically saved locally. Use these tools for additional backup:</p>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={exportCharacters}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          📁 Export All Characters
        </button>
        <small>Downloads a JSON file with all your characters</small>
      </div>
      
      <div>
        <input
          type="file"
          accept=".json"
          onChange={importCharacters}
          style={{ marginRight: '10px' }}
          id="import-file"
        />
        <label htmlFor="import-file" style={{ cursor: 'pointer' }}>
          📤 Import Characters
        </label>
        <br />
        <small>Select a previously exported JSON file</small>
      </div>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <strong>Current Status:</strong>
        <ul>
          <li>Characters stored locally: ✅ Always available offline</li>
          <li>Cloud sync: ✅ Automatic when online</li>
          <li>Manual backup: ✅ Export/import anytime</li>
        </ul>
      </div>
    </div>
  );
};

export default CharacterBackup;
