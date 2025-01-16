import { EnvVariable, Config } from "@type";

const defaultConfig: Config = {
  contextVariables: {
    context: `new-repo-boilerplate`,
    stage: 'unknown' as EnvVariable, 
    owner: 'operations',
    usage: 'EPHEMERAL',
  },
  someConfig: {
    someKey: 'someValue',
  }
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

export const getConfig = (stage: EnvVariable): Config => {
  switch (stage) {
    case 'test':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, stage: 'test', usage: 'PRODUCTION' } } );
    case 'prod':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, stage: 'prod', usage: 'PRODUCTION' } } );
    case 'dev':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, stage: 'dev', usage: 'PRODUCTION' } } );
    case 'sandbox':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, stage: 'sandbox', usage: 'POC' } } );
    default:
      return getFinalConfig({});
  }
};