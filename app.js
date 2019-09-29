const {App} = require('@slack/bolt');
const moment = require('moment-timezone');
const cancel = require('./handlers/cancel');
const ignore = require('./handlers/ignore');
const {handler: schedule, validate: validateTime} = require('./handlers/schedule');

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

const timezones = [
  {
    'text': {
      'type': 'plain_text',
      'text': '(UTC+7:00) Bangkok, Hanoi, Jakarta',
    },
    'value': 'Asia/Bangkok',
  },
  {
    'text': {
      'type': 'plain_text',
      'text': '(UTC-8:00) Kuala Lumpur, Singapore',
    },
    'value': 'Asia/Kuala_Lumpur',
  },
  {
    'text': {
      'type': 'plain_text',
      'text': '(UTC+9:00) Osaka, Sapporo, Tokyo',
    },
    'value': 'Asia/Tokyo',
  },
];

app.command('/schedule', async ({command, ack, payload, context}) => {
  ack();

  let tz;

  try {
    const result = await app.client.users.info({
      token: context.botToken,
      user: command.user_id,
    });

    tz = result.user.tz;
  } catch (error) {
    console.log(error);
  }

  try {
    await app.client.views.open({
      token: context.botToken,
      trigger_id: payload.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'schedule',
        private_metadata: command.channel_id,
        title: {
          type: 'plain_text',
          text: 'Schedule a Message',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'timezone',
            label: {
              type: 'plain_text',
              text: '🌏 Time Zone:',
            },
            element: {
              type: 'static_select',
              action_id: 'timezone',
              placeholder: {
                type: 'plain_text',
                text: 'Select time zone',
              },
              options: timezones,
              initial_option: timezones.find(timezone => timezone.value === tz),
            },
          },
          {
            type: 'input',
            block_id: 'date',
            label: {
              type: 'plain_text',
              text: '🗓 Schedule Date:',
            },
            element: {
              type: 'datepicker',
              action_id: 'date',
              placeholder: {
                type: 'plain_text',
                text: 'Select a date',
              },
              initial_date: moment().tz(tz).format('YYYY-MM-DD'),
            },
          },
          {
            type: 'input',
            block_id: 'time',
            label: {
              type: 'plain_text',
              text: '⏰ Schedule Time:',
            },
            element: {
              type: 'plain_text_input',
              action_id: 'time',
              placeholder: {
                type: 'plain_text',
                text: 'ex. 9:11am, 08.23 PM, 23:03, 10pm',
              },
            },
          },
          {
            type: 'input',
            block_id: 'message',
            label: {
              type: 'plain_text',
              text: '💬 Message:',
            },
            element: {
              type: 'plain_text_input',
              action_id: 'message',
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: 'Your message',
              },
            },
          },
        ],
        submit: {
          type: 'plain_text',
          text: 'Schedule',
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
});

app.view('schedule', validateTime, schedule);

app.action({callback_id: 'schedule'}, ignore);

app.action({block_id: 'cancel', action_id: 'yes'}, cancel);

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');

})();
