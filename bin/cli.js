#!/usr/bin/env node

const childProcess = require( 'child_process' )
const program = require( 'commander' )

const nz = require( 'nozombie' )()

process.on( 'SIGINT', function () {
  nz.add( process.pid )
} )

process.on( 'exit', end )

function end () {
  nz.kill()
}

function exec ( command ) {
  console.log( 'exec: ' + command )
  const split = command.trim().split( /\s+/ )
  const cmd = split.shift()
  const args = split

  const spawn = childProcess.spawn( cmd, args )
  const ttl = 1000 * 10
  nz.add( spawn, ttl )

  spawn.stdout.pipe( process.stdout )
  spawn.stderr.pipe( process.stderr )
}

program
.version( require( '../package.json' ).version )
.option( '-1 [command]', 'execute program on ichi-ban command' )
.option( '-2 [command]', 'execute program on ni-ban command' )
.option( '-3 [command]', 'execute program on san-ban command' )
.option( '-y [command]', 'execute program on hai/yes command' )
.option( '-n [command]', 'execute program on iie/no command' )
.option( '-s, --silent', 'do not speak' )
.option( '-m [command]', 'execute program on "momo-san" command' )

program.parse( process.argv )

// text-to-speech
const say = require( 'say' )

if ( program.silent ) {
  say.speak = function () {}
}

const api = require( './../main.js' )

api.start()

api.events.on( 'listening', function () {
  const port = api.server.address().port
  console.log( 'server listening on port: ' + port )
} )

api.events.on( 'ready', function () {
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
} )

api.events.on( 'momo', function () {
  say.speak( 'Momo!' )
} )

api.events.on( 'momofail', function () {
  say.speak( 'Momo did not understand, please try again.' )
} )

api.events.on( 'parsing-new', function ( words ) {
  console.log( 'parsing: ' )
  console.log( words )
} )

api.events.on( 'ichi-ban', function () {
  say.speak( 'momo found ichi-ban command!' )

  const cmd = program[ '1' ]
  if ( cmd ) {
    exec( cmd )
  }
} )

api.events.on( 'ni-ban', function () {
  say.speak( 'momo found knee-ban command!' )

  const cmd = program[ '2' ]
  if ( cmd ) {
    exec( cmd )
  }
} )

api.events.on( 'san-ban', function () {
  say.speak( 'momo found san-ban command!' )

  const cmd = program[ '3' ]
  if ( cmd ) {
    exec( cmd )
  }
} )

api.events.on( 'hai', function () {
  say.speak( 'Yes.' )

  const cmd = program[ 'y' ]
  if ( cmd ) {
    exec( cmd )
  }
} )

api.events.on( 'iie', function () {
  say.speak( 'No.' )

  const cmd = program[ 'n' ]
  if ( cmd ) {
    exec( cmd )
  }
} )
