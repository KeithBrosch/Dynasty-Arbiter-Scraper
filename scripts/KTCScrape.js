const puppeteer = require('puppeteer');

async function scrapeKTCRankings(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  
  const players = await page.$$(".rank-number")
  const playersAsStrings = [];

  for (let index = 0; index < players.length; index++) {
    const element = players[index];
    const playerText = await page.evaluate(element =>  `${element.textContent.trim()} splitHere ${element.nextSibling.textContent.trim()} splitHere ${element.nextSibling.nextSibling.textContent.trim()} splitHere ${element.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling.textContent.trim()}`, element);
    playersAsStrings.push(playerText);
  }

  const playersAsObjects = [];

  playersAsStrings.shift();

  playersAsStrings.forEach((player) => {
    splitPlayer = player.split(' splitHere ');
    playersAsObjects.push(
      {
        rank: splitPlayer[0],
        name: splitPlayer[1][splitPlayer[1].length - 4] === 'R' ? splitPlayer[1].substring(0, splitPlayer[1].length - 4) : splitPlayer[1].substring(0, splitPlayer[1].length - 3),
        team: splitPlayer[1].substring(splitPlayer[1].length - 3, splitPlayer[1].length),
        age: splitPlayer[2].split('•')[1] || 'pick',
        value: splitPlayer[3],
      }
    );
  })

  console.log(playersAsObjects);

  browser.close();
}

module.exports.scrapeKTCRankings = scrapeKTCRankings;