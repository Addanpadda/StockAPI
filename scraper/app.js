const avanzaAPI = require('./avanza-api');
const db        = require('./database');
const logger    = require('./logger');
const log       = logger.log;


// Scrape an orderbookID
async function runScrape(orderbookID) {
    const stockTimeseries = await avanzaAPI.scrape(orderbookID);
    // Database removes duplicates anyway...
    //stockTimeseries.removeDuplicates();
    db.insertTimeseries(stockTimeseries);
}

// Scrape all stocks
async function runScapeCycle() {
    await handleNullStocks();
    // Get all the stocks' orderbookIDs that should be fetched, from the DB
    let orderbookIDs = await db.getActiveStocksOrderbookIDs();

    for(let i = 0; i < orderbookIDs.length; i++) {
        await runScrape(orderbookIDs[i]); // Await to only scrape on stock at the time to not throw avanza off
    }
}

// Continuous scraping
function startScheduledScraping() {
    runScapeCycle(); // Initial run
    setInterval(runScapeCycle, 1000 * 60 * 5); // Scrape every five minutes
}

// Callback that runs everytime a new stock
// is added in the DB, which fetches
// metadata and timeseries for the new stock
db.addStockChangeCallback(handleNullStocks);

async function handleNullStocks() {
    while (true) {
        let unfetchedStock = await db.getNullStocks();
        if (!unfetchedStock) break;
        let orderbookID;

        if (unfetchedStock.availableData == db.AVAILABLE_DATA.ORDERBOOKID) {
            orderbookID = unfetchedStock.value;
        } else if (unfetchedStock.availableData == db.AVAILABLE_DATA.TICKER) {
            orderbookID = await avanzaAPI.getOrderbookIDFromSearch(unfetchedStock.value);
            if(orderbookID == undefined) { // Remove stock from db if it couldnt be found
                log(logger.TYPE.ERROR, logger.SOURCE.SYSTEM, `orderbookID couldn't be resolved for ${unfetchedStock.value}`);
                db.removeTicker(unfetchedStock.value);
                return;
            }
        } else {
            break;
        }

        let stockData = await avanzaAPI.getStockData(orderbookID);

        // Check if passed ticker found matches the exact ticker passed
        if (unfetchedStock.availableData == db.AVAILABLE_DATA.TICKER &&
            unfetchedStock.value != stockData.ticker) {
                log(logger.TYPE.ERROR, logger.SOURCE.SYSTEM, `orderbookID couldn't be resolved for ${unfetchedStock.value}`);
                db.removeTicker(unfetchedStock.value);
                return;
            }

        db.addStockData(unfetchedStock, stockData);
        runScrape(orderbookID)
        //handleNullStock(orderbookID, unfetchedStock, stockData);
    }
}


// Scrape all stocks in DB 
// every five minutes, continuously
startScheduledScraping();