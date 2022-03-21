import { ethers, Contract } from "ethers";
import BigNumber from "bignumber.js";
import { ETHEREUM_RPC_URL, AVALANCHE_RPC_URL } from "../../config";

const RPC_URL = {
  mainnet: ETHEREUM_RPC_URL,
  avalanche: AVALANCHE_RPC_URL,
};

export async function getOTPoolInfo({ network, address }) {
  const rpcUrl = RPC_URL[network];
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const abi = [
    "function decimals() view returns (uint8)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1)",
    "function totalSupply() view returns (uint256 totalSupply)",
  ];
  const contract = new Contract(address, abi, provider);

  const [decimals, token0, token1, reserves, totalSupply] = await Promise.all([
    contract.decimals(),
    contract.token0(),
    contract.token1(),
    contract.getReserves(),
    contract.totalSupply(),
  ]);

  return {
    decimals: parseInt(decimals),
    token0: token0.toLowerCase(),
    token1: token1.toLowerCase(),
    reserve0: reserves.reserve0.toString(),
    reserve1: reserves.reserve1.toString(),
    totalSupply: totalSupply.toString(),
  };
}

export async function getYTPoolInfo({ network, address }) {
  const rpcUrl = RPC_URL[network];
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const abi = [
    "function decimals() view returns (uint8)",
    "function getReserves() view returns (uint256 xytBalance, uint256 xytWeight, uint256 tokenBalance, uint256 tokenWeight, uint256 currentBlock)",
    "function totalSupply() view returns (uint256 totalSupply)",
  ];
  const contract = new Contract(address, abi, provider);

  const [decimals, reserves, totalSupply] = await Promise.allSettled([
    contract.decimals(),
    contract.getReserves(),
    contract.totalSupply(),
  ]);

  const isOk = reserves.status === "fulfilled";

  return {
    decimals: parseInt(decimals.value),
    ytBalance: isOk ? reserves.value.xytBalance.toString() : 0,
    ytWeight: isOk ? reserves.value.xytWeight.toString() : 0,
    tokenBalance: isOk ? reserves.value.tokenBalance.toString() : 0,
    tokenWeight: isOk ? reserves.value.tokenWeight.toString() : 0,
    totalSupply: totalSupply.value.toString(),
  };
}

export async function getCTokenRate({ network, token, underlyingToken }) {
  const rpcUrl = RPC_URL[network];
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const abi = ["function exchangeRateCurrent() view returns (uint256)"];
  const contract = new Contract(token.address, abi, provider);

  const rateRaw = await contract.exchangeRateCurrent();

  return new BigNumber(rateRaw.toString())
    .div(BigNumber(10).pow(18 + underlyingToken.decimals - token.decimals))
    .toNumber();
}

export async function getwMemoRate() {
  const address = "0x0da67235dd5787d67955420c84ca1cecd4e5bb3b"; // wMEMO
  const rpcUrl = RPC_URL.avalanche;
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const abi = ["function wMEMOToMEMO(uint256) view returns (uint256)"];
  const contract = new Contract(address, abi, provider);

  const rateRaw = await contract.wMEMOToMEMO(
    new BigNumber(10).pow(18).toString()
  );

  return new BigNumber(rateRaw.toString()).div(BigNumber(10).pow(9)).toNumber();
}

export async function getwBtrflyRate() {
  const address = "0x4b16d95ddf1ae4fe8227ed7b7e80cf13275e61c9"; // wBTRFLY
  const rpcUrl = RPC_URL.mainnet;
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const abi = ["function xBTRFLYValue(uint256) view returns (uint256)"];
  const contract = new Contract(address, abi, provider);

  const rateRaw = await contract.xBTRFLYValue(
    new BigNumber(10).pow(18).toString()
  );

  return new BigNumber(rateRaw.toString()).div(BigNumber(10).pow(9)).toNumber();
}

export async function getxJoeRate({ network, token, underlyingToken }) {
  const rpcUrl = RPC_URL[network];
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const abi = [
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
  ];
  const joeContract = new Contract(underlyingToken.address, abi, provider);
  const xJoeContract = new Contract(token.address, abi, provider);

  const [joeBalance, xJoeTotalSupply] = await Promise.all([
    joeContract.balanceOf(underlyingToken.address),
    xJoeContract.totalSupply(),
  ]);

  return BigNumber(xJoeTotalSupply.toString())
    .div(BigNumber(joeBalance.toString()))
    .toNumber();
}
