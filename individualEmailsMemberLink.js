const util = require("./util.js");

const TOKEN_FILE = 'individual-emails-token.json';
const MEMBER_EMAILS_FILE = 'member-link_emails.csv';

const SCOPES = ['https://www.googleapis.com/auth/admin.directory.group.member.readonly',
    'https://www.googleapis.com/auth/admin.directory.group.member',
    'https://www.googleapis.com/auth/admin.directory.group.readonly',
    'https://www.googleapis.com/auth/admin.directory.group'];

util.execute(scraperCallback, SCOPES, TOKEN_FILE);

function scraperCallback(auth) {
    scrapeIndividualEmails(auth, [], ['member-link@cfes.ca'], 0);
}

function scrapeIndividualEmails(auth, individualEmails, nestedGroupEmails, groupIdx) {
    const service = util.gapi.admin({version: 'directory_v1', auth});
    service.members.list({
        groupKey: nestedGroupEmails[groupIdx],
    }, async (err, res) => {
        //TODO dry
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
            await util.writeResults("member-link emails", individualEmails.join("\n"), MEMBER_EMAILS_FILE);
        }
    });
}
