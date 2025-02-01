import { Aspects, NestedStack, NestedStackProps, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApplyDestroyPolicyAspect, ApplyParameterStoreNamingPolicyAspect, ApplyTagsAspect } from "./aspects";
import { ContextVariablesValidator, WorkloadEnvValidator } from "./validators";
import { ContextVariables } from "../types/Context";
export type EnforcedStackProps = StackProps & NestedStackProps & {
  contextVariables: ContextVariables;
}

export class EnforcedNestedStack extends NestedStack {
  protected readonly REGION: string;
  protected readonly ACCOUNT_ID: string;
  protected readonly ENV: string;
  protected readonly CONTEXT: string;
  protected readonly CONTEXT_VARIABLES: ContextVariables;

  constructor(scope: Construct, id: string, props: EnforcedStackProps) {
    super(scope, id, props);

    const { account: ACCOUNT_ID, region: REGION } = Stack.of(this);
    this.REGION = REGION;
    this.ACCOUNT_ID = ACCOUNT_ID;

    const { contextVariables: variables } = props;
    this.ENV = variables.stage;
    this.CONTEXT = variables.context;
    this.CONTEXT_VARIABLES = variables
  }
}
export class EnforcedStack extends Stack { 
  protected readonly REGION: string;
  protected readonly ACCOUNT_ID: string;
  protected readonly ENV: string;
  protected readonly CONTEXT: string;
  protected readonly CONTEXT_VARIABLES: ContextVariables;
  
  constructor(scope: Construct, id: string, props: EnforcedStackProps) {
    super(scope, id, props);

    const { account: ACCOUNT_ID, region: REGION } = Stack.of(this);
    this.REGION = REGION;
    this.ACCOUNT_ID = ACCOUNT_ID;

    const { contextVariables: variables } = props;
    this.ENV = variables.stage;
    this.CONTEXT = variables.context;
    this.CONTEXT_VARIABLES = variables
    
    this.node.addValidation(new ContextVariablesValidator(variables));
    this.node.addValidation(new WorkloadEnvValidator(variables));
    // Aspects.of(this).add(new AwsSolutionsChecks());

    if( variables.usage !== 'PRODUCTION' ) 
      Aspects.of(this).add(new ApplyDestroyPolicyAspect());

    Aspects.of(this).add(new ApplyTagsAspect({
      context: variables.context,
      stage: variables.stage,
      owner: variables.owner,
      usage: variables.usage,
    }));
    
    Aspects.of(this).add(new ApplyParameterStoreNamingPolicyAspect(variables));

  }
}