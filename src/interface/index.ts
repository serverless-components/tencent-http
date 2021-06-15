export * from './inputs';
export * from './outputs';
export * from './state';
export type Framework =
  | 'express'
  | 'koa'
  | 'egg'
  | 'nextjs'
  | 'nuxtjs'
  | 'nestjs'
  | 'flask'
  | 'django'
  | 'laravel'
  | 'thinkphp'
  | 'gin';

export type Policy = {
  Statement: [
    {
      Principal: { qcs: string[] };
      Effect: string;
      Action: string[];
      Resource: string[];
    },
  ];
  version: string;
};

export type DefaultCdnConfig = {
  forceRedirect: {
    switch?: 'on' | 'off';
    redirectStatusCode: number;
    redirectType?: 'https';
  };
  https: {
    switch: 'on';
    http2: 'on';
  };
};

export type FrameworkConfig = {
  region: string;
  templateUrl: string;
  framework: string;
  handler: string;
  runtime: string;
  timeout: number;
  memorySize: number;
  namespace: string;
  description: string;
  defaultStatics: { src: string; targetDir: string }[];
  defaultCdnConfig: DefaultCdnConfig;
  acl: {
    permissions: string;
    grantRead: string;
    grantWrite: string;
    grantFullControl: string;
  };
  // eslint-disable-next-line
  getPolicy: (r: string, b: string, a: string) => Policy;
  injectSlsSdk?: boolean;
  pythonFrameworks?: string[];
  supportMetrics?: string[];
  defaultEnvs: {
    key: string;
    value: string;
  }[];
  cos: {
    lifecycle: {
      status: string;
      id: string;
      expiration: { days: string };
      abortIncompleteMultipartUpload: { daysAfterInitiation: string };
    }[];
  };
  cdn: {
    forceRedirect?: {
      switch?: 'on' | 'off' | undefined;
      redirectType?: 'https';
      redirectStatusCode: number;
    };
    https?: { switch?: 'on' | 'off' | undefined; http2?: 'on' | 'off' | undefined };
  };
};
