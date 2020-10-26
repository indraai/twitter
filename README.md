# @indra.ai/twitter

`@indra.ai/twitter` is a Class utility for accessing the Twitter API.

## installing
```console
npm install @indra.ai/twitter --save  
```

## including in your code
```javascript
const Twitter = require("@indra.ai/twitter")
```

Dependencies:
1. request

Example:

## Using
TwitterServer.js in some other file
```javascript
// using TwitterServer
const TwitterServer = require("@indra.ai/twitter");
const tw = new TwitterServer({
  consumer_key: "your_key",
  consumer_secret: "your_secret",
  token: "your_token",
  token_secret: "your_secret"
});

// now let's get our timeline from the new twitter server
tw.timeline("screen_name")
  .then(response => {
    console.log("RESPONSE", response);
  })
  .catch(err => {
    console.log("ERROR", err);
  });
```
