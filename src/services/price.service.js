import { Token, Price } from "../models";
import { Market } from "../services";
import { getPrice as getCoingeckoPrice } from "../adapters/Coingecko";
import {
  getOTPoolInfo,
  getYTPoolInfo,
  getCTokenRate,
  getwMemoRate,
  getwBtrflyRate,
  getxJoeRate,
} from "../adapters/Pendle";
import BigNumber from "bignumber.js";
import { pow10 } from "../utils/helpers";

export default {
  async find({ address }) {
    return await Price.findOne({ address });
  },

  async save({ address, price }) {
    return await Price.create({ address, price });
  },

  async getTokenPrice(address, query) {
    const fetchMode = query?.fetchMode ?? "cache";

    if (fetchMode === "cache") {
      const found = await this.find({ address });
      if (found) return { price: found.price };
    }

    const token = await Token.findOne({ address }).lean();
    const network = token.network;

    let result = null;
    switch (token.type) {
      case "generic":
        result = await this.getGenericTokenPrice({ network, address });
        break;
      case "lp-ot":
        result = await this.getOTLPPrice({ network, address });
        break;
      case "ot":
        result = await this.getOTPrice({ network, address });
        break;
      case "lp-yt":
        result = await this.getYTLPPrice({ network, address });
        break;
      case "yt":
        result = await this.getYTPrice({ network, address });
        break;
      case "yieldBearing":
        result = await this.getYieldBearingTokenPrice({ network, address });
        break;
      default:
        result = await this.getGenericTokenPrice({ network, address });
    }

    await this.save({ address, price: result.price });

    return result;
  },

  async getGenericTokenPrice({ network, address }) {
    let _address = address;

    switch (address) {
      case "0xcc94faf235cc5d3bf4bed3a30db5984306c86abc": // xBTRFLY
        _address = "0xc0d4ceb216b3ba9c3701b291766fdcba977cec3a"; // BTRFLY
        break;
      case "0x136acd46c134e8269052c62a67042d6bdedde3c9": // MEMO
        _address = "0xb54f16fb19478766a268f172c9480f8da1a7c9c3"; // TIME
        break;
    }

    return await getCoingeckoPrice({ network, address: _address });
  },

  async getOTLPPrice({ network, address }) {
    const market = await Market.findByAddress(address);

    const pool = await getOTPoolInfo({ network, address });

    let reserves;
    let quotePrice;

    if (pool.token0 === market.quoteToken.address) {
      const res = await this.getGenericTokenPrice({
        network,
        address: pool.token0,
      });
      quotePrice = res.price;
      reserves = pool.reserve0;
    } else {
      const res = await this.getGenericTokenPrice({
        network,
        address: pool.token1,
      });
      quotePrice = res.price;
      reserves = pool.reserve1;
    }

    const totalSupply = new BigNumber(pool.totalSupply).div(
      pow10(pool.decimals)
    );

    if (totalSupply.eq(0)) return { price: 0 };

    const tvl = new BigNumber(reserves)
      .div(pow10(market.quoteToken.decimals))
      .times(quotePrice)
      .times(2);

    const price = tvl.div(totalSupply).toNumber();

    return { price };
  },

  async getOTPrice({ network, address }) {
    const market = await Market.findByBaseToken(address);

    const pool = await getOTPoolInfo({ network, address: market.address });

    let baseBalance;
    let quoteBalance;
    let quotePrice;

    if (pool.token0 === market.quoteToken.address) {
      const res = await this.getGenericTokenPrice({
        network,
        address: pool.token0,
      });
      quotePrice = res.price;
      quoteBalance = new BigNumber(pool.reserve0).div(
        pow10(market.quoteToken.decimals)
      );
      baseBalance = new BigNumber(pool.reserve1).div(
        pow10(market.baseToken.decimals)
      );
    } else {
      const res = await this.getGenericTokenPrice({
        network,
        address: pool.token1,
      });
      quotePrice = res.price;
      quoteBalance = new BigNumber(pool.reserve1).div(
        pow10(market.quoteToken.decimals)
      );
      baseBalance = new BigNumber(pool.reserve0).div(
        pow10(market.baseToken.decimals)
      );
    }

    if (baseBalance.eq(0)) return { price: 0 };

    const price = quoteBalance.times(quotePrice).div(baseBalance).toNumber();

    return { price };
  },

  async getYTLPPrice({ network, address }) {
    const market = await Market.findByAddress(address);

    const pool = await getYTPoolInfo({ network, address });

    const RONE = new BigNumber(2).pow(40);

    const tokenWeight = new BigNumber(pool.tokenWeight).div(RONE);

    const tokenBalance = new BigNumber(pool.tokenBalance).div(
      pow10(market.quoteToken.decimals)
    );

    const res = await this.getGenericTokenPrice({
      network,
      address: market.quoteToken.address,
    });
    const tokenPrice = res.price;

    const totalSupply = new BigNumber(pool.totalSupply).div(
      pow10(pool.decimals)
    );

    if (tokenWeight.eq(0) || totalSupply.eq(0)) return { price: 0 };

    const tvl = tokenBalance.times(tokenPrice).div(tokenWeight);

    const price = tvl.div(totalSupply).toNumber();

    return { price };
  },

  async getYTPrice({ network, address }) {
    const market = await Market.findByBaseToken(address);

    const pool = await getYTPoolInfo({ network, address: market.address });

    const RONE = new BigNumber(2).pow(40);

    const ytWeight = new BigNumber(pool.ytWeight).div(RONE);
    const tokenWeight = new BigNumber(pool.tokenWeight).div(RONE);

    const ytBalance = new BigNumber(pool.ytBalance).div(
      pow10(market.baseToken.decimals)
    );
    const tokenBalance = new BigNumber(pool.tokenBalance).div(
      pow10(market.quoteToken.decimals)
    );

    const res = await this.getGenericTokenPrice({
      network,
      address: market.quoteToken.address,
    });
    const tokenPrice = res.price;

    if (tokenWeight.eq(0) || ytBalance.eq(0)) return { price: 0 };

    const tvl = tokenBalance.times(tokenPrice).div(tokenWeight);

    const price = tvl.times(ytWeight).div(ytBalance).toNumber();

    return { price };
  },

  async getYieldBearingTokenPrice({ network, address }) {
    const token = await Token.findOne({ address });
    const underlyingToken = await Token.findOne({
      address: token.underlyingToken,
    });

    const res = await this.getGenericTokenPrice({
      network,
      address: token.underlyingToken,
    });
    const underlyingPrice = res.price;

    const forgeId = token.forgeId;

    let rate = 1;

    if (forgeId.startsWith("Compound")) {
      rate = await getCTokenRate({ network, token, underlyingToken });
    } else if (forgeId.startsWith("BenQi")) {
      rate = await getCTokenRate({ network, token, underlyingToken });
    } else if (forgeId.startsWith("Wonderland")) {
      rate = await getwMemoRate();
    } else if (forgeId.startsWith("Redacted")) {
      rate = await getwBtrflyRate();
    } else if (forgeId.startsWith("xJoe")) {
      rate = await getxJoeRate({ network, token, underlyingToken });
    }

    const price = underlyingPrice * rate;

    return { price };
  },
};
