import pkg from "snoostorm";
const { CommentStream, SubmissionStream } = pkg;
import Snoowrap from "snoowrap";
import getUrls from "get-urls";
import config from "./credentials.js";
import response from "./responses.js";

const client = new Snoowrap(config);

const submissions = new SubmissionStream(client, {
    subreddit: "inat",
    limit: 1,
    pollTime: 2000,
});
submissions.on("item", submission => {
    console.log(submission.title);
    var reply = "";

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
    var reply = "";

    if (checkWord("scope()", comment.selftext)) {
        reply = response.scope;
    }

    if (reply != "") {
        comment.reply(reply);
    }
});

function countWords(str) {
    return str.trim().split(/\s+/).length;
}

function checkWord(word, str) {
    const allowedSeparator = '\\\s,;"\'|';

    const regex = new RegExp(
        `(^.*[${allowedSeparator}]${word}$)|(^${word}[${allowedSeparator}].*)|(^${word}$)|(^.*[${allowedSeparator}]${word}[${allowedSeparator}].*$)`,

        // Case insensitive
        'i',
    );

    return regex.test(str);
}