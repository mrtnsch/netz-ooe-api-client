export class NetzOoeApiError extends Error {
  readonly code: string

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'NetzOoeApiError'
    this.code = code
  }
}

export class NetzOoeAuthenticationError extends NetzOoeApiError {
  constructor(message: string, options?: ErrorOptions) {
    super('AUTH_FAILED', message, options)
    this.name = 'NetzOoeAuthenticationError'
  }
}

export class NetzOoeSessionError extends NetzOoeApiError {
  constructor(message: string, options?: ErrorOptions) {
    super('SESSION_TOKEN_NOT_FOUND', message, options)
    this.name = 'NetzOoeSessionError'
  }
}

export class NetzOoeRequestError extends NetzOoeApiError {
  constructor(message: string, options?: ErrorOptions) {
    super('REQUEST_FAILED', message, options)
    this.name = 'NetzOoeRequestError'
  }
}
