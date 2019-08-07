import { Command, Structures } from 'detritus-client';

import {
  PresenceStatusColors,
  PresenceStatusTexts,
} from '../constants';
import { Parameters } from '../utils';


export default (<Command.CommandOptions> {
  name: 'activity',
  aliases: ['presence'],
  label: 'user',
  type: Parameters.memberOrUser,
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.reply('⚠ Unable to embed information in this channel.'),
  onBeforeRun: (context, args) => !!args.user,
  onCancelRun: (context) => context.reply('⚠ Unable to find that guy.'),
  run: async (context, args) => {
    const user = <Structures.User> args.user;

    const fields: Array<{
      inline?: boolean,
      name: string,
      value: string,
    }> = [];

    let color: number = PresenceStatusColors['offline'];
    let thumbnail: string | undefined;
    const presence = user.presence;
    if (presence) {
      let text = presence.status;
      if (presence.status in PresenceStatusTexts) {
        text = PresenceStatusTexts[presence.status];
      }

      const activity = presence.activity;
      if (activity) {
        text += ` while ${activity.typeText.toLowerCase()} ${activity.name}`;
      }
      fields.push({
        name: 'Activity',
        value: text,
      });

      if (presence.status in PresenceStatusColors) {
        color = PresenceStatusColors[presence.status];
      }

      if (activity) {
        // now do the fields
        thumbnail = activity.imageUrlFormat(null, {size: 1024}) || undefined;

        if (activity.timestamps) {
          const elapsed = activity.timestamps.elapsedTime;
          const total = activity.timestamps.totalTime;
          fields.push({
            inline: true,
            name: 'Time',
            value: (total) ? `${elapsed}/${total}` : `${elapsed}`,
          });
        }

        if (activity.party) {
          const currentSize = activity.party.currentSize;
          const maxSize = activity.party.maxSize;
          const group = activity.party.group.map((user) => {
            return user.mention;
          });

          fields.push({
            name: 'Group',
            value: [
              (activity.party.size) ? `${currentSize}/${maxSize}` : null,
              (group.length) ? `**Members**: ${group.join(', ')}` : null,
            ].filter((v) => v).join('\n'),
          });
        }
      }
    } else {
      fields.push({
        name: 'Activity',
        value: PresenceStatusTexts['offline'],
      });
    }

    await context.reply({
      embed: {
        author: {
          iconUrl: user.avatarUrlFormat(null, {size: 1024}),
          name: user.toString(),
          url: user.jumpLink,
        },
        color,
        fields,
        thumbnail: {
          url: thumbnail,
        },
      },
    });
  },
  onError: (context, args, error) => {
    console.error(error);
  },
  onRunError: (context, args, error) => {
    console.error(error);
  },
  onTypeError: (context, error) => {
    console.error(error);
  },
});
