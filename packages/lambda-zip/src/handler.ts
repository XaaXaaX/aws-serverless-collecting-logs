import { LambdaFunctionURLEvent } from "aws-lambda";

export const handler = async (event: LambdaFunctionURLEvent, context: any) => {
  console.log({ ...event });
  return {
    statusCode: 200,
    body: JSON.stringify('Hello World'),
  };
}