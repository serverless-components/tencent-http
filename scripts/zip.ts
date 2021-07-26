const { zip } = require('yzip/src');
const { join } = require('path');

const frameworks = [
  'express',
  'koa',
  'egg',
  'nestjs',
  'nextjs',
  'nuxtjs',
  'flask',
  'django',
  'laravel',
  'thinkphp',
];

async function main() {
  for (const framework of frameworks) {
    const input = join(__dirname, '../examples/', framework);
    const output = join(__dirname, '../dist/', `${framework}.zip`);
    await zip(input, output);
  }
}

main();
