import { URL } from 'url';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';
import { Response } from 'detritus-rest';

import { ApiErrorBody, getApiError, getApiErrorTranslationKey, readErrorBody } from '../api/errors';
import { ApiErrorCodes, EmbedColors, PermissionsText, StatusEmojis } from '../constants';
import { I18n, displayReply, formatMemory } from '../utils';


// shared error formatting for prefixed and interaction commands, so both show the same messages
// every error is built as an `ErrorPayload` first, then rendered with `displayReply` like every other response
// (components v2 container, embed, or plain text, with the invoker and too long errors uploaded as a file)

const ERROR_FILENAME = 'error.txt';

export type ErrorContext = Command.Context | Interaction.InteractionContext;

export interface ErrorField {
  name: string,
  value: string,
}

export interface ErrorPayload {
  description: string,
  fields?: Array<ErrorField>,
  title?: string,
}

export interface ErrorReplyOptions {
  ephemeral?: boolean,
}


export function warning(content: string): string {
  return `${StatusEmojis.WARNING} ${content}`;
}


export function formatPermissions(failed: Array<bigint>, translator: I18n.Translator): string {
  const { label, translate } = translator;
  return failed.map((permission) => {
    const key = String(permission);
    if (key in PermissionsText) {
      return Markup.codestring(label('permissions', PermissionsText[key]));
    }
    return Markup.codestring(`(${translate('common.unknown_value', {value: key})})`);
  }).join(', ');
}


function jsonField(value: unknown): string {
  return ['```json', JSON.stringify(value), '```'].join('\n');
}


export async function replyError(
  context: ErrorContext,
  payload: ErrorPayload,
  options: ErrorReplyOptions = {},
): Promise<any> {
  const { translate } = await I18n.getTranslator(context);
  return displayReply(context, {
    color: EmbedColors.ERROR,
    description: payload.description,
    ephemeral: options.ephemeral,
    fields: payload.fields,
    title: payload.title,
  }, {
    uploadDescription: translate('errors.uploaded'),
    uploadFilename: ERROR_FILENAME,
  });
}


export function replyWarning(context: ErrorContext, content: string, options?: ErrorReplyOptions) {
  return replyError(context, {description: warning(content)}, options);
}


// sizes from the api are raw bytes, show them like '8 MB' or '7.5 MB'
function formatBytes(bytes: number): string {
  return formatMemory(bytes, 2).replace(/\.?0+(?= )/, '');
}


// some codes come with metadata for a more specific message, which already says everything the api's message does
function translateApiError(
  apiError: ApiErrorBody,
  key: string,
  translator: I18n.Translator,
): {specific: boolean, text: string} {
  const hasMaxSize = (
    apiError.code === ApiErrorCodes.FILE_TOO_LARGE ||
    apiError.code === ApiErrorCodes.MEDIA_RESPONSE_TOO_LARGE
  );
  if (hasMaxSize && typeof(apiError.max_size) === 'number' && 0 < apiError.max_size) {
    const maxSize = formatBytes(apiError.max_size);
    if (typeof(apiError.size) === 'number' && 0 < apiError.size) {
      const size = formatBytes(apiError.size);
      const text = translator.translate(`${key}_max_size_with_size` as I18n.TranslationKey, {max_size: maxSize, size});
      return {specific: true, text};
    }
    const text = translator.translate(`${key}_max_size` as I18n.TranslationKey, {max_size: maxSize});
    return {specific: true, text};
  }
  return {specific: false, text: translator.translateMaybe(key, apiError.message)};
}


// our translations drift from the api's wording a little ('The media...' vs 'This media...'), don't show both when they say the same thing
function normalizeErrorMessage(message: string): string {
  return message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/^(the|this|that) /, '');
}

function isSameErrorMessage(a: string, b: string): boolean {
  return normalizeErrorMessage(a) === normalizeErrorMessage(b);
}


async function describeResponseError(
  context: ErrorContext,
  error: any,
  translator: I18n.Translator,
): Promise<{description: Array<string>, fields: Array<ErrorField>}> {
  const { translate } = translator;
  const response: Response = error.response;
  const description: Array<string> = [];
  const fields: Array<ErrorField> = [];

  let information: any;
  try {
    information = await readErrorBody(error);
  } catch(e) {
    if (response.statusCode === 502 || response.statusCode === 521) {
      return {description: [translate('errors.api_restarting')], fields};
    }
    description.push(translate('errors.http_exception', {status: response.statusCode}));
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('text/html')) {
      description.push(translate('errors.unknown_error_data'));
      if (contentType) {
        description.push(`**${translate('errors.field.mimetype')}**: ${contentType}`);
      }
    }
    return {description, fields};
  }

  // notsobot api errors have a stable `code` we can translate, the api's own message is kept as the details
  const apiError = await getApiError(error);
  const apiErrorKey = (apiError) ? getApiErrorTranslationKey(apiError.code) : null;
  if (apiError && apiErrorKey) {
    const { specific, text } = translateApiError(apiError, apiErrorKey, translator);
    description.push(text);
    if (!specific && apiError.message && !isSameErrorMessage(apiError.message, text)) {
      fields.push({name: translate('errors.field.details'), value: apiError.message});
    }
  } else {
    description.push(error.message || error.stack);
  }
  if (information && typeof(information) === 'object' && 'errors' in information) {
    for (let key in information.errors) {
      const value = information.errors[key];
      const message = (typeof(value) === 'object') ? JSON.stringify(value) : String(value);
      description.push(`**${key}**: ${message}`);
    }
  }

  // discord ratelimits, include the headers so we can debug them
  const { baseUrl } = context.rest.raw.restClient;
  if (response.statusCode === 429 && baseUrl instanceof URL && baseUrl.host === response.request.parsedUrl.host) {
    const headers: Record<string, string> = {};
    for (let [header, value] of response.headers) {
      if (header.startsWith('x-ratelimit')) {
        headers[header] = value;
      }
    }
    fields.push({name: translate('errors.field.ratelimit_info'), value: jsonField({body: information, headers})});
  }
  return {description, fields};
}


export async function createRunErrorPayload(
  context: ErrorContext,
  title: string,
  error: any,
  translator: I18n.Translator,
): Promise<ErrorPayload> {
  const { translate } = translator;

  let description: Array<string>;
  let fields: Array<ErrorField> = [];
  if (error.response) {
    ({ description, fields } = await describeResponseError(context, error, translator));
  } else {
    const message = String(error.message || error.stack);
    if (message.includes('reason: connect ECONNREFUSED 127.0.0.1:80')) {
      description = [translate('errors.api_restarting')];
    } else {
      description = [message];
    }
  }

  if (error.metadata) {
    fields.push({name: translate('errors.field.metadata'), value: jsonField(error.metadata)});
  }
  return {description: description.join('\n'), fields, title};
}


export function createArgumentErrorPayload(
  title: string,
  errors: Record<string, {message: string}>,
  translator: I18n.Translator,
): ErrorPayload {
  const { translate } = translator;
  // message -> first argument that had it, so repeated errors point back to the first one
  const seen: Record<string, string> = {};

  const description: Array<string> = [translate('errors.invalid_arguments') + '\n'];
  for (let key in errors) {
    const { message } = errors[key];
    if (message in seen) {
      description.push(`**${key}**: ${translate('errors.same_error_as', {key: `**${seen[message]}**`})}`);
    } else {
      description.push(`**${key}**: ${message}`);
      seen[message] = key;
    }
  }
  return {description: description.join('\n'), title};
}
