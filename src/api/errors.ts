import { ApiErrorCodes } from '../constants';

import { RestResponsesRaw } from './types';


// every error response from the notsobot api looks like this, `metadata` from the api is spread into it too
export interface ApiErrorBody {
  code: ApiErrorCodes,
  errors?: Record<string, unknown>,
  message: string,
  status: number,
  [key: string]: unknown,
}

// set by `request` on errors that came from the notsobot api, discord errors use the same {code, message} shape
export const IS_NOTSOBOT_API_ERROR = Symbol('isNotSoBotApiError');
const BODY = Symbol('body');


// a response body can only be read once, so cache it on the error for everyone else
export async function readErrorBody(error: any): Promise<any> {
  if (!(BODY in error)) {
    error[BODY] = error.response.json();
  }
  return error[BODY];
}


export async function getApiError(error: any): Promise<ApiErrorBody | null> {
  if (!error || !error.response || !error[IS_NOTSOBOT_API_ERROR]) {
    return null;
  }
  let body: any;
  try {
    body = await readErrorBody(error);
  } catch(e) {
    return null;
  }
  if (body && typeof(body) === 'object' && typeof(body.code) === 'number') {
    return body;
  }
  return null;
}


// `if (await isApiError(error, ApiErrorCodes.UNKNOWN_TAG)) {...}`
export async function isApiError(error: any, ...codes: Array<ApiErrorCodes>): Promise<boolean> {
  const information = await getApiError(error);
  return !!information && (!codes.length || codes.includes(information.code));
}


// failed jobs have the code and metadata separately, put them in the same shape as an error response
export function getJobApiError(job: RestResponsesRaw.JobResponse): ApiErrorBody | null {
  const { error, error_code, error_metadata } = job.result;
  if (!error || typeof(error_code) !== 'number') {
    return null;
  }
  return {...error_metadata, code: error_code, message: error, status: 400};
}


// thrown for failed jobs so the command error handler can translate them like any other api error
export class JobError extends Error {
  apiError: ApiErrorBody | null;

  constructor(job: RestResponsesRaw.JobResponse) {
    super(`Job Failed: ${job.result.error}`);
    this.apiError = getJobApiError(job);
  }
}


// translation key for a code, `null` for UNKNOWN or codes we don't know about yet (show the api's message instead)
export function getApiErrorTranslationKey(code: number): string | null {
  if (code === ApiErrorCodes.UNKNOWN || !(code in ApiErrorCodes)) {
    return null;
  }
  return `api_errors.${ApiErrorCodes[code].toLowerCase()}`;
}
