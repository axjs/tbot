require('dotenv').config()

var apiai = require('apiai')
var app = apiai(process.env.DIALOGFLOW_TOKEN)

const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')
const { reply } = Telegraf
const fs = require('fs')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { enter, leave } = Stage
const WizardScene = require('telegraf/scenes/wizard')
const Composer = require('telegraf/composer')

const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

const catPhoto = 'http://lorempixel.com/400/200/cats/'
const sayYoMiddleware = ({ reply }, next) => reply('yo').then(() => next())

// const keyboard = Markup.inlineKeyboard([
//   Markup.urlButton('❤️', 'http://telegraf.js.org'),
//   Markup.callbackButton('Delete', 'delete')
// ])

bot.start((ctx) => ctx.reply('Hey there!'))
// bot.command('help', (ctx) => ctx.reply('Try send a sticker!'))
// bot.hears('hi', (ctx) => ctx.reply('Hey there!'))
// bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy!'))
// bot.on('sticker', (ctx) => ctx.reply('👍'))

// bot.on('message', (ctx) => ctx.telegram.sendCopy(ctx.from.id, ctx.message, Extra.markup(keyboard)))
// bot.action('delete', ({ deleteMessage }) => deleteMessage())

bot.use(session())

// Register logger middleware
bot.use((ctx, next) => {
  const start = new Date()
  return next().then(() => {
    const ms = new Date() - start
    console.log('response time %sms', ms)
  })
})

// Random location on some text messages
// bot.on('text', ({ replyWithLocation }, next) => {
//   if (Math.random() > 0.2) {
//     return next()
//   }
//   return Promise.all([
//     replyWithLocation((Math.random() * 180) - 90, (Math.random() * 180) - 90),
//     next()
//   ])
// })

// Text messages handling
bot.hears('Hey', sayYoMiddleware, (ctx) => {
  ctx.session.heyCounter = ctx.session.heyCounter || 0
  ctx.session.heyCounter++
  return ctx.replyWithMarkdown(`_Hey counter:_ ${ctx.session.heyCounter}`)
})

// Command handling
bot.command('answer', sayYoMiddleware, (ctx) => {
  console.log(ctx.message)
  return ctx.reply('*42*', Extra.markdown())
})

bot.command('cat', ({ replyWithPhoto }) => replyWithPhoto(catPhoto))

// Streaming photo, in case Telegram doesn't accept direct URL
bot.command('cat2', ({ replyWithPhoto }) => replyWithPhoto({ url: catPhoto }))

// Look ma, reply middleware factory
bot.command('foo', reply('http://coub.com/view/9cjmt'))

// Wow! RegEx
bot.hears(/reverse (.+)/, ({ match, reply }) => reply(match[1].split('').reverse().join('')))

bot.command('onetime', ({ reply }) =>
  reply('One time keyboard', Markup
    .keyboard(['/simple', '/inline', '/pyramid', '/custom', '/special', '/random'])
    .oneTime()
    .resize()
    .extra()
  )
)

bot.command('custom', ({ reply }) => {
  return reply('Custom buttons keyboard', Markup
    .keyboard([
      ['🔍 Search', '😎 Popular'], // Row1 with 2 buttons
      ['☸ Setting', '📞 Feedback'], // Row2 with 2 buttons
      ['📢 Ads', '⭐️ Rate us', '👥 Share'] // Row3 with 3 buttons
    ])
    .oneTime()
    .resize()
    .extra()
  )
})

bot.command('special', (ctx) => {
  return ctx.reply('Special buttons keyboard', Extra.markup((markup) => {
    return markup.resize()
      .keyboard([
        markup.contactRequestButton('Send contact'),
        markup.locationRequestButton('Send location')
      ])
  }))
})

bot.command('pyramid', (ctx) => {
  return ctx.reply('Keyboard wrap', Extra.markup(
    Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
      wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
    })
  ))
})

bot.command('simple', (ctx) => {
  return ctx.replyWithHTML('<b>Coke</b> or <i>Pepsi?</i>', Extra.markup(
    Markup.keyboard(['Coke', 'Pepsi'])
  ))
})

bot.command('inline', (ctx) => {
  return ctx.reply('<b>Coke</b> or <i>Pepsi?</i>', Extra.HTML().markup((m) =>
    m.inlineKeyboard([
      m.callbackButton('Coke', 'Coke'),
      m.callbackButton('Pepsi', 'Pepsi')
    ])))
})

bot.command('random', (ctx) => {
  return ctx.reply('random example',
    Markup.inlineKeyboard([
      Markup.callbackButton('Coke', 'Coke'),
      Markup.callbackButton('Dr Pepper', 'Dr Pepper', Math.random() > 0.5),
      Markup.callbackButton('Pepsi', 'Pepsi')
    ]).extra()
  )
})

bot.hears(/\/wrap (\d+)/, (ctx) => {
  return ctx.reply('Keyboard wrap', Extra.markup(
    Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
      columns: parseInt(ctx.match[1])
    })
  ))
})

bot.action('Dr Pepper', (ctx, next) => {
  return ctx.reply('👍').then(() => next())
})

bot.action(/.+/, (ctx) => {
  return ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`)
})

// function sendLiveLocation(ctx) {
//   let lat = 42.0
//   let lon = 42.0
//   ctx.replyWithLocation(lat, lon, { live_period: 60 }).then((message) => {
//     const timer = setInterval(() => {
//       lat += Math.random() * 0.001
//       lon += Math.random() * 0.001
//       ctx.telegram.editMessageLiveLocation(lat, lon, message.chat.id, message.message_id).catch(() => clearInterval(timer))
//     }, 1000)
//   })
// }
// bot.start(sendLiveLocation)

// bot.command('local', (ctx) => ctx.replyWithPhoto({ source: '/cats/cat1.jpeg' }))
// bot.command('stream', (ctx) => ctx.replyWithPhoto({ source: fs.createReadStream('/cats/cat2.jpeg') }))
// bot.command('buffer', (ctx) => ctx.replyWithPhoto({ source: fs.readFileSync('/cats/cat3.jpeg') }))
bot.command('pipe', (ctx) => ctx.replyWithPhoto({ url: 'http://lorempixel.com/400/200/cats/' }))
bot.command('url', (ctx) => ctx.replyWithPhoto('http://lorempixel.com/400/200/cats/'))
bot.command('caption', (ctx) => ctx.replyWithPhoto('http://lorempixel.com/400/200/cats/', { caption: 'Caption text' }))

bot.command('album', (ctx) => {
  ctx.replyWithMediaGroup([
    {
      'media': 'AgADBAADXME4GxQXZAc6zcjjVhXkE9FAuxkABAIQ3xv265UJKGYEAAEC',
      'caption': 'From file_id',
      'type': 'photo'
    },
    {
      'media': 'http://lorempixel.com/500/300/cats/',
      'caption': 'From URL',
      'type': 'photo'
    },
    {
      'media': { url: 'http://lorempixel.com/400/200/cats/' },
      'caption': 'Piped from URL',
      'type': 'photo'
    }
    // {
    //   'media': { source: '/cats/cat1.jpeg' },
    //   'caption': 'From file',
    //   'type': 'photo'
    // },
    // {
    //   'media': { source: fs.createReadStream('/cats/cat2.jpeg') },
    //   'caption': 'From stream',
    //   'type': 'photo'
    // },
    // {
    //   'media': { source: fs.readFileSync('/cats/cat3.jpeg') },
    //   'caption': 'From buffer',
    //   'type': 'photo'
    // }
  ])
})

// Greeter scene
const greeterScene = new Scene('greeter')
greeterScene.enter((ctx) => ctx.reply('Hi'))
greeterScene.leave((ctx) => ctx.reply('Bye'))
greeterScene.hears('hi', enter('greeter'))
greeterScene.on('message', (ctx) => ctx.replyWithMarkdown('Send `hi`'))

// Echo scene
const echoScene = new Scene('echo')
echoScene.enter((ctx) => ctx.reply('echo scene'))
echoScene.leave((ctx) => ctx.reply('exiting echo scene'))
echoScene.command('back', leave())
echoScene.on('text', (ctx) => ctx.reply(ctx.message.text))
echoScene.on('message', (ctx) => ctx.reply('Only text messages please'))

// Dialog flow
const sessionId = 'hxb8udj9y3auyixb3e87bb238'
const dfScene = new Scene('df')
dfScene.enter((ctx) => ctx.reply('dialog flow'))
dfScene.leave((ctx) => ctx.reply('exiting echo scene'))
dfScene.command('back', leave())
dfScene.on('text', (ctx) => {
  var request = app.textRequest(ctx.message.text, {
    sessionId: sessionId
  })

  request.on('response', function (response) {
    console.log(response)
    ctx.reply(response.result.fulfillment.speech || 'Непонятно...')
  })
  request.end()
}
)

dfScene.on('message', (ctx) => ctx.reply('Only text messages please'))

const stage = new Stage([greeterScene, echoScene, dfScene], { ttl: 1000 })
// bot.use(session())
bot.use(stage.middleware())
bot.command('greeter', enter('greeter'))
bot.command('echo', enter('echo'))
bot.command('df', enter('df'))
bot.on('message', (ctx) => ctx.reply('Try /df or /echo or /greeter'))

const stepHandler = new Composer()
stepHandler.action('next', (ctx) => {
  ctx.reply('Step 2. Via inline button')
  return ctx.wizard.next()
})
stepHandler.command('next', (ctx) => {
  ctx.reply('Step 2. Via command')
  return ctx.wizard.next()
})
stepHandler.use((ctx) => ctx.replyWithMarkdown('Press `Next` button or type /next'))

const superWizard = new WizardScene('super-wizard',
  (ctx) => {
    ctx.reply('Step 1', Markup.inlineKeyboard([
      Markup.urlButton('❤️', 'http://telegraf.js.org'),
      Markup.callbackButton('➡️ Next', 'next')
    ]).extra())
    return ctx.wizard.next()
  },
  stepHandler,
  (ctx) => {
    ctx.reply('Step 3')
    return ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('Step 4')
    return ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('Done')
    return ctx.scene.leave()
  }
)

const stage2 = new Stage([superWizard], { default: 'super-wizard' })
// bot.use(session())
bot.use(stage2.middleware())

bot.startPolling()
