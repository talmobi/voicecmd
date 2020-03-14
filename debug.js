const voicecmd = require( './main.js' )

const ytp = require( 'yt-play-cli' )
const yts = require( 'yt-search' )

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

searchAndPlay( 'waltz goes on' )

const vc = voicecmd()

vc.on( 'exit', function () {
  process.exit()
} )

vc.on( 'message', function ( text ) {
  console.log( 'SpeechRecognition: ' + text )

  const command = text.toLowerCase()
  console.log( 'command: ' + command )

  if ( command.indexOf( 'play' ) === 0 ) {
    const search = command.slice( 'play'.length ).trim()
    searchAndPlay( search )
  } else {
    console.log( 'no play found' )
  }
} )
