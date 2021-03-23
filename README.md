Sample application based on FFMPEG

Can be used to normalize and strip silence in the audio

just run 
* `npm i`
* `node index.js srcDir dstDir`

Programm will process each `wav` and `mp3` file and put processed `mp3` to `dstDir` with the same name

On any error: process exit code will be `1`, otherwise `0`