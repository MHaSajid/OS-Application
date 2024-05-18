const http = require("http");
const express = require("express");
const app = express();
process.stdin.setEncoding("utf8");
const bodyParser = require("body-parser");
const path = require("path");
const { MongoClient, ServerApiVersion } = require('mongodb');
const axios = require('axios');
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

app.use(bodyParser.urlencoded({ extended: false }));
console.log(`Web server started and running at 5002`);
console.log(`Stop to shutdown the server:`);
app.listen(5002);
app.set("views", path.resolve(__dirname,"templates"));
app.set("view engine", "ejs");
app.use(express.static('templates'));
app.get("/",(request, response) => {
    response.render("welcome");
});
app.get("/getOSInfo",(request, response) => {
    response.render("getOSInfo");
});
const databaseAndCollection = {db: "OSDB", collection:"OSInfoSubmissions"};
const uri = process.env.MONGO_CONNECTION_STRING;
app.post("/getOSInfo",async (request, response) => {
    let { name, email, city, OS, additionalInformation } = request.body;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    const info1 = {name:name, email:email, city:city, OS:OS, additionalInformation:additionalInformation};
    let temp;
    let weather;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.API_KEY}&units=imperial`;
    let data;
    await axios.get(url)
        .then(response => {
            data = response.data;
            temp = data.main.temp;
            weather = data.weather[0].description;
    }).catch(error => {
        weather = 'Not Available';
        temp = 'Not Available';
    });

    const vars = {name:name, email:email, temp:temp, weather:weather, city:city, OS:OS, additionalInformation:additionalInformation};
    response.render("processResponse", vars);
    try {
        await client.connect();
        await InsertInfo(client, databaseAndCollection, info1);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});
app.get("/lookupOSinfo",(request, response) => {
    response.render("lookupOSInfo");
});
app.post("/lookupOSinfo",async (request, response) => {
    let {email} = request.body;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    let result = await main1(email);
    let vars;

    let temp;
    let weather;

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${result.city}&appid=${process.env.API_KEY}&units=imperial`;
    let data;
    await axios.get(url)
        .then(response => {
            data = response.data;
            temp = data.main.temp;
            weather = data.weather[0].description;
    }).catch(error => {
        weather = 'Not Available';
        temp = 'Not Available';
    });

    if(result != null){
        vars = {name: result.name, email:result.email, city:result.city, temp:temp, weather:weather, OS:result.OS, additionalInformation:result.additionalInformation};
    }else {
        vars = {name:"Not Found", email:"Not Found", city: "Not Found", temp:"Not Found", weather:"Not Found", OS:"Not Found",  additionalInformation:"Not Found"};
    }
    response.render("retrieveResponse", vars);
});
async function InsertInfo(client, databaseAndCollection, info) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(info);
}
async function main1(email) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    await client.connect();
   return lookUpOneEntry(client, databaseAndCollection, email);
}
async function lookUpOneEntry(client, databaseAndCollection, email) {
    let filter = {email: email};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);
   return new Promise((resolve, reject) => {
        resolve(result);
   });                     
}