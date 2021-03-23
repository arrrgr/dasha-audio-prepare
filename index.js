const exec = require("child_process");
const fs = require("fs")
const path = require("path");
const pathToFfmpeg = require('ffmpeg-static');

class FfmpegException extends Error {
    constructor(message) {
        super(message);
    }
}

function runFFMPEG(args) {
    const ffmpeg = exec.spawnSync(
        pathToFfmpeg, args, { encoding: "utf8", stdio: "inherit" }
    );
    if (ffmpeg.error !== undefined) {
        throw new FfmpegException(`ffmpeg exited: ${ffmpeg.error}`);
    }
    if (ffmpeg.status !== 0) {
        throw new FfmpegException(`ffmpeg exited: ${ffmpeg.status}`);
    }
}

function processAudio(src, dst) {
    const leftPad = 100;
    const rightPad = 400;
    const filters = [
        "afftdn", //remove noice
        "loudnorm=i=-15", //normalize volume
        "silenceremove=1:0.1:-50dB", //remove left silence
        "areverse", //reverse audio
        "silenceremove=1:0.1:-50dB", //remove right audio
        `adelay=${rightPad}`, //add padding to the right
        "areverse", //reverse back
        `adelay=${leftPad}` //add padding to left
    ].join(",");
    const args = [
        "-i", //input file
        src,
        "-ac",
        "1", //single channel
        "-af", //set filter graph
        filters,
        dst, //target file
        "-y" //force rewrite
    ];
    runFFMPEG(args);
}


function main() {
    const srcDir = process.argv[2];
    const dstDir = process.argv[3];
    if (srcDir === undefined || dstDir === undefined) {
        console.log("node index.js <src_dir> <dst_dir>");
        return;
    }
    const entries = fs.readdirSync(srcDir);
    fs.mkdirSync(dstDir, { recursive: true });
    for (const entry of entries) {
        const ext = path.extname(entry).toLowerCase();
        if (ext === ".wav" || ext === ".mp3") {
            const src = path.join(srcDir, entry);
            const dst = path.join(dstDir, path.parse(entry).name + ".mp3");
            console.log(`processing ${src} to ${dst}`);
            try {
                processAudio(src, dst);
            } catch (e) {
                console.error(`Failed to convert ${src}`, e);
                process.exitCode = 1;
            }
        }
    }
}


main();