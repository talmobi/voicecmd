#!/usr/bin/env node

const childProcess = require( 'child_process' )
const program = require( 'commander' )

const nz = require( 'nozombie' )()

process.on( 'exit', clean )

function clean () {
  nz.kill()
}

function exec ( command ) {
  console.log( 'exec: ' + command )
  const split = command.trim().split( /\s+/ )
  const cmd = split.shift()
  const args = split

  const spawn = childProcess.spawn( cmd, args )
  nz.add( spawn.pid )

  spawn.stdout.pipe( process.stdout )
  spawn.stderr.pipe( process.stderr )
}

program
.version( require( '../package.json' ).version )
.option( '-f, --filter <filter>', 'filter recognitions' )
.option( '-x, --execute <command>', 'execute program with args' )

program.parse( process.argv )

const voicecmd = require( './../main.js' )
const vc = voicecmd()

vc.on( 'message', function ( text ) {
  const lt = text.toLowerCase().trim()
  if ( program.filter ) {
    const lf = program.filter.toLowerCase().trim()
    if ( lt.indexOf( lf ) === -1 ) return
  }

  if ( program.execute ) {
    console.log( text )
    exec( program.execute + ' ' + text )
  } else {
    console.log( text )
  }
} )
