import vm from 'node:vm';
import { ChartParseError } from '../types/errors.js';
import { MAX_CHART_INPUT_LENGTH, VM_TIMEOUT_MS } from '../config/constants.js';
import { getGradientFunctions, patternDraw } from '../lib/gradient.js';
import { logger } from '../lib/logger.js';

export function parseChartConfig(
  input: string,
  width: number,
  height: number,
): Record<string, unknown> {
  if (input.length > MAX_CHART_INPUT_LENGTH) {
    throw new ChartParseError(
      `Chart config exceeds maximum length of ${MAX_CHART_INPUT_LENGTH} characters`,
    );
  }

  const { getGradientFill, getGradientFillHelper } = getGradientFunctions(width, height);

  const sandbox = {
    getGradientFill,
    getGradientFillHelper,
    pattern: { draw: patternDraw },
    result: undefined as unknown,
  };

  const context = vm.createContext(sandbox, {
    codeGeneration: {
      strings: false,
      wasm: false,
    },
  });

  const code = `result = ${input}`;

  try {
    const script = new vm.Script(code);
    script.runInContext(context, { timeout: VM_TIMEOUT_MS });
  } catch (err) {
    logger.error({ err, inputLength: input.length }, 'Chart config parse error');
    throw new ChartParseError(`Invalid chart config: ${(err as Error).message}`);
  }

  if (sandbox.result === null || typeof sandbox.result !== 'object') {
    throw new ChartParseError('Chart config must be an object');
  }

  return sandbox.result as Record<string, unknown>;
}
