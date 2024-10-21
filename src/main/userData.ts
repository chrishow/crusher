import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const USER_DATA_PATH = path.join(app.getPath("userData"), 'user_data.json');

export function readUserData(): any {
    try {
        if (!fs.existsSync(USER_DATA_PATH)) {
            writeUserData({ outputFolder: '' });
        }
        const data = fs.readFileSync(USER_DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Error retrieving user data', error);
        // you may want to propagate the error, up to you
        return null;
    }
}

export function writeUserData(data): void {
    fs.writeFileSync(USER_DATA_PATH, JSON.stringify(data));
}