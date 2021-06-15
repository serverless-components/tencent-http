import { Framework, FrameworkConfig } from './interface';

type DefaultConfig = Partial<FrameworkConfig>;

const TEMPLATE_BASE_URL = 'https://serverless-templates-1300862921.cos.ap-beijing.myqcloud.com';

const frameworks: Record<Framework, { [prop: string]: any }> = {
  express: {
    injectSlsSdk: true,
    defaultStatics: [{ src: 'public', targetDir: '/' }],
  },
  koa: {
    injectSlsSdk: true,
    defaultStatics: [{ src: 'public', targetDir: '/' }],
  },
  egg: {
    injectSlsSdk: true,
    defaultStatics: [{ src: 'public', targetDir: '/' }],
    defaultEnvs: [
      {
        key: 'SERVERLESS',
        value: '1',
      },
      {
        key: 'EGG_APP_CONFIG',
        value: '{"rundir":"/tmp","logger":{"dir":"/tmp"}}',
      },
    ],
  },
  nestjs: {
    injectSlsSdk: true,
    defaultStatics: [{ src: 'public', targetDir: '/' }],
  },
  nextjs: {
    injectSlsSdk: true,
    defaultStatics: [
      { src: '.next/static', targetDir: '/_next/static' },
      { src: 'public', targetDir: '/' },
    ],
  },
  nuxtjs: {
    injectSlsSdk: true,
    defaultStatics: [
      { src: '.nuxt/dist/client', targetDir: '/' },
      { src: 'static', targetDir: '/' },
    ],
  },
  laravel: {
    injectSlsSdk: false,
    defaultEnvs: [
      {
        key: 'SERVERLESS',
        value: '1',
      },
      {
        key: 'VIEW_COMPILED_PATH',
        value: '/tmp/storage/framework/views',
      },
      {
        key: 'SESSION_DRIVER',
        value: 'array',
      },
      {
        key: 'LOG_CHANNEL',
        value: 'stderr',
      },
      {
        key: 'APP_STORAGE',
        value: '/tmp',
      },
    ],
  },
  thinkphp: {
    injectSlsSdk: false,
  },
  flask: {
    injectSlsSdk: false,
  },
  django: {
    injectSlsSdk: false,
  },
  gin: {
    injectSlsSdk: false,
  },
};

const CONFIGS: DefaultConfig = {
  // support metrics frameworks
  supportMetrics: ['express', 'next', 'nuxt'],
  region: 'ap-guangzhou',
  description: 'Created by Serverless Component',
  handler: 'sl_handler.handler',
  timeout: 10,
  memorySize: 128,
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
  const templateUrl = `${TEMPLATE_BASE_URL}/${framework}-demo.zip`;
  const frameworkConfigs = frameworks[framework];
  return {
    framework,
    templateUrl,
    ...CONFIGS,
    ...frameworkConfigs,
  } as FrameworkConfig;
};
