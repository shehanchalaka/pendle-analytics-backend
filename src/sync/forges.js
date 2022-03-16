import { ethers, Contract } from "ethers";
import { provider } from "./index";
import BigNumber from "bignumber.js";
import PendleDataAbi from "../abis/PendleData.json";
import IPendleForgeAbi from "../abis/IPendleForge.json";
import { Forge, YieldContract, Mint, Redeem, Token } from "../models";

export async function syncForges() {
  const pendleDataAddress = "0xE8A6916576832AA5504092C1cCCC46E3bB9491d6";
  const contract = new Contract(pendleDataAddress, PendleDataAbi, provider);
  const eventFilter = contract.filters.ForgeAdded();
  let events = await contract.queryFilter(eventFilter);

  const promises = events.map(async (event) => {
    const block = await event.getBlock();
    const forgeId = ethers.utils.parseBytes32String(event.args.forgeId);
    return {
      updateOne: {
        filter: {
          hash: event.transactionHash,
        },
        update: {
          hash: event.transactionHash,
          block: event.blockNumber,
          timestamp: block.timestamp,
          forgeId,
          forgeAddress: event.args.forgeAddress,
        },
        upsert: true,
      },
    };
  });

  const bulkWriteQuery = await Promise.all(promises);

  const forges = bulkWriteQuery.map((item) => {
    return {
      forgeAddress: item.updateOne.update.forgeAddress,
    };
  });

  await Forge.bulkWrite(bulkWriteQuery);
  console.log("Done syncing forges");

  return forges;
}

export async function syncYieldContracts(forgeAddress) {
  const contract = new Contract(forgeAddress, IPendleForgeAbi, provider);
  const eventFilter = contract.filters.NewYieldContracts();
  let events = await contract.queryFilter(eventFilter);

  const promises = events.map(async (event) => {
    const block = await event.getBlock();
    const forgeId = ethers.utils.parseBytes32String(event.args.forgeId);
    const expiry = event.args.expiry.toNumber();
    return {
      updateOne: {
        filter: {
          hash: event.transactionHash,
        },
        update: {
          hash: event.transactionHash,
          block: event.blockNumber,
          timestamp: block.timestamp,
          forgeId,
          expiry,
          underlyingAsset: event.args.underlyingAsset,
          yieldBearingAsset: event.args.yieldBearingAsset,
          ot: event.args.ot,
          xyt: event.args.xyt,
        },
        upsert: true,
      },
    };
  });

  const bulkWriteQuery = await Promise.all(promises);

  const tokens = bulkWriteQuery.map((item) => {
    return {
      ot: item.updateOne.update.ot,
      xyt: item.updateOne.update.xyt,
      underlyingAsset: item.updateOne.update.underlyingAsset,
      yieldBearingAsset: item.updateOne.update.yieldBearingAsset,
    };
  });

  await YieldContract.bulkWrite(bulkWriteQuery);
  console.log("Yield contract synced");

  return tokens;
}

async function getTokenMap() {
  const tokens = await Token.find({}).lean();
  const tokenMap = tokens.reduce((a, b) => {
    if (!a[b.address]) {
      a[b.address] = { decimals: b.decimals };
    }
    return a;
  }, {});
  return tokenMap;
}

async function getYieldContractMap() {
  const yieldContracts = await YieldContract.find({});
  const yieldContractMap = yieldContracts.reduce((a, b) => {
    let id = `${b.forgeId}-${b.underlyingAsset}-${b.expiry}`;
    if (!a[id]) {
      a[id] = b;
    }
    return a;
  }, {});
  return yieldContractMap;
}

export async function syncMints(forgeAddress) {
  const contract = new Contract(forgeAddress, IPendleForgeAbi, provider);
  const eventFilter = contract.filters.MintYieldTokens();
  let events = await contract.queryFilter(eventFilter);

  const tokenMap = await getTokenMap();
  const yieldContractMap = await getYieldContractMap();

  const promises = events.map(async (event) => {
    const block = await event.getBlock();
    const forgeId = ethers.utils.parseBytes32String(event.args.forgeId);
    const expiry = event.args.expiry.toNumber();
    const underlyingAsset = event.args.underlyingAsset;
    let id = `${forgeId}-${underlyingAsset}-${expiry}`;

    const yieldContract = yieldContractMap[id];
    const ot = tokenMap[yieldContract.ot];
    const yieldBearingAsset = tokenMap[yieldContract.yieldBearingAsset];
    const otDecimals = new BigNumber(10).pow(ot.decimals);
    const ybaDecimals = new BigNumber(10).pow(yieldBearingAsset.decimals);

    const amountToTokenize = new BigNumber(
      event.args.amountToTokenize.toString()
    )
      .div(ybaDecimals)
      .toString();
    const amountTokenMinted = new BigNumber(
      event.args.amountTokenMinted.toString()
    )
      .div(otDecimals)
      .toString();

    return {
      updateOne: {
        filter: {
          hash: event.transactionHash,
        },
        update: {
          hash: event.transactionHash,
          block: event.blockNumber,
          timestamp: block.timestamp,
          forgeId,
          expiry,
          underlyingAsset,
          amountToTokenize,
          amountTokenMinted,
          user: event.args.user,
        },
        upsert: true,
      },
    };
  });

  const bulkWriteQuery = await Promise.all(promises);
  await Mint.bulkWrite(bulkWriteQuery);
  console.log("Mints synced");
}

export async function syncRedeems(forgeAddress) {
  const contract = new Contract(forgeAddress, IPendleForgeAbi, provider);
  const eventFilter = contract.filters.RedeemYieldToken();
  let events = await contract.queryFilter(eventFilter);

  const tokenMap = await getTokenMap();
  const yieldContractMap = await getYieldContractMap();

  const promises = events.map(async (event) => {
    const block = await event.getBlock();
    const forgeId = ethers.utils.parseBytes32String(event.args.forgeId);
    const expiry = event.args.expiry.toNumber();
    const underlyingAsset = event.args.underlyingAsset;
    let id = `${forgeId}-${underlyingAsset}-${expiry}`;

    const yieldContract = yieldContractMap[id];
    const ot = tokenMap[yieldContract.ot];
    const yieldBearingAsset = tokenMap[yieldContract.yieldBearingAsset];
    const otDecimals = new BigNumber(10).pow(ot.decimals);
    const ybaDecimals = new BigNumber(10).pow(yieldBearingAsset.decimals);

    const amountToRedeem = new BigNumber(event.args.amountToRedeem.toString())
      .div(otDecimals)
      .toString();
    const redeemedAmount = new BigNumber(event.args.redeemedAmount.toString())
      .div(ybaDecimals)
      .toString();

    return {
      updateOne: {
        filter: {
          hash: event.transactionHash,
        },
        update: {
          hash: event.transactionHash,
          block: event.blockNumber,
          timestamp: block.timestamp,
          forgeId,
          expiry,
          underlyingAsset,
          amountToRedeem,
          redeemedAmount,
          user: event.args.user,
        },
        upsert: true,
      },
    };
  });

  const bulkWriteQuery = await Promise.all(promises);
  await Redeem.bulkWrite(bulkWriteQuery);
  console.log("Redeems synced");
}
