import { headers } from "next/headers";
import StudioClient from "./StudioClient";

function isMobileUserAgent(ua: string) {
  return /(iphone|ipad|ipod|android|mobile)/i.test(ua);
}

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ mobile?: string; pwa?: string }>;
}) {
  const params = await searchParams;
  const headerList = await headers();
  const clientHint = headerList.get("sec-ch-ua-mobile");
  let hintFlag: boolean | undefined;
  if (clientHint === "?1") hintFlag = true;
  if (clientHint === "?0") hintFlag = false;

  const ua = headerList.get("user-agent") || "";
  const uaFlag = ua ? isMobileUserAgent(ua) : undefined;

  // Check for query parameters to force mobile view
  // ?mobile=1 forces mobile view for testing
  // ?pwa=1 indicates PWA mode (should show mobile view)
  const forceMobile = params?.mobile === "1" || params?.pwa === "1";

  const isMobile = forceMobile || hintFlag ?? uaFlag ?? false;

  return <StudioClient isMobile={isMobile} />;
}
