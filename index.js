const puppeteer = require('puppeteer');
const fs = require('fs');
const xlsx = require('xlsx');

// Read the Links.txt file
fs.readFile('Links.txt', 'utf8', async (err, data) => {
  if (err) {
    console.error('Error reading Links.txt:', err);
    return;
  }

  const links = data.split('\n').filter(link => link.trim() !== '');

  // Initialize an array to store the data
  const extractedData = [];

  // Launch Puppeteer browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const link of links) {
    console.log('Visiting: ', link);
    await page.goto(link, { waitUntil: 'domcontentloaded' });

    try {
      // Scrape data from the page
      const providerDisplayName = await page.$eval('[data-qa-target="ProviderDisplayName"]', el => el.innerText.trim());
      const providerAddress = await page.$eval('[data-qa-target="provider-office-address"]', el => el.innerText.trim());
      const category = await page.$eval('.summary-standard-specialty-mobile', el => el.innerText.trim());

      // Check if the phone link exists before clicking
      const phoneLink = await page.$('.summary-standard-button-row');
      let phoneNumber = 'Not Available';
      if (phoneLink) {
        await phoneLink.click();
		await new Promise(resolve => setTimeout(() => resolve(), 300));
        phoneNumber = await page.$eval('.summary-standard-button-row', el => el.innerText.trim());
      } else {
        console.log('Phone link not found for:', link);
      }

      // Push the extracted data to the array
      extractedData.push({
        Name: providerDisplayName,
        Address: providerAddress,
        Category: category,
        'Phone No': phoneNumber,
      });
    } catch (err) {
      console.error('Error extracting data from:', link, err);
    }
  }

  // Close the browser
  await browser.close();

  // Create a new Excel workbook
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(extractedData);

  // Add the sheet to the workbook
  xlsx.utils.book_append_sheet(wb, ws, 'Providers');

  // Write the Excel file
  xlsx.writeFile(wb, 'Provider_Data.xlsx');
  console.log('Data saved to Provider_Data.xlsx');
});
