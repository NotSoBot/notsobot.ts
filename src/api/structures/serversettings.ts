import { Collections, ShardClient, Structures } from 'detritus-client';
import { RequestTypes } from 'detritus-client-rest';

import { NotSoApiKeys } from '../../constants';

import { BaseStructure } from './basestructure';


const keysServerSettings = new Collections.BaseSet<string>([
  NotSoApiKeys.BLOCKED,
  NotSoApiKeys.BLOCKED_REASON,
  NotSoApiKeys.FEATURES,
  NotSoApiKeys.ID,
  NotSoApiKeys.SETTINGS,
  NotSoApiKeys.TIMEZONE,
]);

export class ServerSettings extends BaseStructure {
  readonly _keys = keysServerSettings;

  blocked: boolean = false;
  blockedReason: string | null = null;
  features = new Collections.BaseSet<string>();
  id: string = '';
  settings!: ServerSettingsChild;
  timezone: string | null = null;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  hasFeature(feature: string): boolean {
    if (this.features) {
      return this.features.has(feature);
    }
    return false;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case NotSoApiKeys.FEATURES: {
          if (this.features) {
            this.features.clear();
            for (let raw of value) {
              this.features.add(raw);
            }
          } else {
            this.features = new Collections.BaseSet<string>(value);
          }
        }; return;
        case NotSoApiKeys.SETTINGS: {
          value = new ServerSettingsChild(value);
        }; break;
      }
    }
    return super.mergeValue(key, value);
  }
}


const keysServerSettingsChild = new Collections.BaseSet<string>([
  NotSoApiKeys.ML_DIFFUSION_MODEL,
  NotSoApiKeys.ML_LLM_MODEL,
  NotSoApiKeys.ML_LLM_PERSONALITY,
]);

export class ServerSettingsChild extends BaseStructure {
  readonly _keys = keysServerSettingsChild;

  mlDiffusionModel: null | string = null;
  mlLLMModel: null | string = null;
  mlLLMPersonality: null | string = null;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }
}
