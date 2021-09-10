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

    try {
        conn = await pool.getConnection();
        
        let query = await conn.query(`SELECT * FROM timeseries WHERE timestamp = (SELECT max(timestamp) FROM timeseries WHERE orderbookID = ${orderbookID}) AND orderbookID = ${orderbookID};`);
        console.log(JSON.stringify(query));
        data = {
            'ticker':    ticker,
            'timestamp': query[0].timestamp,
            'open':      query[0].open,
            'close':     query[0].close,
            'low':       query[0].low,
            'high':      query[0].high,
            'totalTradedVolume': query[0].totalTradedVolume
        }
    } catch(err) {
        if (conn) conn.release();
        throw err;
    } finally {
        conn.release();
        return data;
    }
}

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