import express, { RequestHandler } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import redis from "redis";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json() as RequestHandler);
app.use(cors());

app.post("/", (req, res) => {
  const redisClient = redis.createClient();
  const body = req.body;
  const method = body.method;
  const parameters = body.params;
  redisClient.hget(method, JSON.stringify(parameters), (err, reply) => {
    if (reply === null || err) {
      // tell the writer about it
      axios.post(process.env.WRITER_URL, body).then((response) => {
        res.json(response);
      });
    } else {
      res.json(reply);
    }
  });
});

export { app };
