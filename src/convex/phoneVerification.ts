"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) {
    throw new Error("Phone verification is not configured. Add the Twilio Verify environment variables.");
  }
  return { accountSid, authToken, serviceSid };
};

const twilioRequest = async (url: string, body: URLSearchParams) => {
  const { accountSid, authToken } = getTwilioConfig();
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
};

export const sendPhoneOtp = action({
  args: { phone: v.string() },
  handler: async (_ctx, args) => {
    const { accountSid, serviceSid } = getTwilioConfig();
    const phone = args.phone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new Error("Enter a valid phone number with country code, for example +919725756046.");
    }
    const response = await twilioRequest(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      new URLSearchParams({ To: phone, Channel: "sms" }),
    );
    if (!response.ok) {
      throw new Error(`Unable to send SMS verification (${response.status}). Check the phone number and Twilio setup.`);
    }
    return { phone, status: "pending" };
  },
});

export const verifyPhoneOtp = action({
  args: { phone: v.string(), code: v.string() },
  handler: async (ctx, args): Promise<Id<"phoneVerifications">> => {
    const { accountSid, serviceSid } = getTwilioConfig();
    const response = await twilioRequest(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      new URLSearchParams({ To: args.phone.trim(), Code: args.code.trim() }),
    );
    if (!response.ok) throw new Error("The phone verification code is incorrect or expired.");
    const result = (await response.json()) as { status?: string };
    if (result.status !== "approved") throw new Error("The phone verification code is incorrect or expired.");
    return await ctx.runMutation(internal.phoneVerificationStore.createVerification, { phone: args.phone.trim() });
  },
});

