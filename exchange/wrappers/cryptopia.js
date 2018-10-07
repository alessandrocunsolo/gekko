const moment = require('moment');
const _ = require('lodash');
const Cryptopia = require('cryptopia');
const tradePairs = require('./cryptopia-tradepairs.json');
const retry = require('../exchangeUtils').retry;

//const marketData = require('./kraken-markets.json');

const Trader = function(config) {
    //_.bindAll(this);

    if (_.isObject(config)) {
        this.key = config.key;
        this.secret = config.secret;
        this.currency = config.currency.toUpperCase()
        this.asset = config.asset.toUpperCase();
    }

    this.name = 'cryptopia';
    this.since = null;
    this.market = _.find(Trader.getCapabilities().markets, (market) => {
        return market.pair[0] === this.currency && market.pair[1] === this.asset
    });
    this.tradePair = this.asset + "_" + this.currency;

    this.cryptopiaClient = new Cryptopia(this.key, this.secret);
    this.tid = 0;
};
//TODO: Implement
Trader.prototype.getTrades = function(since, callback, descending) {
    var self = this;
    this.cryptopiaClient.getTrades(function(err, data) {
        console.log(data);
        if (err)
            return callback(err);
        if (data.Error != null)
            return callback(err);
        var pushedData = [];
        for (var i = 0; i < data.Data.length; i++) {
            pushedData.push({
                tid: self.tid++,
                date: data.Data[i].Timestamp,
                price: data.Data[i].Price,
                amount: data.Data[i].Amount
            });
        }
        pushedData = pushedData.sort(function(a, b) {
            return a.Timestamp - b.Timestamp;
        });

        console.log(pushedData);
        if (descending)
            callback(undefined, pushedData.reverse());
        else
            callback(undefined, pushedData.reverse());

    }, this.tradePair, 24);
};
Trader.prototype.getPortfolio = function(callback) {
    this.cryptopiaClient.getBalance(function(err, data) {
        //Symbol
        //Available
        if (err)
            return callback(err);

        var assetAmount = _.find(d.Data, item => item.Symbol == this.asset).Available;
        if (!_.isNumber(assetAmount) || _.isNaN(assetAmount)) {
            assetAmount = 0;
        }

        var currencyAmount = _.find(d.Data, item => item.Symbol == this.currency).Available;
        if (!_.isNumber(currencyAmount) || _.isNaN(currencyAmount)) {
            currencyAmount = 0;
        }

        var portfoglio = [
            { name: this.asset, amount: assetAmount },
            { name: this.currency, amount: currencyAmount },
        ];

        callback(undefined, portfoglio);
    });
};

//TODO: implement

Trader.prototype.getFee = function(callback) {

};


Trader.prototype.getTicker = function(callback) {
    this.cryptopiaClient.getTicker(function(err, data) {
        if (err) {
            return callback(err);
        }

        var ticker = {
            ask: data.AskPrice,
            bid: data.BidPrice
        };
        callback(undefined, ticker);

    }, this.tradePair);
};
Trader.prototype.getPrecision = function(tickSize) {

};

Trader.prototype.round = function(amount, tickSize) {

};

Trader.prototype.scientificToDecimal = function(num) {

};

Trader.prototype.roundPrice = function(rawPrice) {

};

Trader.prototype.roundAmount = function(amount) {

};

Trader.prototype.getLotSize = function(tradeType, amount, size, callback) {

};

Trader.prototype.buy = function(amount, price, callback) {

};

Trader.prototype.sell = function(amount, price, callback) {

};

Trader.prototype.getOrder = function(order, callback) {

};

Trader.prototype.checkOrder = function(order, callback) {

};

Trader.prototype.cancelOrder = function(order, callback) {

};

Trader.prototype.isValidPrice = function(price) {

};

Trader.prototype.isValidLot = function(price, amount) {

};

Trader.getCapabilities = function() {

    var assets = tradePairs.Data.map(item => {
        return item.Symbol;
    })

    //assets = assets.filter((v, i, a) => a.indexOf(v) === i);

    assets = assets.sort();

    var markets = tradePairs.Data.map(item => {
        var pair = item.Label.split('/');
        pair = pair.reverse();
        return { pair: pair, minimalOrder: { amount: item.MinimumBaseTrade, unit: 'currency' } };
    });

    return {
        name: 'Cryptopia',
        slug: 'cryptopia',
        currencies: ['BTC', 'USDT', 'NZDT', 'LTC', 'DOGE'],
        assets: assets,
        maxTradesAge: 60,
        maxHistoryFetch: null,
        markets: markets,
        requires: ['key', 'secret', 'username'],
        fetchTimespan: 60,
        tid: 'tid',
        gekkoBroker: '0.6.2',
        limitedCancelConfirmation: false
    };
};

module.exports = Trader;