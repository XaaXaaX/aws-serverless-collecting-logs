
# FROM 904233108557.dkr.ecr.eu-west-1.amazonaws.com/lambda-telemetry-image:latest AS extensions
FROM public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0-aarch64 AS webadapter
FROM public.ecr.aws/docker/library/node:20-slim

WORKDIR ${LAMBDA_TASK_ROOT}

COPY dist/* ./
# COPY --from=extensions ./opt/ /opt/
COPY --from=webadapter /lambda-adapter /opt/extensions/lambda-adapter

CMD ["node", "index.js"]
