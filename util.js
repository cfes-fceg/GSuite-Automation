const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
exports.gapi = google;

const RESULTS_FOLDER = "./results/";
const AUTH_FOLDER = "./authentication/";
const CREDENTIALS_FILE = "credentials.json";

let scopes = [];
let tokenPath = "";

exports.execute = async function (callback, requestedScopes, tokenFile) {
    scopes = requestedScopes;
    tokenPath = AUTH_FOLDER + tokenFile;
    let credentials = await readCredentials();
    authorize(credentials, callback);
};

exports.writeResults = async function (action, results, resultsFileName) {
    return new Promise(function () {
        const resultsPath = RESULTS_FOLDER + resultsFileName;
        fs.writeFile(resultsPath, results, "utf-8", (err) => {
            if (err) console.warn(`${action} not stored: ${err}`);
            console.log(`${action} stored to ${resultsPath}`);
        });
    });
};

function readCredentials() {
    return new Promise(function (resolve, reject) {
        fs.readFile(AUTH_FOLDER + CREDENTIALS_FILE, (err, content) => {
            if (err) reject(`Error loading credentials file: ${err}`);
            resolve(JSON.parse(content.toString()));
        });
    });
}

function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
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
            callback(oauth2Client);
        });
    });
}

function storeToken(token) {
    fs.writeFile(tokenPath, JSON.stringify(token), (err) => {
        if (err) return console.warn(`Token not stored to ${tokenPath}`, err);
        console.log(`Token stored to ${tokenPath}`);
    });
}