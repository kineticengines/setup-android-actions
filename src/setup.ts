import * as path from 'path';
import * as exec from '@actions/exec';
import * as core from '@actions/core';


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

interface Options { listeners: {} };

export async function setupAndroid(version: string): Promise<void>{
  console.log('=== installing prerequisites ===');
  await exec.exec('sudo apt-get update');
  await exec.exec('sudo apt-get install -qqy ca-certificates curl unzip python3-cffi apt-transport-https lsb-release');
  await exec.exec('sudo curl -sL https://firebase.tools | bash');  

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
  await exec.exec('curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -');
  await exec.exec('sudo apt-get update && sudo apt-get install -y google-cloud-sdk');
  await exec.exec('gcloud config set core/disable_usage_reporting true && gcloud config set component_manager/disable_update_check true');
  
  core.exportVariable('ANDROID_HOME','/opt/android/sdk');
  core.exportVariable('SDK_VERSION','sdk-tools-linux-4333796.zip');
  core.exportVariable('ADB_INSTALL_TIMEOUT','120');

  await exec.exec('sudo mkdir -p $ANDROID_HOME');
  await exec.exec('curl --silent --show-error --location --fail --retry 3 --output /tmp/$SDK_VERSION https://dl.google.com/android/repository/$SDK_VERSION');
  await exec.exec('sudo unzip -q /tmp/$SDK_VERSION -d $ANDROID_HOME && sudo rm /tmp/$ANDROID_HOME');
 
  core.addPath('$ANDROID_HOME/emulator');
  core.addPath('$ANDROID_HOME/tools');
  core.addPath('$ANDROID_HOME/tools/bin');
  core.addPath('$ANDROID_HOME/platform-tools');

  console.log('=== installing android ===');
  await exec.exec(`mkdir ~/.android && echo '### User Sources for Android SDK Manager' > ~/.android/repositories.cfg`);
  await exec.exec('yes | sdkmanager --licenses && sdkmanager --update');
  await exec.exec(`sdkmanager "tools" "platform-tools" "emulator" "extras;android;m2repository" "extras;google;m2repository" "extras;google;google_play_services" `);
  await exec.exec(`sdkmanager "build-tools;${version}.0.0" `);
  await exec.exec(`sdkmanager "platforms;android-${version}"`);  
}