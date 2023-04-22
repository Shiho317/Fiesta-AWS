import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { APIGatewayEvent, SQSEvent } from "aws-lambda";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

import nodemailer from "./nodemailer";

export const scheduler = async (event: APIGatewayEvent) => {
  const stateMachineArn = process.env["STATE_MACHINE_ARN"] || "";

  const stepFunctions = new SFNClient({});

  const input = {
    stateMachineArn,
    input: event.body ?? "{}",
  };
  const command = new StartExecutionCommand(input);
  const res = await stepFunctions.send(command);

  return {
    statusCode: 200,
    body: event.body,
  };
};

export const producer = async (event: APIGatewayEvent) => {
  const sqs = new SQSClient({});
  let statusCode = 200;
  let message;

  if (!event) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "No body was found",
      }),
    };
  }

  try {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env["QUEUE_URL"],
        MessageBody: JSON.stringify(event),
      })
    );

    message = "Message accepted!";
    console.log({message})
  } catch (error) {
    console.log(error);
    message = error;
    statusCode = 500;
  }

  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  };
};

type Email = {
  to: string;
  from: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html: string;
  sendAt: string;
};

export const consumer = async (event: SQSEvent) => {
  let statusCode = 200;
  let message;
  for (const record of event.Records) {
    const emailObj = JSON.parse(record.body) as Email;
    try {
      const res = await nodemailer(emailObj);
      if (res && res.length > 0) {
        message = "Sent email successfully.";
        return {
          statusCode,
          message,
        };
      }
    } catch (error) {
      message = error;
      statusCode = 500;
    }
  }

  return {
    statusCode,
    message,
  };
};
