import { Interaction, Structures } from 'detritus-client';
import {
  ApplicationCommandTypes,
  ApplicationCommandOptionTypes,
  InteractionCallbackTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Response } from 'detritus-rest';

import { EmbedColors, PermissionsText } from '../../constants';
import { createUserEmbed } from '../../utils';



export class BaseInteractionCommand<ParsedArgsFinished = Interaction.ParsedArgs> extends Interaction.InteractionCommand<ParsedArgsFinished> {
  error = 'Command';

  onLoadingTrigger(context: Interaction.InteractionContext) {
    if (context.responded) {
      return;
    }

    if (this.triggerLoadingAsEphemeral) {
      return context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {flags: MessageFlags.EPHEMERAL});
    }
    // check perms to maybe force as ephemeral, just in case
    return context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
  }

  onDmBlocked(context: Interaction.InteractionContext) {
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `⚠ ${this.error} \`${command}\` cannot be used in a DM.`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  onPermissionsFailClient(context: Interaction.InteractionContext, failed: Array<bigint>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `⚠ ${this.error} ${command} requires the bot to have ${permissions.join(', ')} to work.`,
    });
  }

  onPermissionsFail(context: Interaction.InteractionContext, failed: Array<bigint>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `⚠ ${this.error} ${command} requires you to have ${permissions.join(', ')}.`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async onRunError(context: Interaction.InteractionContext, args: ParsedArgsFinished, error: any) {
    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle(`⚠ ${this.error} Command Error`);

    const description: Array<string> = [];
    if (error.response) {
      const response: Response = error.response;
      try {
        const information = await response.json() as any;
        description.push(error.message || error.stack);
        if ('errors' in information) {
          for (let key in information.errors) {
            const value = information.errors[key];
            let message: string;
            if (typeof(value) === 'object') {
              message = JSON.stringify(value);
            } else {
              message = String(value);
            }
            description.push(`**${key}**: ${message}`);
          }
        }

        if (
          response.statusCode === 429 &&
          (
            (context.rest.raw.restClient.baseUrl instanceof URL) &&
            (context.rest.raw.restClient.baseUrl.host === response.request.parsedUrl.host)
          )
        ) {
          const headers: Record<string, string> = {};
          for (let [header, value] of response.headers) {
            if (header.startsWith('x-ratelimit')) {
              headers[header] = value;
            }
          }
          embed.addField('Ratelimit Info', [
            '```json',
            JSON.stringify({body: information, headers}),
            '```',
          ].join('\n'));
        }

      } catch(e) {
        description.push(`HTTP Exception: ${response.statusCode}`);
        const contentType = response.headers.get('content-type') || '';
        if (contentType.startsWith('text/html')) {
          // parse it?
        } else {
          description.push('Unknown Error Data');
          if (contentType) {
            description.push(`**Mimetype**: ${contentType}`);
          }
        }
      }
    } else {
      description.push(error.message || error.stack);
    }
    embed.setDescription(description.join('\n'));

    if (error.metadata) {
      embed.addField('Metadata', [
        '```json',
        JSON.stringify(error.metadata),
        '```',
      ].join('\n'));
    }

    return context.editOrRespond({
      embed,
      flags: MessageFlags.EPHEMERAL,
    });
  }
}


export class BaseInteractionCommandOption<ParsedArgsFinished = Interaction.ParsedArgs> extends Interaction.InteractionCommandOption<ParsedArgsFinished> {
  type = ApplicationCommandOptionTypes.SUB_COMMAND;
}


export class BaseInteractionCommandOptionGroup<ParsedArgsFinished = Interaction.ParsedArgs> extends Interaction.InteractionCommandOption<ParsedArgsFinished> {
  type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
}



export class BaseSlashCommand<ParsedArgsFinished = Interaction.ParsedArgs> extends BaseInteractionCommand<ParsedArgsFinished> {
  error = 'Slash Command';
  type = ApplicationCommandTypes.CHAT_INPUT;
}


export interface ContextMenuMessageArgs {
  message: Structures.Message,
}

export class BaseContextMenuMessageCommand extends BaseInteractionCommand<ContextMenuMessageArgs> {
  error = 'Message Context Menu';
  type = ApplicationCommandTypes.MESSAGE;

  global = true;
  permissionsIgnoreClientOwner = true;
  triggerLoadingAfter = 1000;
  triggerLoadingAsEphemeral = true;

  constructor(data: Interaction.InteractionCommandOptions = {}) {
    super(Object.assign({guildIds: ['178313653177548800', '621077547471601685']}, data));
  }
}


export interface ContextMenuUserArgs {
  member?: Structures.Member,
  user: Structures.User,
}

export class BaseContextMenuUserCommand extends BaseInteractionCommand<ContextMenuUserArgs> {
  error = 'User Context Menu';
  type = ApplicationCommandTypes.USER;

  global = true;
  permissionsIgnoreClientOwner = true;
  triggerLoadingAsEphemeral = true;

  constructor(data: Interaction.InteractionCommandOptions = {}) {
    super(Object.assign({guildIds: ['178313653177548800']}, data));
  }
}
