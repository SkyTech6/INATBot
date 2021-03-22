import pkg from "snoostorm";
const { CommentStream, SubmissionStream } = pkg;
import Snoowrap from "snoowrap";
import getUrls from "get-urls";
// import config from "./credentials.js"; // This is for local testing only
import response from "./responses.js"; // Container for bot responses to users

// Setup the Snoowrap client with variables passed from the Heroku env
const client = new Snoowrap({
    userAgent: 'INAT_BOT 0.1',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

// Credentials use for local debugging
// const client = new Snoowrap(config);

// The submission stream from snoostorm 
const submissions = new SubmissionStream(client, {
    subreddit: "inat",
    limit: 10, // pulls the latest 10 threads created
    pollTime: 20000, // does this check every 20 seconds, limited by Reddit's restrictions
});
submissions.on("item", submission => {
    // Check if the submission has already been moderated
    if (notModerated(submission)) {
        console.log(submission.title);
        let reply = "";

        // If there are less than 250 words in the body, filter out
        if (countWords(submission.selftext) < 250) {
            reply = response.wordLimit;
            submission.remove();
        }

        // Check if any urls exist in the submission
        if (getUrls(submission.selftext).size == 0) {
            reply = reply + response.url;
        }

        // Check if the word mmo appears in the body
        if (checkWord("mmo", submission.selftext)) {
            reply = reply + response.mmo;
        }

        // Check if any of the previous checks succeeded and added to the "reply" string
        if (reply != "") {
            submission.reply(reply);
        }
    }
});

// The comment stream from snoostorm
const comments = new CommentStream(client, {
    subreddit: "inat",
    limit: 10, // Same limit and pollTime on both means 60 requests a minute / Reddit's max
    pollTime: 20000, 
});
comments.on("item", comment => {
    let reply = "";

    // Check if the comment text contains the scope command
    if (checkWord("scope()", comment.selftext)) {
        reply = response.scope;
    }

    if (reply != "") {
        comment.reply(reply);
    }
});

// Splits a string by the spaces to get a total word count
const countWords = (str) => {
    return str.trim().split(/\s+/).length;
}

// Regex function to see if a specified word appears in a string
const checkWord = (word, str) => {
    const allowedSeparator = '\\\s,;"\'|';

    const regex = new RegExp(
        `(^.*[${allowedSeparator}]${word}$)|(^${word}[${allowedSeparator}].*)|(^${word}$)|(^.*[${allowedSeparator}]${word}[${allowedSeparator}].*$)`,

        // Case insensitive
        'i',
    );

    return regex.test(str);
}

// Checks if the input submission already has a moderation post by the inat_bot
const notModerated = (submission) => {
    if (submission.num_comments > 0) {
        //snoowrap is all Promise-based, method takes place within the then callback
        client.getSubmission(submission.id).expandReplies().then(thread => {
            if (thread.comments.some(e => e['author']['name'] === "inat_bot")) {
                return false;
            }
            else {
                return true;
            }
        })
    }
    else {
        return true;
    }
}