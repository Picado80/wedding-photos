import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const FOLDER_ID = '1hPN8Jrn8liCUmd3LYHGkH6bJ4y9frT1R';

async function getAuthClient() {
    const credentialsPath = path.join(__dirname, 'credentials.json');
    const tokenPath = path.join(__dirname, 'token.json');

    if (fs.existsSync(tokenPath) && fs.existsSync(credentialsPath)) {
        console.log("Found token.json and credentials.json");
        const content = fs.readFileSync(credentialsPath);
        const credentials = JSON.parse(content);
        const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        const token = fs.readFileSync(tokenPath);
        oAuth2Client.setCredentials(JSON.parse(token));
        return oAuth2Client;
    }
    throw new Error("Missing credentials.json or token.json");
}

async function testUpload() {
    try {
        console.log("Authenticating...");
        const auth = await getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        console.log("Uploading test file...");
        const fileMetadata = {
            name: 'test_upload_oauth.txt',
            parents: [FOLDER_ID],
        };

        const media = {
            mimeType: 'text/plain',
            body: 'Hello World from OAuth',
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        console.log('Success! File ID:', response.data.id);
    } catch (error) {
        console.error('Error uploading to Drive:');
        console.error(JSON.stringify(error, null, 2));
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testUpload();
