import { URL } from 'url';

import { Command, Interaction } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { Response } from 'detritus-rest';

import { ApiErrorBody, CONTENT_BLOCKED_API_ERRORS, JobError, getApiError, getApiErrorTranslationKey, isApiDownError, readErrorBody } from '../api/errors';
import { ApiErrorCodes, EmbedColors, PermissionsText, StatusEmojis } from '../constants';
import { I18n, displayReply, formatMemory } from '../utils';


// shared error formatting for prefixed and interaction commands, so both show the same messages
// every error is built as an `ErrorPayload` first, then rendered with `displayReply` like every other response
// (components v2 container, embed, or plain text, with the invoker and too long errors uploaded as a file)

const ERROR_FILENAME = 'error.txt';
// discord takes up to 4000, but walls of text (like a full ffmpeg log) are easier to read as a file
const ERROR_MAX_INLINE_LENGTH = 1000;

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
  // nobody by default
  allowedMentions?: Command.EditOrReply['allowedMentions'],
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
    allowedMentions: options.allowedMentions,
    color: EmbedColors.ERROR,
    description: payload.description,
    ephemeral: options.ephemeral,
    fields: payload.fields,
    title: payload.title,
  }, {
    maxInlineLength: ERROR_MAX_INLINE_LENGTH,
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
  // how many messages a server gets from its premium, and when they come back
  if (apiError.code === ApiErrorCodes.SERVER_AI_LIMIT && typeof(apiError.resets_at) === 'string') {
    const resetsAt = new Date(apiError.resets_at);
    if (!isNaN(resetsAt.getTime())) {
      const text = translator.translate(key as I18n.TranslationKey, {
        limit: String(apiError.limit),
        time: Markup.timestamp(resetsAt, MarkupTimestampStyles.RELATIVE),
      });
      return {specific: true, text};
    }
  }
  return {specific: false, text: translator.translateMaybe(key, apiError.message)};
}


// the api's message for these only rewords the translation ('An outputted media was blocked...'), it never adds anything
const API_ERRORS_WITHOUT_DETAILS: ReadonlyArray<ApiErrorCodes> = [
  ApiErrorCodes.SERVER_AI_LIMIT,
  ...CONTENT_BLOCKED_API_ERRORS,
];


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


// notsobot api errors have a stable `code` we can translate, the api's own message is kept as the details
// returns false for codes without a translation
function describeApiError(
  apiError: ApiErrorBody,
  translator: I18n.Translator,
  description: Array<string>,
  fields: Array<ErrorField>,
): boolean {
  const apiErrorKey = getApiErrorTranslationKey(apiError.code);
  if (!apiErrorKey) {
    return false;
  }
  const { specific, text } = translateApiError(apiError, apiErrorKey, translator);
  description.push(text);
  const showDetails = !specific && !API_ERRORS_WITHOUT_DETAILS.includes(apiError.code);
  if (showDetails && apiError.message && !isSameErrorMessage(apiError.message, text)) {
    fields.push({name: translator.translate('errors.field.details'), value: apiError.message});
  }
  return true;
}


// the api and discord both nest form errors by field, like `{width: {_errors: [{code, message}]}}` or `{files: {0: {_errors: [...]}}}`
// show one line per field with just the messages instead of the raw json
function formatFormErrors(errors: unknown, path: Array<string> = [], lines: Array<string> = []): Array<string> {
  const label = (path.length) ? `**${path.join('.')}**: ` : '';
  if (!errors || typeof(errors) !== 'object') {
    lines.push(label + String(errors));
    return lines;
  }
  for (let key in errors) {
    const value = (errors as Record<string, unknown>)[key];
    if (key === '_errors' && Array.isArray(value)) {
      const messages = value.map((error) => {
        return (error && typeof(error) === 'object' && error.message) ? String(error.message) : JSON.stringify(error);
      });
      lines.push(label + messages.join(' • '));
    } else {
      formatFormErrors(value, [...path, key], lines);
    }
  }
  return lines;
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

  if (await isApiDownError(error)) {
    return {description: [translate('errors.api_restarting')], fields};
  }

  let information: any;
  try {
    information = await readErrorBody(error);
  } catch(e) {
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

  const apiError = await getApiError(error);
  if (!(apiError && describeApiError(apiError, translator, description, fields))) {
    description.push(error.message || error.stack);
  }
  if (information && typeof(information) === 'object' && 'errors' in information) {
    description.push(...formatFormErrors(information.errors));
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
  } else if (error instanceof JobError && error.apiError) {
    description = [];
    if (!describeApiError(error.apiError, translator, description, fields)) {
      description.push(error.message);
    }
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
