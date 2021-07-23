import { join } from 'path';
import * as dotenv from 'dotenv';
import * as ora from 'ora';
import { execSync } from 'child_process';
import { program } from 'commander';

dotenv.config({
  path: join(__dirname, '..', '.env'),
});

import { COMPONENT_NAME, VERSION_YAML_PATH } from './config';
import { copySync, rmdirSync, parseYaml, getComponentConfig, publishComponent } from './utils';

async function buildProject() {
  const buildPath = join(__dirname, '..', 'build');
  rmdirSync(buildPath);
  execSync(`tsc -p .`, {
    cwd: process.cwd(),
  });
  copySync(join(__dirname, '..', 'src/node_modules'), join(__dirname, '..', 'build/node_modules'));
}

async function copyExtraFiles() {
  const shimPath = join(__dirname, '..', `src/_shims`);
  const targetShimPath = join(__dirname, '..', 'build/_shims');
  const fixturePath = join(__dirname, '..', 'src/_fixtures');
  const targetFixturePath = join(__dirname, '..', 'build/_fixtures');

  // 复制前，需要先删除
  rmdirSync(targetShimPath);
  rmdirSync(targetFixturePath);

  // 复制指定框架的 _shims 文件
  copySync(shimPath, targetShimPath);
  // 复制 _fixtures
  copySync(fixturePath, targetFixturePath);
}

async function deploy(options: { [propName: string]: any }) {
  const stage = options.env || 'dev';
  process.env.SERVERLESS_PLATFORM_STAGE = stage;

  const spinner = ora().start('Start deploying...\n');

  spinner.info(`[BUILD] Building project...`);
  await buildProject();
  spinner.succeed(`[BUILD] Build project success`);
  if (options.onlyBuild) {
    spinner.stop();
    return true;
  }

  spinner.info(`Copying extra files for component...`);
  await copyExtraFiles();

  spinner.info(`Generate config file for compooent ${COMPONENT_NAME}...`);
  const { version } = parseYaml(VERSION_YAML_PATH);
  const compConfig = getComponentConfig(version);

  if (options.version) {
    compConfig.version = options.version;
  }
  if (options.dev) {
    compConfig.version = 'dev';
  }

  try {
    spinner.info(`Publishing component ${COMPONENT_NAME}@${compConfig.version}...`);
    await publishComponent(compConfig);
    spinner.succeed(`Publish compooent ${COMPONENT_NAME}@${compConfig.version} success`);
  } catch (e) {
    spinner.warn(`Publish compooent ${COMPONENT_NAME}@${compConfig.version} error: ${e.message}`);
  }

  spinner.stop();

  return compConfig;
}

async function run() {
  program
    .description('Deploy components')
    .option('-d, --dev [dev]', 'deploy dev version component')
    .option('-e, --env [env]', 'specify deploy environment: prod,dev', 'dev')
    .option('-v, --ver [ver]', 'component version')
    .option('-ob, --onlyBuild [onlyBuild]', 'only build project', false)
    .action((options) => {
      deploy(options);
    });

  program.parse(process.argv);
}

run();
