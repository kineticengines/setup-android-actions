import * as path from 'path';
import * as exec from '@actions/exec';
import * as core from '@actions/core';
import * as io from '@actions/io';


const IS_WINDOWS = process.platform === 'win32';
const IS_DARWIN = process.platform === 'darwin';
const IS_LINUX = process.platform === 'linux';

let homeDirectory = process.env['HOME'] || process.env['USERPROFILE'];
interface Options { listeners: {} };

export async function setupAndroid(version: string): Promise<void>{
  console.log('=== installing prerequisites ==='); 
  await exec.exec('sudo apt-get update');
  await exec.exec('sudo apt-get install -qqy ca-certificates curl apt-transport-https');
  await exec.exec('sudo apt-get install -qqy unzip python3-cffi lsb-release');
  console.log('=== installing firebase tools ===');  
  await exec.exec(`bash -c "curl -sL https://firebase.tools | bash"` );

  let lsbRelease : string = '';
  const  lsbReleaseObj = {} as Options;
  lsbReleaseObj.listeners = {
    stdout: (data: Buffer) => {
      lsbRelease += data.toString();
    },    
  };

  await exec.exec('lsb_release -c -s',undefined,lsbReleaseObj);
  core.exportVariable('LSB_RELEASE', lsbRelease); 
  core.exportVariable('CLOUD_SDK_REPO', `cloud-sdk-${lsbRelease}`);

  console.log('=== installing gcloud SDK ===');
  await exec.exec('echo "deb https://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list');  
  await exec.exec(`bash -c "curl https://packages.cloud.google.com/apt/doc/apt-key.gpg --output ${homeDirectory}/key.gpg "`);
  await exec.exec(`sudo apt-key add ${homeDirectory}/key.gpg`);
  await exec.exec('bash -c "sudo apt-get update && sudo apt-get install -qqy google-cloud-sdk "');
  await exec.exec(`bash -c "gcloud config set core/disable_usage_reporting true && gcloud config set component_manager/disable_update_check true "`);
  
  core.exportVariable('ANDROID_HOME',`${homeDirectory}/android/sdk`);
  core.exportVariable('SDK_VERSION','sdk-tools-linux-4333796.zip');
  core.exportVariable('ADB_INSTALL_TIMEOUT','120');

  await io.mkdirP(`${homeDirectory}/android/sdk`);   
  await exec.exec(`bash -c "curl --silent --show-error --location --fail --retry 3 --output ${homeDirectory}/$SDK_VERSION https://dl.google.com/android/repository/$SDK_VERSION"`);
  await exec.exec(`bash -c "sudo unzip -q ${homeDirectory}/$SDK_VERSION -d $ANDROID_HOME && sudo rm -rf ${homeDirectory}/$SDK_VERSION "`); 
 
  core.addPath(`${homeDirectory}/android/sdk/tools`);
  core.addPath(`${homeDirectory}/android/sdk/tools/bin`);
  core.addPath(`${homeDirectory}/android/sdk/platform-tools`);

  await exec.exec(`bash -c "echo $PATH" `);
  await exec.exec(`bash -c "echo $ANDROID_HOME" `);
  console.log('=== installing android SDK ===');
  // await exec.exec(`bash -c "sudo mkdir ${tempDirectory}/.android && sudo echo '### User Sources for Android SDK Manager' | sudo tee -a ${tempDirectory}/.android/repositories.cfg"`)
  await exec.exec(`bash -c "yes | sudo ${homeDirectory}/android/sdk/tools/bin/sdkmanager --licenses"`);  
  await exec.exec(`bash -c " ls -la ${homeDirectory}/android/sdk/tools/"`)
  await exec.exec(`bash -c "sudo ${homeDirectory}/android/sdk/tools/bin/sdkmanager "tools" "platform-tools" "extras;android;m2repository" "extras;google;m2repository" "extras;google;google_play_services" "`);
  await exec.exec(`bash -c "sudo ${homeDirectory}/android/sdk/tools/bin/sdkmanager "build-tools;${version}.0.0" "`);
  await exec.exec(`bash -c "sudo ${homeDirectory}/android/sdk/tools/bin/sdkmanager "platforms;android-${version}" "`);  
  await exec.exec(`bash -c "sudo ${homeDirectory}/android/sdk/tools/bin/sdkmanager --update "`) 
}