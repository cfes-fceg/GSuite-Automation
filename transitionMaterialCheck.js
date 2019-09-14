const fs = require("fs");
const executor = require("./util.js");
const {google} = require('googleapis');

const TRANSITION_DATA_PATH = "transition_data.csv";
const TOKEN_PATH = 'transition-data-token.json';
//if folders change in google chrome, the ID needs to change here
const OFFICER_FOLDERS = [
    {folderName: "IT", folderId: "15GxtmJ5G3Y7bnf5z0PiRcNPLMcw_XX6X"},
    // {folderName: "President", folderId: "5678"}
];
let SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.appdata",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/drive.photos.readonly",
    "https://www.googleapis.com/auth/drive.readonly"
];
const CREDENTIALS_PATH = 'drive-credentials.json';

let transitionData = [];

executor.execute(getAllTransitionData, CREDENTIALS_PATH, SCOPES, TOKEN_PATH);

function getAllTransitionData(auth) {
    let i = 0;
    let firstFolder = OFFICER_FOLDERS[0];
    getOneOfficerTransitionData(auth, firstFolder.folderName, firstFolder.folderId).then(function () {
        i++;
        if (i < OFFICER_FOLDERS.length) {
            let folder = OFFICER_FOLDERS[i];
            getOneOfficerTransitionData(auth, folder.folderName, folder.folderId);
        } else {
            exportTransitionMaterialData(createCsvDataString());
        }
    }).catch(function (err) {
        console.log("ERROR: " + err)
    });
}

function getOneOfficerTransitionData(auth, officerFolderName, officerFolderId) {
    return new Promise(function (resolve) {
        const service = google.drive({version: 'v2', auth});
        service.children.list({
            folderId: officerFolderId
        }, (err, res) => {
            if (err) return console.error('The API returned an error for ' + officerFolderName + ":", err.message);
            console.log(res);
            let oneOfficerData = {officer: officerFolderName, itemCount: res.items.length};
            transitionData.push(oneOfficerData);
            resolve();
        });
    });
}

function createCsvDataString() {
    let csvData = "Officer, Number of Items in Transition Folder\n";
    for (let data of transitionData) {
        csvData += (data.officer + "," + data.itemCount + "\n");
    }
    return csvData;
}

function exportTransitionMaterialData(dataStr) {
    return new Promise(function () {
        fs.writeFile(TRANSITION_DATA_PATH, dataStr, "utf-8", (err) => {
            if (err) return console.warn("stale emails not stored", err);
            console.log("stale emails stored to " + TRANSITION_DATA_PATH);
        });
    });
}