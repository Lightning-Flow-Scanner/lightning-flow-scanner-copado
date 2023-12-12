FROM salesforce/salesforcedx:7.209.6-full

RUN apt-get update && apt-get -y install python3 python3-requests && rm -rf /var/lib/apt/lists/*

RUN useradd -u 1000 -s /bin/bash func && mkdir -p /app /home/func && chown func:func /app /home/func
USER func:func

RUN echo y | sfdx plugins:install lightning-flow-scanner@v2.16.0
RUN echo y | sfdx plugins:install sfdx-git-delta@v5.18.0

ENV SFDX_DISABLE_AUTOUPDATE=true \
    SFDX_DISABLE_TELEMETRY=true \
    SF_DISABLE_AUTOUPDATE=true \
    SF_DISABLE_TELEMETRY=true

WORKDIR /app
