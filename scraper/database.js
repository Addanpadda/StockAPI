const MySQLEvents = require('@rodrigogs/mysql-events');
const mysql = require('mysql');

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


module.exports.test = async function() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT name FROM test WHERE id=20");

        console.log(JSON.stringify(rows));
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release(); 
    }
}

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
        console.log("[+] Timeseries inserted in database for " + timeseries.orderBookID);
        if (conn) conn.release();
    }

}

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
      name: 'STOCK_CHANGE_TRIGGER',
      expression: `${process.env.DB_NAME}.stocks.*`,
      statement: MySQLEvents.STATEMENTS.ALL,
      //onEvent: callback, // When db changed, run callback
      onEvent: (event) => {console.log("DB Changed!!!")} // For test
    });
    
    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
    instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
}

async function setup() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("create TABLE timeseries (orderBookID SMALLINT, timestamp DATETIME NOT NULL, open SMALLINT UNSIGNED, close SMALLINT UNSIGNED, high SMALLINT UNSIGNED, low SMALLINT UNSIGNED, totalVolumeTraded SMALLINT UNSIGNED, CONSTRAINT definition PRIMARY KEY(orderBookID, timestamp));");
    } catch (err) {
        throw err;
    } finally {
        conn.release();
    }
}