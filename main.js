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
    console.log( 'ready! listening for voice commands:' )

    // list of voice commands
    console.log( '  monitor off' )
  } )

  socket.on( 'scores', function ( scores ) {
    if ( !_ready ) return

  socket.on( 'execute', function ( command ) {
    console.log( 'socket command execution: ' + command )

    const split = command.trim().split( /\s+/ )

    const cmd = split.shift() // first element is command
    const args = split // the rest are arguments

    say.speak( 'Voice command detected. Executing in 15 seconds of idle mouse time.' )

    const mouse = robot.getMousePos()
    const exec_time = Date.now()

    _exec_timeout = setTimeout( function () {
      const mouse_now = robot.getMousePos()

      if ( mouse.x != mouse_now.x || mouse.y != mouse_now.y ) {
        console.log( 'mouse position changed, canceling command.' )
        // mouse position changes -> not idle -> cancel command
        // execution
        return
      }

      if ( _idle_since < exec_time ) {
        say.speak( 'Executing command.' )

        setTimeout( function () {
          execute()
        }, 2000 )
      }
    }, 1000 * 15 )

    function execute () {
      say.speak( 'Executing command!' )
      console.log( 'executing' )

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
  _nz.add( pid )
  const page = await browser.newPage()

  const preload = (`
    console.log( '${ Date.now() }' )
  `)

  fs.writeFileSync( 'preload.js', preload, 'utf8' )

  await page.goto( `http://127.0.0.1:${ port }` )
}
