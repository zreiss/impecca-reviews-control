import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$ } from '@builder.io/qwik-city';

import { getReviewIps } from '~/lib/db/queries';

export const useQueryData = routeLoader$(async () => {
  return getReviewIps();
});

export default component$(() => {
  const data = useQueryData();

  return (
    <section class="p-6">
      <h1 class="mb-4 text-2xl font-semibold">Query Results</h1>
      <pre class="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
        {JSON.stringify(data.value, null, 2)}
      </pre>
    </section>
  );
});

export const head: DocumentHead = {
  title: 'Query Results',
  meta: [
    {
      name: 'description',
      content: 'Server-side MySQL query results rendered with Qwik routeLoader$.',
    },
  ],
};
