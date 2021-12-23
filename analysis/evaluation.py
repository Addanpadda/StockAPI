from app import *
from pyalgotrade import strategy
from pyalgotrade.barfeed import quandlfeed

from pyalgotrade.bar import Bar
from pyalgotrade.bar import BasicBar
from pyalgotrade.bar import Bars

from pyalgotrade.technical import ma

import datetime

'''
myBars = Bars({
    '_Bars__barDict': {
        'orcl': BasicBar(datetime.datetime(2000, 10, 10, 10, 20), 2, 2, 2, 2, 3, 2, 3),
    },
    '_Bars__dateTime': datetime.datetime(2000, 10, 10, 10, 20),
})

myBars = Bars({
    'orcl': BasicBar(datetime.datetime(2000, 10, 10, 10, 20), 2, 2, 2, 2, 3, 2, 3),
})
'''

class MyStrategy(strategy.BacktestingStrategy):
    def __init__(self, feed, instrument):
        super(MyStrategy, self).__init__(feed)
        self.__instrument = instrument

    def onBars(self, bars):
        bar = bars[self.__instrument]
        self.info(bar.getClose())

class MAStrategy(strategy.BacktestingStrategy):
    def __init__(self, feed, instrument, smaPeriod):
        super(MATwoStrategy, self).__init__(feed, 1000)
        self.__position = None
        self.__instrument = instrument
        # We'll use adjusted close values instead of regular close values.
        #self.setUseAdjustedValues(True)
        self.__sma = ma.SMA(feed[instrument].getPriceDataSeries(), smaPeriod)

    def onEnterOk(self, position):
        execInfo = position.getEntryOrder().getExecutionInfo()
        self.info("BUY at $%.2f" % (execInfo.getPrice()))

    def onEnterCanceled(self, position):
        self.__position = None

    def onExitOk(self, position):
        execInfo = position.getExitOrder().getExecutionInfo()
        self.info("SELL at $%.2f" % (execInfo.getPrice()))
        self.__position = None

    def onExitCanceled(self, position):
        # If the exit was canceled, re-submit it.
        self.__position.exitMarket()

    def onBars(self, bars):
        # Wait for enough bars to be available to calculate a SMA.
        if self.__sma[-1] is None:
            return

        bar = bars[self.__instrument]
        # If a position was not opened, check if we should enter a long position.
        if self.__position is None:
            if bar.getPrice() > self.__sma[-1]:
                # Enter a buy market order for 10 shares. The order is good till canceled.
                self.__position = self.enterLong(self.__instrument, 10, True)
        # Check if we have to exit the position.
        elif bar.getPrice() < self.__sma[-1] and not self.__position.exitActive():
            self.__position.exitMarket()



class MATwoStrategy(strategy.BacktestingStrategy):
    def __init__(self, feed, instrument, firstSmaPeriod, secondSmaPeriod):
        super(MATwoStrategy, self).__init__(feed, 1000)
        self.__position = None
        self.__instrument = instrument
        # We'll use adjusted close values instead of regular close values.
        #self.setUseAdjustedValues(True)
        self.__firstSma = ma.SMA(feed[instrument].getPriceDataSeries(), firstSmaPeriod)
        self.__secondSma = ma.SMA(feed[instrument].getPriceDataSeries(), secondSmaPeriod)

    def onEnterOk(self, position):
        execInfo = position.getEntryOrder().getExecutionInfo()
        self.info("BUY at $%.2f" % (execInfo.getPrice()))

    def onEnterCanceled(self, position):
        self.__position = None

    def onExitOk(self, position):
        execInfo = position.getExitOrder().getExecutionInfo()
        self.info("SELL at $%.2f" % (execInfo.getPrice()))
        self.__position = None

    def onExitCanceled(self, position):
        # If the exit was canceled, re-submit it.
        self.__position.exitMarket()

    def onBars(self, bars):
        # Wait for enough bars to be available to calculate a SMA.
        if self.__firstSma[-1] is None or self.__secondSma[-1] is None:
            return

        bar = bars[self.__instrument]
        # If a position was not opened, check if we should enter a long position.
        if self.__position is None:
            if self.__firstSma[-1] > self.__secondSma[-1]:
                # Enter a buy market order for 10 shares. The order is good till canceled. # int((self.getBroker().getEquity()/bar.getPrice()))
                nShares = int((self.getBroker().getEquity()/bar.getPrice()))
                if nShares == 0:
                    nShares = 1
                self.__position = self.enterLong(self.__instrument, nShares, True)
        # Check if we have to exit the position.
        elif self.__firstSma[-1] < self.__secondSma[-1] and not self.__position.exitActive():
            self.__position.exitMarket()





# Load the bar feed from the CSV file
#csvfeed = quandlfeed.Feed()
#csvfeed.addBarsFromCSV("orcl", "WIKI-ORCL-2000-quandl.csv")


feed = quandlfeed.Feed()
feed.addBarsFromSequence('orcl', [
    BasicBar(datetime.datetime(2000, 10, 10, 10, 20), 2, 2, 2, 2, 3, 2, 3),
    BasicBar(datetime.datetime(2000, 10, 11, 10, 20), 2, 2, 2, 2, 3, 2, 3),
    BasicBar(datetime.datetime(2000, 10, 12, 10, 20), 2, 2, 2, 2, 3, 2, 3),
    BasicBar(datetime.datetime(2000, 10, 13, 10, 20), 2, 2, 2, 2, 3, 2, 3),
    BasicBar(datetime.datetime(2000, 10, 14, 10, 20), 2, 2, 2, 2, 3, 2, 3),
    BasicBar(datetime.datetime(2000, 10, 15, 10, 20), 2, 2, 2, 2, 3, 2, 3),
])

#csvfeed.getNextBars().getDict()




#print(db.getActiveStocks()[0].ticker)
dbfeed = db.getPyAlgoTradeFeed()


# Evaluate the strategy with the feed's bars.
#myStrategy = MyStrategy(feed, 'orcl')
#myStrategy.run()
#print(feed.getCurrentBars().__dict__['_Bars__barDict']['orcl'].getClose())


'''
portfolio = dict()

for i in range(10, 30, 1):
    dbfeed = db.getPyAlgoTradeFeed()
    strategy = MATwoStrategy(dbfeed, 'ABLI', i, 40)
    strategy.run()
    portfolio[i] = strategy.getBroker().getEquity()


for i in range(10, 30, 1):
    print("Final portfolio value with MA {} : {}".format(i, portfolio[i]))
'''


'''
portfolio = dict()

for fi in range(20, 60, 3):
    portfolio[fi] = dict()
    for si in range(40, 150, 3):
        if fi >= si:
            continue
        dbfeed = db.getPyAlgoTradeFeed()
        strategy = MATwoStrategy(dbfeed, 'ABLI', fi, si)
        strategy.run()
        portfolio[fi][si] = strategy.getBroker().getEquity()


for fi in range(20, 60, 3):
    for si in range(40, 150, 3):
        if fi >= si:
            continue
        print("Final portfolio value with MA {};{} : {}".format(fi, si, portfolio[fi][si]))
'''

'''
fullStocks = db.getFullActiveStocks()
res = []
cash = 0

for stock in fullStocks:
    dbfeed = stock.getFeed()
    strategy = MATwoStrategy(dbfeed, stock.ticker, 20, 40)
    strategy.run()
    end = strategy.getBroker().getEquity()
    res.append("Final portfolio value with MA 20;40 at stock {} : {}".format(stock.ticker, end))

    cash += end

cash /= len(fullStocks)

for msg in res:
    print(msg)

print("Cash balance is {}".format(cash))
'''

fullStocks = db.getFullActiveStocks()


for stock in fullStocks:
    if stock.ticker == 'AMZN':
        useStock = stock
        break

portfolio = dict()

for fi in range(20, 60, 3):
    portfolio[fi] = dict()
    for si in range(60, 150, 3):
        if fi >= si:
            continue
        dbfeed = useStock.getFeed()
        strategy = MATwoStrategy(dbfeed, 'AMZN', fi, si)
        strategy.run()
        portfolio[fi][si] = strategy.getBroker().getEquity()


for fi in range(20, 60, 3):
    for si in range(60, 150, 3):
        if fi >= si:
            continue
        print("Final portfolio value with MA {};{} : {}".format(fi, si, portfolio[fi][si]))