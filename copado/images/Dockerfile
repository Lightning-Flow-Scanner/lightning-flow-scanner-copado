FROM salesforce/cli:latest-full

RUN apt-get update && apt-get -y install python3 python3-requests && rm -rf /var/lib/apt/lists/*

USER root
RUN usermod -l func heroku && \
    groupmod -n func heroku && \
    usermod -d /home/func -m func && \
    mkdir -p /app /home/func && chown func:func /app /home/func

USER func:func

RUN echo y | sfdx plugins:install lightning-flow-scanner@v2.34.0
RUN echo y | sfdx plugins:install sfdx-git-delta@v5.45.0

ENV SFDX_DISABLE_AUTOUPDATE=true \
    SFDX_DISABLE_TELEMETRY=true \
    SF_DISABLE_AUTOUPDATE=true \
    SF_DISABLE_TELEMETRY=true

WORKDIR /app
