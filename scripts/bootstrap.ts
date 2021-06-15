import { join } from 'path';
import { spawnSync } from 'child_process';

const rootDir = join(__dirname, '..');

async function installDependencies(dir: string) {
  spawnSync('yarn', ['install'], {
    cwd: dir,
  });
}

/* eslint-disable no-console*/
async function bootstrap() {
  console.log('[root] Install dependencies');
  await installDependencies(rootDir);

  console.log('[src] Install dependencies');
  await installDependencies(join(rootDir, 'src'));
}

bootstrap();

process.on('unhandledRejection', (e) => {
  throw e;
});
