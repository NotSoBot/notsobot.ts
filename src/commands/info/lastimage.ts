import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { Parameters } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  urls: Array<string> | null,
}

export interface CommandArgs {
  urls: Array<string>,
}

export default class LastImageCommand extends BaseCommand {
  name = 'lastimage';

  label = 'urls';
  permissionsClient = [Permissions.EMBED_LINKS];
  type = Parameters.lastImageUrls;

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.urls && args.urls.length);
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.urls) {
      return context.editOrReply('⚠ Unable to find any messages with an image.');
    } else {
      return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
    }
  }

  async run(context: Command.Context, args: CommandArgs) {
    const embed = new Embed();

    {
      const description: Array<string> = [];
      for (let url of args.urls) {
        description.push(Markup.url('URL', url));
      }
      embed.setDescription(description.join(', '));
    }

    const [ image ] = args.urls;
    if (image) {
      embed.setImage(image);
    }
    return context.editOrReply({embed});
  }
}
