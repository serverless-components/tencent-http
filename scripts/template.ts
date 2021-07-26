import { join } from 'path';
import * as COS from 'cos-nodejs-sdk-v5';
import * as dotenv from 'dotenv';
import * as ora from 'ora';
import { program } from 'commander';
import { prompt } from 'inquirer';
import { Framework } from '../typings';
import { FRAMEWORKS } from './config';

dotenv.config();

const { zip } = require('yzip/src');

interface Options {
  framework: string;
  all: boolean;
}

async function updateTemplate(framework: Framework, spinner: ora.Ora) {
  const cos = new COS({
    SecretId: process.env.TENCENT_SECRET_ID,
    SecretKey: process.env.TENCENT_SECRET_KEY,
  });

  const filename = `${framework}.zip`;
  const input = join(__dirname, '../examples/', framework);
  const output = join(__dirname, '../dist/', filename);
  // 1. 生成 zip 文件
  await zip(input, output);
  // 2. 上传
  spinner.info(`Uploading ${filename}...`);
  await cos.uploadFile({
    Bucket: 'serverless-templates-1300862921',
    Region: 'ap-beijing',
    Key: `/http/${filename}`,
    FilePath: output,
  });

  spinner.succeed(`Upload ${filename} success!`);
}

async function tempalte(options: Options) {
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
    await updateTemplate(frameworks[i], spinner);
  }

  spinner.stop();
}

async function run() {
  program
    .description('Deploy examples')
    .option('-f, --framework [framework]', 'specify framework example to be deploy')
    .option('-a, --all [all]', 'specify all frameworks examples to be deploy')
    .action((options) => {
      tempalte(options);
    });

  program.parse(process.argv);
}

run();
