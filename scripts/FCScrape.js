import puppeteer from 'puppeteer';
import supabase from '../supabase/supabaseClient.js';

async function scrapeFantasyCalcRankings() {

  // launch browser instance
  const browser = await puppeteer.launch();
  // create new page within browser instance
  const page = await browser.newPage();
  // navigate to url
  await page.goto('https://www.fantasycalc.com/dynasty-rankings', {timeout: 0});

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
        // rank: splitPlayer[0],
        player_name: splitPlayer[1],
        player_age: splitPlayer[splitPlayer.length - 2],
        player_value: splitPlayer[splitPlayer.length - 1],
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

  const { data, error } = await supabase
    .from('fc_values')
    .insert(playersAsObjects)
    
    if (error) {
      console.error(error);
    }
  // console.log('FantasyCalc Top 50: ', playersAsObjects);
}

export default scrapeFantasyCalcRankings;