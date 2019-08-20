const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/admin.directory.group.member.readonly',
    'https://www.googleapis.com/auth/admin.directory.group.member',
    'https://www.googleapis.com/auth/admin.directory.group.readonly',
    'https://www.googleapis.com/auth/admin.directory.group'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'individual-emails-token.json';

const MEMBER_EMAILS_PATH = 'member-link_emails.csv';

fs.readFile('credentials.json', (err, content) => {
    if (err) return console.error('Error loading client secret file', err);
    authorize(JSON.parse(content), scrapeIndividualEmails);
});

function authorize(credentials, scrapeCallback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    //Check if we have previously stored a token.
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
            callback(oauth2Client, [], ['member-link@cfes.ca'], 0);
        });
    });
}

function storeToken(token) {
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.warn(`Token not stored to ${TOKEN_PATH}`, err);
        console.log(`Token stored to ${TOKEN_PATH}`);
    });
}

function scrapeIndividualEmails(auth, individualEmails, nestedGroupEmails, groupIdx) {
    const service = google.admin({version: 'directory_v1', auth});
    service.members.list({
        groupKey: nestedGroupEmails[groupIdx],
    }, (err, res) => {
        if (err) return console.error('The API returned an error:', err.message);
        const members = res.data.members;
        for (let i = 0; i < members.length; i++) {
            let member = members[i];
            if (member.type === "USER") {
                individualEmails.push(member.email);
            } else if (member.email.includes("@cfes.ca")) {
                nestedGroupEmails.push(member.email); //group email, add to list
            }
        }
        if (groupIdx < nestedGroupEmails.length - 1) {
            scrapeIndividualEmails(auth, individualEmails, nestedGroupEmails, groupIdx + 1);
        } else {
            exportEmails(individualEmails.join("\n"));
        }
    });
}

function exportEmails(emails) {
    return new Promise(function () {
        fs.writeFile(MEMBER_EMAILS_PATH, emails, 'utf-8', (err) => {
            if (err) return console.warn("member-link emails not stored", err);
            console.log("member-link emails stored to " + MEMBER_EMAILS_PATH);
        });
    });
}
