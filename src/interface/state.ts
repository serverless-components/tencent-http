import { FaasOutputs, ApigwOutputs, AssetsOutputs } from './outputs';

export type State = {
  zipPath?: string;
  region?: string;
  lambdaArn?: string;
  functionName?: string;
  faas?: FaasOutputs;
  apigw?: ApigwOutputs;
  assets?: AssetsOutputs;
};
