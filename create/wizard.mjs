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
 * question the user never saw. When a step returns BACK, its own answer and
 * everything after it is discarded so the summary can't show a stale value.
 */
export async function runWizard(steps, { values = {}, onStep } = {}) {
  let index = 0;

  while (index < steps.length) {
    const step = steps[index];

    if (isSkipped(step, values)) {
      index++;
      continue;
    }

    onStep?.(values);
    const answer = await step.run(values, {
      canGoBack: previousStep(steps, index, values) !== null,
    });

    if (answer === BACK) {
      const target = previousStep(steps, index, values);

      if (target === null) continue;

      // Skipped steps hold answers that came from the command line — going
      // back must not clear a question the user was never asked.
      for (const later of steps.slice(target)) {
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
