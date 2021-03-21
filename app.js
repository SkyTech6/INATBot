import pkg from "snoostorm";
const { CommentStream, SubmissionStream } = pkg;
import Snoowrap from "snoowrap";
import getUrls from "get-urls";
//import config from "./credentials.js"; // This is for local testing only
import response from "./responses.js";

const client = new Snoowrap({
    userAgent: 'INAT_BOT 0.1',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

const submissions = new SubmissionStream(client, {
    subreddit: "inat",
    limit: 10,
    pollTime: 2000,
});
submissions.on("item", submission => {
    console.log(submission.title);
    let reply = "";

    if (countWords(submission.selftext) < 250) {
        reply = response.wordLimit;
        submission.remove();
    }

    if (getUrls(submission.selftext).size == 0) {
        reply = reply + response.url;
    }

    if (checkWord("mmo", submission.selftext)) {
        reply = reply + response.mmo;
    }

    if (reply != "") {
        submission.reply(reply);
    }
});

const comments = new CommentStream(client, {
    subreddit: "inat",
    limit: 10,
    pollTime: 2000,
});
comments.on("item", comment => {
    let reply = "";

    if (checkWord("scope()", comment.selftext)) {
        reply = response.scope;
    }

    if (reply != "") {
        comment.reply(reply);
    }
});

const countWords = (str) => {
    return str.trim().split(/\s+/).length;
}

const checkWord = (word, str) => {
    const allowedSeparator = '\\\s,;"\'|';

    const regex = new RegExp(
        `(^.*[${allowedSeparator}]${word}$)|(^${word}[${allowedSeparator}].*)|(^${word}$)|(^.*[${allowedSeparator}]${word}[${allowedSeparator}].*$)`,

        // Case insensitive
        'i',
    );

    return regex.test(str);
}