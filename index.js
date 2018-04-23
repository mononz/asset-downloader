let fs        = require('fs');
let request   = require('request');
let mkdirp    = require('mkdirp');
let validUrl  = require('valid-url');
let reader    = require('line-by-line');
let url       = require("url");
let path      = require("path");

let filePath = './sample.txt';
let outputDirectory = './output';

let lr = new reader(filePath);

let processed = {
  total: 0,
  skipped: 0,
  completed: 0,
};

lr.on('error', err => {
  console.error(err)
});

lr.on('line', async line => {
  processed.total++;
  lr.pause();
  if (validUrl.isUri(line)) {
    let parsed = url.parse(line);
    let filename = path.basename(parsed.pathname);
    if (filename != null && filename.length > 0) {
      await downloadAsset(line, filename);
      console.log(`Completed: ${filename} from ${line}`);
      processed.completed++
    } else {
      console.error(`Skipped: ${line}`);
      processed.skipped++
    }
  } else {
    console.error(`Skipped: ${line}`);
    processed.skipped++
  }
  lr.resume();
});

lr.on('end', () => {
  console.log(`All done! Processed ${processed.completed}/${processed.total}`);
});

async function downloadAsset(url, filename) {
  return new Promise(resolve => {
    mkdirp(outputDirectory, function (err) {
      if (err) {
        console.error(err);
        return
      }
      let stream = request(url).pipe(fs.createWriteStream(outputDirectory + '/' + filename));
      stream.on('finish', function () {
        resolve();
      });
    });
  });
}