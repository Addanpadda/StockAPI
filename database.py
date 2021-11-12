import sys
import mariadb

class Credentials:
    def __init__(self, host, user, password, database):
        self.host = host
        self.user = user
        self.password = password
        self.database = database

class IDatabase:
    def query():
        pass

    def connect():
        pass

class MariaDBDatabase(IDatabase):
    def __init__(self, cred: Credentials):
        self.connect(cred)

    def query(self, q, extras):
        self.cur.execute(q, extras)
        return self.cur

    def connect(self, cred: Credentials):
        try:
            conn = mariadb.connect(
                user=cred.user,
                password=cred.password,
                host=cred.host,
                port=3306,
                database=cred.database
            )
            print('Successfully connected to database!')
        except mariadb.Error as e:
            print(f"Error connecting to MariaDB Platform: {e}")
            sys.exit(1)

        self.cur = conn.cursor()

class IStockAPIDatabase():
    def getActiveStocks(self):
        pass

    def getStockTimeseries(self):
        pass

class Database(MariaDBDatabase, IStockAPIDatabase):
    def getActiveStocks(self) -> list:
        cur = self.query("SELECT ticker,orderbookID FROM stocks WHERE active=true;", None)
        stocks = []
        for ticker,orderbookID in cur:
            stocks.append(Stock(ticker, orderbookID))
        return stocks

    def getStockTimeseries(self):
        cur = self.query("SELECT ticker,orderbookID FROM stocks WHERE active=true;", None)
        stocks = []
        for ticker,orderbookID in cur:
            stocks.append(Stock(ticker, orderbookID))
        return stocks
