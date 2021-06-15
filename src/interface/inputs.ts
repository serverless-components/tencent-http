import { Framework } from '.';

export interface KeyValue {
  key: string;
  value: string;
}

export interface FaasInputs {
  framework?: Framework;
  bootstrap: {
    cmd: string;
    port: string | number;
  };
  code?: { bucket?: string; object?: string; src?: string };

  name?: string;
  role?: string;
  handler?: string;
  runtime?: string;
  namespace?: string;
  description?: string;

  environments?: KeyValue[];

  layers?: { name: string; version: number }[];
  cfs?: { cfsId: string }[];
  timeout?: number;
  memorySize?: number;
  tags?: KeyValue[];
  vpc?: {
    vpcId: string;
    subnetId: string;
  };
}
export interface FaasSdkInputs {
  code?: { bucket?: string; object?: string; src?: string };

  name?: string;
  role?: string;
  handler?: string;
  runtime?: string;
  namespace?: string;
  description?: string;

  layers?: { name: string; version: number }[];
  cfs?: { cfsId: string }[];
  timeout?: number;
  memorySize?: number;
  tags?: { [propName: string]: any };

  // sdk inputs
  vpcConfig?: {
    vpcId: string;
    subnetId: string;
  };
  environment?: {
    variables: Record<string, string>;
  };
}

export interface ApigwInputs {
  oldState?: any;

  isDisabled?: boolean;
  id?: string;
  name?: string;
  qualifier?: string;
  description?: string;

  environment?: 'prepub' | 'release' | 'test';
  customDomains?: {
    domain: string;
    protocols: ('http' | 'https')[];
    certId: string;
    customMap?: boolean;
    pathMap: [];
    isForcedHttps: boolean;
  }[];

  cors?: boolean;

  timeout?: number;

  protocols: ('http' | 'https')[];

  usagePlan?: {
    usagePlanId: string;
    usagePlanName: string;
    usagePlanDesc: string;
    maxRequestNum: number;
  };

  auth?: {
    secretName?: string;
    secretIds?: string;
  };

  // sdk inputs
  serviceId?: string;
  serviceName?: string;
  serviceDesc?: string;
  endpoints?: {
    path?: string;
    enableCORS?: boolean;
    serviceTimeout?: number;
    method?: string;
    apiName?: string;

    function?: {
      isIntegratedResponse?: boolean;
      functionName: string;
      functionNamespace: string;
      functionQualifier: string;
    };

    usagePlan?: {
      usagePlanId: string;
      usagePlanName: string;
      usagePlanDesc: string;
      maxRequestNum: number;
    };

    auth?: {
      secretName?: string;
      secretIds?: string;
    };
  }[];
}
export interface ApigwSdkInputs {
  oldState?: any;

  isDisabled?: boolean;
  qualifier?: string;
  description?: string;

  environment?: 'prepub' | 'release' | 'test';
  customDomains?: {
    domain: string;
    protocols: ('http' | 'https')[];
    certificateId: string;
    isDefaultMapping?: boolean;
    pathMappingSet: [];
    isForcedHttps?: boolean;
  }[];

  serviceId?: string;
  serviceName?: string;
  serviceDesc?: string;
  serviceTimeout?: number;

  protocols: ('http' | 'https')[];

  usagePlan?: {
    usagePlanId: string;
    usagePlanName: string;
    usagePlanDesc: string;
    maxRequestNum: number;
  };

  auth?: {
    secretName?: string;
    secretIds?: string;
  };

  endpoints: {
    path: string;
    method: string;
    enableCORS?: boolean;
    serviceTimeout?: number;
    apiName?: string;

    function?: {
      isIntegratedResponse?: boolean;
      functionName: string;
      functionNamespace: string;
      functionQualifier: string;
    };

    usagePlan?: {
      usagePlanId: string;
      usagePlanName: string;
      usagePlanDesc: string;
      maxRequestNum: number;
    };

    auth?: {
      secretName?: string;
      secretIds?: string;
    };
  }[];
}

export interface CosInputs {
  replace?: boolean;
  bucket: string;
  sources?: { src: string; targetDir: string }[];
}

export interface CdnInputs {
  domain: string;
  area?: string;
  autoRefresh?: boolean;
  refreshType?: string;
  forceRedirect?: {
    switch?: 'on' | 'off' | undefined;
    redirectType?: 'https';
    redirectStatusCode: number;
  };
  https?: { switch?: 'on' | 'off' | undefined; http2?: 'on' | 'off' | undefined; certId: string };
}

export interface AssetsInputs {
  cosConf: CosInputs;
  cdnConf?: CdnInputs;
}

export interface Inputs {
  faas?: FaasInputs;
  apigw?: ApigwInputs;

  region?: string;
  src?: string;

  srcOriginal?: {
    bucket: string;
    object: string;
  };

  assets?: AssetsInputs;
}

export interface MetricsInputs {
  tz?: string;
  rangeStart?: string;
  rangeEnd?: string;
}