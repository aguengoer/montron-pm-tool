export type SetupState = "UNCONFIGURED" | "CONFIGURED"

export type SetupStateResponse = {
  state: SetupState
}

export type ConfigureWithTokenRequest = {
  serviceToken: string
}

export type ConfigureWithCodeRequest = {
  code: string
}

export type ConfigureResponse = {
  success: boolean
  message: string
}

export type ErrorResponse = {
  message: string
}

