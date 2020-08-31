const puppeteer = require( 'puppeteer-core' )
const chromePath = require( 'chrome-finder' )()
const fileUrl = require( 'file-url' )

const fs = require( 'fs' )
const path = require( 'path' )

const eeto = require( 'eeto' )

const nozombie = require( 'nozombie' )

module.exports = main

let _tick_timeout
function main () {
  const nz = nozombie()

  // return this event emitter api to user
  const api = eeto()

  api.close = api.exit = async function () {
    try {
      await browser.close()
    } catch ( ignore ) {}
  }

  ;( async function () {
    const opts = {
      executablePath: chromePath,
      headless: false,
      ignoreDefaultArgs: [
        '--mute-audio',
        '--hide-scrollbars',
        // '--enable-automation'
      ],
      args: [
        // '--no-sandbox',
        '--window-position=0,0',
        '--window-size=1,1',
        '--allow-insecure-localhost',
        '--use-fake-ui-for-media-stream', // auto allow mic
      ]
    }
    const browser = await puppeteer.launch( opts )
    nz.add( browser.process().pid )
    const [ page ] = await browser.pages()

    page.on( 'close', async function () {
      nz.kill()

      api.emit( 'exit' )
      api.emit( 'close' )
      clearTimeout( _tick_timeout )

      try {
        await browser.close()
      } catch ( ignore ) {}
    } )

    // await page.setViewport( {
    //     width: 1,
    //     height: 1,
    //     deviceScaleFactor: 1,
    // } )

    await page.goto( fileUrl( path.join( './index.html' ) ) )

    _tick_timeout = setTimeout( tick, 250 )
    async function tick () {
      const text = await page.evaluate( function () {
        const list = document.getElementById( 'list' )
        if ( !list ) return

        const el = list.firstChild
        if ( el ) {
          const t = el.textContent
          list.removeChild( el )
          document.getElementById( 'last-recognition' ).textContent = t
          return t
        }
      } )

      if ( text ) {
        let t = text.trim()
        t && api.emit( 'message', t )
        t && api.emit( 'command', t )
        t && api.emit( 'recognition', t )
        t && api.emit( 'speechrecognition', t )
      }

      _tick_timeout = setTimeout( tick, 250 )
    }
  } )()

  return api
}

process.on( 'exit', async function () {
  try {
    await browser.close()
  } catch ( ignore ) {}
} )
