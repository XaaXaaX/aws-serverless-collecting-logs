import { EnvVariable, Config } from "../types";

const defaultConfig: Config = {
  contextVariables: {
    context: `logs-collector`,
    stage: 'unknown' as EnvVariable, 
    owner: 'operations',
    usage: 'EPHEMERAL',
  },
}

const getFinalConfig = (config: Partial<Config>): Config => {
  return {
    ...defaultConfig,
    contextVariables: {
      ...defaultConfig.contextVariables,
      ...config.contextVariables,
    },
    ...config
  }
}

export const getConfig = (stage: EnvVariable, contextSuffix: string): Config => {
  const context = `${defaultConfig.contextVariables.context}-${contextSuffix}`;
  switch (stage) {
    case 'test':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, context, stage: 'test', usage: 'PRODUCTION' } } );
    case 'prod':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, context, stage: 'prod', usage: 'PRODUCTION' } } );
    case 'dev':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, context, stage: 'dev', usage: 'DEVELOPMENT' } } );
    case 'sandbox':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, context, stage: 'sandbox', usage: 'POC' } } );
    default:
      return getFinalConfig({});
  }
};