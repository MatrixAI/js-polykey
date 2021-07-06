import { GithubProvider } from "../src/identities/providers";
import { sleep } from "../src/utils";

async function main() {
  const githubProvider = new GithubProvider({ clientId: "ca5c4c520da868387c52" });
  const gen = githubProvider.authenticate();
  const userCode = (await gen?.next())?.value;
  console.log(userCode);
  gen?.next();
  await sleep(100000);
}

main();
