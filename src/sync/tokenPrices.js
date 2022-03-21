import { Price, Token } from "../services";

export async function syncTokenPrices() {
  const tokens = await Token.model().find({}).lean();
  tokens.forEach(async (token, index) => {
    await syncPrice(token);
    process.stdout.write(`Synced ${index}/${tokens.length} tokens\r`);
  });
}

async function syncPrice(token) {
  try {
    await Price.getTokenPrice(token.address);
  } catch (error) {
    console.error(`${token.name}: ❌ ${token.address}`);
  }
}
