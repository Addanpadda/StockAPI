# StockAPI
Tool for scraping and analysing stock data in the form of an API.

# Quick start
Export variables
`export DB_HOST=127.0.0.1 && export DB_NAME=stock_api && export DB_USER=root && export DB_PASSWORD=adam && export PORT=3000 && export DEBUG=TRUE`

Create the mariadb database and tables
`CREATE DATABASE stock_api;`
`USE stock_api;`
`CREATE TABLE timeseries (orderBookID MEDIUMINT, timestamp DATETIME NOT NULL, open DECIMAL(8, 4) UNSIGNED, close DECIMAL(8, 4) UNSIGNED, high DECIMAL(8, 4) UNSIGNED, low DECIMAL(8, 4) UNSIGNED, totalVolumeTraded SMALLINT UNSIGNED, CONSTRAINT definition PRIMARY KEY(orderBookID, timestamp));`
`CREATE TABLE stocks (ticker VARCHAR(16), orderbookID MEDIUMINT, name VARCHAR(64), currency VARCHAR(6), countryCode VARCHAR(3), marketPlaceName VARCHAR(30), volatility DECIMAL(5,4), numberOfOwners SMALLINT, beta DECIMAL(5,4), priceEarningsRatio DECIMAL(7,2), priceSalesRatio DECIMAL(8,2), marketCapital DECIMAL(18,1), equityPerShare DECIMAL(18,1), turnoverPerShare DECIMAL(6,2), earningsPerShare DECIMAL(6,2), active BOOLEAN);`

# Scraper references
https://www.npmjs.com/package/node-fetch
https://www.npmjs.com/package/@rodrigogs/mysql-events
https://www.npmjs.com/package/mariadb

# Analasis references
https://mariadb.com/resources/blog/how-to-connect-python-programs-to-mariadb/

# Clean code
https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
