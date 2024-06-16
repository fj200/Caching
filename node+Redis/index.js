const express = require("express");
const axios = require("axios");
const redis = require("redis");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

client.connect().then();

const app = express();

function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

async function getRepos(req, res, next) {
  try {
    console.log("Fetching Data.....");

    const { username } = req.params;

    const response = await axios(`https://api.github.com/users/${username}`);

    const data = await response.data;

    const repos = data.public_repos;

    await client.set(username, repos, "EX", 60);

    res.send(setResponse(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

// Cache middleware
function cache(req, res, next) {
  const { username } = req.params;

  client
    .get(username)
    .then((data) => {
      if (data !== null) {
        res.send(setResponse(username, data));
      } else {
        next();
      }
    })
    .catch((err) => {
      throw err;
    });
}

app.get("/repos/:username", cache, getRepos);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
