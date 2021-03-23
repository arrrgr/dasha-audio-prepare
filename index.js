const exec = require("child_process");
const tmp = require("tmp");
const fs = require("fs")
const path = require("path");
const { ENOENT } = require("constants");

class FfmpegException extends Error {
    constructor(message) {
        super(message);
    }
}

async function runFFMPEG(args) {
    const ffmpeg = await exec.spawnSync(
        "ffmpeg", args, { encoding: "utf8" }
    );
    if (ffmpeg.error !== undefined) {
        console.log(ffmpeg.error.code);
        if (ffmpeg.error.code === "ENOENT") {
            throw new FfmpegException(`ffmpeg not found, install it first`);
        }
        throw new FfmpegException(`ffmpeg exited: ${ffmpeg.error}`);
    }
    if (ffmpeg.status != 0) {
        throw new FfmpegException(`ffmpeg exited: ${ffmpeg.status} ${ffmpeg.stderr}`);
    }
}

async function Process(src, dst) {
    const leftPad = 100;
    const rightPad = 400;
    const filters = `loudnorm=i=-15,silenceremove=1:0.1:-50dB,areverse,silenceremove=1:0.1:-50dB,adelay=${rightPad},areverse,adelay=${leftPad}`;
    await runFFMPEG(["-i", src, "-ac", "1", "-af", filters, dst, "-y"]);
}


async function main() {
    const srcDir = process.argv[2];
    const dstDir = process.argv[3];
    let hasErrors = false;
    if (srcDir == undefined || dstDir == undefined) {
        console.log("node index.js <src_dir> <dst_dir>");
        return;
    }
    var entries = await fs.promises.readdir(srcDir);
    await fs.promises.mkdir(dstDir, { recursive: true });
    for (const i in entries) {
        var ext = path.extname(entries[i]).toLowerCase();
        if (ext == ".wav" || ext == ".mp3") {
            const src = path.join(srcDir, entries[i]);
            const dst = path.join(dstDir, path.parse(entries[i]).name + ".mp3");
            console.log(`processing ${src} to ${dst}`);
            try {
                await Process(src, dst);
            } catch (e) {
                console.error(`Failed to convert ${src}`, e);
                hasErrors = true;
            }
        }
    }
    if (hasErrors)
        process.exit(1);
    process.exit(0);
}


main();