import {
  ApiEndpoint,
  ApigwBindCustomDomainOutputs,
} from 'tencent-component-toolkit/lib/modules/apigw/interface';

export interface FaasOutputs {
  name: string;
  runtime: string;
  namespace: string;
}
export type ApigwOutputs = {
  created?: boolean;
  isDisabled?: boolean;
  id: string;
  subDomain: string | string[];
  environment: 'prepub' | 'test' | 'release';
  url: string;
  customDomains?: ApigwBindCustomDomainOutputs[];
  apiList: ApiEndpoint[];
};

export interface AssetsCosOutputs {
  region: string;
  cosOrigin: string;
  bucket?: string;
  url?: string;
}

export interface AssetsOutputs {
  cos: AssetsCosOutputs;
  cdn?: any;
}

export interface Outputs {
  templateUrl?: string;
  region?: string;
  faas?: FaasOutputs;
  apigw?: ApigwOutputs;
  assets?: AssetsOutputs;
}
