
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
  const browser = await puppeteer.launch({
    headless: false, // Run in non-headless mode (optional, for debugging purposes)
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Bypass root sandboxing restrictions if needed
  });
  const page = await browser.newPage();

  // Set a custom User-Agent to avoid detection as a bot
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36');

  // Check if the Excel file exists
  const filePath = 'Provider_Data.xlsx';
  let wb;

  if (fs.existsSync(filePath)) {
    // If the file exists, read the existing workbook
    wb = xlsx.readFile(filePath);
  } else {
    // If the file doesn't exist, create a new workbook
    wb = xlsx.utils.book_new();
  }

  // Create a sheet if it doesn't exist yet
  let ws = wb.Sheets['Providers'];
  if (!ws) {
    ws = xlsx.utils.aoa_to_sheet([['Name', 'Address', 'Category', 'Phone No']]); // Add headers if new
    xlsx.utils.book_append_sheet(wb, ws, 'Providers');
  }

  for (const link of links) {
    console.log('Visiting: ', link);
    
    // Navigate to the page with extended wait time
    await page.goto(link, { waitUntil: 'networkidle2', timeout: 60000 }); // Wait for the page to load fully

    try {
      // Wait for the specific element to be present on the page
      await page.waitForSelector('[data-qa-target="ProviderDisplayName"]', { timeout: 10000 });

      // Scrape data from the page
      const providerDisplayName = await page.$eval('[data-qa-target="ProviderDisplayName"]', el => el.innerText.trim());
      const providerAddress = await page.$eval('[data-qa-target="provider-office-address"]', el => el.innerText.trim());
      const category = await page.$eval('.summary-standard-specialty-mobile', el => el.innerText.trim());

      // Check if the phone link exists before clicking
      const phoneLink = await page.$('.summary-standard-button-row');
      let phoneNumber = 'Not Available';
      if (phoneLink) {
        await phoneLink.click();
        await new Promise(resolve => setTimeout(() => resolve(), 300)); // Delay for phone number to appear
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

      // Immediately append data to the sheet
      const newWs = xlsx.utils.json_to_sheet([extractedData[extractedData.length - 1]], { header: ['Name', 'Address', 'Category', 'Phone No'] });
      xlsx.utils.sheet_add_json(ws, extractedData, { skipHeader: true, origin: -1 }); // Append without headers

      // Save the workbook after each link's data is appended
      xlsx.writeFile(wb, filePath);

    } catch (err) {
      console.error('Error extracting data from:', link, err);
    }
  }

  // Close the browser after processing all links
  await browser.close();

  console.log('Data appended to Provider_Data.xlsx');
});

















// const puppeteer = require('puppeteer');
// const fs = require('fs');
// const xlsx = require('xlsx');

// // Read the Links.txt file
// fs.readFile('Links.txt', 'utf8', async (err, data) => {
//   if (err) {
//     console.error('Error reading Links.txt:', err);
//     return;
//   }

//   const links = data.split('\n').filter(link => link.trim() !== '');

//   // Initialize an array to store the data
//   const extractedData = [];

//   // Launch Puppeteer browser
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   // Check if the Excel file exists
//   const filePath = 'Provider_Data.xlsx';
//   let wb;

//   if (fs.existsSync(filePath)) {
//     // If the file exists, read the existing workbook
//     wb = xlsx.readFile(filePath);
//   } else {
//     // If the file doesn't exist, create a new workbook
//     wb = xlsx.utils.book_new();
//   }

//   // Create a sheet if it doesn't exist yet
//   let ws = wb.Sheets['Providers'];
//   if (!ws) {
//     ws = xlsx.utils.aoa_to_sheet([['Name', 'Address', 'Category', 'Phone No']]); // Add headers if new
//     xlsx.utils.book_append_sheet(wb, ws, 'Providers');
//   }

//   for (const link of links) {
//     console.log('Visiting: ', link);
//     await page.goto(link, { waitUntil: 'domcontentloaded' });

//     try {
//       // Scrape data from the page
//       const providerDisplayName = await page.$eval('[data-qa-target="ProviderDisplayName"]', el => el.innerText.trim());
//       const providerAddress = await page.$eval('[data-qa-target="provider-office-address"]', el => el.innerText.trim());
//       const category = await page.$eval('.summary-standard-specialty-mobile', el => el.innerText.trim());

//       // Check if the phone link exists before clicking
//       const phoneLink = await page.$('.summary-standard-button-row');
//       let phoneNumber = 'Not Available';
//       if (phoneLink) {
//         await phoneLink.click();
//         await new Promise(resolve => setTimeout(() => resolve(), 300)); // Delay for phone number
//         phoneNumber = await page.$eval('.summary-standard-button-row', el => el.innerText.trim());
//       } else {
//         console.log('Phone link not found for:', link);
//       }

//       // Push the extracted data to the array
//       extractedData.push({
//         Name: providerDisplayName,
//         Address: providerAddress,
//         Category: category,
//         'Phone No': phoneNumber,
//       });

//       // Immediately append data to the sheet
//       const newWs = xlsx.utils.json_to_sheet([extractedData[extractedData.length - 1]], { header: ['Name', 'Address', 'Category', 'Phone No'] });
//       xlsx.utils.sheet_add_json(ws, extractedData, { skipHeader: true, origin: -1 }); // Append without headers

//       // Save the workbook after each link's data is appended
//       xlsx.writeFile(wb, filePath);
      
//     } catch (err) {
//       console.error('Error extracting data from:', link, err);
//     }
//   }

//   // Close the browser
//   await browser.close();

//   console.log('Data appended to Provider_Data.xlsx');
// });
