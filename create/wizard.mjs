/** Returned by a prompt when the user wants the previous question back. */
export const BACK = Symbol("back");

const isSkipped = (step, values) => Boolean(step.skip?.(values));

/** The nearest earlier step the user can actually answer, or null if none. */
export function previousStep(steps, index, values) {
  for (let i = index - 1; i >= 0; i--) {
    if (!isSkipped(steps[i], values)) return i;
  }

  return null;
}

/**
 * Walk the steps in order, collecting an answer from each.
 *
 * A step whose `skip` returns true is passed over — that's how an answer given
 * on the command line removes its prompt, and it keeps "back" from landing on a
 * question the user never saw. When a step returns BACK, the answers after the
 * one it lands on are discarded, so the summary can't show a stale value. The
 * landed-on answer survives, so the prompt can offer it back as a default —
 * going back to fix a typo shouldn't mean retyping the whole thing.
 *
 * `onStep` receives the key of the question about to be asked, so the caller
 * can leave it out of the summary while the user is editing it.
 */
export async function runWizard(steps, { values = {}, onStep } = {}) {
  let index = 0;

  while (index < steps.length) {
    const step = steps[index];

    if (isSkipped(step, values)) {
      index++;
      continue;
    }

    onStep?.(values, step.key);
    const answer = await step.run(values, {
      canGoBack: previousStep(steps, index, values) !== null,
    });

    if (answer === BACK) {
      const target = previousStep(steps, index, values);

      if (target === null) continue;

      // Skipped steps hold answers that came from the command line — going
      // back must not clear a question the user was never asked.
      for (const later of steps.slice(target + 1)) {
        if (!isSkipped(later, values)) delete values[later.key];
      }
      index = target;
      continue;
    }

    values[step.key] = answer;
    index++;
  }

  onStep?.(values);

  return values;
}
