const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;
//middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4mqcd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("Doctor-Db");
    const doctorsCollections = database.collection("doctors");
    console.log("database connected successfully");
  } finally {
    //await client.close()
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Backend ok");
});
app.listen(port, () => {
  console.log("server running at port ", port);
});
