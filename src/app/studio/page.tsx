import { headers } from "next/headers";
import StudioClient from "./StudioClient";

function isMobileUserAgent(ua: string) {
  return /(iphone|ipad|ipod|android|mobile)/i.test(ua);
}

export default async function StudioPage() {
  const headerList = await headers();
  const clientHint = headerList.get("sec-ch-ua-mobile");
  let hintFlag: boolean | undefined;
  if (clientHint === "?1") hintFlag = true;
  if (clientHint === "?0") hintFlag = false;

  const ua = headerList.get("user-agent") || "";
  const uaFlag = ua ? isMobileUserAgent(ua) : undefined;

  const isMobile = hintFlag ?? uaFlag ?? false;

  return <StudioClient isMobile={isMobile} />;
}
