const { spawn } = require('child_process')

let SLS_INIT = false;

const START_CMD = 'node app.js';

async function startServer() {
  return new Promise((resolve, reject) => {
    if (!START_CMD) {
      reject(new Error('Missing start command'))
      return;
    }
    if (SLS_INIT) {
      resolve(`Server already initilized`)
      return;
    } else {
      console.log('Starting serverless server');
      const [cmd, ...args] = START_CMD.split(' ')
      const cpr = spawn(cmd, args, {
        cwd: process.cwd()
      });

      cpr.stdout.on('data', (chunk) => {
        console.log(chunk.toString('utf-8'));
      });

      cpr.stderr.on('data', (chunk) => {
        console.log(chunk.toString('utf-8'));
      });

      cpr.on('error', (err) => {
        console.log(`Child process error: ${err}`);

        SLS_INIT = false;
        reject(err)
      })

      cpr.on('exit', (code, signal) => {
        const msg = `Child process exist with code: ${code}, signal: ${signal}`
        console.log(msg);
        SLS_INIT = false;
        reject(new Error(msg))
      })

      console.log('[Process]', cpr.pid);

      SLS_INIT = true

      resolve(`Server initilize success`)
    }
  })

}

async function main() {
  const start = await startServer();
  console.log(start);
}
main()
