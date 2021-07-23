import { join } from 'path';
import * as YAML from 'js-yaml';
import { readFileSync, writeFileSync, rmSync } from 'fs';
import * as fse from 'fs-extra';
import { ComponentConfig, ServerlessConfig, InputsSrc, SrcObject } from '../typings';
import { COMPONENT_CODE_PATH, COMPONENT_NAME } from './config';

const { ServerlessSDK } = require('@serverless/platform-client-china');

export const typeOf = (obj: any) => {
  return Object.prototype.toString.call(obj).slice(8, -1);
};

export function getComponentConfig(version: string): ComponentConfig {
  const componentYaml = join(__dirname, '../component.yml');
  const content = readFileSync(componentYaml, 'utf-8');
  const config = YAML.load(content) as ComponentConfig;
  return {
    ...config,
    type: 'component',
    name: COMPONENT_NAME,
    version,
    repo: `https://github.com/serverless-components/tencent-${COMPONENT_NAME}`,
    readme: `https://github.com/serverless-components/tencent-${COMPONENT_NAME}/tree/master/README.md`,
    webDeployable: true,
    src: COMPONENT_CODE_PATH,
  };
}

export function parseYaml(filename: string): Record<string, any> {
  const content = readFileSync(filename, 'utf-8');
  return YAML.load(content) as Record<string, any>;
}

export function generateYaml(filename: string, obj: { [propName: string]: any } | string) {
  let yamlContent: string;
  if (typeOf(obj) === 'String') {
    yamlContent = obj as string;
  } else {
    yamlContent = YAML.dump(obj);
  }
  return writeFileSync(filename, yamlContent);
}

export async function publishComponent(componentConfig: { [propName: string]: any }) {
  const sdk = new ServerlessSDK();

  let registryPackage;
  try {
    registryPackage = await sdk.publishPackage(componentConfig);
  } catch (error) {
    if (error.message.includes('409')) {
      error.message = error.message.replace('409 - ', '');
      console.error(error.message, true);
    } else {
      throw error;
    }
  }

  if (registryPackage && registryPackage.version === '0.0.0-dev') {
    registryPackage.version = 'dev';
  }
  return registryPackage;
}

export function copySync(source: string, dest: string) {
  fse.copySync(source, dest, {
    // overwrite: true,
    errorOnExist: false,
    // recursive: true,
  });
}

export async function rmdirSync(source: string) {
  rmSync(source, {
    recursive: true,
    force: true,
  });
}

export function getExampleConfig(framework: string) {
  const examplePath = join(__dirname, '..', 'examples', framework);
  const exampleYaml = join(examplePath, 'serverless.yml');
  const yamlConfig = parseYaml(exampleYaml) as ServerlessConfig;

  return {
    examplePath,
    yamlConfig,
  };
}

export function generateId(len = 6) {
  const randomStr = Math.random().toString(36);
  return randomStr.substr(-len);
}

export function getServerlessSdk(orgName: string, orgUid: string) {
  const sdk = new ServerlessSDK({
    context: {
      orgUid,
      orgName,
    },
  });
  return sdk;
}

export function resolveSrcConfig(baseDir: string, srcConfig: InputsSrc): SrcObject {
  if (typeof srcConfig === 'string') {
    const src = {
      src: join(baseDir, srcConfig),
    };
    return src;
  }
  if (srcConfig.src) {
    srcConfig.src = join(baseDir, srcConfig.src!);
  } else if (srcConfig.dist) {
    srcConfig.dist = join(baseDir, srcConfig.dist!);
    srcConfig.src = srcConfig.dist;
  }
  return srcConfig;
}
