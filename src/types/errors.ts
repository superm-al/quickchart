export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class ChartParseError extends AppError {
  constructor(message: string) {
    super(message, 422, 'CHART_PARSE_ERROR');
  }
}

export class ChartRenderError extends AppError {
  constructor(message: string) {
    super(message, 422, 'CHART_RENDER_ERROR');
  }
}

export class GraphvizRenderError extends AppError {
  constructor(message: string) {
    super(message, 422, 'GRAPHVIZ_RENDER_ERROR');
  }
}

export class QrGenerationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'QR_GENERATION_ERROR');
  }
}
