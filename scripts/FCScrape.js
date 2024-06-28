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

    // get player id on FC
    const element = playersAsRows[index];
    var player_slug = await  page.evaluate(element => element.childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].getAttribute('href'), element);

    playersAsObjects.push(
      {
        // rank: splitPlayer[0],
        fc_player_name: splitPlayer[1],
        fc_player_age: splitPlayer[splitPlayer.length - 2],
        fc_player_value: splitPlayer[splitPlayer.length - 1],
        fc_player_slug: player_slug
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

  // clear and insert to supabase
  const { data, error } = await supabase
    .from(`${process.env.SUPABASE_FC_DB_NAME}`)
    .delete()
    .neq('player_value', 0)

    if (error) {
      console.error(error);
    }
  const { data2, error2 } = await supabase
    .from(`${process.env.SUPABASE_FC_DB_NAME}`)
    .insert(playersAsObjects)
    
    if (error2) {
      console.error(error2);
    }
  // console.log('FantasyCalc Top 50: ', playersAsObjects);
}

export default scrapeFantasyCalcRankings;