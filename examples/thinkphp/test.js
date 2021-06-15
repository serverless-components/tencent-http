const { spawn } = require('child_process');

async function main() {
  const { stdout, stderr } = spawn('php', ['think', 'run']);

  stdout.on('data', (chunk) => {
    console.log(chunk.toString('utf-8'));
  });

  stderr.on('data', (chunk) => {
    console.log(chunk.toString('utf-8'));
  });
}

main();
