import { Structures } from 'detritus-client';
import { toCamelCase } from 'detritus-client/lib/utils';

import { NotSoBotKeys } from '../../constants';


export function convertKey(snake: string): string {
  if (snake in NotSoBotKeys) {
    return NotSoBotKeys[snake];
  }
  return toCamelCase(snake);
}


export class BaseStructure extends Structures.Structure {
  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  _getFromSnake(key: string): any {
    return (this as any)[convertKey(key)];
  }

  _setFromSnake(key: string, value: any): any {
    return (this as any)[convertKey(key)] = value;
  }
}
