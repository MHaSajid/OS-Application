const http = require("http");
const express = require("express");
const app = express();
process.stdin.setEncoding("utf8");
const axios = require('axios');
const bodyParser = require("body-parser");
const path = require("path");
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config({ path: path.resolve(__dirname, '.env') });


console.log("hello");
app.use(bodyParser.urlencoded({ extended: false }));
console.log(`server started and running at http://localhost:${5003}`);
console.log(`Stop to shutdown the server:`);
app.listen(5002);
app.set("views", path.resolve(__dirname,"templates"));
app.set("view engine", "ejs");
app.use(express.static('templates'));


app.get("/",  async(request, response) => {
    console.log(await getWeather());
    console.log("hello");
    //response.render("welcome");
});
const CITY = 'New York'; // Or any other city
const url = `http://api.openweathermap.org/data/2.5/weather?q=${CITY}&amp;appid=${process.env.API_KEY}`;

async function getWeather(){
    axios.get(url)
    .then(response => {
        // Handle the response
        const weatherData = response.data;
        console.log(weatherData);
        // Further processing of weather data
    })
    .catch(error => {
        console.error('Error fetching weather data:', error);
    });
}
app.get("/getOSInfo",(request, response) => {
    response.render("getOSInfo");
});
const databaseAndCollection = {db: "OSDB", collection:"OSInfoSubmissions"};
const uri = process.env.MONGO_CONNECTION_STRING;
app.post("/getOSInfo",async (request, response) => {
    let { name, email, OS, additionalInformation } = request.body;
    const vars = {name:name, email:email, OS:OS, additionalInformation:additionalInformation};
    response.render("processResponse", vars);
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    const info1 = {name:name, email:email, OS:OS, additionalInformation:additionalInformation};
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
    if(result != null){
        vars = {name: result.name, email:result.email, OS:result.OS, additionalInformation:result.additionalInformation};
    }else {
        vars = {name:"Not Found", email:"Not Found", OS:"Not Found",  additionalInformation:"Not Found"};
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

