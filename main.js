const puppeteer = require( 'puppeteer' )

const fs = require( 'fs' )
const path = require( 'path' )

// text-to-speech
const say = require( 'say' )

const express = require( 'express' )
const http = require( 'http' )
const app = express()
app.use( express.static( __dirname ) )

const server = http.createServer( app )

// polling sockets
const kiite = require( 'kiite' )
const io = kiite( server )

process.on( 'SIGINT', function () {
  nz.add( process.pid )
  nz.kill()
  process.exit()
} )

const childProcess = require( 'child_process' )
// track spawns
const nozombie = require( 'nozombie' )
const nz = nozombie()

io.on( 'connect', function ( socket ) {
  console.log( 'kiite socket connected!' )

  socket.on( 'ready', function () {
    console.log( 'ready! listening for voice commands:' )

    // list of voice commands
    console.log( '  monitor off' )
  } )

  socket.on( 'scores', function ( scores ) {
    const score = decimals( scores[ 0 ], 2 )
    console.log( `voicecmd[Monitor Off]: ${ score }` )
  } )

  socket.on( 'execute', function ( command ) {
    console.log( 'socket command execution: ' + command )

    const split = command.trim().split( /\s+/ )

    const cmd = split.shift() // first element is command
    const args = split // the rest are arguments

    say.speak( 'Voice command detected.' )

    function execute () {
      const spawn = childProcess.spawn( cmd, args )
      // time-to-live should exit within 10 seconds
      const ttl = 1000 * 10
      nz.add( spawn.pid, ttl )

      // pipe output to console
      spawn.stdout.pipe( process.stdout )
      spawn.stderr.pipe( process.stderr )
    }
  } )

  socket.on( 'disconnect', function ( command ) {
    console.log( 'kiite socket left.' )
  } )
} )

// get random free port
const getPort = require( 'get-port' )

start()

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
  nz.add( pid )
  const page = await browser.newPage()

  const preload = (`
    console.log( '${ Date.now() }' )
  `)

  fs.writeFileSync( 'preload.js', preload, 'utf8' )

  await page.goto( `http://127.0.0.1:${ port }` )
}

function decimals ( num, decimals ) {
  num = String( num )
  const split = num.split( '.' )
  let dec = split[ 1 ]
  while ( dec.length < decimals ) dec += '0'
  if ( dec.length > decimals ) dec = dec.slice( 0, decimals )
  return split[ 0 ] + '.' + dec
}
