import * as path from 'path';
import * as exec from '@actions/exec';


const IS_WINDOWS = process.platform === 'win32';
const IS_DARWIN = process.platform === 'darwin';
const IS_LINUX = process.platform === 'linux';

let tempDirectory = process.env['RUNNER_TEMP'] || '';

if (!tempDirectory) {
  let baseLocation;

  if(IS_WINDOWS){
    baseLocation = process.env['USERPROFILE'] || 'C:\\';
  }else if(IS_DARWIN){
    baseLocation = '/Users';
  }else{
    baseLocation = '/home';
  }
  tempDirectory = path.join(baseLocation, 'actions', 'temp');
}


export async function setupAndroid(version: string): Promise<void>{
  console.log('=== installing prerequisites ===');
  await exec.exec('apt-get update');
  await exec.exec('apt-get install -qqy ca-certificates unzip python3-cffi apt-transport-https lsb-release');
  await exec.exec('curl -sL https://firebase.tools | bash');
}