/**
 * `iyzipay` (the official Node SDK) ships no TypeScript declarations, and
 * the community `@types/iyzipay` package is years stale — see the research
 * in docs/product/roadmap.md M5. Declared as `any` deliberately: the actual
 * request/response shape this codebase depends on is typed at the boundary
 * in payments/IyzicoProvider.ts, not here. Narrowing this file instead would
 * just be re-typing a JS library we don't control and can't verify against
 * a live account yet.
 */
declare module "iyzipay" {
  const Iyzipay: any;
  export = Iyzipay;
}
