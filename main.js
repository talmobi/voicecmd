const puppeteer = require( 'puppeteer' )

// track mouse position to detect "idle" time -> execute
// command only if mouse position has not moved within a certain
// short period.
const robot = require( 'robotjs' )

let _exec_timeout = undefined
let _idle_since = Date.now()

const fs = require( 'fs' )
const path = require( 'path' )

// text-to-speech
const say = require( 'say' )

const express = require( 'express' )
const http = require( 'http' )
const app = express()
app.use( express.static( __dirname ) )

const server = http.createServer( app )

// get random free port to start server on
const getPort = require( 'get-port' )

// polling sockets
const kiite = require( 'kiite' )
const io = kiite( server )

const childProcess = require( 'child_process' )
// track spawns
const nozombie = require( 'nozombie' )
const _nz = nozombie()

process.on( 'SIGINT', function () {
  _nz.add( process.pid )
  _nz.kill()
  process.exit()
} )

let _ready = false

// time-to-live
const _word_ttl = 1000 * 5
// recognized words
let _words = []

io.on( 'connect', function ( socket ) {
  console.log( 'kiite socket connected!' )

  socket.on( 'ready', function () {
    setTimeout( function () {
      _ready = true
      console.log( 'ready! listening for voice commands:' )

      // print list of available commands
      console.log( 'recognized words:' )
      console.log( 'momo-san, ichi-ban, ni-ban, san-ban, hai, iie' )

      console.log( 'recognized commands ( two word combinations ):' )
      console.log( 'momo-san, ichi-ban' )
      console.log( 'momo-san, ni-ban' )
      console.log( 'momo-san, san-ban' )
      console.log( 'momo-san, hai' )
      console.log( 'momo-san, iie' )
    }, 3000 )
  } )

  socket.on( 'scores', function ( scores ) {
    if ( !_ready ) return

    // console.log( 'scores' )
    // console.log( scores )

    const labels = Object.keys( scores )
    const sorted = labels.map( function ( label ) {
      // also turn into number
      scores[ label ] = Number( scores[ label ] )

      return {
        label: label,
        score: scores[ label ]
      }
    } ).sort( function ( a, b ) {
      return b.score - a.score
    } )

    let highest = sorted[ 0 ].label
    // console.log( 'highest: ' + highest )

    // if momo-san command is already listening give second
    // highest command priority
    if ( momoIsListening() && highest === 'momo-san' ) {
      highest = sorted[ 1 ].label
    }

    let trigger = false

    if ( scores[ '_background_noise_' ] < .25 ) {
      if ( scores[ highest ] >= 0.35 ) {
        trigger = true
      }
    }

    if ( trigger ) {
      switch ( highest ) {
        case 'momo-san':
          say.speak( 'Momo!' )
          break
      }

      const now = Date.now()
      // add to end of array
      _words.push( {
        label: highest,
        time: now
      } )

      updateWords( true )
    }
  } )

  socket.on( 'disconnect', function ( command ) {
    console.log( 'kiite socket left.' )
  } )
} )

start()

function momoIsListening () {
  for ( let i = 0; i < _words.length; i++ ) {
    const word = _words[ i ]
    if ( word.label === 'momo-san' ) return true
  }

  return false
}

// start ticking
setTimeout( tick, 1000 )

function tick () {
  updateWords( false )
  setTimeout( tick, 1000 )
}

function updateWords ( hasNewWords ) {
  if ( _words.length < 1 ) return

  const momoWasListening = momoIsListening()

  const now = Date.now()
  // remove old words
  _words = _words.filter( function ( word ) {
    const delta = ( now - word.time )
    return delta <= _word_ttl
  } )

  if ( momoWasListening && !momoIsListening() ) {
    say.speak( 'Momo did not understand, please try again.' )
    _words = []
    return
  }

  var str = (
    _words.map( function ( v ) { return v.label } )
    .join( ',' )
  )

  hasNewWords && console.log( 'parsing: ' )
  // log only labels
  hasNewWords && console.log(
    _words.map( function ( v ) { return v.label } )
    .join( ',' )
  )

  if ( str.match( /momo-san,.*ichi-ban/ ) ) {
    say.speak( 'momo found ichi-ban command!' )
    _words = []
  }

  if ( str.match( /momo-san,.*ni-ban/ ) ) {
    say.speak( 'momo found knee-ban command!' )
    _words = []
  }

  if ( str.match( /momo-san,.*san-ban/ ) ) {
    say.speak( 'momo found san-ban command!' )
    _words = []
  }

  if ( str.match( /momo-san,.*hai/ ) ) {
    say.speak( 'Yes.' )
    _words = []
  }

  if ( str.match( /momo-san,.*iie/ ) ) {
    say.speak( 'No.' )
    _words = []
  }
}

async function start () {
  const port = await getPort()
  server.listen( port, function () {
    console.log( 'server listening at: ', server.address() )
    launchPuppeteer( server.address().port )
  } )
}

async function launchPuppeteer ( port ) {
  const opts = {
    // set to false to see what we're doing during development
    headless: true
  }

  // auto allow mic access
  opts.args = [
    // enables mic without user dialog prompt
    '--use-fake-ui-for-media-stream'
  ]

  const browser = await puppeteer.launch( opts )
  const pid = browser.process().pid
  _nz.add( pid )
  const page = await browser.newPage()

  const preload = (`
    console.log( '${ Date.now() }' )
  `)

  fs.writeFileSync( 'preload.js', preload, 'utf8' )

  await page.goto( `http://127.0.0.1:${ port }` )
}
