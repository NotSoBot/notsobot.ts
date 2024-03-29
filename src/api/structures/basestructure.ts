import { Structures } from 'detritus-client';
import { toCamelCase } from 'detritus-client/lib/utils';

import { NotSoBotKeys } from '../../constants';


export function convertKey(snake: string): string {
  if (snake in NotSoBotKeys) {
    return (NotSoBotKeys as any)[snake];
  }
  return toCamelCase(snake);
}


export class BaseStructure extends Structures.Structure {
  _getFromSnake(key: string): any {
    return (this as any)[convertKey(key)];
  }

  _setFromSnake(key: string, value: any): any {
    return (this as any)[convertKey(key)] = value;
  }
}
