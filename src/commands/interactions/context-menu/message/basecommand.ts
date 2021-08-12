import { Interaction, Structures } from 'detritus-client';
import {
  ApplicationCommandTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Response } from 'detritus-rest';

import { EmbedColors, PermissionsText } from '../../../../constants';
import { createUserEmbed } from '../../../../utils';


export interface CommandArgs {
  message: Structures.Message,
}

export class BaseCommand<ParsedArgsFinished = Interaction.ParsedArgs> extends Interaction.InteractionCommand<ParsedArgsFinished> {
  triggerLoadingAfter = 1000;
  triggerLoadingAsEphemeral = true;
  type = ApplicationCommandTypes.MESSAGE;

  constructor(data: Interaction.InteractionCommandOptions = {}) {
    super(Object.assign({
      guildIds: ['178313653177548800', '621077547471601685'],
      permissionsIgnoreClientOwner: true,
    }, data));
  }

  onDmBlocked(context: Interaction.InteractionContext) {
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `⚠ Message Context Menu Command \`${command}\` cannot be used in a DM.`,
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
      content: `⚠ Message Context Menu Command ${command} requires the bot to have ${permissions.join(', ')} to work.`,
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
      content: `⚠ Message Context Menu Command ${command} requires you to have ${permissions.join(', ')}.`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async onRunError(context: Interaction.InteractionContext, args: ParsedArgsFinished, error: any) {
    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle('⚠ Message Context Menu Command Error');

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
