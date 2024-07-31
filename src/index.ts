import express from "express";
import client from "prom-client";
import { requestCountMiddleware } from "./monitoring/requestCount";


const app = express();
app.use(requestCountMiddleware)
app.use(express.json());
app.get("/user", async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  res.send({
      name: "John Doe",
      age: 25,
  });
});

app.post("/user", (req, res) => {
    const user = req.body;
    res.send({
        ...user,
        id: 1,
    });
});


app.get("/metrics", async (req, res) => {
    const metrics = await client.register.metrics();
    res.set('Content-Type', client.register.contentType);
    res.end(metrics);
})
app.listen(3000);