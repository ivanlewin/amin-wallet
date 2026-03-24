import { Suspense } from "react";

export default async function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main>index</main>
    </Suspense>
  );
}
