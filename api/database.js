const { query } = require('express');
const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME, 
    connectionLimit: 50
});

module.exports.top = async function(ticker) {
    let conn;
    let data;

    //ticker = ticker.toUpperCase();
    let orderbookID = await getOrderbookIDFromTicker(ticker);
    if(orderbookID == undefined) {
        return {
            'status': STOCK_FETCH_STATUS.NOT_FOUND
        };
    }
    try {
        conn = await pool.getConnection();
        let res = await conn.query(`SELECT * FROM timeseries WHERE timestamp = (SELECT max(timestamp) FROM timeseries WHERE orderbookID = ${orderbookID}) AND orderbookID = ${orderbookID};`);
        console.log(`[+] TOP done for orderbookID ${orderbookID}`);

        data = {
            'status': STOCK_FETCH_STATUS.OK,
            'ticker':    ticker,
            'timestamp': res[0].timestamp,
            'open':      res[0].open,
            'close':     res[0].close,
            'low':       res[0].low,
            'high':      res[0].high,
            'totalTradedVolume': res[0].totalTradedVolume
        }
    } catch(err) {
        if (conn) conn.release();
        throw err;
    } finally {
        conn.release();
        return data;
    }
}

module.exports.timeseries = async function(ticker, timeperiod) {
    let conn;
    let data;

    //ticker = ticker.toUpperCase();
    let orderbookID = await getOrderbookIDFromTicker(ticker);
    if(orderbookID == undefined) {
        return {
            'status': STOCK_FETCH_STATUS.NOT_FOUND
        };
    }
    try {
        conn = await pool.getConnection();
        
        let res = await conn.query(`SELECT * FROM timeseries WHERE timestamp = (SELECT max(timestamp) FROM timeseries WHERE orderbookID = ${orderbookID}) AND orderbookID = ${orderbookID};`);
        console.log(`[+] TOP done for orderbookID ${orderbookID}`);

        data = {
            'status': STOCK_FETCH_STATUS.OK,
            'ticker':    ticker,
            'timestamp': res[0].timestamp,
            'open':      res[0].open,
            'close':     res[0].close,
            'low':       res[0].low,
            'high':      res[0].high,
            'totalTradedVolume': res[0].totalTradedVolume
        }
    } catch(err) {
        if (conn) conn.release();
        throw err;
    } finally {
        conn.release();
        return data;
    }
}

const STOCK_FETCH_STATUS = {
    OK: 'OK',
    NOT_FOUND: 'NOT_FOUND',
};

const STOCK_FETCH_TIMEPERIOD = {
    WEEK: 'WEEK',
};

async function getOrderbookIDFromTicker(ticker) {
    let conn;
    let orderbookID;

    try {
        conn = await pool.getConnection();

        let query = await conn.query(`SELECT orderbookID FROM stocks WHERE ticker = "${ticker}"`);
        orderbookID = query[0].orderbookID;
    } catch(err) {
        if (conn) conn.release();
        throw err;
    } finally {
        conn.release();
        return orderbookID;
    }
}