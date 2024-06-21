const puppeteer = require('puppeteer');

async function scrapeKTCRankings() {

  // launch browser instance
  const browser = await puppeteer.launch();
  // create new page within browser instance
  const page = await browser.newPage();

  const playersAsObjects = [];

  // for each of KTC's 9 pages or rankings
  for (let pageNum = 0; pageNum <= 9; pageNum++) {
    // navigate to pageurl
    await page.goto(`https://keeptradecut.com/dynasty-rankings?page=${pageNum}&filters=QB|WR|RB|TE|RDP&format=2`);
    
    // get all elements matching '.rank-number'
    const playersAsRows = await page.$$(".rank-number")

    // remove first '.rank-number' element (header row)
    playersAsRows.shift();

    // for each '.rank-number' element, traverse the DOM to get inner text and convert into object, then push into playersAsObjects array (excluding unwanted player info such as positional rank, rookie status, tier and trending direction)
    for (let index = 0; index < playersAsRows.length; index++) {
      const element = playersAsRows[index];
      const playerText = await page.evaluate(element =>  `${element.textContent.trim()} splitHere ${element.nextSibling.textContent.trim()} splitHere ${element.nextSibling.nextSibling.textContent.trim()} splitHere ${element.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling.textContent.trim()}`, element);
      const splitPlayer = playerText.split(' splitHere ');
      playersAsObjects.push(
        {
          rank: splitPlayer[0],
          name: splitPlayer[1][splitPlayer[1].length - 4] === 'R' ? splitPlayer[1].substring(0, splitPlayer[1].length - 4) : splitPlayer[1].substring(0, splitPlayer[1].length - 3),
          // team: splitPlayer[1].substring(splitPlayer[1].length - 3, splitPlayer[1].length),
          age: splitPlayer[2].split('•')[1] || 'PICK',
          value: splitPlayer[3],
        }
      );
    }
  }

  // close browser instance
  browser.close();
  console.log('KTC Top 500: ', playersAsObjects);
}

async function scrapeFantasyCalcRankings() {

  // launch browser instance
  const browser = await puppeteer.launch();
  // create new page within browser instance
  const page = await browser.newPage();
  // navigate to url
  await page.goto('https://www.fantasycalc.com/dynasty-rankings');

  const playersAsObjects = [];

  for (let pageNum = 0; pageNum <= 9; pageNum++) {

  // get all elements matching 'tr'
  const playersAsRows = await page.$$('tr');
  // remove first 'tr' element (header row)
  playersAsRows.shift();

  // for each 'tr' element, get inner text and convert into object, then push into playersAsObjects array (excluding unwanted player info such as positional rank, rookie status and trending direction)
  for (let index = 0; index < playersAsRows.length; index++) {
    const playerText = await (await (await playersAsRows[index].getProperty('innerText')).jsonValue()).replace(/(\t\n|\n\n|\n\n\t|\t)/gm," splitHere ");
    const splitPlayer = playerText.split(' splitHere ');
    playersAsObjects.push(
      {
        rank: splitPlayer[0],
        name: splitPlayer[1],
        age: splitPlayer[splitPlayer.length - 2],
        value: splitPlayer[splitPlayer.length - 1],
      }
    );
  }
  
  // don't seem to need this?
  // await page.waitForSelector('.download-icon');

  // click to view next page
  await page.click('.mat-paginator-navigation-next');

  // don't seem to need this either?
  // new Promise(r => setTimeout(r, 5000)); // Adjust the timeout as necessary
}

  // close browser instance
  browser.close();
  console.log('FantasyCalc Top 50: ', playersAsObjects);
}

module.exports.scrapeKTCRankings = scrapeKTCRankings;
module.exports.scrapeFantasyCalcRankings = scrapeFantasyCalcRankings;