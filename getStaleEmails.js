const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/admin.directory.user",
    "https://www.googleapis.com/auth/admin.directory.user.readonly"
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'stale-emails-token.json';
const STALE_EMAILS_PATH = "stale-emails.txt";
const CUSTOMER_ID = "C02u6z7rd";

const CURRENT_MS = new Date().getTime();
const MS_TO_DAYS = 1000 * 60 * 60 * 24;
const STALE_LOGIN_THRESHOLD_DAYS = 365;

fs.readFile('credentials.json', (err, content) => {
    if (err) return console.error('Error loading client secret file', err);
    authorize(JSON.parse(content), getStaleEmails);
});

function authorize(credentials, scrapeCallback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oauth2Client, scrapeCallback);
        oauth2Client.credentials = JSON.parse(token);
        scrapeCallback(oauth2Client, [], ['member-link@cfes.ca'], 0);
    });
}

function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url, be sure you copy the full URL:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oauth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

function storeToken(token) {
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.warn(`Token not stored to ${TOKEN_PATH}`, err);
        console.log(`Token stored to ${TOKEN_PATH}`);
    });
}

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