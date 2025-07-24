const fs = require('fs');
const { PDFDocument, PDFTextField, PDFCheckBox } = require('pdf-lib');

async function renamePDFFields() {
  try {
    // Load the original PDF template
    const templateBytes = fs.readFileSync('./public/character-sheet-template.pdf');
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log(`Found ${fields.length} fields in the PDF`);
    
    // Create a mapping of old field names to new logical names
    const fieldMappings = {
      // Basic Character Information
      'Player Name': 'player_name',
      'Character Name': 'character_name',
      'FactionRow1': 'faction',
      'Subfaction1': 'subfaction_1',
      'Subfaction2': 'subfaction_2', 
      'Subfaction3': 'subfaction_3',
      'Patron': 'patron',
      'Gen/Rank': 'generation_rank',
      'Passion': 'passion',
      
      // Stats
      'Health': 'health',
      'Energy Amount': 'energy_amount',
      'Energy Type': 'energy_type',
      'Virtue': 'virtue_amount',
      'Devoured': 'devoured',
      
      // Innate Power Trees (SkillsRow1-3 are actually innate trees)
      'SkillsRow1': 'innate_tree_1_name',
      'SkillsRow2': 'innate_tree_2_name', 
      'SkillsRow3': 'innate_tree_3_name',
      
      // Skills (SkillsRow4-15)
      'SkillsRow4': 'skill_1_name',
      'SkillsRow5': 'skill_2_name',
      'SkillsRow6': 'skill_3_name',
      'SkillsRow7': 'skill_4_name',
      'SkillsRow8': 'skill_5_name',
      'SkillsRow9': 'skill_6_name',
      'SkillsRow10': 'skill_7_name',
      'SkillsRow11': 'skill_8_name',
      'SkillsRow12': 'skill_9_name',
      'SkillsRow13': 'skill_10_name',
      'SkillsRow14': 'skill_11_name',
      'SkillsRow15': 'skill_12_name',
      
      // Learned Power Trees (Source TreeRow fields)
      'Source  TreeRow2_2': 'learned_tree_1_name',
      'Source  TreeRow3_2': 'learned_tree_2_name',
      'Source  TreeRow4': 'learned_tree_3_name',
      'Source  TreeRow5': 'learned_tree_4_name',
      'Source  TreeRow6': 'learned_tree_5_name',
      
      // Summary field
      'Innates 1': 'innate_summary'
    };
    
    // Add dot patterns for innate trees (Level1-1, Level2-1, Level3-1, etc.)
    for (let treeIndex = 1; treeIndex <= 3; treeIndex++) {
      for (let level = 1; level <= 3; level++) {
        const oldName = `Level${level}-${treeIndex}`;
        const newName = `innate_tree_${treeIndex}_level_${level}`;
        fieldMappings[oldName] = newName;
      }
    }
    
    // Add dot patterns for skills (Level1-4 through Level3-15)
    for (let skillIndex = 4; skillIndex <= 15; skillIndex++) {
      for (let level = 1; level <= 3; level++) {
        const oldName = `Level${level}-${skillIndex}`;
        const newName = `skill_${skillIndex - 3}_level_${level}`; // skill_1_level_1, etc.
        fieldMappings[oldName] = newName;
      }
    }
    
    // Add Willpower dots (WP1-WP10)
    for (let i = 1; i <= 10; i++) {
      fieldMappings[`WP${i}`] = `willpower_dot_${i}`;
    }
    
    // Add Virtue dots (Virtue1-Virtue10)
    for (let i = 1; i <= 10; i++) {
      fieldMappings[`Virtue${i}`] = `virtue_dot_${i}`;
    }
    
    // Rename the fields
    let renamedCount = 0;
    fields.forEach(field => {
      const oldName = field.getName();
      const newName = fieldMappings[oldName];
      
      if (newName) {
        try {
          // Create new field with the new name
          if (field instanceof PDFTextField) {
            const newField = form.createTextField(newName);
            // Copy properties from old field
            newField.setText(field.getText() || '');
            // Remove old field
            form.removeField(field);
            console.log(`Renamed text field: ${oldName} → ${newName}`);
          } else if (field instanceof PDFCheckBox) {
            const newField = form.createCheckBox(newName);
            // Copy properties from old field
            if (field.isChecked()) {
              newField.check();
            }
            // Remove old field
            form.removeField(field);
            console.log(`Renamed checkbox: ${oldName} → ${newName}`);
          }
          renamedCount++;
        } catch (error) {
          console.warn(`Could not rename field ${oldName}:`, error.message);
        }
      } else {
        console.log(`No mapping for field: ${oldName}`);
      }
    });
    
    console.log(`\nRenamed ${renamedCount} fields successfully`);
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync('./public/character-sheet-template-v2.pdf', modifiedPdfBytes);
    
    console.log('Saved renamed PDF as character-sheet-template-v2.pdf');
    
    // Generate field reference
    const fieldReference = Object.entries(fieldMappings)
      .map(([oldName, newName]) => `${oldName} → ${newName}`)
      .join('\n');
    
    fs.writeFileSync('./pdf-field-mappings.txt', fieldReference);
    console.log('Saved field mappings to pdf-field-mappings.txt');
    
  } catch (error) {
    console.error('Error renaming PDF fields:', error);
  }
}

renamePDFFields();