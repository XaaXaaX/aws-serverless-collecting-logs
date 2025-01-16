import { Construct } from 'constructs';
import { EnforcedStack, EnforcedStackProps } from '@helpers';
import { SomeConfig } from '@type';

export type HostedZoneStackProps = EnforcedStackProps & { someConfig: SomeConfig }
export class ApplicationStack extends EnforcedStack {
  constructor(scope: Construct, id: string, props: HostedZoneStackProps) {
    super(scope, id, props);
    const { someConfig } = props;

  }
}
