# G-Suite Automation Scripts
For all of these scripts, the first time running them you will be prompted to copy a URL and paste it in a web browser.
You will then login to your GSuite CFES administrator account and copy-paste a token into command line to give the script access.
While doing this, you may be told it is unsafe because the application is unverified, but simply go to advanced and choose to proceed.

## getStaleEmails.js
This script will create `stale-emails-token.json` in the same directory so that future script runs do not need manual authorization.

This script creates `stale-emails.txt`, which lists the emails that have not been logged into in the past year.
These are emails that could be de-activated/deleted in G-Suite.

## individualEmailsMemberLink.js
This script will create `individual-emails-token.json` in the same directory so that future script runs do not need manual authorization.

This script creates `member-link_emails.csv`, which contains every individual email from the member-link distribution list; any distribution list email is drilled into to get the user emails.
These are needed for newsletters by the Administration Commissioner, as member-link may change, and just using `member-link@cfes.ca` allows any individual to unsubscribe everyone from the newsletter.

## setEmployeeIds.js
This script will create `employee-ids-token.json` in the same directory so that future script runs do not need manual authorization.

This script sets the Employee ID field of every user in the CFES organization.
With the yearly transition of emails, Google will send a challenge question upon the first "different" login.
If the phone number and secondary email are not set, the employee ID will be used. This script increases convenience by setting every employee ID to be their email name, or everything before the '@'.
 
