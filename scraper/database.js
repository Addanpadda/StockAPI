const MySQLEvents = require('@rodrigogs/mysql-events');
const mysql = require('mysql');
const logger     = require('./logger');
const log        = logger.log;

// mariadb package supports bulk insertion, the but mysql
// package is required by mysql-events.
const mariadb = require('mariadb'); 
const pool    = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME, 
    connectionLimit: 5
});

// Connection to db, used only for monitoring changes in the stock table
let stockChangeConn;


// Insert a whole timeseries of a stock in the DB
module.exports.insertTimeseries = async function(timeseries) {
    let conn;
    try {
        conn = await pool.getConnection();
    } catch(err) {
        if (conn) conn.release();
        throw err;
    }

    conn.beginTransaction();
    try {
        conn.batch("INSERT IGNORE INTO timeseries(orderBookID, timestamp, open, close, high, low, totalVolumeTraded) VALUES(?, ?, ?, ?, ?, ?, ?)",
            timeseries.generateMariaDBBatch()
        );
        conn.commit();
    } catch(err) {
        conn.rollback();
        throw(err);
    } finally {
        log(logger.TYPE.INFO, logger.SOURCE.DB, "Timeseries inserted in database for " + timeseries.orderBookID);
        if (conn) conn.release();
    }

}

// Get stock from DB where the metadata
// isn't set already (when new stocks are added)
module.exports.getNullStocks = async function() {
    let conn;
    let stockData;

    try {
        conn = await pool.getConnection();
        let res  = await conn.query('SELECT ticker,orderbookID FROM stocks WHERE orderbookID IS NULL OR ticker IS NULL;');

        if(res[0].orderbookID != null) {
            stockData = new StockIdentifier(AVAILABLE_DATA.ORDERBOOKID, res[0].orderbookID);
        } else if (res[0].ticker != null) {
            stockData = new StockIdentifier(AVAILABLE_DATA.TICKER, res[0].ticker);
        } else {
            stockData = new StockIdentifier(AVAILABLE_DATA.NONE, null);
        }
    } catch(err) {
        if(conn) conn.release();
        throw err;
    } finally {
        conn.release();
        return stockData;
    }
}

// Get all stocks in the DB that is market
// as active and is therefore meant to be processed
module.exports.getActiveStocksOrderbookIDs = async function() {
    let conn;
    let orderbookIDs = [];
    
    try {
        conn = await pool.getConnection();
        let res = await conn.query('SELECT orderbookID FROM stocks WHERE active IS TRUE');
        for(let i = 0; i < res.length; i++) orderbookIDs.push(res[i].orderbookID)
    } catch(err) {
        if(conn) conn.release();
        throw err;
    } finally {
        conn.release();
        return orderbookIDs;
    }

}

module.exports.test = async function() {
    let conn;
    let stockData;

    try {
        conn = await pool.getConnection();
        let res  = await conn.query('SELECT ticker,orderbookID FROM stocks WHERE orderbookID IS NULL OR ticker IS NULL;');
        console.log(res[0]);
    } catch(err) {
        if(conn) conn.release();
        throw err;
    } finally {
        conn.release();
        return stockData;
    }
}

// Adds the stock metadata
module.exports.addStockData = async function(stockIdentifier, stockData) {
    let conn;

    log(logger.TYPE.DEGUB, logger.SOURCE.DB, JSON.stringify(stockData));
    log(logger.TYPE.DEGUB, logger.SOURCE.DB, JSON.stringify(stockIdentifier));

    try {
        conn = await pool.getConnection();

        if (stockIdentifier.availableData == AVAILABLE_DATA.ORDERBOOKID) {
            await conn.query('UPDATE stocks SET ticker=?,name=?,currency=?,countryCode=?,marketPlaceName=?,volatility=?,numberOfOwners=?,beta=?,priceEarningsRatio=?,priceSalesRatio=?,marketCapital=?,equityPerShare=?,turnoverPerShare=?,earningsPerShare=? WHERE orderbookID=?;', [
                stockData.ticker,
                stockData.name,
                stockData.currency,
                stockData.countryCode,
                stockData.marketPlaceName,
                stockData.volatility,
                stockData.numberOfOwners,
                stockData.beta,
                stockData.priceEarningsRatio,
                stockData.priceSalesRatio,
                stockData.marketCapital,
                stockData.equityPerShare,
                stockData.turnoverPerShare,
                stockData.earningsPerShare,
                stockData.orderbookID,

            ]);
        } else if (stockIdentifier.availableData == AVAILABLE_DATA.TICKER) {
            await conn.query('UPDATE stocks SET orderbookID=?,name=?,currency=?,countryCode=?,marketPlaceName=?,volatility=?,numberOfOwners=?,beta=?,priceEarningsRatio=?,priceSalesRatio=?,marketCapital=?,equityPerShare=?,turnoverPerShare=?,earningsPerShare=? WHERE ticker=?;', [
                stockData.orderbookID,
                stockData.name,
                stockData.currency,
                stockData.countryCode,
                stockData.marketPlaceName,
                stockData.volatility,
                stockData.numberOfOwners,
                stockData.beta,
                stockData.priceEarningsRatio,
                stockData.priceSalesRatio,
                stockData.marketCapital,
                stockData.equityPerShare,
                stockData.turnoverPerShare,
                stockData.earningsPerShare,
                stockData.ticker,

            ]);
        } 
    } catch(err) {
        if(conn) conn.release();
        throw err;
    } finally {
        conn.release();
    }
}

module.exports.removeTicker = async function(ticker) {
    let conn;

    try {
        conn = await pool.getConnection();
        conn.query('DELETE FROM stocks WHERE ticker=?', ticker);
    } catch(err) {
        if(conn) conn.release();
        throw err;
    } finally {
        conn.release();
    }
}

// Add an own callback for when a new stock
// is added in the database
module.exports.addStockChangeCallback = async function(callback) {
    try {
        stockChangeConn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
          });
    } catch(err) {
        throw err;
    }


    const instance = new MySQLEvents(stockChangeConn, {
        startAtEnd: true,
        excludedSchemas: {
          mysql: false,
        },
      });

    await instance.start();

    instance.addTrigger({
      name: 'STOCK_INSERT_TRIGGER',
      expression: `${process.env.DB_NAME}.stocks.*`,
      statement: MySQLEvents.STATEMENTS.INSERT,
      onEvent: callback,
    });
    
    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
    instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
}

// Supposed to be for autosetup
async function setup() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("CREATE TABLE timeseries (orderBookID SMALLINT, timestamp DATETIME NOT NULL, open SMALLINT UNSIGNED, close SMALLINT UNSIGNED, high SMALLINT UNSIGNED, low SMALLINT UNSIGNED, totalVolumeTraded SMALLINT UNSIGNED, CONSTRAINT definition PRIMARY KEY(orderBookID, timestamp));CREATE TABLE stocks (ticker VARCHAR(6), orderbookID SMALLINT, currency VARCHAR(6), countryCode VARCHAR(3), marketPlaceName VARCHAR(30), volatility DECIMAL(4,4), numberOfOwners SMALLINT, beta DECIMAL(4,4), priceEarningsRatio DECIMAL(6,2), priceSalesRatio DECIMAL(6,2), marketCapital INT, equityPerShare DECIMAL(6,2), turnoverPerShare DECIMAL(6,2), earningsPerShare DECIMAL(6,2), active BOOLEAN);");
    } catch (err) {
        throw err;
    } finally {
        conn.release();
    }
}

const AVAILABLE_DATA = {
    TICKER: 'ticker',
    ORDERBOOKID: 'orderbookID',
    NONE: 'none'
};
module.exports.AVAILABLE_DATA = AVAILABLE_DATA;


class StockIdentifier { // StockIdentifier
    constructor(availableData, value) {
        this.availableData = availableData;
        this.value = value;
    }
}
module.exports.StockData = StockIdentifier;