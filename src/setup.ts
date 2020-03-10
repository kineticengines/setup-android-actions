import * as path from 'path';
import * as exec from '@actions/exec';
import * as core from '@actions/core';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';


// const IS_WINDOWS = process.platform === 'win32';
// const IS_DARWIN = process.platform === 'darwin';
// const IS_LINUX = process.platform === 'linux';

let homeDirectory = process.env['HOME'] || process.env['USERPROFILE'] as string;
let user = process.env['USER'];
interface Options { listeners: {} };

export async function setupAndroid(version: string): Promise<void>{
  console.log('=== installing prerequisites ==='); 
  await exec.exec('sudo apt-get update');
  await exec.exec('sudo apt-get install -qqy ca-certificates curl apt-transport-https');
  await exec.exec('sudo apt-get install -qqy unzip python3-cffi lsb-release');

  // download firebase
  console.log('=== installing firebase tools ===');  
  await exec.exec(`bash -c "curl -sL https://firebase.tools | bash"` );

  let lsbRelease : string = '';
  const  lsbReleaseObj = {} as Options;
  lsbReleaseObj.listeners = {
    stdout: (data: Buffer) => {
      lsbRelease += data.toString();
    },    
  };

  //setup env variables to be used to download google-cloud-sdk
  await exec.exec('lsb_release -c -s',undefined,lsbReleaseObj);
  core.exportVariable('LSB_RELEASE', lsbRelease); 
  core.exportVariable('CLOUD_SDK_REPO', `cloud-sdk-${lsbRelease}`);

  console.log('=== installing gcloud SDK ===');
  await exec.exec('echo "deb https://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list');  
  
  // download gcloud gpg key
  // await exec.exec(`bash -c "curl https://packages.cloud.google.com/apt/doc/apt-key.gpg --output ${homeDirectory}/key.gpg "`);

  const gcloudGPGPath = await tc.downloadTool('https://packages.cloud.google.com/apt/doc/apt-key.gpg');
  await io.mv(gcloudGPGPath, path.join(homeDirectory, "key.gpg"));
  await exec.exec(`sudo apt-key add ${homeDirectory}/key.gpg`);
  //download gcloud-sdk
  await exec.exec('bash -c "sudo apt-get update && sudo apt-get install -qqy google-cloud-sdk "');
  await exec.exec(`bash -c "gcloud config set core/disable_usage_reporting true && gcloud config set component_manager/disable_update_check true "`);
  
  //download android sdk
  await io.mkdirP(`${homeDirectory}/android/sdk`);

  core.exportVariable('ANDROID_HOME',`${homeDirectory}/android/sdk`);
  core.exportVariable('SDK_VERSION','sdk-tools-linux-4333796.zip');
  core.exportVariable('ADB_INSTALL_TIMEOUT','120');
  
  //await exec.exec(`bash -c "curl --silent --show-error --location --fail --retry 3 --output ${homeDirectory}/$SDK_VERSION https://dl.google.com/android/repository/$SDK_VERSION"`);
  //await exec.exec(`bash -c "sudo unzip -q ${homeDirectory}/$SDK_VERSION -d $ANDROID_HOME && sudo rm -rf ${homeDirectory}/$SDK_VERSION "`); 
  const androidSDKPath = await tc.downloadTool('https://dl.google.com/android/repository/$SDK_VERSION');
  await tc.extractZip(androidSDKPath, '$ANDROID_HOME');

 
  core.addPath('$ANDROID_HOME/tools');
  core.addPath('$ANDROID_HOME/tools/bin');
  core.addPath('$ANDROID_HOME/platform-tools');

  await exec.exec(`bash -c "echo $PATH" `);
  await exec.exec(`bash -c "echo $ANDROID_HOME" `);

  console.log('=== installing android SDK ===');
  
  // await io.mkdirP(`${homeDirectory}/.android`);
  // await exec.exec(`bash -c "sudo echo '### User Sources for Android SDK Manager' | sudo tee -a ${homeDirectory}/.android/repositories.cfg"`);  
  await exec.exec(`bash -c "mkdir ~/.android && echo '### User Sources for Android SDK Manager' > ~/.android/repositories.cfg"`); 
  await exec.exec(`bash -c "sudo ln -s $ANDROID_HOME/tools/bin/sdkmanager /usr/lib/sdkmanager"`);
  await exec.exec(`bash -c "yes | sudo sdkmanager --list"`); 
  await exec.exec(`bash -c "yes | sudo sdkmanager --licenses"`);  
  // await exec.exec(`sudo chown -R ${user}:${user} ${homeDirectory}/android`); 
  // await exec.exec(`sudo chown -R ${user}:${user} ${homeDirectory}/.android`); 
  // await exec.exec(`bash -c " ls -la ${homeDirectory}/android/sdk/tools/"`);
  // await exec.exec(`bash -c "sdkmanager --list"`);
  // await exec.exec(`bash -c "sudo ${homeDirectory}/android/sdk/tools/bin/sdkmanager "tools" "platform-tools" "`);
  // await exec.exec(`bash -c "sudo ${homeDirectory}/android/sdk/tools/bin/sdkmanager "build-tools;${version}.0.0" "`);
  // await exec.exec(`bash -c "sudo ${homeDirectory}/android/sdk/tools/bin/sdkmanager "platforms;android-${version}" "`);  
  // await exec.exec(`bash -c "sudo ${homeDirectory}/android/sdk/tools/bin/sdkmanager --update "`) 
}