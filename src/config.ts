import { Framework, FrameworkConfig } from './interface';

type DefaultConfig = Partial<FrameworkConfig>;

const TEMPLATE_BASE_URL = 'https://serverless-templates-1300862921.cos.ap-beijing.myqcloud.com';

const frameworks: Record<Framework, { [prop: string]: any }> = {
  express: {
    defaultStatics: [{ src: 'public', targetDir: '/' }],
  },
  koa: {
    defaultStatics: [{ src: 'public', targetDir: '/' }],
  },
  egg: {
    defaultStatics: [{ src: 'public', targetDir: '/' }],
  },
  nestjs: {
    defaultStatics: [{ src: 'public', targetDir: '/' }],
  },
  nextjs: {
    defaultStatics: [
      { src: '.next/static', targetDir: '/_next/static' },
      { src: 'public', targetDir: '/' },
    ],
  },
  nuxtjs: {
    defaultStatics: [
      { src: '.nuxt/dist/client', targetDir: '/' },
      { src: 'static', targetDir: '/' },
    ],
  },
  laravel: {},
  thinkphp: {},
  flask: {},
  django: {},
  gin: {},
};

const CONFIGS: DefaultConfig = {
  // support metrics frameworks
  region: 'ap-guangzhou',
  description: 'Created by Serverless Component',
  handler: 'scf_bootstrap',
  timeout: 10,
  memorySize: 512,
  namespace: 'default',
  runtime: 'Nodejs12.16',
  defaultEnvs: [
    {
      key: 'SERVERLESS',
      value: '1',
    },
  ],
  cos: {
    lifecycle: [
      {
        status: 'Enabled',
        id: 'deleteObject',
        expiration: { days: '10' },
        abortIncompleteMultipartUpload: { daysAfterInitiation: '10' },
      },
    ],
  },
  cdn: {
    forceRedirect: {
      switch: 'on',
      redirectType: 'https',
      redirectStatusCode: 301,
    },
    https: {
      switch: 'on',
      http2: 'on',
    },
  },

  defaultCdnConfig: {
    forceRedirect: {
      switch: 'on',
      redirectType: 'https',
      redirectStatusCode: 301,
    },
    https: {
      switch: 'on',
      http2: 'on',
    },
  },
  acl: {
    permissions: 'public-read',
    grantRead: '',
    grantWrite: '',
    grantFullControl: '',
  },
  getPolicy(region: string, bucket: string, appid: string) {
    return {
      Statement: [
        {
          Principal: { qcs: ['qcs::cam::anyone:anyone'] },
          Effect: 'Allow',
          Action: [
            'name/cos:HeadBucket',
            'name/cos:ListMultipartUploads',
            'name/cos:ListParts',
            'name/cos:GetObject',
            'name/cos:HeadObject',
            'name/cos:OptionsObject',
          ],
          Resource: [`qcs::cos:${region}:uid/${appid}:${bucket}-${appid}/*`],
        },
      ],
      version: '2.0',
    };
  },
};

export const getConfig = (framework: Framework): FrameworkConfig => {
  const templateUrl = `${TEMPLATE_BASE_URL}/http/${framework}.zip`;
  const frameworkConfigs = frameworks[framework];
  return {
    framework,
    templateUrl,
    ...CONFIGS,
    ...frameworkConfigs,
  } as FrameworkConfig;
};
