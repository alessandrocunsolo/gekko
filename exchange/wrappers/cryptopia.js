import { calendarFormat } from 'moment';

const moment = require('moment');
const _ = require('lodash');
const Cryptopia = require('cryptopia');
const tradePairs = require('./cryptopia-tradepairs.json');
const retry = require('../exchangeUtils').retry;


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

    this.marketStr = this.market.pair[1] + "/"+this.market.pair[0];

    this.tradePair = this.asset + "_" + this.currency;


    this.cryptopiaClient = new Cryptopia(this.key, this.secret);
    this.tid = 0;
};

Trader.prototype.getTrades = function(since, callback, descending) {
    var self = this;

    function generateTid(data) {
        var amountStr = data.Amount.toString().replace('.', '');
        var totalStr = data.Total.toString().replace('.', '');
        var key = data.TradePairId + data.Type == "Buy" ? "1" : "0" + data.Timestamp + amountStr + totalStr;
        return key;
    };


    this.cryptopiaClient.getTrades(function(err, data) {
        if (err)
            return callback(err);
        if (data.Error != null)
            return callback(err);
        var pushedData = [];
        for (var i = 0; i < data.Data.length; i++) {
            pushedData.push({
                tid: generateTid(data.Data[i]),
                date: data.Data[i].Timestamp,
                price: data.Data[i].Price,
                amount: data.Data[i].Amount
            });
        }
        pushedData = pushedData.sort(function(a, b) {
            return a.date - b.date;
        });

        if (descending)
            callback(undefined, pushedData.reverse());
        else
            callback(undefined, pushedData);

    }, this.tradePair, 48);
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


Trader.prototype.getFee = function(callback) {
    callback(undefined,0.0002);
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

function submitOrder(type,amount, price, callback)
{
    var self = this;
    self.cryptopiaClient.submitTrade(function(err, data) {
        if (err)
            return callback(err);
        if (!data.Success)
            return callback(data.Error);
        //var order = {orderid:data.Data.OrderId};
        var order = data.Data;
        callback(undefined,order);
    },self.marketStr,undefined,type,price.toString(),amount.toString())
};


Trader.prototype.buy = function(amount, price, callback) {
    submitOrder("Buy",amount,price,callback);
};

Trader.prototype.sell = function(amount, price, callback) {
   submitOrder("Sell",amount,price,callback);
};

Trader.prototype.getOrder = function(order, callback) {
    var self = this;

    this.cryptopiaClient.getTradeHistory(function(err,result){
        if (err) 
            return callback(err);
        if (!result.Success)
            return callback(result.Error);
        var orderId = order.OrderId;
        var orders = data.Data.filter(o => {o.TradeId == orderId && o.Market == self.marketStr});

        return callback(undefined,{price : orders[0].Rate, amount: orders[0].Amount,date:moment(orders[0].Timestamp, moment.ISO_8601) })
    },this.marketStr,undefined,1000);
};

Trader.prototype.checkOrder = function(order, callback) {
    var self = this;
    this.cryptopiaClient.getOpenOrders(function(err,result){
        if (err) 
            return callback(err);
        if (!result.Success)
            return callback(result.Error);
        
        var orderId = order.OrderId;
        
        var orders = data.Data.filter(o => {o.OrderId == orderId && o.Market == self.marketStr});
        if (orders.length > 0)
        {
            if (orders[0].Remaining == orders[0].Amount)
                return callback(undefined,{
                    open:true,
                    executed:false,
                    filledAmount:0
                });
            else
                return callback(undefined,{
                    open:true,
                    executed:false,
                    filledAmount:(order[0].Amount - order[0].Remaining)
                });
        }else
        {
            return callback(undefined,{
                open:false,
                executed:true,
            });
        }


        
        
    },this.marketStr,undefined,100);
};

Trader.prototype.cancelOrder = function(order, callback) {
    this.cryptopiaClient.cancelTrade(function(err,result){
    if (err) 
        return callback(err);
    if (!result.Success)
        return callback(result.Error);
    
    return callback(undefined,false);
    },"Trade",order.OrderId)
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
        providesHistory: 'date',
        providesFullHistory: true,
        markets: markets,
        requires: ['key', 'secret', 'username'],
        fetchTimespan: null,
        tid: 'tid',
        gekkoBroker: '0.6.2',
        limitedCancelConfirmation: false
    };
};

module.exports = Trader;