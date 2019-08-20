const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.user.readonly'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'employee-ids-token.json';

const CUSTOMER_ID = "C02u6z7rd";

fs.readFile('credentials.json', (err, content) => {
    if (err) return console.error('Error loading client secret file', err);
    authorize(JSON.parse(content), setEveryEmployeeId);
});

function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oauth2Client, callback);
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
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

function setEveryEmployeeId(auth) {
    const service = google.admin({version: 'directory_v1', auth});
    service.users.list({
        customer: CUSTOMER_ID
    }, (err, res) => {
        if (err) return console.error('The API returned an error:', err.message);
        setEmployeeId(res.data.users, 0, auth);
    });
}

function setEmployeeId(users, idx, auth) {
    return new Promise(function (resolve) {
        if (idx >= users.length) {
            resolve();
        } else {
            let userEmail = users[idx].primaryEmail;
            let id = userEmail.split("@")[0];
            const service = google.admin({version: 'directory_v1', auth});
            service.users.update({
                userKey: userEmail,
                resource: {
                    externalIds: [
                        {
                            type: "organization",
                            value: id
                        }
                    ]
                }
            }, (err, res) => {
                if (err) return console.error('The API returned an error:', err.message);
                setEmployeeId(users, idx + 1, auth).then(function () {
                    resolve();
                });
            });
        }
    });
}