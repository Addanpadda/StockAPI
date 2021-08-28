const mariadb = require('mariadb');
const pool    = mariadb.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME, 
    connectionLimit: 5
});

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

async function setup() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("create TABLE timeseries (orderBookID SMALLINT NOT NULL, timestamp DATETIME NOT NULL, open DECIMAL(6, 1) UNSIGNED, close DECIMAL(6, 1) UNSIGNED, high DECIMAL(6, 1) UNSIGNED, low DECIMAL(6, 1) UNSIGNED, totalVolumeTraded INT UNSIGNED);");
    } catch (err) {
        throw err;
    } finally {
        conn.release();
    }
}