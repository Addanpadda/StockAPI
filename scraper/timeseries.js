
class value {
    constructor (open, close, low, high, timestamp, totalVolumeTraded) {
        this.open              = open;
        this.close             = close;
        this.low               = low;
        this.high              = high;
        this.timestamp         = timestamp;
        this.totalVolumeTraded = totalVolumeTraded
    }

    equals(obj) {
        if (this.timestamp.toLocaleString() === obj.timestamp.toLocaleString()) return true;
        else return false;
    }
}

class timeseries {
    #timeseriesList = [];

    constructor(orderBookID) {
        this.orderBookID = orderBookID;
    }

    log() {
        return JSON.stringify(this.#timeseriesList);
    }

    addValue(value) {
        this.#timeseriesList.push(value)
    }

    removeDuplicates() {
        for (let firstIndex = 0; firstIndex < this.#timeseriesList.length; firstIndex++) {
            
            for (let secondIndex = firstIndex + 1; secondIndex < this.#timeseriesList.length; secondIndex++) {
                if (this.#timeseriesList[firstIndex].equals(this.#timeseriesList[secondIndex])) {
                    this.#timeseriesList.splice(secondIndex, 1);
                    secondIndex--; // Compensate for the removed index

                }
            }
        }

        console.log("[+] Duplicates removed for " + this.orderBookID);
    }

    generateMariaDBBatch() {
        let data = [];

        for (let i = 0; i < this.#timeseriesList.length; i++) {
            data.push([
                this.orderBookID,
                this.#timeseriesList[i].timestamp.toLocaleString(),
                this.#timeseriesList[i].open,
                this.#timeseriesList[i].close,
                this.#timeseriesList[i].high,
                this.#timeseriesList[i].low,
                this.#timeseriesList[i].totalVolumeTraded,
            ])
        }

        return data;
    }
}

module.exports.value      = value;
module.exports.timeseries = timeseries;