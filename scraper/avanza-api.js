const fetch      = require('node-fetch');
const timeseries = require('./timeseries');
const logger     = require('./logger');
const log        = logger.log;

// Specific values for the avanza api on charts
const APITimePeriods = ["today", "one_week", "one_month", "five_years", "infinity"];
const bestRes        = ["minute", "ten_minutes", "hour", "day", "week"];


async function fetchJSON(url) {
    const res  = await fetch(url);
    const json = res.json();

    return json;
}

// Scrapes a stock's timeseries data
module.exports.scrape = async function(orderbookID) {
    // Variable containing the stock timeseries data
    let stockTimeseries = new timeseries.timeseries(orderbookID);

    try {
        // Scrape for all the time periods of a chart
        for (let period = 0; period < APITimePeriods.length; period++) {
            let json = await fetchJSON(`https://www.avanza.se/_api/price-chart/stock/${orderbookID}?timePeriod=${APITimePeriods[period]}&resolution=${bestRes[period]}`);
            log(logger.TYPE.INFO, logger.SOURCE.API, "Fetched " + `https://www.avanza.se/_api/price-chart/stock/${orderbookID}?timePeriod=${APITimePeriods[period]}&resolution=${bestRes[period]}`);
            const timeseriesJSON = await json.ohlc;

            log(logger.TYPE.INFO, logger.SOURCE.API, 'Timeperiod ' + APITimePeriods[period] + ' gave ' + timeseriesJSON.length + ' results for ' + orderbookID);

            // Add all the individual values (for each time period)
            // in the stockTimeseries variable
            for (let i = 0; i < timeseriesJSON.length; i++) {
                stockTimeseries.addValue(new timeseries.value(
                    open  = timeseriesJSON[i].open,
                    close = timeseriesJSON[i].close,
                    low   = timeseriesJSON[i].low,
                    high  = timeseriesJSON[i].high,
                    timestamp = new Date(timeseriesJSON[i].timestamp),
                    totalVolumeTraded = timeseriesJSON[i].totalVolumeTraded
                ));
            }
        }
    } catch(err) {
        throw err;
    } finally {
        log(logger.TYPE.INFO, logger.SOURCE.API, "Scraped for " + orderbookID);    
        return stockTimeseries;
    }
}

// Experimental option
module.exports.scrapeLast = async function(orderbookID) {
        const json           = await fetchJSON(`https://www.avanza.se/_cqbe/guide/stock/${orderbookID}/top`);
        const timeseriesJSON = await json.quote;
        log(logger.TYPE.INFO, logger.SOURCE.API, "Fetched " + `https://www.avanza.se/_cqbe/guide/stock/${orderbookID}/top`);

        return new timeseries.value(
            open  = timeseriesJSON[i].open,
            close = timeseriesJSON[i].close,
            low   = timeseriesJSON[i].low,
            high  = timeseriesJSON[i].high,
            timestamp = new Date(timeseriesJSON[i].timestamp),
            totalVolumeTraded = timeseriesJSON[i].totalVolumeTraded
        );
}

// Fetches a orderbookID from a query
module.exports.getOrderbookIDFromSearch = async function(query) {
    let orderbookID;

    try {
        const json  = await fetchJSON(`https://www.avanza.se/_cqbe/search/global-search/global-search-template?query=${query}`);
        orderbookID = json.resultGroups[0].hits[0].link.orderbookId;
    } catch(err) {
        throw err;
    } finally {
        log(logger.TYPE.INFO, logger.SOURCE.API, `${query} was found as orderbookID ${orderbookID}`);
        return orderbookID;
    }
}

// Fetches surounding data about a stock
module.exports.getStockData = async function(orderbookID) {
    const json  = await fetchJSON(`https://www.avanza.se/_cqbe/guide/stock/${orderbookID}/top`);

    log(logger.TYPE.DEGUB, logger.SOURCE.API, JSON.stringify(json));
    
    return new StockData (
        ticker             = json.listing.tickerSymbol,
        orderbookID        = json.orderbookId,
        name               = json.name,
        currency           = json.listing.currency,
        countryCode        = json.listing.countryCode,
        marketPlaceName    = json.listing.marketPlaceName,
        volatility         = json.keyIndicators.volatility,
        numberOfOwners     = json.keyIndicators.numberOfOwners,
        // These are optional, hence the validation
        beta               = json.keyIndicators.beta               ? json.keyIndicators.beta : null,
        priceEarningsRatio = json.keyIndicators.priceEarningsRatio ? json.keyIndicators.priceEarningsRatio : null,
        priceSalesRatio    = json.keyIndicators.priceSalesRatio    ? json.keyIndicators.priceSalesRatio : null,
        marketCapital      = json.keyIndicators.marketCapital      ? json.keyIndicators.marketCapital.value : null,
        equityPerShare     = json.keyIndicators.equityPerShare     ? json.keyIndicators.equityPerShare.value : null,
        turnoverPerShare   = json.keyIndicators.turnoverPerShare   ? json.keyIndicators.turnoverPerShare.value : null,
        earningsPerShare   = json.keyIndicators.earningsPerShare   ? json.keyIndicators.earningsPerShare.value : null,
    );
}

// Datastructure of the StockData return type
class StockData {
    constructor(ticker, orderbookID, name, currency, countryCode, marketPlaceName, volatility, numberOfOwners, beta, priceEarningsRatio, priceSalesRatio, equityPerShare, turnoverPerShare, earningsPerShare) {
        this.ticker             = ticker;
        this.orderbookID        = orderbookID;
        this.name               = name;
        this.currency           = currency;
        this.countryCode        = countryCode;
        this.marketPlaceName    = marketPlaceName;
        this.volatility         = volatility || null;
        this.numberOfOwners     = numberOfOwners;
        this.beta               = beta;
        this.priceEarningsRatio = priceEarningsRatio;
        this.priceSalesRatio    = priceSalesRatio;
        this.marketCapital      = marketCapital;
        this.equityPerShare     = equityPerShare;
        this.turnoverPerShare   = turnoverPerShare;
        this.earningsPerShare   = earningsPerShare;
    }
}