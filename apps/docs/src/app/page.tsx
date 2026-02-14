'use client';

import { createStore, useStore } from '@meursyphus/yoshi';

const counterStore = createStore(0);

export default function Home() {
  const count = useStore(counterStore);

  return (
    <main>
      <h1>Subarashi Example</h1>
      <p>Counter from subarashi store: {count}</p>
      <button
        type="button"
        onClick={() => {
          counterStore.set((prev: number) => prev + 1);
        }}
      >
        +1
      </button>
    </main>
  );
}
