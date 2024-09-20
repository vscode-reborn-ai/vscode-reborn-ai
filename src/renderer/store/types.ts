// What is the status of the API key?
export enum ApiKeyStatus {
  Unknown = "unknown", // On extension load, key has not yet been checked
  Unset = "unset", // On extension load, key is checked, but no valid API key is discovered
  Pending = "pending", // When the user submits an API key
  Authenticating = "authenticating", // When the extension is checking the API key
  Invalid = "invalid", // When the user's submission is checked, and it not valid. This is when the error message is shown.
  Valid = "valid", // Either after user submits a valid key, or on extension load, if a valid key is discovered
  Error = "error", // When an error occurs while checking the API key
}

// What is the status of getting the list of models?
export enum ModelListStatus {
  Unknown = "unknown", // Models have not been fetched yet
  Fetching = "fetching", // Models are being fetched
  Fetched = "fetched", // Models have been fetched
  Error = "error", // An error occurred while fetching models
}
