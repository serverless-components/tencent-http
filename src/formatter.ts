import * as AdmZip from 'adm-zip';
import { CdnDeployInputs } from 'tencent-component-toolkit/lib/modules/cdn/interface';
import { ApiError } from 'tencent-component-toolkit/lib/utils/error';
import {
  KeyValue,
  Inputs,
  CosInputs,
  CdnInputs,
  FaasInputs,
  FaasSdkInputs,
  ApigwInputs,
  ApigwSdkInputs,
  State,
  Framework,
} from './interface';
import { getConfig } from './config';

import {
  deepClone,
  removeAppid,
  generateId,
  getDefaultFunctionName,
  getDefaultServiceName,
  getDefaultServiceDescription,
} from './utils';

// format static cos inputs
export const formatStaticCosInputs = async (
  cosConf: CosInputs,
  appId: string,
  codeZipPath: string,
  region: string,
) => {
  const CONFIGS = getConfig(process.env.FRAMEWORK as Framework);
  try {
    const staticCosInputs = [];
    const sources = cosConf.sources || CONFIGS.defaultStatics;
    const { bucket } = cosConf;
    // remove user append appid
    const bucketName = removeAppid(bucket, appId);
    const staticPath = `/tmp/${generateId()}`;
    const codeZip = new AdmZip(codeZipPath);
    const entries = codeZip.getEntries();

    // traverse sources, generate static directory and deploy to cos
    for (let i = 0; i < sources.length; i++) {
      const curSource = sources[i];
      const entryName = `${curSource.src}`;
      let exist = false;
      entries.forEach((et) => {
        if (et.entryName.indexOf(entryName) === 0) {
          codeZip.extractEntryTo(et, staticPath, true, true);
          exist = true;
        }
      });
      if (exist) {
        const cosInputs = {
          force: true,
          protocol: 'https',
          bucket: `${bucketName}-${appId}`,
          src: `${staticPath}/${entryName}`,
          keyPrefix: curSource.targetDir || '/',
          // 通过设置 policy 来支持公网访问
          policy: CONFIGS.getPolicy(region, bucket, appId),
        };

        staticCosInputs.push(cosInputs);
      }
    }
    return {
      bucket: `${bucketName}-${appId}`,
      staticCosInputs,
    };
  } catch (e) {
    throw new ApiError({
      type: `UTILS_${CONFIGS.framework.toUpperCase()}_prepareStaticCosInputs`,
      message: e.message,
    });
  }
};

// format cdn inputs
export const formatStaticCdnInputs = async (cdnConf: CdnInputs, origin: string) => {
  const CONFIGS = getConfig(process.env.FRAMEWORK as Framework);

  const cdnInputs: CdnDeployInputs = {
    async: true,
    area: cdnConf.area || 'mainland',
    domain: cdnConf.domain,
    serviceType: 'web',
    origin: {
      origins: [origin],
      originType: 'cos',
      originPullProtocol: 'https',
    },
  };
  if (cdnConf.https) {
    // using these default configs, for making user's config more simple
    cdnInputs.forceRedirect = cdnConf.forceRedirect || CONFIGS.defaultCdnConfig.forceRedirect;
    if (!cdnConf.https.certId) {
      throw new ApiError({
        type: `PARAMETER_${CONFIGS.framework.toUpperCase()}_HTTPS`,
        message: 'https.certId is required',
      });
    }
    cdnInputs.https = {
      ...CONFIGS.defaultCdnConfig.https,
      ...{
        http2: cdnConf.https.http2 || 'on',
        certInfo: {
          certId: cdnConf.https.certId,
        },
      },
    };
  }
  if (cdnConf.autoRefresh !== false) {
    cdnInputs.refreshCdn = {
      flushType: cdnConf.refreshType || 'delete',
      urls: [`http://${cdnInputs.domain}`, `https://${cdnInputs.domain}`],
    };
  }

  return cdnInputs;
};

// compatible code for old configs
// transfer yaml config to sdk inputs
const yamlToSdkInputs = (state: State, faasConfig: FaasInputs, apigwConfig: ApigwInputs) => {
  const CONFIGS = getConfig(process.env.FRAMEWORK as Framework);
  const { framework } = CONFIGS;

  const faasSdkInputs = deepClone(faasConfig) as FaasSdkInputs;
  const apigwSdkInputs = deepClone(apigwConfig) as ApigwSdkInputs;
  // chenck state function name
  const stateFaasName = state.faas && state.faas.name;
  faasSdkInputs.name = faasConfig.name || stateFaasName || getDefaultFunctionName(framework);

  const { defaultEnvs = [] } = CONFIGS;
  faasConfig.environments = (faasConfig.environments || []).concat(defaultEnvs);
  const environments = deepClone(faasConfig.environments);

  faasSdkInputs.environment = {
    variables: {},
  };

  environments.forEach((item: KeyValue) => {
    faasSdkInputs.environment!.variables[item.key] = item.value;
  });

  if (faasConfig.vpc) {
    faasSdkInputs.vpcConfig = faasConfig.vpc;
  }

  if (faasConfig.tags) {
    const tags = deepClone(faasConfig.tags);
    faasSdkInputs.tags = {};
    tags.forEach((item: KeyValue) => {
      faasSdkInputs.tags![item.key] = item.value;
    });
  }

  // transfer apigw config
  const stateApigwId = state.apigw && state.apigw.id;
  apigwSdkInputs.serviceId = apigwConfig.id || stateApigwId;
  apigwSdkInputs.serviceName = apigwConfig.name || getDefaultServiceName();
  apigwSdkInputs.serviceDesc = apigwConfig.description || getDefaultServiceDescription();
  const { api = {} } = apigwConfig;

  apigwSdkInputs.endpoints = [
    {
      path: api.path || '/',
      apiName: api.name || 'http_api',
      method: api.method || 'ANY',
      enableCORS: api.cors ?? true,
      serviceTimeout: api.timeout ?? 15,
      function: {
        functionType: 'HTTP',
        isIntegratedResponse: true,
        functionQualifier: apigwConfig.qualifier || '$DEFAULT',
        functionName: faasSdkInputs.name,
        functionNamespace: faasSdkInputs.namespace || 'default',
      },
    },
  ];

  if (apigwConfig.customDomains && apigwConfig.customDomains.length > 0) {
    apigwSdkInputs.customDomains = apigwConfig.customDomains.map((item) => {
      return {
        domain: item.domain,
        certificateId: item.certId,
        isDefaultMapping: !item.customMap,
        pathMappingSet: item.pathMap,
        protocols: item.protocols,
        isForcedHttps: item.isForcedHttps,
      };
    });
  }

  return { faasConfig: faasSdkInputs, apigwConfig: apigwSdkInputs };
};

// format faas and apigw inputs
export const formatInputs = (state: State, inputs: Partial<Inputs> = {}) => {
  const CONFIGS = getConfig(process.env.FRAMEWORK as Framework);

  // 对function inputs进行标准化
  const tempFaasConfig: FaasInputs = inputs.faas ?? ({} as any);
  const region = inputs.region ?? CONFIGS.region;

  const faasConfig: FaasInputs = Object.assign(tempFaasConfig, {
    code: {
      src: inputs.src,
      bucket: inputs?.srcOriginal?.bucket,
      object: inputs?.srcOriginal?.object,
    },
    region: region,
    role: tempFaasConfig.role ?? '',
    type: 'web',
    handler: CONFIGS.handler,
    runtime: tempFaasConfig.runtime ?? CONFIGS.runtime,
    namespace: tempFaasConfig.namespace ?? CONFIGS.namespace,
    description: tempFaasConfig.description ?? CONFIGS.description,
    timeout: tempFaasConfig.timeout ?? CONFIGS.timeout,
    memorySize: tempFaasConfig.memorySize ?? CONFIGS.memorySize,
    layers: tempFaasConfig.layers ?? [],
    cfs: tempFaasConfig.cfs ?? [],
    bootstrapContent: tempFaasConfig.bootstrap?.cmd ?? '',
  });

  // 对apigw inputs进行标准化
  const tempApigwConfig: ApigwInputs = inputs.apigw ?? ({} as any);
  const apigwConfig: ApigwInputs = Object.assign(tempApigwConfig, {
    region: region,
    isDisabled: tempApigwConfig.isDisabled === true,
    protocols: tempApigwConfig.protocols || ['http'],
    environment: tempApigwConfig.environment ? tempApigwConfig.environment : 'release',
  });

  return {
    region,
    ...yamlToSdkInputs(state, faasConfig, apigwConfig),
  };
};
