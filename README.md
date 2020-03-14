[![npm](https://img.shields.io/npm/v/voicecmd.svg?maxAge=3600&style=flat-square)](https://www.npmjs.com/package/voicecmd)
[![npm](https://img.shields.io/npm/l/voicecmd.svg?maxAge=3600&style=flat-square)](https://github.com/talmobi/voicecmd/blob/master/LICENSE)

#  voicecmd
simple wildcard pub/sub store

## Easy to use

#### CLI usage
```javascript
voicecmd '* | say *'
// TODO
```
```
```

#### Module usage 1
```javascript
const voicecmd = require( 'voicecmd' )
const v = voicecmd()
v.on( 'exit', process.exit )
v.on( 'speechrecognition', function ( text ) {
    console.log( 'SpeechRecognition: ' + text )
} )
```

#### Module usage 1
```javascript
const voicecmd = require( 'voicecmd' )
const ytp = require( 'yt-play-cli' )
const yts = require( 'yt-search' )

const v = voicecmd()
v.on( 'exit', process.exit )
v.on( 'speechrecognition', function ( text ) {
    console.log( 'SpeechRecognition: ' + text )

    if ( text.indexOf( 'play' ) === 0 ) {
      const search = text.slice( 'play'.length ).trim()
      searchAndPlay( search )
    } else {
      console.log( 'no play found' )
    }
} )

function searchAndPlay ( search ) {
  yts( search, function ( err, r ) {
    if ( err ) return console.log( err )
    const song = r.videos && r.videos[ 0 ]
    if ( song ) {
      ytp.play( song.videoId )

      // format the results nicer
      const details = (
        ' (' + song.timestamp + ')' +
        ' views: ' + song.views +
        ' | ' + song.title +
        ' - ' + song.videoId
      ).trim()

      console.log( 'playing: ' + details  )
    }
  } )
}
```

## Requirements
  Google Chrome must be installed. The module looks for it
  automatically using the 'chrome-finder' npm module.

## About
  Simple way to recognize voice input and do something with it.

## Why
  Originally intended to capture voice commands and do arbitrary
  commands such as turning off monitor screens, pausing music,
  shutting down, playing specific videos etc...

## For who? For what?
  Those wanting to test speech recognition.

  Mainly for small doodles and experiments.

## How
  Originally used a trained tf audio model but it was very
  limited and quite bad. So now uses chrome's inbuilt webkitSpeechRecognition api.

  The downside is that it requries a chrome installation and
  internet connection. The original could be run offline and
  without chrome, but it sucked. Can be found in the 'tf' branch.

  There's probably a limit to how much each chrome installation
  can use the API, too, not sure. I think chrome installations
  come with a unique API key that it uses.

## Similar
[voice-speech-recognition](https://github.com/krzaku281/voice-speech-recognition#readme)

[@google-cloud/speech](https://www.npmjs.com/package/@google-cloud/speech)

## Test
```
No tests until I figure out how to send prerecorded voice output
into the mic easily without a bunch of hacks. Run the `debug.js` file to dev/test.
```

