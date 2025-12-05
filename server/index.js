import { Readable } from 'stream';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());

// Serve static files from the React client
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Configure Multer to store files in memory temporarily
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// Google Drive Setup
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const FOLDER_ID = '1hPN8Jrn8liCUmd3LYHGkH6bJ4y9frT1R';

async function getAuthClient() {
    const credentialsPath = path.join(__dirname, 'credentials.json');
    const tokenPath = path.join(__dirname, 'token.json');

    // Try OAuth2 first (token.json)
    if (fs.existsSync(tokenPath) && fs.existsSync(credentialsPath)) {
        const content = fs.readFileSync(credentialsPath);
        const credentials = JSON.parse(content);
        // Handle different JSON structures (installed vs web)
        const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        const token = fs.readFileSync(tokenPath);
        oAuth2Client.setCredentials(JSON.parse(token));
        return oAuth2Client;
    }

    // Fallback to Service Account (if it ever works)
    return new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: SCOPES,
    });
}

async function uploadToDrive(fileBuffer, fileName, mimeType) {
    try {
        const auth = await getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        const fileMetadata = {
            name: fileName,
            parents: [FOLDER_ID],
        };

        const media = {
            mimeType: mimeType,
            body: Readable.from(fileBuffer),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        return response.data.id;
    } catch (error) {
        console.error('Error uploading to Drive:', error);
        throw error;
    }
}

app.post('/upload', upload.array('photos', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    try {
        // Check if credentials exist
        if (!fs.existsSync(path.join(__dirname, 'credentials.json'))) {
            console.error("credentials.json not found!");
            return res.status(500).json({ error: "Server configuration error: Missing credentials." });
        }

        const uploadPromises = req.files.map(file =>
            uploadToDrive(file.buffer, file.originalname, file.mimetype)
        );

        await Promise.all(uploadPromises);

        res.status(200).send('Files uploaded successfully to Google Drive.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading files: ' + error.message + '\n' + JSON.stringify(error, null, 2));
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
