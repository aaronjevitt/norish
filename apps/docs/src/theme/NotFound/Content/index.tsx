import React from "react";
import Link from "@docusaurus/Link";
import { buttonVariants } from "@heroui/react";

export default function NotFoundContent() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-muted text-sm font-medium">404</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold">This page isn't here</h1>
      <p className="text-muted mt-4 text-pretty">
        It may have moved in a newer version of the docs. The introduction is a good place to start
        again.
      </p>
      <Link className={`${buttonVariants({ variant: "primary" })} mt-8`} to="/">
        Back to the docs
      </Link>
    </main>
  );
}
