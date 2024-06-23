import puppeteer from 'puppeteer';
import supabase from '../supabase/supabaseClient.js';

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

      // get player id on KTC
      var player_slug = await page.evaluate(element => Object.values(Object.values(element.nextSibling.childNodes)[0])[0].slug, element);
      player_slug = player_slug.split('-');
      const player_id = player_slug[player_slug.length - 1]

      playersAsObjects.push(
        {
          // rank: splitPlayer[0],
          player_name: splitPlayer[1][splitPlayer[1].length - 4] === 'R' ? splitPlayer[1].substring(0, splitPlayer[1].length - 4) : splitPlayer[1].substring(0, splitPlayer[1].length - 3),
          // team: splitPlayer[1].substring(splitPlayer[1].length - 3, splitPlayer[1].length),
          player_age: splitPlayer[2].split('•')[1] || 'PICK',
          player_value: splitPlayer[3],
          ktc_id: player_id
        }
      );
    }
  }

  // close browser instance
  browser.close();
  
  // insert to supabase
  const { data, error } = await supabase
    .from('ktc_values')
    .insert(playersAsObjects)
    
    if (error) {
      console.error(error);
    }
    
  // console.log('KTC Top 500: ', playersAsObjects);
}
export default scrapeKTCRankings;