const fetch           = require('node-fetch');
const timeseries      = require('./timeseries');

const APITimePeriods = ["today", "one_week", "one_month", "five_years", "infinity"];
const bestRes        = ["minute", "ten_minutes", "hour", "day", "week"];


const stockNotInDatabase = true;


module.exports.scrape = async function(orderbookID) {
    // Variable containing the stock timeseries data
    let stockTimeseries = new timeseries.timeseries(orderbookID);
    let res;

    try {
        for (let period = 0; period < APITimePeriods.length; period++) {
            res = await fetch(`https://www.avanza.se/_api/price-chart/stock/${orderbookID}?timePeriod=${APITimePeriods[period]}&resolution=${bestRes[period]}`);
            console.log("[+] Fetched " + `https://www.avanza.se/_api/price-chart/stock/${orderbookID}?timePeriod=${APITimePeriods[period]}&resolution=${bestRes[period]}`);
            const json       = await res.json();
            const timeseriesJSON = await json.ohlc;

            console.log(APITimePeriods[period] + " gave " + timeseriesJSON.length);

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
        console.err("[-] Error: " + err + "; JSON: " + JSON.stringify(res));
    } finally {
        console.log("[+] Scraped for " + orderbookID);
        //console.log(stockTimeseries.log());
    
        return stockTimeseries;
    }
}

module.exports.scrapeLast = async function(orderbookID) {
        const res        = await fetch(`https://www.avanza.se/_cqbe/guide/stock/${orderbookID}/top`);
        console.log("[+] Fetched " + `https://www.avanza.se/_cqbe/guide/stock/${orderbookID}/top`);
        const json       = await res.json();
        const timeseriesJSON = await json.quote;

        return new timeseries.value(
            open  = timeseriesJSON[i].open,
            close = timeseriesJSON[i].close,
            low   = timeseriesJSON[i].low,
            high  = timeseriesJSON[i].high,
            timestamp = new Date(timeseriesJSON[i].timestamp),
            totalVolumeTraded = timeseriesJSON[i].totalVolumeTraded
        );
}

module.exports.getStockMetaData = async function(query) {
    const res  = await fetch(`https://www.avanza.se/_cqbe/search/global-search/global-search-template?query=${query}`);
    const json = await res.json();
    const hit  = await json.resultGroups[0].hits[0];


    return new stock(
        name        = hit.link.linkDisplay,
        orderBookID = hit.link.orderbookId,
        currency    = hit.currency
    );
}

class stock {
    constructor(name, orderBookID, currency) {
        this.name        = name;
        this.orderBookID = orderBookID;
        this.currency    = currency;
    }
}