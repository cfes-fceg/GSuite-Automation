const fs = require('fs');
const {google} = require('googleapis');
const executor = require("./util.js");

const SCOPES = ['https://www.googleapis.com/auth/admin.directory.group.member.readonly',
    'https://www.googleapis.com/auth/admin.directory.group.member',
    'https://www.googleapis.com/auth/admin.directory.group.readonly',
    'https://www.googleapis.com/auth/admin.directory.group'];
const TOKEN_PATH = 'individual-emails-token.json';
const MEMBER_EMAILS_PATH = 'member-link_emails.csv';
const CREDENTIALS_PATH = 'credentials.json';

executor.execute(scraperCallback, CREDENTIALS_PATH, SCOPES, TOKEN_PATH);

function scraperCallback(auth) {
    scrapeIndividualEmails(auth, [], ['member-link@cfes.ca'], 0);
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
