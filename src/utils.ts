import { ServerlessComponent } from './index';
import { ApiError } from 'tencent-component-toolkit/lib/utils/error';
import * as download from 'download';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as AdmZip from 'adm-zip';
import { FaasSdkInputs, Framework } from './interface';

import { getConfig } from './config';

export const generateId = () =>
  Math.random()
    .toString(36)
    .substring(6);

export const deepClone = (obj: { [propName: string]: any }) => {
  return JSON.parse(JSON.stringify(obj));
};

export const getType = (obj: any) => {
  return Object.prototype.toString.call(obj).slice(8, -1);
};

export const capitalString = (str: string) => {
  if (str.length < 2) {
    return str.toUpperCase();
  }

  return `${str[0].toUpperCase()}${str.slice(1)}`;
};

export const getDefaultProtocol = (protocols: string[]) => {
  return String(protocols).includes('https') ? 'https' : 'http';
};

export const getDefaultFunctionName = (framework?: string) => {
  return `${framework || 'http'}_${generateId()}`;
};

export const getDefaultServiceName = () => {
  return 'serverless';
};

export const getDefaultServiceDescription = () => {
  return 'Created by Serverless';
};

export const removeAppid = (str: string, appid: string) => {
  const suffix = `-${appid}`;
  if (!str || str.indexOf(suffix) === -1) {
    return str;
  }
  return str.slice(0, -suffix.length);
};

export const validateTraffic = (num: number | any) => {
  if (getType(num) !== 'Number') {
    throw new ApiError({
      type: `PARAMETER_HTTP_TRAFFIC`,
      message: 'traffic must be a number',
    });
  }
  if (num < 0 || num > 1) {
    throw new ApiError({
      type: `PARAMETER_HTTP_TRAFFIC`,
      message: 'traffic must be a number between 0 and 1',
    });
  }
  return true;
};

const generatePublicDir = (zipPath: string) => {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  const [entry] = entries.filter((e) => e.entryName === 'app/public/' && e.name === '');
  if (!entry) {
    const extraPublicPath = path.join(__dirname, '_fixtures/public');
    zip.addLocalFolder(extraPublicPath, 'app/public');
    zip.writeZip();
  }
};

/**
 * 初始化 scf_bootstrap 文件
 */
export const initializeBootstrap = (framework: string, zipPath: string, content?: string) => {
  const bsFilename = 'scf_bootstrap';
  const zip = new AdmZip(zipPath);
  if (content) {
    const decodeContent = decodeURIComponent(content);
    zip.addFile(bsFilename, Buffer.from(decodeContent, 'utf8'), '', 0o755);
  } else {
    const entries = zip.getEntries();
    const [entry] = entries.filter((e: any) => e.entryName === bsFilename);
    // 如果不存在，自动创建
    if (!entry) {
      const bootstrapFile = path.join(__dirname, '_shims', framework, bsFilename);
      zip.addFile(bsFilename, fse.readFileSync(bootstrapFile), '', 0o755);
    }
  }
  zip.writeZip();
};

export const getCodeZipPath = async (inputs: FaasSdkInputs) => {
  const CONFIGS = getConfig(process.env.FRAMEWORK as Framework);
  const { framework } = CONFIGS;
  console.log(`Packaging ${framework} application`);

  let zipPath;
  if (!inputs.code?.src) {
    // 添加默认代码模板
    const downloadPath = `/tmp/${generateId()}`;
    const filename = 'template';

    console.log(`Installing Default ${framework} App`);
    try {
      await download(CONFIGS.templateUrl, downloadPath, {
        filename: `${filename}.zip`,
      });
    } catch (e) {
      throw new ApiError({
        type: `DOWNLOAD_TEMPLATE`,
        message: 'Download default template failed.',
      });
    }
    zipPath = `${downloadPath}/${filename}.zip`;
  } else {
    zipPath = inputs.code.src;
  }
  initializeBootstrap(framework, zipPath, inputs.bootstrapContent);

  // 自动注入 public 目录
  if (framework === 'egg') {
    generatePublicDir(zipPath);
  }

  return zipPath;
};

export const getDirFiles = (dirPath: string) => {
  const targetPath = path.resolve(dirPath);
  const files = fse.readdirSync(targetPath);
  const temp: { [propName: string]: any } = {};
  files.forEach((file: string) => {
    temp[file] = path.join(targetPath, file);
  });
  return temp;
};

export const getInjection = (instance: ServerlessComponent) => {
  let injectFiles = {};
  let injectDirs = {};
  const shimPath = path.join(__dirname, '_shims');
  injectFiles = instance.getSDKEntries(`_shims/handler.handler`);
  injectDirs = {
    _shims: shimPath,
  };

  return { injectFiles, injectDirs };
};
