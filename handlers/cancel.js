const {App} = require('@slack/bolt');

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

const handler = async ({ack, context, body, action, respond}) => {
  ack();

  try {
    await app.client.chat.deleteScheduledMessage({
      token: context.botToken,
      scheduled_message_id: action.value,
      channel: body.channel.id,
    });
  } catch (error) {
    console.log(error);
  }

  respond({
    // response_type: 'ephemeral',
    replace_original: true,
    text: ':relieved: This message has been deleted successfully.',
  });
};

module.exports = handler;
