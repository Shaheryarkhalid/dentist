const fs = require('fs');

// Function to read Links.txt and add prefix to each line
function processLinks() {
  const inputFile = 'Links.txt'; // Name of the input file
  const prefix = 'https://www.healthgrades.com';

  // Read the Links.txt file
  fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    // Split the file content by line breaks and add prefix to each line
    const lines = data.split('\n').map(line => prefix + line.trim());

    // Output the modified lines
    lines.forEach(link => console.log(link));

    // Optionally, you can save the modified links to a new file
    fs.writeFile('Modified_Links.txt', lines.join('\n'), 'utf8', (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('Modified links saved to Modified_Links.txt');
      }
    });
  });
}

// Call the function to process the links
processLinks();
