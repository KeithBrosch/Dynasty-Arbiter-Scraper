const puppeteer = require('puppeteer');

async function scrapeKTCRankings() {
  const playersAsObjects = [];

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (let pageNum = 0; pageNum <= 9; pageNum++) {
  await page.goto(`https://keeptradecut.com/dynasty-rankings?page=${pageNum}&filters=QB|WR|RB|TE|RDP&format=2`);
  
  const players = await page.$$(".rank-number")
  const playersAsStrings = [];

  for (let index = 0; index < players.length; index++) {
    const element = players[index];
    const playerText = await page.evaluate(element =>  `${element.textContent.trim()} splitHere ${element.nextSibling.textContent.trim()} splitHere ${element.nextSibling.nextSibling.textContent.trim()} splitHere ${element.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling.textContent.trim()}`, element);
    playersAsStrings.push(playerText);
  }

  playersAsStrings.shift();

  playersAsStrings.forEach((player) => {
    splitPlayer = player.split(' splitHere ');
    playersAsObjects.push(
      {
        rank: splitPlayer[0],
        name: splitPlayer[1][splitPlayer[1].length - 4] === 'R' ? splitPlayer[1].substring(0, splitPlayer[1].length - 4) : splitPlayer[1].substring(0, splitPlayer[1].length - 3),
        team: splitPlayer[1].substring(splitPlayer[1].length - 3, splitPlayer[1].length),
        age: splitPlayer[2].split('•')[1] || 'PICK',
        value: splitPlayer[3],
      }
    );
  })
  }

  browser.close();
  console.log('KTC Top 500: ', playersAsObjects);
}

async function scrapeFantasyCalcRankings() {
  const playersAsObjects = [];

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.fantasycalc.com/dynasty-rankings');

  const players = await page.$$('tr');
  const playersAsStrings = [];

  for (let index = 0; index < players.length; index++) {
    const element = players[index];
    const playerText = await (await (await element.getProperty('innerText')).jsonValue()).replace(/(\t\n|\n\n|\n\n\t|\t)/gm," splitHere ");
    playersAsStrings.push(playerText);
  }

  playersAsStrings.shift();

  playersAsStrings.forEach((player) => {
    splitPlayer = player.split(' splitHere ');
    splitPlayer.splice(3, 2);
    playersAsObjects.push(
      {
        rank: splitPlayer[0],
        name: splitPlayer[1],
        age: splitPlayer[2],
        value: splitPlayer[3],
      }
    );
  })

  
  browser.close();
  console.log('FantasyCalc Top 50: ', playersAsObjects);
}

function delay(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

module.exports.scrapeKTCRankings = scrapeKTCRankings;
module.exports.scrapeFantasyCalcRankings = scrapeFantasyCalcRankings;