import * as ora from 'ora';
import { program } from 'commander';
import { prompt } from 'inquirer';
import { inc as semverInc, ReleaseType } from 'semver';

import { VERSION_YAML_PATH } from './config';
import { parseYaml, generateYaml } from './utils';

interface Options {
  ver: string;
  dev: string;
  framework: string;
  all: boolean;
  type: ReleaseType;
}

async function change(options: Options) {
  const spinner = ora().start(`Start changing...\n`);

  const versions = parseYaml(VERSION_YAML_PATH);

  let versionType: ReleaseType | undefined = undefined;
  let version = '';
  if (options.dev) {
    version = 'dev';
  } else if (options.ver) {
    version = options.ver;
  } else {
    if (!options.type) {
      spinner.info('No version is specified');
      const { type } = await prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Please select version type ?',
          choices: ['patch', 'minor', 'major'],
        },
      ]);
      versionType = type;
    } else {
      versionType = options.type;
    }
  }

  const curVersion = versions.version;
  if (versionType) {
    version = semverInc(curVersion, versionType) as string;
  }
  versions.version = version;
  await generateYaml(VERSION_YAML_PATH, versions);

  spinner.stop();
}

async function run() {
  program
    .description('Change component version')
    .option('-t, --type [type]', 'chagne version type')
    .option('-a, --all [all]', 'specify all frameworks to be deploy')
    .option('-v, --ver [ver]', 'specify version for component')
    .option('-d, --dev [dev]', 'deploy dev version component')
    .action((options) => {
      change(options);
    });

  program.parse(process.argv);
}

run();
