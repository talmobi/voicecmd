#!/usr/bin/env node

// text-to-speech
const say = require( 'say' )

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
} )

api.events.on( 'ni-ban', function () {
  say.speak( 'momo found knee-ban command!' )
} )

api.events.on( 'san-ban', function () {
  say.speak( 'momo found san-ban command!' )
} )

api.events.on( 'hai', function () {
  say.speak( 'Yes.' )
} )

api.events.on( 'iie', function () {
  say.speak( 'No.' )
} )
