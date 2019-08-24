const fs = require('fs');
const {google} = require('googleapis');
const executor = require("./util.js");

const SCOPES = ["https://www.googleapis.com/auth/admin.directory.user",
    "https://www.googleapis.com/auth/admin.directory.user.readonly"
];
const TOKEN_PATH = 'stale-emails-token.json';
const STALE_EMAILS_PATH = "stale-emails.txt";
const CUSTOMER_ID = "C02u6z7rd";

const CURRENT_MS = new Date().getTime();
const MS_TO_DAYS = 1000 * 60 * 60 * 24;
const STALE_LOGIN_THRESHOLD_DAYS = 365;

executor.execute(getStaleEmails, SCOPES, TOKEN_PATH);

function getStaleEmails(auth) {
    const service = google.admin({version: 'directory_v1', auth});
    service.users.list({
        customer: CUSTOMER_ID,
    }, (err, res) => {
        if (err) return console.error('The API returned an error:', err.message);
        let staleEmails = [];
        for (let i = 0; i < res.data.users.length; i++) {
            let user = res.data.users[i];
            if (isStaleLogin(user.lastLoginTime)) {
                staleEmails.push(user.primaryEmail + "\n");
            }
        }
        exportStaleEmails(staleEmails.join(""))
    });
}

function isStaleLogin(lastLogin) {
    let signInMs = new Date(lastLogin).getTime();
    let daysSinceLogin = (CURRENT_MS - signInMs) / MS_TO_DAYS;
    return daysSinceLogin > STALE_LOGIN_THRESHOLD_DAYS;
}

function exportStaleEmails(emails) {
    return new Promise(function () {
        fs.writeFile(STALE_EMAILS_PATH, emails, "utf-8", (err) => {
            if (err) return console.warn("stale emails not stored", err);
            console.log("stale emails stored to " + STALE_EMAILS_PATH);
        });
    });
}