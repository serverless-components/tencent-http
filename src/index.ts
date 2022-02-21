import { Component } from '@serverless/core';
import { Scf, Apigw, Cos, Cdn } from 'tencent-component-toolkit';
import { ApiError } from 'tencent-component-toolkit/lib/utils/error';
import { deepClone, getCodeZipPath, getDefaultProtocol } from './utils';
import { formatInputs, formatStaticCosInputs, formatStaticCdnInputs } from './formatter';

import {
  Credential,
  State,
  Inputs,
  FaasSdkInputs,
  ApigwSdkInputs,
  AssetsInputs,
  Outputs,
  FaasOutputs,
  ApigwOutputs,
  AssetsOutputs,
  AssetsCosOutputs,
  Framework,
} from './interface';

import { getConfig } from './config';

export class ServerlessComponent extends Component<State> {
  getCredentials() {
    const { tmpSecrets } = this.credentials.tencent;

    if (!tmpSecrets || !tmpSecrets.TmpSecretId) {
      throw new ApiError({
        type: 'CREDENTIAL',
        message:
          '无法获取授权密钥信息，账号可能为子账户，并且没有角色 SLS_QcsRole 的权限，请确认角色 SLS_QcsRole 是否存在，参考 https://cloud.tencent.com/document/product/1154/43006',
      });
    }

    return {
      SecretId: tmpSecrets.TmpSecretId,
      SecretKey: tmpSecrets.TmpSecretKey,
      Token: tmpSecrets.Token,
    };
  }

  getAppId() {
    return this.credentials.tencent.tmpSecrets.appId;
  }

  async uploadCodeToCos(appId: string, inputs: FaasSdkInputs, region: string) {
    const credentials = this.getCredentials();
    // TODO: 默认还是使用历史的桶名称
    const bucketName = inputs.code?.bucket || `sls-cloudfunction-${region}-code`;
    const objectName = inputs.code?.object || `${inputs.name}-${Math.floor(Date.now() / 1000)}.zip`;
    // if set bucket and object not pack code
    if (!inputs.code?.bucket || !inputs.code?.object) {
      const zipPath = await getCodeZipPath(inputs);
      console.log(`Code zip path ${zipPath}`);

      // save the zip path to state for lambda to use it
      this.state.zipPath = zipPath;

      const cos = new Cos(credentials, region);

      if (!inputs.code?.bucket) {
        // create default bucket
        await cos.deploy({
          bucket: bucketName + '-' + appId,
          force: true,
          lifecycle: [
            {
              status: 'Enabled',
              id: 'deleteObject',
              expiration: { days: '10' },
              abortIncompleteMultipartUpload: { daysAfterInitiation: '10' },
            },
          ],
        });
      }

      // upload code to cos
      if (!inputs.code?.object) {
        console.log(`Getting cos upload url for bucket ${bucketName}`);
        const uploadUrl = await cos.getObjectUrl({
          bucket: bucketName + '-' + appId,
          object: objectName,
          method: 'PUT',
        });

        // if shims and sls sdk entries had been injected to zipPath, no need to injected again
        console.log(`Uploading code to bucket ${bucketName}`);
        // eslint-disable-next-lint
        await this.uploadSourceZipToCOS(zipPath, uploadUrl as string, {}, {});
        console.log(`Upload ${objectName} to bucket ${bucketName} success`);
      }
    }

    return {
      bucket: bucketName,
      object: objectName,
    };
  }

  async deployFunction(credentials: Credential, inputs: FaasSdkInputs = {}, region: string) {
    const appId = this.getAppId();

    const code = await this.uploadCodeToCos(appId, inputs, region);
    const scf = new Scf(credentials, region);
    const tempInputs = {
      ...inputs,
      code,
    };
    const scfOutput = await scf.deploy(deepClone(tempInputs));
    const outputs: FaasOutputs = {
      type: 'web',
      name: scfOutput.FunctionName,
      runtime: scfOutput.Runtime,
      namespace: scfOutput.Namespace,
    };

    this.state.faas = outputs;

    return outputs;
  }

  async deployApigw(credentials: Credential, inputs: ApigwSdkInputs, region: string) {
    const apigw = new Apigw(credentials, region);

    const oldState = this.state ?? {};
    const tempInputs = {
      ...inputs,
      oldState: {
        apiList: oldState.apigw?.apiList || [],
        customDomains: oldState.apigw?.customDomains || [],
      },
    };
    const apigwOutput = await apigw.deploy(deepClone(tempInputs));

    const outputs: ApigwOutputs = {
      created: apigwOutput!.created,
      id: apigwOutput!.serviceId,
      subDomain: apigwOutput!.subDomain,
      environment: apigwOutput!.environment,
      url: `${getDefaultProtocol(inputs.protocols)}://${apigwOutput!.subDomain}/${
        apigwOutput!.environment
      }${tempInputs.endpoints[0].path}`,
      apiList: apigwOutput!.apiList,
    };

    if (apigwOutput!.customDomains) {
      outputs.customDomains = apigwOutput!.customDomains;
    }

    this.state.apigw = outputs;

    return outputs;
  }

  // deploy static to cos, and setup cdn
  async deployStatic(inputs: AssetsInputs, region: string) {
    const credentials = this.getCredentials();
    const { zipPath } = this.state;
    const appId = this.getAppId();
    const deployAssetsOutputss: AssetsOutputs = {
      cos: {
        region: '',
        cosOrigin: '',
      },
    };

    const cosOutput: AssetsCosOutputs = {
      region,
      cosOrigin: '',
      bucket: '',
    };

    if (zipPath) {
      console.log(`Deploying static files`);
      // 1. deploy to cos
      const { staticCosInputs, bucket } = await formatStaticCosInputs(
        inputs.cos,
        appId,
        zipPath,
        region,
      );

      const cos = new Cos(credentials, region);
      // flush bucket

      if (inputs.cos.replace) {
        if (inputs.cos.ignoreUpdate) {
          console.log('Ignore cos update (ignore flush)...');
        } else {
          await cos.flushBucketFiles(bucket);
          try {
          } catch (e) {}
        }
      }
      for (let i = 0; i < staticCosInputs.length; i++) {
        const curInputs = staticCosInputs[i];
        console.log(`Starting deploy directory ${curInputs.src} to cos bucket ${curInputs.bucket}`);
        if (inputs.cos.ignoreUpdate) {
          console.log('Ignore cos update (ignore deploy)...');
        } else {
          const deployRes = await cos.deploy(curInputs);
          cosOutput.bucket = deployRes!.bucket;
        }
        cosOutput.cosOrigin = `${curInputs.bucket}.cos.${region}.myqcloud.com`;

        cosOutput.url = `https://${curInputs.bucket}.cos.${region}.myqcloud.com`;
        console.log(`Deploy directory ${curInputs.src} to cos bucket ${curInputs.bucket} success`);
      }
      deployAssetsOutputss.cos = cosOutput;

      // 2. deploy cdn
      if (inputs.cdn) {
        if (inputs.cdn.ignoreUpdate) {
          console.log('Ignore cdn update...');
        } else {
          const cdn = new Cdn(credentials);

          const cdnInputs = await formatStaticCdnInputs(inputs.cdn, cosOutput.cosOrigin);
          console.log(`Starting deploy cdn ${cdnInputs.domain}`);
          const cdnDeployRes = await cdn.deploy(cdnInputs);
          const protocol = cdnInputs.https ? 'https' : 'http';
          const cdnOutput = {
            domain: cdnDeployRes!.domain,
            url: `${protocol}://${cdnDeployRes!.domain}`,
            cname: cdnDeployRes!.cname,
          };
          deployAssetsOutputss.cdn = cdnOutput;

          console.log(`Deploy cdn ${cdnInputs.domain} success`);
        }
      }

      console.log(`Deployed static files success`);

      return deployAssetsOutputss;
    }

    return null;
  }

  async deploy(inputs: Inputs) {
    process.env.FRAMEWORK = inputs?.faas?.framework || 'express';

    const CONFIGS = getConfig(process.env.FRAMEWORK as Framework);

    console.log(`Deploying ${CONFIGS.framework} application`);
    const credentials = this.getCredentials();

    // 对Inputs内容进行标准化
    const { region, faasConfig, apigwConfig } = await formatInputs(this.state, inputs);

    // 部署函数 + API网关
    const outputs: Outputs = {};

    this.state.region = region;

    if (!faasConfig.code?.src) {
      outputs.templateUrl = CONFIGS.templateUrl;
    }

    outputs.faas = await this.deployFunction(credentials, faasConfig, region);
    // support apigatewayConf.isDisabled
    if (apigwConfig.isDisabled !== true) {
      if (inputs.apigw?.ignoreUpdate) {
        console.log('Ignore apigw update...');
      } else {
        outputs.apigw = await this.deployApigw(credentials, apigwConfig, region);
      }
    } else {
      this.state.apigw = {
        isDisabled: true,
      } as ApigwOutputs;
    }

    // optimize outputs for one region
    outputs.region = region;
    // start deploy static cdn
    if (inputs.assets) {
      const { assets } = inputs;
      const res = await this.deployStatic(assets, region);
      if (res) {
        this.state.assets = res;
        outputs.assets = res;
      }
    }

    this.state.lambdaArn = faasConfig.name;

    return outputs;
  }

  async removeStatic() {
    // remove static
    const { region, assets } = this.state;
    if (assets) {
      console.log(`Removing static files`);
      const credentials = this.getCredentials();
      // 1. remove cos
      if (assets.cos) {
        const { cos: cosState } = assets as AssetsOutputs;
        if (cosState.bucket) {
          const { bucket } = cosState;
          const cos = new Cos(credentials, region);
          await cos.remove({ bucket });
        }
      }
      // 2. remove cdn
      if (assets.cdn) {
        const cdn = new Cdn(credentials);
        try {
          await cdn.remove(assets.cdn);
        } catch (e) {
          // no op
        }
      }
      console.log(`Remove static config success`);
    }
  }

  async remove() {
    console.log(`Removing application`);

    const { state } = this;
    const { region, apigw: apigwState, faas: faasState } = state;

    const credentials = this.getCredentials();

    // if disable apigw, no need to remove
    if (apigwState?.id && apigwState?.isDisabled !== true) {
      const apigw = new Apigw(credentials, region);
      await apigw.remove({
        created: !!apigwState.created,
        environment: apigwState.environment,
        serviceId: apigwState.id,
        apiList: apigwState.apiList,
        customDomains: apigwState.customDomains,
      });
    }

    if (faasState?.name) {
      const scf = new Scf(credentials, region);
      await scf.remove({
        functionName: faasState.name,
        namespace: faasState.namespace,
      });
    }

    // remove static
    await this.removeStatic();

    this.state = {} as State;
  }
}
