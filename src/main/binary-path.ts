import { join as joinPath, dirname } from 'path';
import { platform } from 'os';
import { app } from 'electron';
import { is } from '@electron-toolkit/utils'

export const binaryPath = (): string => {
    const getPlatformClass = (): string => {
        switch (platform()) {
            case 'aix':
            case 'freebsd':
            case 'linux':
            case 'openbsd':
            case 'android':
                return 'linux';
            case 'darwin':
            case 'sunos':
                return 'mac';
            case 'win32':
                return 'win';
        }

        return 'unknown';
    };

    const appRootDir = app.getAppPath();
    const platformClass = getPlatformClass();
    const execPath = is.dev ?
        joinPath(appRootDir, 'resources', platformClass) :
        joinPath(dirname(appRootDir), 'bin');

    return execPath;
};