const puppeteer = require( 'puppeteer' )

const api = {}

api.events = new ( require( 'events' ) )()
api.start = start
api.stop = stop

module.exports = api

// track mouse position to detect "idle" time -> execute
// command only if mouse position has not moved within a certain
// short period.
const robot = require( 'robotjs' )

let _exec_timeout = undefined
let _idle_since = Date.now()

const fs = require( 'fs' )
const path = require( 'path' )

const express = require( 'express' )
const http = require( 'http' )
const app = express()
app.use( express.static( __dirname ) )

const server = http.createServer( app )

// get random free port to start server on
const getPort = require( 'get-port' )

// polling sockets
const kiite = require( 'kiite' )

const childProcess = require( 'child_process' )
// track spawns
const nozombie = require( 'nozombie' )
const _nz = nozombie()

let _started = false

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

function handleSocket ( socket ) {
  // console.log( 'kiite socket connected!' )

  socket.on( 'ready', function () {
    setTimeout( function () {
      api.events.emit( 'ready' )
      setTimeout( function () {
        _ready = true
      }, 1500 )
    }, 1500 )
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
          api.events.emit( 'momo' )
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
}

function momoIsListening () {
  for ( let i = 0; i < _words.length; i++ ) {
    const word = _words[ i ]
    if ( word.label === 'momo-san' ) return true
  }

  return false
}

function tick () {
  updateWords( false )
  setTimeout( tick, 1000 )
}

let _reset_timeout = undefined
function reset ( ms ) {
  _words = []
  _ready = false

  const str = (
    _words.map( function ( v ) { return v.label } )
    .join( ',' )
  )
  api.words = str

  clearTimeout( _reset_timeout )
  _reset_timeout = setTimeout( function () {
    _ready = true
  }, ms || 2000 )
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
    api.events.emit( 'momofail' )
    reset()
    return
  }

  const str = (
    _words.map( function ( v ) { return v.label } )
    .join( ',' )
  )
  api.words = str
  hasNewWords && api.events.emit( 'parsing-new', str )

  if ( str.match( /momo-san,.*ichi-ban/ ) ) {
    api.events.emit( 'ichi-ban' )
    reset()
  }

  if ( str.match( /momo-san,.*ni-ban/ ) ) {
    api.events.emit( 'ni-ban' )
    reset()
  }

  if ( str.match( /momo-san,.*san-ban/ ) ) {
    api.events.emit( 'san-ban' )
    reset()
  }

  if ( str.match( /momo-san,.*hai/ ) ) {
    api.events.emit( 'hai' )
    reset()
  }

  if ( str.match( /momo-san,.*iie/ ) ) {
    api.events.emit( 'iie' )
    reset()
  }
}

function stop () {
  _nz.clean()
  server.close( function () {
    _started = false
  } )
}

async function start () {
  if ( _started ) return
  _started = true

  // start ticking
  setTimeout( tick, 1000 )

  // attach socket (polling) server
  const io = kiite( server )

  io.on( 'connect', handleSocket )

  const port = await getPort()
  server.listen( port, function () {
    api.server = server
    api.events.emit( 'listening', server.address() )
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
