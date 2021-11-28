import pkg from "snoostorm";
const { CommentStream, SubmissionStream } = pkg;
import Snoowrap from "snoowrap";
import getUrls from "get-urls";
import response from "./responses.js"; // Container for bot responses to users
import wordCounter from "./uniqueoccurances.js";

// Setup the Snoowrap client with variables passed from the Heroku env
const client = new Snoowrap({
    userAgent: 'INAT_BOT 0.2',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

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

        // Checks if the post is a offer post
        if (includesWord("offer", submission.link_flair_text)) {
            // Offer posts require at least 150 words to be posted
            if (countWords(submission.selftext) < 150) {
                reply = 'Word Count: ' + countWords(submission.selftext) + '\n\n';
                reply = reply + response.offerLimit;
                submission.remove();
            }
        }
        else {
            // All other posts require at least 250 words to be posted
            if (countWords(submission.selftext) < 250) {
                reply = 'Word Count: ' + countWords(submission.selftext) + '\n\n';
                reply =  reply + response.wordLimit;
                submission.remove();
            }
        }

        // Check if any urls exist in the submission
        if (getUrls(submission.selftext).size == 0) {
            reply = reply + response.url;
        }

        // Check if the word mmo appears in the body
        if (mmoCheck.test(submission.selftext.toLowerCase()) || mmoCheck.test(submission.title.toLowerCase())) {
            reply = reply + response.mmo;
        }

        // Check if any of the previous checks succeeded and added to the "reply" string
        if (reply != "") {
            submission.reply(reply);
        }

        // Checks for the percentage of unique word usage in the post
        if (uniquePercentage(submission.selftext) < 40) {
            client.composeMessage({
                text: submission.url,
                subject: "High Repetition Alert",
                to: "r/INAT"
            });
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
    if (includesWord("scope();", comment.body)) {
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

// Substring check
const includesWord = (word, str) => {
    return str.toLowerCase().includes(word);
}

// MMO Keyword check
const mmoCheck = new RegExp(
    ["mmo", "mmos", "mmorpg"].map(item => `\\b${item}\\b`).join("|")
)

const uniquePercentage = (str) => {
    let occurance = wordCounter(str, false);
    return (occurance.uniqueWordsCount * 100) / occurance.totalWords;
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
