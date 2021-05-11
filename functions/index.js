const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const region = "asia-southeast2";

const lineApi = "https://api.line.me/v2/bot";
const lineMessageApi = lineApi + "/message";
const lineProfileApi = lineApi + "/profile";
// get this from line developer console page.
const channelAccessToken = "v4tObEGDcWEwPu8F8AfBv+0DpQkHVdqm0N3P8WFCJGiWwsTcqs0PqCpYMOnns+3IscbFrEaWfHC0tbZRKm4aNAV//4gi3mqunmRwVjzNYIiWIPrGoIzEfqddgrelpICXnOhMhlg4tSuvMkrziy41UAdB04t89/1O/w1cDnyilFU=";

admin.initializeApp();

const db = admin.firestore();

// simple reply message line api.
exports.testMessageLog =
functions.region(region).https.onRequest((req, res) => {
  if (req.method.toUpperCase() !== "POST") {
    return;
  }
  const events = req.body.events;
  if (events.length <= 0) {
    return;
  }
  // run this only when user send message.
  if (events[0].type === "message" && events[0].message.type === "text") {
    // line messageObject contain message type and content(text, videos, ...).
    // this function only reply text message. <<<<
    const messageObject = events[0].message;
    const replyToken = events[0].replyToken;
    // source for geting userId.
    const source = events[0].source;
    // only work when text message.
    const text = messageObject.text;
    insertUserText(text, source.userId);
    replyMessage(text, replyToken);
  }
  // can response with anything, it won't affect the function.
  res.json(req.method);
});

/**
 * @param {string} text
 * @param {string} repToken
 * @return {boolean}
 */
function replyMessage(text, repToken) {
  if (typeof text !== "string") {
    return false;
  }
  return fetch(lineMessageApi + "/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      replyToken: repToken,
      messages: [
        {
          type: "text",
          text: text,
        },
      ],
    }),
  })
    .then((json) => json.json())
    .then((data) => {
      functions.logger.log(data);
      return true;
    })
    .catch((error) => {
      functions.logger.log(error);
      return false;
    });
}

/**
 * store users text data to firebase firestore.
 * @param {string} user
 * @return {Promise<void>}
 */
function insertUserText (text, userId) {
  // get user profile.
  return fetch(lineProfileApi + "/" + userId, {
    method: "GET",
    headers: {"Authorization": `Bearer ${channelAccessToken}`}
  })
      .then((json) => json.json())
      .then((data) => {
        db.collection("text").add({text: text, user: data.displayName});
      })
}
