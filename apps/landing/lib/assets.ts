import { env } from "~/env";

// Static export can be served from a subpath, so every hand-written asset URL
// goes through here. next/image used to do this automatically; the landing page
// now emits plain <img> tags so it can ship a real srcset (see components/shot.tsx).
export function asset(path: string) {
  return `${env.basePath}${path}`;
}
