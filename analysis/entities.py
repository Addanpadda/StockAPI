
class Timeseries:
    def __init__(self):
        self.timedata = []

class Stock:
    def __init__(self, ticker, orderbookID):
        self.ticker = ticker
        self.orderbookID = orderbookID
        self.timeseries: Timeseries = None
