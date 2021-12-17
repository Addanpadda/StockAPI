from pyalgotrade.bar import BasicBar
from pyalgotrade.bar import Frequency

class Value:
    def __init__(self, dateTime, open_, close, high, low, volume):
        self.dateTime = dateTime
        self.open_ = float(open_)
        self.high = float(high)
        self.low = float(low)
        self.close = float(close)
        self.volume = volume
        self.adjClose = None

class Timeseries:
    def __init__(self):
        self.timedata = []

    def addValue(self, value: Value):
        self.timedata.append(value)

    def getPyAlgoTradeBars(self):
        pyAlgoTradeBars = []
        for value in self.timedata:
            pyAlgoTradeBars.append(BasicBar(value.dateTime, value.open_, value.high, value.low, value.close, value.volume, value.close, Frequency.DAY))
        
        return pyAlgoTradeBars

class Stock:
    def __init__(self, ticker, orderbookID):
        self.ticker = ticker
        self.orderbookID = orderbookID

class FullStock:
    def __init__(self, ticker, orderbookID):
        self.ticker = ticker
        self.orderbookID = orderbookID
        self.timeseries = Timeseries()