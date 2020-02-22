# Android setup actions

This action sets up a android environment for use in actions. It works on Linux, Windows, and macOS.

# Usage

```yaml
steps:
- uses: actions/checkout@v1
- uses: actions/setup-java@v1
  with:
    java-version: '8.x'
- uses: kineticengines/setup-android-actions@mastemaster
  with:
    api-version: '29'
```