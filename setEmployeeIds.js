const {google} = require('googleapis');
const executor = require("./util.js");

const SCOPES = ['https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.user.readonly'];
const TOKEN_PATH = 'employee-ids-token.json';
const CUSTOMER_ID = "C02u6z7rd";

executor.execute(setEveryEmployeeId, SCOPES, TOKEN_PATH);

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