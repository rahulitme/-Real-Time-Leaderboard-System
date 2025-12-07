const { MongoClient } = require("mongodb");
const config = require("./env");

let mongoClient = null;
let db = null;
let scoresCollection = null;

async function connectMongo() {
  mongoClient = new MongoClient(config.MONGO_URI, { maxPoolSize: 10, minPoolSize: 2 });
  await mongoClient.connect();
  db = mongoClient.db(config.MONGO_DB_NAME);
  scoresCollection = db.collection(config.MONGO_COLLECTION);

  await scoresCollection.createIndex({ leaderboardId: 1, userId: 1 }, { unique: true });
  await scoresCollection.createIndex({ leaderboardId: 1, score: -1 });
  await scoresCollection.createIndex({ updatedAt: 1 });

  return { mongoClient, db, scoresCollection };
}

function getMongoClient() {
  if (!mongoClient) throw new Error("MongoDB not initialized. Call connectMongo() first.");
  return mongoClient;
}

function getDb() {
  if (!db) throw new Error("MongoDB not initialized. Call connectMongo() first.");
  return db;
}

function getScoresCollection() {
  if (!scoresCollection) throw new Error("MongoDB not initialized. Call connectMongo() first.");
  return scoresCollection;
}

module.exports = { connectMongo, getMongoClient, getDb, getScoresCollection };
