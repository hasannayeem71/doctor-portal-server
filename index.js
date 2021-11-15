const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const admin = require("firebase-admin");
const ObjectId = require('mongodb').ObjectId;
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
//

const serviceAccount = require("./doctor-portal-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//middle war
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4mqcd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  if (req?.body?.headers?.Authorization?.startsWith("Bearer ")) {
    const token = req?.body?.headers?.Authorization?.split(" ")[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }

  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("Doctor-Db");
    const doctorsCollections = database.collection("doctors");
    const appointmentsCollections = database.collection("Appointments");
    const usersCollections = database.collection("users");
    //get data by user email
    app.get("/appointments", async (req, res) => {
      const email = req.query?.email;
      const date = req.query?.date;
      const query = { email: email, date: date };
      const cursor = await appointmentsCollections.find(query).toArray();
      res.json(cursor);
    });
    //get one user data using id
    app.get('/appointments/:id',async (req,res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await appointmentsCollections.findOne(query);
      res.send(result)
    })
    //get a user by email address
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollections.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    //post one appointment data
    app.post("/appointments", async (req, res) => {
      const appointment = req.body;
      const result = await appointmentsCollections.insertOne(appointment);
      res.json(result);
    });
    //post user data
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollections.insertOne(user);
      console.log(result);
      res.json(result);
    });
    //user when google popup login
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollections.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log(result);
      res.json(result);
    });
    //handle admin
    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body.user;
      const filter = { email: user.email };
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollections.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          console.log(filter);
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollections.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(401)
          .json({ message: "You do not have access to make admin" });
      }
    });
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
