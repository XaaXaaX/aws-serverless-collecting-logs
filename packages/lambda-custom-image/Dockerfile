
# FROM 904233108557.dkr.ecr.eu-west-1.amazonaws.com/lambda-telemetry-image:latest AS extensions
FROM public.ecr.aws/lambda/nodejs:22

WORKDIR ${LAMBDA_TASK_ROOT}

COPY dist/* ./
# COPY --from=extensions ./opt/ /opt/

CMD ["index.handler"]