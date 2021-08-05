import { join } from 'path';
import * as dotenv from 'dotenv';
import * as ora from 'ora';
import * as chalk from 'chalk';
import { program } from 'commander';
import { prompt } from 'inquirer';
import * as open from 'open';
import { Framework, ServerlessConfig } from '../typings';
import { FRAMEWORKS } from './config';
import { getExampleConfig, getServerlessSdk } from './utils';

dotenv.config({
  path: join(__dirname, '..', '.env.test'),
});

process.env.SERVERLESS_PLATFORM_VENDOR = 'tencent';

const credentials = {
  tencent: {
    SecretId: process.env.TENCENT_SECRET_ID,
    SecretKey: process.env.TENCENT_SECRET_KEY,
  },
};

interface Options {
  env: string;
  dev: string;
  framework: string;
  all: boolean;
  example: boolean;
  template: boolean;
  open: boolean;
  remove: boolean;
  inputs: string;
}

function parseInputs(inputs: string) {
  const inputObject: { [key: string]: any } = {};
  if (!inputs) {
    return inputObject;
  }
  try {
    inputs.split(',').forEach((item) => {
      const [key, value] = item.split('=');
      if (key.indexOf('.') !== -1) {
        const keyArr = key.split('.');
        const len = keyArr.length;
        let index = 0;
        let curObj = inputObject;

        while (index < len) {
          const curKey = keyArr[index];
          if (!curObj[curKey]) {
            curObj[curKey] = index === len - 1 ? value : {};
          }
          curObj = curObj[curKey];
          index++;
        }
      } else {
        inputObject[key] = value;
      }
    });
  } catch (e) {}
  return inputObject;
}

async function deployExample(framework: Framework, options: Options, spinner: ora.Ora) {
  const { examplePath, yamlConfig } = getExampleConfig(framework);
  const appId = process.env.TENCENT_APP_ID as string;

  if (options.template) {
    delete yamlConfig.inputs.src;
  } else {
    yamlConfig.inputs.src = {
      src: examplePath,
      exclude: ['.env'],
    };
  }

  yamlConfig.org = appId;
  yamlConfig.app = yamlConfig.app || yamlConfig.name;
  yamlConfig.stage = yamlConfig.stage || 'dev';

  if (options.dev) {
    yamlConfig.component = `http@dev`;
  } else {
    yamlConfig.component = 'http';
  }

  const sdk = getServerlessSdk(appId, appId);

  async function retrySlsAction(action: string, yamlConf: ServerlessConfig, cred: any) {
    try {
      const res = await sdk[action](yamlConf, cred);
      return res;
    } catch (e) {
      if (e.message.indexOf('An internal error has occurred') > -1) {
        return new Promise((resolve) => {
          setTimeout(async () => {
            const res = await sdk[action](yamlConf, cred);
            resolve(res);
          }, 3000);
        });
      }
    }
  }

  const stage = options.env || 'dev';
  process.env.SERVERLESS_PLATFORM_STAGE = stage;

  if (stage === 'dev') {
    yamlConfig.component = `http@dev`;
  }

  // merge customize inputs parameters
  const inputs = parseInputs(options.inputs);
  yamlConfig.inputs = {
    ...yamlConfig.inputs,
    ...inputs,
  };

  // remove deploy instance
  if (options.remove) {
    spinner.info(`[${yamlConfig.component}] Removing example (${stage})...`);
    await retrySlsAction('remove', yamlConfig, credentials);
    spinner.succeed(`[${yamlConfig.component}] Remove example success`);
  } else {
    // deploy
    spinner.info(`[${yamlConfig.component}] Deploying example (${stage})...`);
    const res = await retrySlsAction('deploy', yamlConfig, credentials);
    spinner.succeed(`[${yamlConfig.component}] Deploy example success`);

    console.log(
      chalk.bgGreen('\n', chalk.black(` OUTPUTS `)),
      '\n',
      chalk.yellow(JSON.stringify(res.outputs, null, 2)),
    );

    if (options.open) {
      const { url } = res.outputs.apigw;
      console.log(`Open ${chalk.greenBright(url)}`);
      await open(url, { wait: false });
    }
  }
}

async function deploy(options: Options) {
  let frameworks: Framework[];
  if (options.framework) {
    const { framework } = options;
    frameworks = [framework] as Framework[];

    // await deployComponent(framework as Framework, options, spinner);
  } else if (options.all) {
    frameworks = FRAMEWORKS;
  } else {
    // ask to select framework
    const anwsers = await prompt([
      {
        type: 'checkbox',
        name: 'frameworks',
        message: 'Please select framework to be deploy ?',
        choices: FRAMEWORKS,
      },
    ]);
    frameworks = anwsers.frameworks as Framework[];
  }

  const spinner = ora().start(`Start deploying examples...\n`);

  for (let i = 0; i < frameworks.length; i++) {
    await deployExample(frameworks[i], options, spinner);
  }

  spinner.stop();
}

async function run() {
  program
    .description('Deploy examples')
    .option('-f, --framework [framework]', 'specify framework example to be deploy')
    .option('-a, --all [all]', 'specify all frameworks examples to be deploy')
    .option('-o, --open [open]', 'After deployment auto open url')
    .option('-e, --env [env]', 'specify environment for component service: prod,dev', 'dev')
    .option('-d, --dev [dev]', 'use dev version component')
    .option('-t, --template [template]', 'use template to deploy')
    .option('-r, --remove [remove]', 'remove example')
    .option('-i, --inputs [inputs]', 'customize inputs')
    .action((options) => {
      deploy(options);
    });

  program.parse(process.argv);
}

run();
