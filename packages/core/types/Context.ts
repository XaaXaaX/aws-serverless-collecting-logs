
export const AvailableEnvs = ['dev', 'test', 'prod', 'sandbox'] as const; 
export type EnvVariable = typeof AvailableEnvs[number];

export type ContextVariables = {
    context: string;
    stage: EnvVariable;
    owner: string;
    usage: 'POC' | 'EPHEMERAL' | 'PRODUCTION' | 'MANAGEMENT' | 'DEVELOPMENT';
}
export type ContextMetadata = ContextVariables & {
  [key: string]: string | undefined;
} & { [K in keyof ContextVariables]?: never };
