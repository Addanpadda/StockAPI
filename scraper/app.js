const avanzaAPI     = require('./avanza-api');
const db            = require('./database');

const orderbookID    = 3986; // Amazon



async function runScapeCycle() {
    const stockTimeseries = await avanzaAPI.scrape(orderbookID);
    stockTimeseries.removeDuplicates();
    db.insertTimeseries(stockTimeseries);
}

function startScheduledScraping() {
    runScapeCycle(); // Initial run
    setInterval(runScapeCycle, 1000 * 60 * 5);  // Scrape every five minutes
}


startScheduledScraping();