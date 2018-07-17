// Express Init
var express = require("express");
var app = express();
var allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
};
app.use(allowCrossDomain);

// Mongo Init
var ObjectId = require("mongodb").ObjectID;
var MongoClient = require("mongodb").MongoClient;
var dbo;

// Config MongoDB
var url = "mongodb://localhost:27017";
var dbName = "EOStest";
var listLimit = 10;

// Config api endpoint
const apiPort = "4001";
const apiIP = "0.0.0.0";

var data = [
    {
        "baseName": "accounts",
        "tableName": "Accounts"
    },
    {
        "baseName": "blocks",
        "tableName": "Blocks"
    },
    {
        "baseName": "transactions",
        "tableName": "Transactions"
    },
    {
        "baseName": "messages",
        "tableName": "Messages"
    }
];


MongoClient.connect(url, true, function (err, db) {
    if (err) {
        throw err;
    }
    dbo = db.db(dbName);
    app.listen(apiPort, apiIP, function () {
        console.log("Example app listening on port ", apiPort);
    });
});

app.get("/", function (req, res) {
    res.send("EOS Test net query API");
});


data.forEach(function (item) {
    // Count functions
    app.get("/" + item.baseName + "/count", function (req, res) {
        dbo.collection(item.tableName).count(function (err, result) {
            if (err) throw err;
            console.log(result);
            res.send({count: result})

        });
    });

    // List functions
    app.get("/" + item.baseName + "/", function (req, res) {
        dbo.collection(item.tableName).find().sort({createdAt: -1}).limit(listLimit).toArray(function (err, result) {
            if (err) throw err;
            console.log(result);
            res.send(result)
        });
    });

    // Query by _id
    app.get("/" + item.baseName + "/:id", function (req, res) {
        var objId = new ObjectId(req.params.id);
        dbo.collection(item.tableName).findOne({"_id": objId}, function (err, result) {
            if (err) throw err;
            console.log(result);
            res.send(result)
        });
    });
});

app.get("/accounts/name/:name", function (req, res) {
    // var o_id = new ObjectId(req.params.name);
    dbo.collection("Accounts").findOne({"name": req.params.name}, function (err, result) {
        if (err) throw err;
        console.log(result);
        res.send(result)
    });
});
app.get("/blocks/b/:id", function (req, res) {
    dbo.collection("Blocks").findOne({"block_id": req.params.id}, function (err, result) {
        if (err) throw err;
        console.log(result);
        res.send(result)
    });
});
app.get("/transactions/t/:id", function (req, res) {
    dbo.collection("Transactions").findOne({"transaction_id": req.params.id}, function (err, result) {
        if (err) throw err;
        console.log(result);
        res.send(result)
    });
});
app.get("/messages/t/:id", function (req, res) {
    dbo.collection("Messages").findOne({"transaction_id": req.params.id}, function (err, result) {
        if (err) throw err;
        console.log(result);
        res.send(result)
    });
});

app.get("/transactions/account/:name", function (req, res) {
    dbo.collection("Transactions").find({"scope": req.params.name}).sort({createdAt: -1}).limit(listLimit).toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
        res.send(result)
    });
});
app.get("/messages/account/:name", function (req, res) {
    dbo.collection("Messages").find({$or: [{"data.from": req.params.name}, {"data.to": req.params.name}]})
        .sort({createdAt: -1}).limit(listLimit).toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
        res.send(result)
    });
});

app.get("/aggregate/transactions", function (req, res) {
    var day = new Date();
    day.setDate(day.getDate() - 15);
    dbo.collection("Transactions").aggregate([
        {$match: {"expiration": {"$gte": day}}},
        {
            $group: {
                _id: {$substr: ["$expiration", 0, 10]},
                count: {$sum: 1}
            }
        },
        {$sort: {_id: -1}}
    ]).toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
        res.send(result)
    });

});

app.get("/aggregate/producer", function (req, res) {
    var day = new Date();
    day.setDate(day.getDate() - 15);
    dbo.collection("Blocks").aggregate([
        {$match: {"timestamp": {"$gte": day}}},
        {
            $group: {
                _id: "$producer_account_id",
                count: {$sum: 1}
            }
        },
        {$sort: {count: -1}}
    ]).toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
        res.send(result)
    });

});
