# G-Suite Automation Scripts
For all of these scripts, the first time running them you will be prompted to copy a URL and paste it in a web browser.
You will then login to your GSuite CFES administrator account and copy-paste a secret into command line to give the script access.
While doing this, you may be told it is unsafe because the application is unverified, but simply go to advanced and choose to proceed.

These scripts must be run in the same directory as `util.js`, which handles the Google authentication.

## Authentication

In the `authentication` folder, `credentials.json` file is needed. This is the OAuth 2.0 credential in the Google API, which can 
be downloaded from the [dashboard](https://console.developers.google.com/apis/credentials?folder=&organizationId=&project=quickstart-1566655068519).

Each script uses an appropriately named token file that will also appear in the `authentication` folder. Running the script without a token present
will trigger the process mentioned above, with a URL to manually go to and a secret to be retrieved. After this, the token is saved and re-used.

## Testing

The `test` directory holds `testScripts.js` file, which runs each script present in the `test/tests.json` file.

__NOTE: THESE ARE NOT ACTUAL TESTS. They simply run the scripts.__ So, if you want to ensure your changes didn't break anything,
running this test file works well. However, any scripts that set data (e.g. `setEmployeeIds.js`) will actually set values.
Make sure you set `tests.json` appropriately and are aware that scripts run in a live environment. In this case of `setEmployeeIds.js`,
it is okay (in my opinion, at the time of writing), because it only sets the employee IDs to the email name, which is always the same
and is *currently* the always desired behaviour.

Mocha is used to test, so you can run the tests via mocha. For example, using the Webstorm mocha template run configuration.

## Debugging

For any general error such as `invalid_grant` or `unauthorized_client`, the first step is to delete the token and re-try the script.
Tokens expire in ~30 days, and using an expired token will cause the Google API to throw an error.

You may also have to allow access to an API, errors will occur if APIs aren't enabled for whatever reason.
You can manage API credentials and enabled APIs in the [dashboard](https://console.developers.google.com/apis/dashboard).
Make sure you are logged into it@cfes.ca on this page.

## getStaleEmails.js
This script creates `stale-emails.txt`, which lists the emails that have not been logged into in the past year.
These are emails that could be de-activated/deleted in G-Suite.

## individualEmailsMemberLink.js
This script creates `member-link_emails.csv`, which contains every individual email from the member-link distribution list; any distribution list email is drilled into to get the user emails.
These are needed for newsletters by the Administration Commissioner, as member-link may change, and just using `member-link@cfes.ca` allows any individual to unsubscribe everyone from the newsletter.

## setEmployeeIds.js
This script sets the Employee ID field of every user in the CFES organization.
With the yearly transition of emails, Google will send a challenge question upon the first "different" login.
If the phone number and secondary email are not set, the employee ID will be used. This script increases convenience by setting every employee ID to be their email name, or everything before the '@'.
 
