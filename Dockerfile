FROM openjdk:8-jdk-slim
LABEL DavidDexter "dmwangi@kineticengines.coke"
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update \ 
  && apt-get install -qqy git locales ca-certificates curl unzip lcov sudo \
  python3-dev python3-pip python3-setuptools python3-wheel python3-cffi apt-transport-https lsb-release 

RUN pip3 install -U lxml && pip3 install -U beautifulsoup4 && pip3 install -U crcmod && \
   ln -sf /usr/share/zoneinfo/Etc/UTC /etc/localtime

# Use unicode
RUN locale-gen C.UTF-8 || true
ENV LANG=C.UTF-

## Install firebase
RUN curl -sL https://firebase.tools | bash

# Install Google Cloud SDK

RUN export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
    echo "deb https://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -

RUN apt-get update && sudo apt-get install -y google-cloud-sdk && \
    gcloud config set component_manager/disable_update_check true

# clean-up unused packages
RUN apt-get -y autoremove

WORKDIR /app

# Download and install Android SDK
ARG sdk_version=sdk-tools-linux-4333796.zip
ARG android_home=/opt/android/sdk

RUN mkdir -p ${android_home} && \
    curl --silent --show-error --location --fail --retry 3 --output /tmp/${sdk_version} https://dl.google.com/android/repository/${sdk_version} && \
    unzip -q /tmp/${sdk_version} -d ${android_home} && \
    rm /tmp/${sdk_version}

# Set environmental variables
ENV ANDROID_HOME ${android_home}
ENV ADB_INSTALL_TIMEOUT 120
ENV PATH=${ANDROID_HOME}/emulator:${ANDROID_HOME}/tools:${ANDROID_HOME}/tools/bin:${ANDROID_HOME}/platform-tools:${PATH}

RUN mkdir ~/.android && echo '### User Sources for Android SDK Manager' > ~/.android/repositories.cfg

RUN yes | sdkmanager --licenses && sdkmanager --update

## Update SDK manager and install system image, platform and build tools
RUN sdkmanager "tools" "platform-tools" "extras;android;m2repository"  "extras;google;m2repository" "extras;google;google_play_services"

RUN sdkmanager \ 
  "build-tools;29.0.0" \
  "build-tools;29.0.1" \
  "build-tools;29.0.2"

# API_LEVEL string gets replaced by m4
RUN sdkmanager "platforms;android-29"



# ## install flutter
# RUN git clone --single-branch --branch beta https://github.com/flutter/flutter.git /opt/flutter/
# ENV PATH="$PATH:/opt/flutter/bin"
# RUN flutter upgrade && flutter config --no-analytics




