/*

MIT License

Copyright (c) 2019 @crouchcd
Copyright (c) 2024 Christopher-Hayes/vscode-reborn-ai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

Pulled from: https://github.com/crouchcd/pkce-challenge

* The source package is not used due to CJS top-level async/await issues.
* This package has been modified to support different code challenge methods.

*/

/**
 * Creates an array of length `size` of random bytes
 * @param size
 * @returns Array of random ints (0 to 255)
 */
function getRandomValues(size: number) {
  return crypto.getRandomValues(new Uint8Array(size));
}

/** Generate cryptographically strong random string
 * @param size The desired length of the string
 * @returns The random string
 */
function random(size: number) {
  const mask =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
  let result = "";
  const randomUints = getRandomValues(size);
  for (let i = 0; i < size; i++) {
    // cap the value of the randomIndex to mask.length - 1
    const randomIndex = randomUints[i] % mask.length;
    result += mask[randomIndex];
  }
  return result;
}

/** Generate a PKCE challenge verifier
 * @param length Length of the verifier
 * @returns A random verifier `length` characters long
 */
function generateVerifier(length: number): string {
  return random(length);
}

/** Generate a PKCE code challenge from a code verifier
 * @param code_verifier
 * @param method "plain" or "S256". Defaults to "S256".
 * @returns The base64 url encoded code challenge
 */
export async function generateChallenge(code_verifier: string, method: "plain" | "S256" = "S256") {
  if (method === "plain") {
    return code_verifier;
  } else if (method === "S256") {
    const buffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(code_verifier)
    );
    // Generate base64url string
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .replace(/=/g, '');
  } else {
    throw new Error(`Unsupported challenge method: ${method}`);
  }
}

/** Generate a PKCE challenge pair
 * @param length Length of the verifier (between 43-128). Defaults to 43.
 * @param method "plain" or "S256". Defaults to "S256".
 * @returns PKCE challenge pair
 */
export default async function pkceChallenge(length: number = 43, method: "plain" | "S256" = "S256"): Promise<{
  code_verifier: string;
  code_challenge: string;
}> {
  if (length < 43 || length > 128) {
    throw new Error(`Expected a length between 43 and 128. Received ${length}.`);
  }

  const verifier = generateVerifier(length);
  const challenge = await generateChallenge(verifier, method);

  return {
    code_verifier: verifier,
    code_challenge: challenge,
  };
}

/** Verify that a code_verifier produces the expected code challenge
 * @param code_verifier
 * @param expectedChallenge The code challenge to verify
 * @param method "plain" or "S256". Defaults to "S256".
 * @returns True if challenges are equal. False otherwise.
 */
export async function verifyChallenge(
  code_verifier: string,
  expectedChallenge: string,
  method: "plain" | "S256" = "S256"
) {
  const actualChallenge = await generateChallenge(code_verifier, method);
  return actualChallenge === expectedChallenge;
}
