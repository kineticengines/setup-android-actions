import * as core from '@actions/core';
import * as setup from './setup';

async function run() {
  try {
    const version = core.getInput('api-version') || '';
    await setup.setupAndroid(version);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();