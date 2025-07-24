const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function analyzePDFFields() {
  try {
    // Load the new PDF template
    const templateBytes = fs.readFileSync('./public/Shadow accord fixed fillable character sheet 7.24.pdf');
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log(`Found ${fields.length} fields in the new PDF template`);
    console.log('\n=== ALL FIELD NAMES ===');
    
    const fieldNames = fields.map(field => field.getName()).sort();
    fieldNames.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    
    // Save field list to file for reference
    fs.writeFileSync('./new-pdf-fields.txt', fieldNames.join('\n'));
    console.log('\nSaved field names to new-pdf-fields.txt');
    
  } catch (error) {
    console.error('Error analyzing PDF fields:', error);
  }
}

analyzePDFFields();