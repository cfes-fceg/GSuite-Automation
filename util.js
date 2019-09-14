const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

let scopes = [];
let tokenPath = "";

exports.execute = function (callback, credentialsPath, requestedScopes, tokenPathGiven) {
    scopes = requestedScopes;
    tokenPath = tokenPathGiven;
    readCredentials(callback, credentialsPath);
};

function readCredentials(callback, credentialsPath) {
    fs.readFile(credentialsPath, (err, content) => {
        if (err) return console.error('Error loading client secret file', err);
        authorize(JSON.parse(content), callback);
    });
}

function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    // Check if we have previously stored a token.
    fs.readFile(tokenPath, (err, token) => {
        if (err) return getNewToken(oauth2Client, callback);
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
    });
}

function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
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
            callback(oauth2Client, [], ['member-link@cfes.ca'], 0); //some callbacks may not use all arguments
        });
    });
}

function storeToken(token) {
    fs.writeFile(tokenPath, JSON.stringify(token), (err) => {
        if (err) return console.warn(`Token not stored to ${tokenPath}`, err);
        console.log(`Token stored to ${tokenPath}`);
    });
}