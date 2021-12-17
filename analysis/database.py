
import sys
import mariadb
from datetime import datetime
from entities import *

from pyalgotrade.barfeed import quandlfeed


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

    def getFullActiveStocks(self):
        pass
    
    def getStockTimeseries(self):
        pass

class IStockAPIEvalutationDatabase(IStockAPIDatabase):
    def getPyAlgoTradeFeed(self):
        pass
 
class Database(MariaDBDatabase, IStockAPIEvalutationDatabase):
    def getActiveStocks(self) -> list:
        cur = self.query("SELECT ticker,orderbookID FROM stocks WHERE active=true;", None)
        stocks = []
        for ticker,orderbookID in cur:
            stocks.append(Stock(ticker, orderbookID))
        return stocks

    def getFullActiveStocks(self):
        stocks = self.getActiveStocks()
        fullStocks = []

        for i in range(0, len(stocks)):
            fullStock = FullStock(stocks[i].ticker, stocks[i].orderbookID)
            print(stocks[i].orderbookID)
            cur = self.query('SELECT timestamp,open,close,high,low,totalVolumeTraded FROM timeseries WHERE orderBookID=? AND cast(timestamp as time)="00:00:00";', (stocks[i].orderbookID, ))
            
            for timestamp, open_, close, high, low, totalVolumeTraded in cur:
                #d = datetime(int(timestamp[0:4]), int(timestamp[5:7]), int(timestamp[8:10]))
                if open_ > high:
                    high = open_
                if low > open_:
                    low = open_
                if close > high:
                    high = close
                if low > close:
                    low = close
                value = Value(timestamp, open_, close, high, low, totalVolumeTraded)
                fullStock.timeseries.addValue(value)

            fullStocks.append(fullStock)

        return fullStocks

    def getPyAlgoTradeFeed(self):
        fullStocks = self.getFullActiveStocks()
        feed = quandlfeed.Feed()

        '''
        for stock in fullStocks:
            #print("Ticker: ", fullStocks[0].ticker)
            #print("Bars: ", fullStocks[0].timeseries.getPyAlgoTradeBars())
            print('Adding to feed ', stock.ticker)
            feed.addBarsFromSequence(stock.ticker, stock.timeseries.getPyAlgoTradeBars())
        '''
        
        stock = fullStocks[0]
        print('Adding to feed ', stock.ticker)
        feed.addBarsFromSequence(stock.ticker, stock.timeseries.getPyAlgoTradeBars())


        return feed

    def getStockTimeseries(self):
        cur = self.query("SELECT ticker,orderbookID FROM stocks WHERE active=true;", None)
        stocks = []
        for ticker,orderbookID in cur:
            stocks.append(Stock(ticker, orderbookID))
        return stocks
