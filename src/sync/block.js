import { ethers } from "ethers";
import dayjs from "dayjs";
import axios from "axios";
import BigNumber from "bignumber.js";

const RPC_URL =
  "https://eth-mainnet.alchemyapi.io/v2/yFw07RqrMxovCZkTXYJPg0X3fj1Kpj_3";

const startBlock = 12638042;
const batchSize = 2000;

export async function syncBlocks() {
  // const from = 12638042;
  // const to = 12638044;

  // const reqs = [];
  // for (let i = from; i < to; i++) {
  //   reqs.push({
  //     method: "eth_getBlockByNumber",
  //     params: [`0x${i.toString(16)}`, false],
  //     id: i - from,
  //     jsonrpc: "2.0",
  //   });
  // }

  // const res = await axios.post(RPC_URL, JSON.stringify(reqs));

  // const hexString = res.data?.[0]?.result?.timestamp;
  // const timestamp = parseInt(hexString, 16);
  // printDate(timestamp);

  let UNISWAP_Q192 = new BigNumber(2).pow(192);

  let poolState = new BigNumber("11834355360583352084990106");

  let token0Decimals = new BigNumber(10).pow(18);
  let token1Decimals = new BigNumber(10).pow(9);

  let price0 = poolState
    .times(poolState)
    .div(UNISWAP_Q192)
    .times(token0Decimals)
    .div(token1Decimals)
    .toString();

  let price1 = new BigNumber(1).div(price0).toString();

  console.log(price0, price1);
}

function printDate(timestamp) {
  const date = dayjs.unix(timestamp).format("YYYY MMM DD");
  console.log(date);
}
