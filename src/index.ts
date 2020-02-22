import * as core from '@actions/core';
import * as setup from './setup';

async function run() {
  try {
    const version = core.getInput('api-version') || '29';
    await setup.setupAndroid(version);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();