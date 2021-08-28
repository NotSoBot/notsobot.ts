import { Command, Interaction } from 'detritus-client';
import { Locales as DiscordLocales, LocalesText as DiscordLocalesText } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import * as juration from 'juration';
import * as moment from 'moment';

import { GoogleLocaleFromDiscord, GoogleLocales, GoogleLocalesText } from '../../constants';
import { DefaultParameters, isSnowflake, validateUrl } from '../../utils';


import * as ContextMenu from './context-menu';
import * as Prefixed from './prefixed';
import * as Slash from './slash';

export { ContextMenu, Prefixed, Slash };

export * from './prefixed';


export function days(value: string): number {
  let days: number;
  if (isNaN(value as any)) {
    days = Math.round(moment.duration(seconds(value), 'seconds').asDays());
  } else {
    days = parseInt(value);
  }
  return days;
}


export async function locale(value: string, context: Command.Context | Interaction.InteractionContext): Promise<GoogleLocales> {
  if (!value) {
    return await DefaultParameters.locale(context);
  }

  value = value.toLowerCase().replace(/ /g, '_');
  for (let key in GoogleLocales) {
    const locale = (GoogleLocales as any)[key];
    if (locale.toLowerCase() === value) {
      return locale;
    }
  }

  for (let key in GoogleLocales) {
    const name = key.toLowerCase();
    if (name.includes(value)) {
      return (GoogleLocales as any)[key];
    }
  }

  for (let key in GoogleLocalesText) {
    const name = (GoogleLocalesText as any)[key].toLowerCase();
    if (name.includes(value)) {
      return key as GoogleLocales;
    }
  }

  const locales = Object.values(GoogleLocalesText).map((locale) => {
    if (locale.includes(',')) {
      return `(\`${locale}\`)`;
    }
    return `\`${locale}\``;
  });
  throw new Error(`Must be one of ${locales.join(', ')}`);
}


export async function localeDiscord(value: string): Promise<DiscordLocales | null> {
  if (!value) {
    return null;
  }

  value = value.toLowerCase().replace(/ /g, '_');
  for (let key in DiscordLocales) {
    const locale = (DiscordLocales as any)[key];
    if (locale.toLowerCase() === value) {
      return locale;
    }
  }
  for (let key in DiscordLocales) {
    const name = key.toLowerCase();
    if (name.includes(value)) {
      return (DiscordLocales as any)[key];
    }
  }
  for (let key in DiscordLocalesText) {
    const name = (DiscordLocalesText as any)[key].toLowerCase();
    if (name.includes(value)) {
      return key as DiscordLocales;
    }
  }
  const locales = Object.values(DiscordLocalesText).map((locale) => {
    if (locale.includes(',')) {
      return `(\`${locale}\`)`;
    }
    return `\`${locale}\``;
  });
  throw new Error(`Must be one of ${locales.join(', ')}`);
}


export interface NumberOptions {
  max?: number,
  min?: number,
}

export function number(options: NumberOptions = {}) {
  return (valueStrOrNum: number | string): number => {
    const value = parseInt(valueStrOrNum as string);
    if (isNaN(value)) {
      throw new Error('Value must be a number.');
    }
    if (options.max !== undefined && options.min !== undefined) {
      if (value < options.min || options.max < value) {
        throw new Error(`Value must be between ${options.min} and ${options.max}`);
      }
    } else if (options.max !== undefined) {
      if (options.max < value) {
        throw new Error(`Value must be less than ${options.max}`);
      }
    } else if (options.min !== undefined) {
      if (value < options.min) {
        throw new Error(`Value must be more than ${options.min}`);
      }
    }
    return value;
  };
}


export function percentage(value: number | string): number {
  if (typeof(value) === 'string') {
    value = value.replace(/%/g, '');
  }
  const percentage = parseFloat(value as string);
  if (isNaN(percentage)) {
    return percentage;
  }
  return Math.max(0, Math.min(percentage / 100));
}


export function seconds(value: number | string): number {
  try {
    return juration.parse(String(value));
  } catch(error) {
    if (typeof(error) === 'string') {
      let text = error.slice(error.indexOf(':', error.indexOf(':') + 1) + 1).trim();
      if (text === 'a falsey value') {
        throw new Error('Unable to parse');
      }
      if (25 < text.length) {
        text = text.slice(0, 22) + '...';
      }
      throw new Error(`Unable to parse time format ${Markup.codestring(text)}`);
    }
    throw error;
  }
}


export function snowflake(value: string): string {
  if (!isSnowflake(value)) {
    throw new Error('Value must be a snowflake');
  }
  return value;
}


export interface StringOptions {
  maxLength?: number,
  minLength?: number,
}

export function string(options: StringOptions = {}) {
  return (value: string): string => {
    if (options.maxLength !== undefined && options.minLength !== undefined) {
      if (value.length < options.minLength || options.maxLength < value.length) {
        throw new Error(`Value must be between ${options.minLength} and ${options.maxLength} characters`);
      }
    } else if (options.maxLength !== undefined) {
      if (options.maxLength < value.length) {
        throw new Error(`Value must be less than ${options.maxLength} characters`);
      }
    } else if (options.minLength !== undefined) {
      if (value.length < options.minLength) {
        throw new Error(`Value must be more than ${options.minLength} characters`);
      }
    }
    return value;
  };
}


export function stringLowerCase(options: StringOptions = {}) {
  const stringify = string(options);
  return (value: string) => {
    return stringify(value.toLowerCase());
  };
}


export function url(value: string): string {
  if (value) {
    if (!/^https?:\/\//.test(value)) {
      return `http://${value}`;
    }
    if (!validateUrl(value)) {
      throw new Error('Malformed URL');
    }
  }
  return value;
}
