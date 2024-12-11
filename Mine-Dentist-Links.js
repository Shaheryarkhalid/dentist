const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Healthgrades URL template
const baseUrl = 'https://www.healthgrades.com/usearch?what=dentist&pt=32.817036%2C-117.133439&state=CA&where=San%20Diego%2C%20CA&searchType=PracticingSpecialty&distances=5&pageNum=';

// Function to fetch the maximum page number (Last Page)
async function getMaxPages() {
  try {
    // Make a GET request to the first page of results
    const { data } = await axios.get(baseUrl + '1&sort.provider=bestmatch&state=CA');
    
    // Load the HTML into Cheerio
    const $ = cheerio.load(data);

    // Find the link containing "Last Page"
    const lastPageLink = $('a[aria-label="Last Page"][data-qa-target*="last-page"]');

    // Extract the page number from the data-qa-target attribute
    const maxPages = lastPageLink.attr('data-qa-target').match(/pagination--page-(\d+)/);

    if (maxPages && maxPages[1]) {
      return parseInt(maxPages[1], 10); // Return the maximum page number
    }
    throw new Error('Could not find the last page number.');
  } catch (error) {
    console.error('Error fetching max pages:', error);
    return 0;
  }
}

// Function to scrape dentist links from a specific page
async function scrapeDentists(pageNum) {
  try {
    const { data } = await axios.get(baseUrl + pageNum + '&sort.provider=bestmatch&state=CA');
    const $ = cheerio.load(data);

    // Loop through divs with the class "jWr8yJPe5w8zJNff"
    $('div.jWr8yJPe5w8zJNff').each((index, element) => {
      // Find the 'a' tag inside this div with class "RML7ZoJM_T0OsSL0"
      const link = $(element).find('a.RML7ZoJM_T0OsSL0').attr('href');
      
      if (link) {
        // Write the link to the file
        fs.appendFileSync('Dentists.txt', link + '\n', 'utf8');
        console.log('Saved link:', link);
      }
    });
  } catch (error) {
    console.error('Error scraping page', pageNum, ':', error);
  }
}

// Main function to loop through all pages
async function scrapeAllPages() {
  const maxPages = 27;

  if (maxPages > 0) {
    console.log('Found a total of', maxPages, 'pages.');

    // Loop through each page from 1 to the max page number
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`Scraping page ${pageNum}...`);
      await scrapeDentists(pageNum);
    }

    console.log('Finished scraping all pages.');
  } else {
    console.log('No pages found.');
  }
}

// Start the scraping process
scrapeAllPages();
