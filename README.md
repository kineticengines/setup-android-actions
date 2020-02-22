# Android setup actions

This action sets up a android environment for use in actions. It works on Linux, Windows, and macOS.

# Usage

```yaml
steps:
- uses: actions/checkout@v1
- uses: actions/setup-java@v1
  with:
    java-version: '8.x'
- uses: kineticengines/setup-android-actions@v1
  with:
    api-version: '29'
```

If the `api-version` is not provided, the latest API version will be used. At this time, that is API version 29 (Android 10)