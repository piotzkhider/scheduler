const {App} = require('@slack/bolt');
const moment = require('moment-timezone');

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

const isTime = /^(\d\d?(([:.]\d{2}([ ]?[a|p]m)?)|([ ]?[a|p]m))$)/i;

const parseTime = (s) => s.match(isTime)[0];
const parseDate = (d, t, tz) => moment.tz(`${d} ${parseTime(t)}`, 'YYYY-MM-DD h:mA', tz);

const handler = async ({ack, view, context, payload, body}) => {
  ack();

  const message = view.state.values.message.message.value;
  const channel = payload.private_metadata;
  const user = body.user.id;
  const timezone = view.state.values.timezone.timezone.selected_option.value;
  const date = parseDate(view.state.values.date.date.selected_date, view.state.values.time.time.value, timezone);

  let result;

  try {
    result = await app.client.chat.scheduleMessage({
      token: context.botToken,
      channel: channel,
      post_at: date.unix(),
      text: message,
    });
  } catch (error) {
    if (error.data) {
      let err;

      if (error.data.error === 'time_in_past') {
        err = `*Oops!* You may not select a schedule date in the past.`;
      } else if (error.data.error === 'time_too_far') {
        err = `*Oops!* You will only be able to schedule a message up to 120 days into the future.`;
      } else {
        err = 'Failed because of `' + error.data.error + '`. please contact ' + `<@${process.env.USER}>.`;
      }

      await app.client.chat.postEphemeral({
        token: context.botToken,
        channel: channel,
        user: user,
        attachments: [
          {
            color: '#e61b42',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: err,
                },
              },
            ],
          },
        ],
      });
    }

    return;
  }

  try {
    await app.client.chat.postEphemeral({
      token: context.botToken,
      channel: channel,
      user: user,
      text: '*Great!* Your message has been scheduled.',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Great!* Your message has been scheduled.',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `🌏 *Time Zone:*\n${timezone}`,
            },
            {
              type: 'mrkdwn',
              text: `🗓 *Date Time:*\n${date.format('YYYY/M/D H:mm')}`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `💬 *Message*:\n${message}`,
            },
          ],
        },
        {
          type: 'actions',
          block_id: 'cancel',
          elements: [
            {
              type: 'button',
              action_id: 'yes',
              text: {
                type: 'plain_text',
                text: 'Cancel',
              },
              value: result.scheduled_message_id,
              style: 'danger',
              confirm: {
                title: {
                  type: 'plain_text',
                  text: 'Are you sure?',
                },
                text: {
                  type: 'plain_text',
                  text: 'This message will be canceled.',
                },
                deny: {
                  type: 'plain_text',
                  text: 'No',
                },
                confirm: {
                  type: 'plain_text',
                  text: 'Yes',
                },
              },
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.log(error);
  }
};

const validate = ({ack, view, next}) => {
  const time = view.state.values.time.time.value;

  if (isTime.test(time)) {
    next();
  }

  ack({
    response_action: 'errors',
    errors: {
      time: 'This field is not in a correct format. Ex: 9:11am, 08.23 PM, 23:03, 10pm',
    },
  });
};

module.exports.handler = handler;
module.exports.validate = validate;
