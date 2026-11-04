import { cache } from "react";
import { prisma } from "@/infrastructure/prisma";

export type IntegrationRow = {
  kavenegarApiKey: string;
  kavenegarSender: string;
  kavenegarTemplate: string;
  zarinpalMerchantId: string;
  zarinpalSandbox: boolean;
  enamadImage: string;
  enamadLink: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
};

const empty: IntegrationRow = {
  kavenegarApiKey: "",
  kavenegarSender: "",
  kavenegarTemplate: "",
  zarinpalMerchantId: "",
  zarinpalSandbox: false,
  enamadImage: "",
  enamadLink: "",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
};

export const getIntegration = cache(async (): Promise<IntegrationRow> => {
  const row = await prisma.integration.findUnique({ where: { id: "site" } });
  if (!row) return empty;
  return {
    kavenegarApiKey: row.kavenegarApiKey,
    kavenegarSender: row.kavenegarSender,
    kavenegarTemplate: row.kavenegarTemplate,
    zarinpalMerchantId: row.zarinpalMerchantId,
    zarinpalSandbox: row.zarinpalSandbox,
    enamadImage: row.enamadImage,
    enamadLink: row.enamadLink,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    contactAddress: row.contactAddress,
  };
});

export async function smsIsLive(): Promise<boolean> {
  const row = await getIntegration();
  return row.kavenegarApiKey.trim().length > 0;
}

export async function paymentsAreLive(): Promise<boolean> {
  const row = await getIntegration();
  return row.zarinpalMerchantId.trim().length > 0;
}
