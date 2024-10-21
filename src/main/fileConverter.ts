import Ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { binaryPath } from './binary-path'
import { join } from 'path'
const temp = require('temp');
const fs = require('fs');

export class fileConverter {
    static isStaticInitialized = false;

    static staticInit(): void {
        temp.track();
        const binaryPathString: string = binaryPath();
        const FFMEG_PATH = join(binaryPathString, 'ffmpeg');
        const FFPROBE_PATH = join(binaryPathString, 'ffprobe');
        Ffmpeg.setFfmpegPath(FFMEG_PATH);
        Ffmpeg.setFfprobePath(FFPROBE_PATH);
    }


    static getMetadata(path): Promise<string | FfprobeData> {
        if (fileConverter.isStaticInitialized === false) {
            fileConverter.staticInit();
            fileConverter.isStaticInitialized = true;
        }

        return new Promise((resolve, reject) => {
            Ffmpeg.ffprobe(path, (err, metadata) => {
                if (err) {
                    reject(err);
                }

                if (metadata) {
                    resolve(metadata);
                }
            });
        });
    }

    static compress(path, resolution, progressCallback, endCallback): string {
        if (fileConverter.isStaticInitialized === false) {
            fileConverter.staticInit();
            fileConverter.isStaticInitialized = true;
        }

        // Generate a temporary file
        const outputFile = temp.openSync({ prefix: 'crush-crusher-', suffix: '.mp4' });
        fs.close(outputFile.fd);

        let outputFilePath = outputFile.path;
        if (process.platform === 'darwin') {
            outputFilePath = `/private${outputFilePath}`;
        }
        console.log('Output file: ', outputFilePath);

        const resolutionNumber = resolution.endsWith('p') ? resolution.slice(0, -1) : resolution;

        const argsString = "-vcodec libx264 -acodec aac -b:v 1000k -refs 6 -coder 1 -sc_threshold 40 -flags +loop -me_range 16 -subq 7 -i_qfactor 0.71 -qcomp 0.6 -qdiff 4 -trellis 1 -b:a 128k -movflags +faststart -pix_fmt yuv420p -crf 23";
        const args = argsString.split(' ');

        Ffmpeg(path, { logger: console })
            .size(`?x${resolutionNumber}`)
            .on('end', endCallback)
            .on('progress', progressCallback)
            .outputOptions(args)
            .save(outputFilePath);

        return outputFilePath;
    }
}