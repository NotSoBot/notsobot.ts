import { Slash } from 'detritus-client';
import { InteractionCallbackTypes, Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Response } from 'detritus-rest';

import { EmbedColors, PermissionsText } from '../constants';
import { createUserEmbed } from '../utils';


export class BaseCommand<ParsedArgsFinished = Slash.ParsedArgs> extends Slash.SlashCommand<ParsedArgsFinished> {
  permissionsIgnoreClientOwner = true;

  onPermissionsFailClient(context: Slash.SlashContext, failed: Array<bigint>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    // build the full command name
    const command = 'This command';
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: `⚠ ${command} requires the bot to have ${permissions.join(', ')} to work.`,
    });
  }

  onPermissionsFail(context: Slash.SlashContext, failed: Array<bigint>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    // build the full command name
    const command = 'This command';
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: `⚠ ${command} requires you to have ${permissions.join(', ')}.`,
    });
  }

  async onRunError(context: Slash.SlashContext, args: ParsedArgsFinished, error: any) {
    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle('⚠ Command Error');

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

    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      embed,
      flags: 64,
    });
  }
}


export class BaseCommandOption<ParsedArgsFinished = Slash.ParsedArgs> extends Slash.SlashCommandOption<ParsedArgsFinished> {
  permissionsIgnoreClientOwner = true;

  onPermissionsFailClient(context: Slash.SlashContext, failed: Array<bigint>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    // build the full command name
    const command = 'This command';
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: `⚠ ${command} requires the bot to have ${permissions.join(', ')} to work.`,
    });
  }

  onPermissionsFail(context: Slash.SlashContext, failed: Array<bigint>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    // build the full command name
    const command = 'This command';
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: `⚠ ${command} requires you to have ${permissions.join(', ')}.`,
    });
  }

  async onRunError(context: Slash.SlashContext, args: ParsedArgsFinished, error: any) {
    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle('⚠ Command Error');

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

    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      embed,
      flags: 64,
    });
  }
}
