import { ContextVariables } from "./Context";

export type SomeConfig = {
  someKey: string;
}
export type Config = {
  contextVariables: ContextVariables;
  someConfig: SomeConfig;
}
